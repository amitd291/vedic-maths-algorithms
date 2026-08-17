import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InputForm from './InputForm'

function submit() {
  fireEvent.submit(document.querySelector('form')!)
}

describe('InputForm', () => {
  it('rejects an empty dividend and does not solve', () => {
    const onSolve = vi.fn()
    render(<InputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '' } })
    submit()

    expect(screen.getByText('Enter a dividend.')).toBeInTheDocument()
    expect(screen.getByLabelText('Dividend')).toHaveAttribute('aria-invalid', 'true')
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('rejects an empty divisor and does not solve', () => {
    const onSolve = vi.fn()
    render(<InputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '' } })
    submit()

    expect(screen.getByText('Enter a divisor.')).toBeInTheDocument()
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('reports both field errors together when both inputs are invalid', () => {
    const onSolve = vi.fn()
    render(<InputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '5' } })
    submit()

    expect(screen.getByText('Dividend must be between 1 and 9999.')).toBeInTheDocument()
    expect(screen.getByText('Divisor must be a two-digit number (10-99).')).toBeInTheDocument()
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('rejects a non-integer dividend', () => {
    const onSolve = vi.fn()
    render(<InputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '12.5' } })
    submit()

    expect(screen.getByText('Dividend must be a whole number.')).toBeInTheDocument()
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('rejects an out-of-range divisor', () => {
    const onSolve = vi.fn()
    render(<InputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '100' } })
    submit()

    expect(screen.getByText('Divisor must be a two-digit number (10-99).')).toBeInTheDocument()
    expect(onSolve).not.toHaveBeenCalled()
  })

  it('accepts boundary values (dividend 1, divisor 99) and solves', () => {
    const onSolve = vi.fn()
    render(<InputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '99' } })
    submit()

    expect(screen.queryByText(/must be/)).not.toBeInTheDocument()
    expect(onSolve).toHaveBeenCalledWith(1, 99)
  })

  it('clears prior errors once a subsequent submission is valid', () => {
    const onSolve = vi.fn()
    render(<InputForm onSolve={onSolve} />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '' } })
    submit()
    expect(screen.getByText('Enter a dividend.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '144' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '12' } })
    submit()

    expect(screen.queryByText('Enter a dividend.')).not.toBeInTheDocument()
    expect(onSolve).toHaveBeenCalledWith(144, 12)
  })
})
