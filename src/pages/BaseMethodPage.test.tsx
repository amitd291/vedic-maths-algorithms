import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BaseMethodPage from './BaseMethodPage'
import { computeBaseMethodSteps, nearestBase } from '../lib/computeBaseMethodSteps'
import type { CalcLine } from '../types'

function hasLabel(l: CalcLine): l is Extract<CalcLine, { label: string }> {
  return l.kind === 'calc' || l.kind === 'result'
}

// Kept in sync with BaseMethodPage's own hardcoded example rather than
// duplicated as a literal, so a future default-example change doesn't
// require touching every assertion below.
const DIVIDEND = 10600
const DIVISOR = 87
const steps = computeBaseMethodSteps(DIVIDEND, DIVISOR)
const base = nearestBase(DIVISOR)
const difference = base - DIVISOR

describe('BaseMethodPage', () => {
  it('renders the default walkthrough', () => {
    render(<BaseMethodPage />)

    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText(`1 / ${steps.length}`)).toBeInTheDocument()
    expect(screen.getByText('base').nextElementSibling).toHaveTextContent(String(base))
    expect(screen.getByText('difference').nextElementSibling).toHaveTextContent(String(difference))
  })

  it('steps through to the verified remainder', () => {
    render(<BaseMethodPage />)

    for (let i = 0; i < steps.length - 1; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }

    const last = steps[steps.length - 1]
    const verifyNote = last.lines.find((l) => l.kind === 'note' && l.tone === 'success')!

    expect(screen.getByText(`${steps.length} / ${steps.length}`)).toBeInTheDocument()
    expect(screen.getByText(last.title)).toBeInTheDocument()
    expect(screen.getByText((verifyNote as Extract<CalcLine, { kind: 'note' }>).text)).toBeInTheDocument()
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

  it('sums the RHS columns left-to-right in the explainer text (raw, pre-correction)', () => {
    const sumStepIndex = steps.findIndex((s) => s.title.includes('sum the RHS columns'))
    const { container } = render(<BaseMethodPage />)

    for (let i = 0; i < sumStepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${sumStepIndex + 1} / ${steps.length}`)).toBeInTheDocument()

    const sumLines = steps[sumStepIndex].lines
      .filter(hasLabel)
      .filter((l) => l.label.startsWith('Sum column'))
    const labels = container.querySelectorAll('[aria-hidden="false"] .calc-line .co')

    for (let i = 0; i < sumLines.length; i++) {
      expect(labels[i]).toHaveTextContent(sumLines[i].label)
    }
  })

  it('surfaces a raw (≥10) LHS total, used as-is with no mid-pass redo', () => {
    const rawStepIndex = steps.findIndex((s) =>
      s.lines.some((l) => l.kind === 'note' && l.text.includes('not a single digit')),
    )
    render(<BaseMethodPage />)

    for (let i = 0; i < rawStepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${rawStepIndex + 1} / ${steps.length}`)).toBeInTheDocument()

    const result = steps[rawStepIndex].lines.find((l) => l.kind === 'result')! as Extract<CalcLine, { kind: 'result' }>
    const note = steps[rawStepIndex].lines.find(
      (l) => l.kind === 'note' && l.text.includes('not a single digit'),
    )! as Extract<CalcLine, { kind: 'note' }>

    expect(screen.getByText(result.label).nextElementSibling).toHaveTextContent(result.value)
    expect(screen.getByText(note.text)).toBeInTheDocument()
  })

  it('shows the carry chip on the interim step, and nowhere else', () => {
    const compareStepIndex = steps.findIndex((s) => s.title.includes('compare and correct'))
    const { container } = render(<BaseMethodPage />)

    for (let i = 0; i < compareStepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${compareStepIndex + 1} / ${steps.length}`)).toBeInTheDocument()

    const activeChips = container.querySelectorAll('.carry-chip.show')
    expect(Array.from(activeChips).map((c) => c.textContent)).toEqual(['+ 1', '− 10'])
    expect(container.querySelector('.carry-connector.show')).not.toBeNull()

    fireEvent.click(screen.getByLabelText('Next step'))
    expect(container.querySelectorAll('.carry-chip.show')).toHaveLength(0)
  })

  it("Q1's multiply lands its contribution chips on the same row across every column it reaches", () => {
    const multiplyStepIndex = steps.findIndex((s) => s.title.includes('multiply Q₁'))
    const { container } = render(<BaseMethodPage />)

    for (let i = 0; i < multiplyStepIndex; i++) {
      fireEvent.click(screen.getByLabelText('Next step'))
    }
    expect(screen.getByText(`${multiplyStepIndex + 1} / ${steps.length}`)).toBeInTheDocument()

    const expectedChips = steps[multiplyStepIndex].cols
      .map((c) => c.contributions[0])
      .filter((v): v is number => v !== undefined)
      .map((v) => (v < 0 ? `−${-v}` : `+${v}`))

    const cols = container.querySelectorAll('.board-col')
    let chipIdx = 0
    for (const col of cols) {
      const chip = col.querySelectorAll('.contribution-chip')[0]
      if (chip && !chip.classList.contains('placeholder')) {
        expect(chip).toHaveTextContent(expectedChips[chipIdx])
        chipIdx += 1
      }
    }
    expect(chipIdx).toBe(expectedChips.length)
  })

  it('solves a new problem entered via the input form', () => {
    render(<BaseMethodPage />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '865' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '9' } })
    fireEvent.submit(document.querySelector('form')!)

    const newSteps = computeBaseMethodSteps(865, 9)
    expect(screen.getByText(`1 / ${newSteps.length}`)).toBeInTheDocument()
  })

  it('shows an error banner instead of crashing when the dividend is too small for its base', () => {
    render(<BaseMethodPage />)

    fireEvent.change(screen.getByLabelText('Dividend'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Divisor'), { target: { value: '87' } })
    fireEvent.submit(document.querySelector('form')!)

    expect(screen.getByRole('alert')).toHaveTextContent('dividend is too small for this base')
    expect(screen.queryByText('Setup')).not.toBeInTheDocument()
  })
})
