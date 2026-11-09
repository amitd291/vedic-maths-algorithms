import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SimplificationSelector from './SimplificationSelector'
import { findScalingCandidates, findSimplificationCandidates } from '../lib/baseMethodMath'

describe('SimplificationSelector', () => {
  it('renders nothing when divisor is 9', () => {
    const { container } = render(<SimplificationSelector divisor={9} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when divisor is 182', () => {
    const { container } = render(<SimplificationSelector divisor={182} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the question, expanded with no option highlighted and the intro, before any selection for divisor 35', () => {
    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    expect(screen.getByText('How should this be simplified?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /How should this be simplified/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /105: Scaled divisor/ })).toBeInTheDocument()
    expect(document.querySelectorAll('.simplification-option.selected')).toHaveLength(0)

    const intro = document.querySelector('.select-intro')
    expect(intro).toHaveTextContent("The plain difference (−25) isn't simple to calculate with. Pick how to simplify.")
    expect(intro).toHaveTextContent('Note that only one option is ever applied.')
  })

  it('renders no Plain option for divisor 35', () => {
    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /^Plain/ })).toBeNull()
  })

  it('renders nothing for divisor 53 (no candidate: plain difference unfriendly, substitution is a no-op, no scaling)', () => {
    const { container } = render(<SimplificationSelector divisor={53} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one substituted card for divisor 827 with its derivation', () => {
    render(<SimplificationSelector divisor={827} onSelect={vi.fn()} />)

    const card = screen.getByRole('button', { name: /Substituted difference \(173\)/ })
    expect(card).toHaveClass('substituted-option')
    expect(card).toHaveTextContent('2, −3, 3:')
    expect(card).toHaveTextContent('Base: 1000 | Difference: 173 = 200 − 30 + 3')
    expect(document.querySelectorAll('.simplification-option')).toHaveLength(1)
  })

  it('calls onSelect with the substitution candidate when the substituted card is clicked for divisor 827', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={827} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /Substituted difference \(173\)/ }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect.mock.calls[0][0]).toEqual({ kind: 'substitution', digits: [2, -3, 3], base: 1000, difference: 173 })
  })

  it('shows the green collapsed summary after picking the substituted card for divisor 827', () => {
    render(<SimplificationSelector divisor={827} onSelect={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Substituted difference \(173\)/ }))

    expect(screen.queryByRole('button', { name: /^2, −3, 3:/ })).toBeNull()
    expect(screen.getByText('✓ 2, −3, 3: Substituted difference (173)')).toBeInTheDocument()
  })

  it('renders the scaling card first and the substituted card after it for divisor 791', () => {
    render(<SimplificationSelector divisor={791} onSelect={vi.fn()} />)

    const cards = Array.from(document.querySelectorAll('.simplification-option'))
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('113: Scaled divisor (791 ÷ 7)')
    expect(cards[1]).toHaveClass('substituted-option')
    expect(cards[1]).toHaveTextContent('2, 1, −1: Substituted difference (209)')
    expect(cards[1]).toHaveTextContent('Base: 1000 | Difference: 209 = 200 + 10 − 1')
  })

  it('shows the negative derivation wrapped in a minus for a negative substituted difference', () => {
    render(<SimplificationSelector divisor={146} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Substituted difference \(−46\)/ })).toHaveTextContent('−46 = −(50 − 4)')
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

    // +1 for the expand/collapse toggle (also a `role="button"` for
    // keyboard/screen-reader accessibility). Scaling cards now follow
    // findSimplificationCandidates, which drops scaling candidates whose
    // difference is wider than the plain one (5 raw scaling candidates, 2 shown here).
    expect(screen.getAllByRole('button')).toHaveLength(findSimplificationCandidates(16).length + 1)
  })

  it('renders N candidate buttons plus the toggle visible by default for divisor 35', () => {
    const allCandidates = findScalingCandidates(35)
    expect(allCandidates).toHaveLength(4)

    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(allCandidates.length + 1)
  })

  it('calls onSelect with the correct candidate when ×3 button is clicked for divisor 35', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={35} onSelect={onSelect} />)

    const candidateButton = screen.getByRole('button', { name: /105: Scaled divisor/ })
    fireEvent.click(candidateButton)

    expect(onSelect).toHaveBeenCalledOnce()
    const calledWith = onSelect.mock.calls[0][0]
    expect(calledWith).toEqual({
      kind: 'scaling',
      k: 3,
      direction: 'multiply',
      scaledDivisor: 105,
      base: 100,
      difference: -5,
    })
  })

  it('hides option buttons after one is selected, but keeps toggle header visible with green summary for divisor 35', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={35} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /^105: Scaled divisor/ }))

    expect(screen.queryByRole('button', { name: /^105: Scaled divisor/ })).toBeNull()
    expect(screen.getByText('✓ 105: Scaled divisor (35 × 3)')).toBeInTheDocument()
  })

  it('re-expands options when toggle header is clicked again after selection for divisor 35', () => {
    const onSelect = vi.fn()
    render(<SimplificationSelector divisor={35} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /^105: Scaled divisor/ }))

    expect(screen.queryByRole('button', { name: /^105: Scaled divisor/ })).toBeNull()

    // Click on the green summary text to re-expand
    const summaryElement = screen.getByText('✓ 105: Scaled divisor (35 × 3)')
    fireEvent.click(summaryElement)

    expect(screen.getByRole('button', { name: /^105: Scaled divisor/ })).toBeInTheDocument()
  })

  it('renders ×3 candidate card (105) with Base 100 and Difference -5 for divisor 35', () => {
    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    // Find the button with the expected pattern
    const candidateButton = screen.getByRole('button', { name: /^105: Scaled divisor \(35 × 3\)/ })
    const cardContent = candidateButton.textContent || ''

    expect(cardContent).toContain('Base')
    expect(cardContent).toContain('100')
    expect(cardContent).toContain('Difference')
    expect(cardContent).toContain('−5')
    expect(cardContent).not.toMatch(/-\d/)
  })

  it('displays green summary when ×3 candidate (105) is selected for divisor 35', () => {
    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    const candidateButton = screen.getByRole('button', { name: /105: Scaled divisor/ })
    fireEvent.click(candidateButton)

    expect(screen.getByRole('button', { name: /✓ 105: Scaled divisor/ })).toBeInTheDocument()
    expect(screen.queryByText(/How should this be simplified/)).not.toBeInTheDocument()
  })

  it('selected ×3 button has class "selected" and summary persists when re-expanded for divisor 35', () => {
    render(<SimplificationSelector divisor={35} onSelect={vi.fn()} />)

    const candidateButton = screen.getByRole('button', { name: /^105: Scaled divisor/ })
    fireEvent.click(candidateButton)

    // Summary should be visible
    expect(screen.getByText('✓ 105: Scaled divisor (35 × 3)')).toBeInTheDocument()

    // Re-expand by clicking the summary text
    const summaryText = screen.getByText('✓ 105: Scaled divisor (35 × 3)')
    fireEvent.click(summaryText)

    // Button should have selected class after re-expansion
    const expandedButton = screen.getByRole('button', { name: /^105: Scaled divisor/ })
    expect(expandedButton.classList.contains('selected')).toBe(true)

    // Summary should still be visible after re-expansion
    expect(screen.getByText('✓ 105: Scaled divisor (35 × 3)')).toBeInTheDocument()

    // The button name should be visible since expanded
    expect(screen.getByRole('button', { name: /^105: Scaled divisor/ })).toBeInTheDocument()
  })

})
