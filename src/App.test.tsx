import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

vi.mock('./pages/DhvajankaPage', () => ({
  default: () => <div data-testid="dhvajanka-page">Dhvajanka page</div>,
}))
vi.mock('./pages/BaseMethodPage', () => ({
  default: () => <div data-testid="base-method-page">Base Method page</div>,
}))

describe('App', () => {
  it('renders the Base Method pane by default', () => {
    render(<App />)
    expect(screen.getByTestId('base-method-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dhvajanka-page')).not.toBeInTheDocument()
  })

  function switchToDhvajanka() {
    fireEvent.click(screen.getByLabelText('Open method menu'))
    fireEvent.click(screen.getByRole('tab', { name: /Dhvajanka/ }))
  }

  it('switches to the Dhvajanka pane via the menu', () => {
    render(<App />)
    switchToDhvajanka()

    expect(screen.getByTestId('dhvajanka-page')).toBeInTheDocument()
    expect(screen.queryByTestId('base-method-page')).not.toBeInTheDocument()
  })

  it('switching back to Base Method renders its default pane again', () => {
    render(<App />)
    switchToDhvajanka()

    fireEvent.click(screen.getByLabelText('Open method menu'))
    fireEvent.click(screen.getByRole('tab', { name: /Base Method/ }))

    expect(screen.getByTestId('base-method-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dhvajanka-page')).not.toBeInTheDocument()
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
