import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the default problem inputs and first step', () => {
    render(<App />)
    expect(screen.getByLabelText('Dividend')).toHaveValue(5428)
    expect(screen.getByLabelText('Divisor')).toHaveValue(35)
    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
  })

  it('advances to the next step on click', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(screen.getByText('2 / 6')).toBeInTheDocument()
    expect(screen.getByText('Step 1 — first digit')).toBeInTheDocument()
  })

  it('disables back at the first step and disables next at the last step', () => {
    render(<App />)
    expect(screen.getByLabelText('Previous step')).toBeDisabled()

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByLabelText('Next step')).toBeDisabled()
  })

  it('solves a new problem entered in the input form', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '12' } })
    // jsdom does not auto-dispatch a submit event on a plain click of a
    // submit button, so submit the form directly (as a real browser click
    // would end up doing).
    fireEvent.submit(document.querySelector('form')!)

    expect(screen.getByLabelText('Dividend')).toHaveValue(15)
    expect(screen.getByLabelText('Divisor')).toHaveValue(12)
    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('shows inline validation errors instead of solving on invalid input', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '0' } })
    fireEvent.submit(document.querySelector('form')!)

    expect(screen.getByText('Dividend must be between 1 and 9999.')).toBeInTheDocument()
    // still showing the previous (default) problem, not a crash
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
  })

  describe('Base Method pane', () => {
    function switchToBaseMethod() {
      fireEvent.click(screen.getByLabelText('Open method menu'))
      fireEvent.click(screen.getByRole('tab', { name: /Base Method/ }))
    }

    it('renders the 10030 ÷ 827 walkthrough on switching methods', () => {
      render(<App />)
      switchToBaseMethod()

      expect(screen.getByText('Setup')).toBeInTheDocument()
      expect(screen.getByText('1 / 7')).toBeInTheDocument()
      expect(screen.getByText('base').nextElementSibling).toHaveTextContent('1000')
      expect(screen.getByText('difference').nextElementSibling).toHaveTextContent('173')
    })

    it('steps through to the verified remainder', () => {
      render(<App />)
      switchToBaseMethod()

      for (let i = 0; i < 6; i++) {
        fireEvent.click(screen.getByLabelText('Next step'))
      }

      expect(screen.getByText('7 / 7')).toBeInTheDocument()
      expect(screen.getByText('Step 6 — compare and normalize')).toBeInTheDocument()
      expect(screen.getByText('Verify: 12 × 827 + 106 = 10030 ✓')).toBeInTheDocument()
      expect(screen.getByLabelText('Next step')).toBeDisabled()
    })

    it('switching back to Dhvajanka restores its own walkthrough', () => {
      render(<App />)
      switchToBaseMethod()
      fireEvent.click(screen.getByLabelText('Open method menu'))
      fireEvent.click(screen.getByRole('tab', { name: /Dhvajanka/ }))

      expect(screen.getByLabelText('Dividend')).toHaveValue(5428)
      expect(screen.getByText('1 / 6')).toBeInTheDocument()
    })

    it('steps forward and back with the ArrowRight/ArrowLeft keys', () => {
      render(<App />)
      switchToBaseMethod()

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(screen.getByText('2 / 7')).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      expect(screen.getByText('1 / 7')).toBeInTheDocument()
    })
  })

  describe('sidebar navigation', () => {
    it('opens via the menu button and closes via a scrim click', () => {
      const { container } = render(<App />)
      const menuButton = screen.getByLabelText('Open method menu')
      const scrim = container.querySelector('.sidebar-scrim')!

      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(scrim).not.toHaveClass('open')

      fireEvent.click(menuButton)
      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
      expect(scrim).toHaveClass('open')

      fireEvent.click(scrim)
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(scrim).not.toHaveClass('open')
    })
  })
})
