import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBanner from './ErrorBanner'

describe('ErrorBanner', () => {
  it('renders the generic prefix by default', () => {
    render(<ErrorBanner message="something broke" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong computing this problem: something broke')
  })

  it('renders only the message when showPrefix is false', () => {
    render(<ErrorBanner message="Try a larger dividend." showPrefix={false} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Try a larger dividend.')
    expect(alert).not.toHaveTextContent('Something went wrong')
  })
})
