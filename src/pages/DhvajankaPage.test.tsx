import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DhvajankaPage from './DhvajankaPage'
import { computeSteps } from '../lib/computeSteps'

describe('DhvajankaPage', () => {
  it('renders the default problem inputs and first step', () => {
    render(<DhvajankaPage />)
    expect(screen.getByLabelText('Dividend')).toHaveValue(5428)
    expect(screen.getByLabelText('Divisor')).toHaveValue(35)
    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
  })

  it('advances to the next step on click', () => {
    render(<DhvajankaPage />)
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(screen.getByText('2 / 6')).toBeInTheDocument()
    expect(screen.getByText('Step 1 — first digit')).toBeInTheDocument()
  })

  it('disables back at the first step and disables next at the last step', () => {
    render(<DhvajankaPage />)
    expect(screen.getByLabelText('Previous step')).toBeDisabled()

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByLabelText('Next step')).toBeDisabled()
  })

  it('solves a new problem entered in the input form', () => {
    render(<DhvajankaPage />)

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
    render(<DhvajankaPage />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '0' } })
    fireEvent.submit(document.querySelector('form')!)

    expect(screen.getByText('Dividend must be between 1 and 9999.')).toBeInTheDocument()
    // still showing the previous (default) problem, not a crash
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
  })

  it('steps forward and back with the ArrowRight/ArrowLeft keys', () => {
    render(<DhvajankaPage />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 6')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
  })

  it('clamps at the boundary steps instead of going out of range', () => {
    render(<DhvajankaPage />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 6')).toBeInTheDocument()

    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByLabelText('Next step'))
    expect(screen.getByText('6 / 6')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('6 / 6')).toBeInTheDocument()
  })

  it('accepts boundary values (dividend 1, divisor 99) without an error banner', () => {
    const { container } = render(<DhvajankaPage />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '99' } })
    fireEvent.submit(document.querySelector('form')!)

    expect(container.querySelector('.error-banner')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Dividend')).toHaveValue(1)
    expect(screen.getByLabelText('Divisor')).toHaveValue(99)
  })

  describe('edge case problems', () => {
    function solveViaForm(dividend: number, divisor: number) {
      fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: String(dividend) } })
      fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: String(divisor) } })
      fireEvent.submit(document.querySelector('form')!)
    }

    const cases = [
      { dividend: 5, divisor: 12, label: 'divisor greater than dividend' },
      { dividend: 4900, divisor: 35, label: 'exact division (zero remainder)' },
      { dividend: 1015, divisor: 99, label: 'leading-zero quotient digit' },
      { dividend: 5428, divisor: 35, label: 'quotient-digit adjustment/backtrack' },
    ]

    for (const { dividend, divisor, label } of cases) {
      it(`${label}: ${dividend} ÷ ${divisor} matches computeSteps`, () => {
        const steps = computeSteps(dividend, divisor)
        const last = steps[steps.length - 1]

        const { container } = render(<DhvajankaPage />)
        solveViaForm(dividend, divisor)

        expect(screen.getByText(`1 / ${steps.length}`)).toBeInTheDocument()

        for (let i = 1; i < steps.length; i++) {
          fireEvent.click(screen.getByLabelText('Next step'))
        }
        expect(screen.getByText(`${steps.length} / ${steps.length}`)).toBeInTheDocument()
        expect(screen.getByLabelText('Next step')).toBeDisabled()

        const quotientSlots = container.querySelectorAll('.quotient-slot')
        expect(quotientSlots).toHaveLength(last.quotientDigits.length + 1)

        for (let i = 0; i < last.quotientDigits.length; i++) {
          const value = last.quotientDigits[i]
          expect(quotientSlots[i]).toHaveTextContent(value === null ? `Q${i + 1}` : String(value))
        }
        expect(quotientSlots[last.quotientDigits.length]).toHaveTextContent(String(last.r))

        const verifyText = last.lines.find((l) => l.kind === 'note' && l.tone === 'success')?.text
        expect(verifyText).toBeDefined()
        expect(container.querySelector('.success-note')).toHaveTextContent(verifyText!)
      })
    }

    it('the raw step shows the lookahead note and the adjusted step shows the reduction note', () => {
      const steps = computeSteps(5428, 35)
      const rawNote = steps[2].lines.find((l) => l.kind === 'note' && l.tone === 'warn')?.text
      const adjustedNote = steps[3].lines.find((l) => l.kind === 'note' && l.tone === 'warn')?.text
      expect(rawNote).toBeDefined()
      expect(adjustedNote).toBeDefined()

      const { container } = render(<DhvajankaPage />)
      fireEvent.click(screen.getByLabelText('Next step'))
      fireEvent.click(screen.getByLabelText('Next step'))

      expect(screen.getByText('3 / 6')).toBeInTheDocument()
      expect(container.querySelector('[aria-hidden="false"] .warn-note')).toHaveTextContent(rawNote!)

      fireEvent.click(screen.getByLabelText('Next step'))

      expect(screen.getByText('4 / 6')).toBeInTheDocument()
      expect(container.querySelector('[aria-hidden="false"] .warn-note')).toHaveTextContent(adjustedNote!)
    })
  })
})
