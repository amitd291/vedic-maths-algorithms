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
  it('renders the Dhvajanka pane by default', () => {
    render(<App />)
    expect(screen.getByTestId('dhvajanka-page')).toBeInTheDocument()
    expect(screen.queryByTestId('base-method-page')).not.toBeInTheDocument()
  })

  function switchToBaseMethod() {
    fireEvent.click(screen.getByLabelText('Open method menu'))
    fireEvent.click(screen.getByRole('tab', { name: /Base Method/ }))
  }

  it('switches to the Base Method pane via the menu', () => {
    render(<App />)
    switchToBaseMethod()

    expect(screen.getByTestId('base-method-page')).toBeInTheDocument()
    expect(screen.queryByTestId('dhvajanka-page')).not.toBeInTheDocument()
  })

  it('switching back to Dhvajanka renders its default pane again', () => {
    render(<App />)
    switchToBaseMethod()

    fireEvent.click(screen.getByLabelText('Open method menu'))
    fireEvent.click(screen.getByRole('tab', { name: /Dhvajanka/ }))

    expect(screen.getByTestId('dhvajanka-page')).toBeInTheDocument()
    expect(screen.queryByTestId('base-method-page')).not.toBeInTheDocument()
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
