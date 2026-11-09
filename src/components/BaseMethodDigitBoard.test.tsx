import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import BaseMethodDigitBoard from './BaseMethodDigitBoard'
import type { BaseMethodStep } from '../types'

function makeStep(carries: BaseMethodStep['carries']): BaseMethodStep {
  return {
    title: 'Test step',
    lines: [],
    connectors: [false, false, false],
    carries,
    cols: [
      { kind: 'lhs', digit: 1, contributions: [], total: 1, colState: 'active' },
      { kind: 'lhs', digit: 4, contributions: [], total: 4, colState: 'active' },
      { kind: 'lhs', digit: 1, contributions: [], total: -1, colState: 'active' },
      { kind: 'rhs', digit: 8, contributions: [], total: 8, colState: 'done' },
    ],
  }
}

const noop = vi.fn()

describe('BaseMethodDigitBoard total row', () => {
  it('renders a negative column total with a true minus (U+2212)', () => {
    const step = makeStep(undefined)
    const { container } = render(<BaseMethodDigitBoard step={step} onBack={noop} onNext={noop} isFirst isLast={false} />)

    const totals = Array.from(container.querySelectorAll('.total-slot')).map((t) => t.textContent)
    expect(totals).toContain('−1')
    expect(totals.join(' ')).not.toMatch(/-\d/)
  })
})

describe('BaseMethodDigitBoard carry chip', () => {
  it('renders a positive carry as a decrease on the sender, increase on the receiver, arrow pointing left', () => {
    const step = makeStep([{ fromCol: 2, toCol: 1, amount: 1 }])
    const { container } = render(<BaseMethodDigitBoard step={step} onBack={noop} onNext={noop} isFirst isLast={false} />)

    const chips = container.querySelectorAll('.carry-chip.show')
    expect(Array.from(chips).map((c) => c.textContent)).toEqual(['+ 1', '− 10'])

    const arrow = container.querySelector('.carry-connector.show')!
    expect(arrow.querySelector('line')).toHaveAttribute('x1', '20')
    expect(arrow.textContent).toContain('1')
  })

  it('renders a negative carry (borrow) as an increase on the sender, decrease on the receiver, arrow pointing right', () => {
    const step = makeStep([{ fromCol: 2, toCol: 1, amount: -1 }])
    const { container } = render(<BaseMethodDigitBoard step={step} onBack={noop} onNext={noop} isFirst isLast={false} />)

    const chips = container.querySelectorAll('.carry-chip.show')
    expect(Array.from(chips).map((c) => c.textContent)).toEqual(['− 1', '+ 10'])

    const arrow = container.querySelector('.carry-connector.show')!
    expect(arrow.querySelector('line')).toHaveAttribute('x1', '6')
    expect(arrow.textContent).toContain('1')
  })

  it('shows no carry chips when the step has none', () => {
    const step = makeStep(undefined)
    const { container } = render(<BaseMethodDigitBoard step={step} onBack={noop} onNext={noop} isFirst isLast={false} />)

    expect(container.querySelectorAll('.carry-chip.show')).toHaveLength(0)
    expect(container.querySelectorAll('.carry-connector.show')).toHaveLength(0)
  })

  it('renders descale-row when finalAnswer prop is provided', () => {
    const step = makeStep(undefined)
    const { container } = render(
      <BaseMethodDigitBoard
        step={step}
        onBack={noop}
        onNext={noop}
        isFirst
        isLast
        finalAnswer={{ divisor: 35, quotient: 155, remainder: 3 }}
      />,
    )

    const descaleRow = container.querySelector('.digit-board-cols .descale-row')
    expect(descaleRow).not.toBeNull()
    expect(descaleRow?.textContent).toContain('Real answer (÷ 35)')
    expect(descaleRow?.textContent).toContain('155 | 3')
  })

  it('renders no descale-row when finalAnswer prop is omitted', () => {
    const step = makeStep(undefined)
    const { container } = render(<BaseMethodDigitBoard step={step} onBack={noop} onNext={noop} isFirst isLast={false} />)

    expect(container.querySelector('.digit-board-cols .descale-row')).toBeNull()
  })

  it('renders no descale-row when finalAnswer prop is null', () => {
    const step = makeStep(undefined)
    const { container } = render(
      <BaseMethodDigitBoard step={step} onBack={noop} onNext={noop} isFirst isLast={false} finalAnswer={null} />,
    )

    expect(container.querySelector('.digit-board-cols .descale-row')).toBeNull()
  })
})
