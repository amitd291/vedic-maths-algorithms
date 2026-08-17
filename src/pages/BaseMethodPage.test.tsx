import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BaseMethodPage from './BaseMethodPage'
import { computeBaseMethodSteps } from '../lib/computeBaseMethodSteps'

const DIVIDEND = 10030
const DIVISOR = 827
const steps = computeBaseMethodSteps(DIVIDEND, DIVISOR)

describe('BaseMethodPage', () => {
  it('renders the 10030 ÷ 827 walkthrough', () => {
    render(<BaseMethodPage />)

    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText('1 / 7')).toBeInTheDocument()
    expect(screen.getByText('base').nextElementSibling).toHaveTextContent('1000')
    expect(screen.getByText('difference').nextElementSibling).toHaveTextContent('173')
  })

  it('steps through to the verified remainder', () => {
    render(<BaseMethodPage />)

    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }

    expect(screen.getByText('7 / 7')).toBeInTheDocument()
    expect(screen.getByText('Step 6 — compare and normalize')).toBeInTheDocument()
    expect(screen.getByText('Verify: 12 × 827 + 106 = 10030 ✓')).toBeInTheDocument()
    expect(screen.getByLabelText('Next step')).toBeDisabled()
  })

  it('steps forward and back with the ArrowRight/ArrowLeft keys', () => {
    render(<BaseMethodPage />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 7')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 7')).toBeInTheDocument()
  })

  it('clamps at the boundary steps instead of going out of range', () => {
    render(<BaseMethodPage />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 7')).toBeInTheDocument()

    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByLabelText('Next step'))
    expect(screen.getByText('7 / 7')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('7 / 7')).toBeInTheDocument()
  })

  it('sums the RHS columns right-to-left in the explainer text, carry first', () => {
    const sumStepIndex = steps.findIndex((s) => s.title.includes('sum the RHS columns'))
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
    // Rightmost column first, so the carry into column 3 is already on screen
    // by the time its own "(with carry)" line explains it.
    expect(sumLines.map((l) => l.label)).toEqual(['Sum column 5', 'Sum column 4', 'Sum column 3 (with carry)'])
  })

  it("Q2's multiply lands its contribution chips on the same row across every column it reaches", () => {
    const multiplyStepIndex = steps.findIndex((s) => s.title.includes('multiply Q₂'))
    const { container } = render(<BaseMethodPage />)

    for (let i = 0; i < multiplyStepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${multiplyStepIndex + 1} / ${steps.length}`)).toBeInTheDocument()

    const cols = container.querySelectorAll('.board-col')
    // Column 3 and column 4 (0-indexed 2, 3) already held Q1's contribution
    // on row 0; Q2's contribution should land as their second chip (row 1).
    expect(cols[2].querySelectorAll('.contribution-chip')[1]).toHaveTextContent('+1')
    expect(cols[3].querySelectorAll('.contribution-chip')[1]).toHaveTextContent('+7')

    // Column 5 (0-indexed 4) is only ever reached by Q2 — its lone chip must
    // still land on row 1 (not float up to row 0), keeping it aligned with
    // columns 3 and 4's row-1 chip from this same multiply step.
    const col5Chips = cols[4].querySelectorAll('.contribution-chip')
    expect(col5Chips).toHaveLength(2)
    expect(col5Chips[0]).toHaveClass('placeholder')
    expect(col5Chips[1]).not.toHaveClass('placeholder')
    expect(col5Chips[1]).toHaveTextContent('+3')
  })
})
