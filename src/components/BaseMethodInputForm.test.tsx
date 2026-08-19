import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BaseMethodInputForm from './BaseMethodInputForm'

function submit() {
  fireEvent.submit(document.querySelector('form')!)
}

describe('BaseMethodInputForm', () => {
  it('rejects an empty dividend and does not solve', () => {
    const onSolve = vi.fn()
    render(<BaseMethodInputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '' } })
    submit()

    expect(screen.getByText('Enter a dividend.')).toBeInTheDocument()
    expect(screen.getByLabelText('Dividend')).toHaveAttribute('aria-invalid', 'true')
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('rejects an empty divisor and does not solve', () => {
    const onSolve = vi.fn()
    render(<BaseMethodInputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '' } })
    submit()

    expect(screen.getByText('Enter a divisor.')).toBeInTheDocument()
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('reports both field errors together when both inputs are out of range', () => {
    const onSolve = vi.fn()
    render(<BaseMethodInputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '100000' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '1000' } })
    submit()

    expect(screen.getByText('Dividend must be between 1 and 99999.')).toBeInTheDocument()
    expect(screen.getByText('Divisor must be between 1 and 999.')).toBeInTheDocument()
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('rejects a non-integer dividend', () => {
    const onSolve = vi.fn()
    render(<BaseMethodInputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '12.5' } })
    submit()

    expect(screen.getByText('Dividend must be a whole number.')).toBeInTheDocument()
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('accepts boundary values (dividend 1, divisor 999) and solves', () => {
    const onSolve = vi.fn()
    render(<BaseMethodInputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '999' } })
    submit()

    expect(screen.queryByText(/must be/)).not.toBeInTheDocument()
    expect(onSolve).toHaveBeenCalledWith(1, 999)
  })

  it('clears prior errors once a subsequent submission is valid', () => {
    const onSolve = vi.fn()
    render(<BaseMethodInputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '' } })
    submit()
    expect(screen.getByText('Enter a dividend.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '10600' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '87' } })
    submit()

    expect(screen.queryByText('Enter a dividend.')).not.toBeInTheDocument()
    expect(onSolve).toHaveBeenCalledWith(10600, 87)
  })

  it('defaults to the given initial dividend/divisor', () => {
    render(<BaseMethodInputForm onSolve={vi.fn()} initialDividend={1693} initialDivisor={131} />)

    expect(screen.getByLabelText('Dividend')).toHaveValue(1693)
    expect(screen.getByLabelText('Divisor')).toHaveValue(131)
  })
})
