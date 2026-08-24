import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SimplificationSelector from './SimplificationSelector'
import { findScalingCandidates } from '../lib/baseMethodMath'

describe('SimplificationSelector', () => {
  it('renders nothing when divisor is 9', () => {
    const { container } = render(<SimplificationSelector divisor={9} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when divisor is 182', () => {
    const { container } = render(<SimplificationSelector divisor={182} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for divisor 11, even though it has 5 raw candidates, because its plain difference is already friendly', () => {
    // Regression guard: divisor 11's own digits ('1','1') are flat-friendly,
    // which a buggy render guard checking the divisor itself (instead of
    // the plain difference) would wrongly treat as "show the panel".
    expect(findScalingCandidates(11)).toHaveLength(5)
    const { container } = render(<SimplificationSelector divisor={11} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the panel for divisor 16, even though its own digits contain an unfriendly 6, because its plain difference needs simplifying', () => {
    // Regression guard: divisor 16's own digits ('1','6') are flat-unfriendly,
    // which a buggy render guard checking the divisor itself (instead of
    // the plain difference) would wrongly treat as "render nothing".
    const candidates = findScalingCandidates(16)
    expect(candidates).toHaveLength(5)

    render(<SimplificationSelector divisor={16} onSelect={vi.fn()} />)

    // +1 for the Plain option, +1 for the expand/collapse toggle (also a
    // `role="button"` for keyboard/screen-reader accessibility).
    expect(screen.getAllByRole('button')).toHaveLength(candidates.length + 2)
  })

  it('renders 1 Plain + N candidate buttons visible by default for divisor 35', () => {
    const allCandidates = findScalingCandidates(35)
    expect(allCandidates).toHaveLength(4)

    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(allCandidates.length + 2)
  })

  it('calls onSelect with the correct candidate when ×3 button is clicked for divisor 35', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={35} onSelect={onSelect} />)

    const multiplyButton = screen.getByRole('button', { name: /×3/ })
    fireEvent.click(multiplyButton)

    expect(onSelect).toHaveBeenCalledOnce()
    const calledWith = onSelect.mock.calls[0][0]
    expect(calledWith).toEqual({
      k: 3,
      direction: 'multiply',
      scaledDivisor: 105,
      base: 100,
      difference: -5,
    })
  })

  it('calls onSelect with null when Plain button is clicked for divisor 35', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={35} onSelect={onSelect} />)

    const plainButton = screen.getByRole('button', { name: /Plain/ })
    fireEvent.click(plainButton)

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('hides option buttons after one is selected, but keeps toggle header visible for divisor 35', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={35} onSelect={onSelect} />)

    const plainButton = screen.getByRole('button', { name: /Plain/ })
    fireEvent.click(plainButton)

    expect(screen.queryByRole('button', { name: /Plain/ })).toBeNull()
    expect(screen.queryByText(/×3/)).toBeNull()
    expect(screen.getByText(/How should this be simplified/)).toBeInTheDocument()
  })

  it('re-expands options when toggle header is clicked again for divisor 35', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={35} onSelect={onSelect} />)

    const plainButton = screen.getByRole('button', { name: /Plain/ })
    fireEvent.click(plainButton)

    expect(screen.queryByText(/×3/)).toBeNull()

    const toggleElement = screen.getByText(/How should this be simplified/)
    fireEvent.click(toggleElement)

    expect(screen.getByText(/×3/)).toBeInTheDocument()
  })

  it('renders Plain option card with Base 10 and Difference -25 for divisor 35', () => {
    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    const plainButton = screen.getByRole('button', { name: /^Plain/ })
    const plainCardContent = plainButton.textContent || ''

    expect(plainCardContent).toContain('Base')
    expect(plainCardContent).toContain('10')
    expect(plainCardContent).toContain('Difference')
    expect(plainCardContent).toContain('-25')
  })

  it('renders ×3 candidate card with Base 100 and Difference -5 for divisor 35', () => {
    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    const multiplyButton = screen.getByRole('button', { name: /×3/ })
    const cardContent = multiplyButton.textContent || ''

    expect(cardContent).toContain('Base')
    expect(cardContent).toContain('100')
    expect(cardContent).toContain('Difference')
    expect(cardContent).toContain('-5')
  })
})
