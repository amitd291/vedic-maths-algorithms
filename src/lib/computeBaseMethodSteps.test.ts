import { describe, it, expect } from 'vitest'
import { computeBaseMethodSteps } from './computeBaseMethodSteps'

// nearestBase and the solveBaseMethod validation throws (dividend/divisor
// shape, too-small dividend, quotient-width overflow) are pure-math concerns
// covered directly in baseMethodMath.test.ts — no need to re-derive them
// through the full narration pipeline here.

describe('computeBaseMethodSteps', () => {
  it('reproduces the 123 ÷ 9 worked example', () => {
    const steps = computeBaseMethodSteps(123, 9)

    expect(steps[0].title).toBe('Setup')
    expect(steps[0].cols.map((c) => c.digit)).toEqual([1, 2, 3])
    expect(steps[0].cols.map((c) => c.kind)).toEqual(['lhs', 'lhs', 'rhs'])

    const last = steps[steps.length - 1]
    expect(last.title).toBe('Step 5 — remainder')
    expect(last.cols.map((c) => c.total)).toEqual([1, 3, 6])
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 13 × 9 + 6 = 123 ✓',
    })
  })

  it('fans a multi-digit difference across every RHS column (1234 ÷ 98)', () => {
    const steps = computeBaseMethodSteps(1234, 98)
    const last = steps[steps.length - 1]
    expect(last.cols.map((c) => c.total)).toEqual([1, 2, 5, 8])
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 98 + 58 = 1234 ✓',
    })
  })

  it('fans a multi-digit difference across every RHS column (2122 ÷ 97)', () => {
    const steps = computeBaseMethodSteps(2122, 97)
    const last = steps[steps.length - 1]
    expect(last.cols.map((c) => c.total)).toEqual([2, 1, 8, 5])
  })

  it('carries right to left across RHS columns and applies the overflow correction (10030 ÷ 827)', () => {
    const steps = computeBaseMethodSteps(10030, 827)
    const last = steps[steps.length - 1]
    // The corrected last LHS chunk (Q₂ = 1 + 1 = 2) is already a single
    // digit, so no separate LHS-normalize step is needed — compare-and-correct
    // is the final step.
    expect(last.title).toBe('Step 7 — compare and correct')
    expect(last.cols.map((c) => c.total)).toEqual([1, 2, 1, 0, 6])
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '12 · 106' })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 827 + 106 = 10030 ✓',
    })

    // Self-contained case: raw RHS is [8, 13, 3] — carrying right to left
    // within RHS alone (13 → write 3, carry 1 into column 3; 8 + 1 = 9,
    // already a single digit) never spills past RHS's own leftmost column,
    // so it's safe to show as its own step, the same carry mechanism as the
    // LHS normalize step, before the divisor-range compare-and-correct runs.
    const normalizeStep = steps.find((s) => s.title.includes('normalize the remainder'))!
    expect(normalizeStep.title).toBe('Step 6 — normalize the remainder')
    expect(normalizeStep.cols.map((c) => c.total)).toEqual([1, 1, 9, 3, 3])
    expect(normalizeStep.lines).toContainEqual({
      kind: 'calc',
      label: 'Normalize',
      value: 'column 4 = 13 − 10 = 3; column 3 = 8 + 1 = 9',
    })
  })

  it('flips sign for a negative (Paravartya) difference and normalizes a negative remainder (1693 ÷ 131)', () => {
    const steps = computeBaseMethodSteps(1693, 131)
    const last = steps[steps.length - 1]
    // Corrected last LHS chunk (Q₂ = 3 − 1 = 2) is already a single digit,
    // so no separate LHS-normalize step is needed. The RHS side is a
    // boundary case (raw [-1, 0] — carrying spills past RHS's own leftmost
    // column), so no interim normalize-the-remainder step either —
    // compare-and-correct is the final step.
    expect(last.title).toBe('Step 6 — compare and correct')
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '12 · 121' })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 131 + 121 = 1693 ✓',
    })

    // The corrected remainder (121) needs 3 digits but the RHS board only
    // has 2 columns (divisor 131 has one more digit than base 100's RHS
    // width) — nowhere to split the extra leading digit, so it's shown as
    // one merged, green total in the rightmost RHS column instead of a
    // stale pre-correction value split across both.
    expect(last.cols.map((c) => c.colState)).toEqual(['done', 'done', 'done', 'done'])
    expect(last.cols.map((c) => c.total)).toEqual([1, 2, null, 121])
  })

  it('normalizes a signed intermediate LHS digit with no RHS correction needed (14189 ÷ 102)', () => {
    const steps = computeBaseMethodSteps(14189, 102)
    const last = steps[steps.length - 1]
    // No RHS correction is needed, but Q₃'s raw total (-1) still needs the
    // closing carry-normalize pass, so the last step is that pass, not a
    // trivial "remainder" step.
    expect(last.title).toBe(`Step ${steps.length - 1} — normalize the quotient`)
    expect(last.cols.map((c) => c.total)).toEqual([1, 3, 9, 1, 1])
    expect(last.lines).toContainEqual({
      kind: 'calc',
      label: 'Normalize',
      value: 'Q₃ = 10 + (-1) = 9; Q₂ = 4 − 1 = 3',
    })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 139 × 102 + 11 = 14189 ✓',
    })
  })

  it('settles a positive raw remainder and quotient in one step when no carry cascade is needed (30122 ÷ 87)', () => {
    // Hand-verified against the source PDF's own worked example (343/281 → 346/20).
    const steps = computeBaseMethodSteps(30122, 87)
    const last = steps[steps.length - 1]
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '346 · 20' })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 346 × 87 + 20 = 30122 ✓',
    })
  })

  it('folds a raw RHS overflow needing two subtractions into the last LHS chunk, then normalizes it (865 ÷ 9)', () => {
    const steps = computeBaseMethodSteps(865, 9)
    const last = steps[steps.length - 1]
    expect(last.title).toBe(`Step ${steps.length - 1} — normalize the quotient`)
    expect(last.cols.map((c) => c.total)).toEqual([9, 6, 1])
    expect(last.lines).toContainEqual({
      kind: 'calc',
      label: 'Normalize',
      value: 'Q₂ = 16 − 10 = 6; Q₁ = 8 + 1 = 9',
    })
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '96 · 1' })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 96 × 9 + 1 = 865 ✓',
    })

    // Q₂'s raw total (14) is used as-is for its own multiply — no mid-pass redo.
    const q2Step = steps.find((s) => s.title.includes('second LHS digit'))!
    expect(q2Step.lines).toContainEqual({ kind: 'result', label: 'Q₂', value: '14' })
    expect(q2Step.lines).toContainEqual({
      kind: 'note',
      tone: 'warn',
      text: "Q₂ is 14, not a single digit — used as-is for its own multiply below. Carries and borrows are resolved once, at the end.",
    })

    // Two closing steps: compare-and-correct (RHS settles, LHS still raw),
    // then normalize (LHS finally settles).
    const compareStep = steps.find((s) => s.title.includes('compare and correct'))!
    expect(compareStep.cols.map((c) => c.colState)).toEqual(['active', 'active', 'done'])
    const normalizeStep = last
    expect(normalizeStep.cols.map((c) => c.colState)).toEqual(['done', 'done', 'done'])
  })

  it('redoes an already-finalized LHS digit when a later column carries back into it (10600 ÷ 87)', () => {
    const steps = computeBaseMethodSteps(10600, 87)
    const last = steps[steps.length - 1]
    expect(last.title).toBe(`Step ${steps.length - 1} — normalize the quotient`)
    expect(last.cols.map((c) => c.total)).toEqual([1, 2, 1, 7, 3])
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 121 × 87 + 73 = 10600 ✓',
    })

    // Boundary case: raw RHS is [16, 0] — carrying 16 within RHS alone would
    // spill past RHS's own leftmost column. That crossing can only be
    // resolved by the divisor-range compare-and-correct (base and divisor
    // differ, so a raw base-10 carry across the LHS/RHS boundary would
    // silently give the wrong quotient/remainder) — so no interim
    // "normalize the remainder" step is inserted here; compare-and-correct
    // consumes the raw RHS total directly, same as before this change.
    expect(steps.some((s) => s.title.includes('normalize the remainder'))).toBe(false)
  })

  it('lands a contribution chip on an LHS column, aligned with its RHS neighbors from the same multiply (10030 ÷ 827)', () => {
    const steps = computeBaseMethodSteps(10030, 827)
    const multiplyQ1Step = steps.find((s) => s.title.includes('multiply Q₁'))!
    // LHS width is 2, so Q₁'s 3-digit contribution fans across column 2 (LHS)
    // and columns 3–4 (RHS) — all on the same contribution row (index 0).
    expect(multiplyQ1Step.cols[1].kind).toBe('lhs')
    expect(multiplyQ1Step.cols[1].contributions[0]).toBe(1)
    expect(multiplyQ1Step.cols[2].contributions[0]).toBe(7)
    expect(multiplyQ1Step.cols[3].contributions[0]).toBe(3)
  })
})
