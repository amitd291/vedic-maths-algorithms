import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BaseMethodPage from './BaseMethodPage'
import { computeBaseMethodSteps } from '../lib/computeBaseMethodSteps'

const DIVIDEND = 10600
const DIVISOR = 87
const steps = computeBaseMethodSteps(DIVIDEND, DIVISOR)

describe('BaseMethodPage', () => {
  it('renders the 10600 ÷ 87 walkthrough', () => {
    render(<BaseMethodPage />)

    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText(`1 / ${steps.length}`)).toBeInTheDocument()
    expect(screen.getByText('base').nextElementSibling).toHaveTextContent('100')
    expect(screen.getByText('difference').nextElementSibling).toHaveTextContent('13')
  })

  it('steps through to the verified remainder', () => {
    render(<BaseMethodPage />)

    for (let i = 0; i < steps.length - 1; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }

    expect(screen.getByText(`${steps.length} / ${steps.length}`)).toBeInTheDocument()
    expect(screen.getByText(`Step ${steps.length - 1} — remainder`)).toBeInTheDocument()
    expect(screen.getByText('Verify: 121 × 87 + 73 = 10600 ✓')).toBeInTheDocument()
    expect(screen.getByLabelText('Next step')).toBeDisabled()
  })

  it('steps forward and back with the ArrowRight/ArrowLeft keys', () => {
    render(<BaseMethodPage />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(`2 / ${steps.length}`)).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText(`1 / ${steps.length}`)).toBeInTheDocument()
  })

  it('clamps at the boundary steps instead of going out of range', () => {
    render(<BaseMethodPage />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText(`1 / ${steps.length}`)).toBeInTheDocument()

    for (let i = 0; i < steps.length - 1; i++) fireEvent.click(screen.getByLabelText('Next step'))
    expect(screen.getByText(`${steps.length} / ${steps.length}`)).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(`${steps.length} / ${steps.length}`)).toBeInTheDocument()
  })

  it('sums the RHS columns right-to-left in the explainer text, carry first', () => {
    const sumStepIndex = steps.length - 1
    const { container } = render(<BaseMethodPage />)

    for (let i = 0; i < sumStepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${sumStepIndex + 1} / ${steps.length}`)).toBeInTheDocument()

    const sumLines = steps[sumStepIndex].lines.filter((l) => l.kind === 'calc' && l.label.startsWith('Sum column'))
    const labels = container.querySelectorAll('[aria-hidden="false"] .calc-line .co')

    for (let i = 0; i < sumLines.length; i++) {
      expect(labels[i]).toHaveTextContent(sumLines[i].label)
    }
    // Rightmost column first, so the carry into column 4 is already on screen
    // by the time its own line explains it.
    expect(sumLines.map((l) => l.label)).toEqual(['Sum column 5', 'Sum column 4'])
  })

  it("Q2's finalize step surfaces the carry-back from Q3's overflow and the redone digit", () => {
    const q2StepIndex = steps.findIndex((s) => s.title.includes('second LHS digit'))
    render(<BaseMethodPage />)

    for (let i = 0; i < q2StepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${q2StepIndex + 1} / ${steps.length}`)).toBeInTheDocument()
    expect(screen.getByText('Q₂').nextElementSibling).toHaveTextContent('2')
    expect(
      screen.getByText("Includes a carry of 1 from column 3's overflow — Q₂'s multiply below uses this corrected value."),
    ).toBeInTheDocument()
  })

  it("Q1's multiply lands its contribution chips on the same row across the LHS and RHS columns it reaches", () => {
    const multiplyStepIndex = steps.findIndex((s) => s.title.includes('multiply Q₁'))
    const { container } = render(<BaseMethodPage />)

    for (let i = 0; i < multiplyStepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${multiplyStepIndex + 1} / ${steps.length}`)).toBeInTheDocument()

    const cols = container.querySelectorAll('.board-col')
    // Column 2 (0-indexed 1) is LHS; columns 3 (0-indexed 2) is the next
    // column reached by the same 2-digit contribution (13) fanning out.
    expect(cols[1].querySelectorAll('.contribution-chip')[0]).toHaveTextContent('+1')
    expect(cols[2].querySelectorAll('.contribution-chip')[0]).toHaveTextContent('+3')
  })
})
