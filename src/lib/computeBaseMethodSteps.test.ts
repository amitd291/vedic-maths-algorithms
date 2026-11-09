import { describe, it, expect } from 'vitest'
import { computeBaseMethodSteps, computeScaledBaseMethodSteps } from './computeBaseMethodSteps'
import { findScalingCandidates } from './baseMethodMath'
import type { CalcLine } from '../types'

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
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '12 | 106' })
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

    // The carry chip: shown on the preceding "sum the RHS columns" step,
    // while column 4 (index 3) is still raw — not on the normalize step
    // itself, which settles clean with nothing left to flag.
    const sumStep = steps.find((s) => s.title.includes('sum the RHS columns'))!
    expect(sumStep.carries).toEqual([{ fromCol: 3, toCol: 2, amount: 1 }])
    expect(normalizeStep.carries).toBeUndefined()
  })

  // Reachable in the app: 87 needs no simplification, so the plain board shows.
  it('keeps the RHS-total note on a normalize-the-remainder step that a compare-and-correct step follows (612 ÷ 87)', () => {
    const steps = computeBaseMethodSteps(612, 87)
    const normalizeIdx = steps.findIndex((s) => s.title.includes('normalize the remainder'))
    expect(normalizeIdx).toBeGreaterThan(-1)
    expect(steps[normalizeIdx].lines).toContainEqual({
      kind: 'note',
      tone: 'warn',
      text: 'RHS total is now 90, after being re-expressed as valid digits.',
    })
    expect(steps[normalizeIdx + 1].title).toContain('compare and correct')
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
    expect(last.lines).toContainEqual({ kind: 'calc', label: 'Compare', value: 'RHS total −10 is negative' })
    expect(last.lines).toContainEqual({
      kind: 'calc',
      label: 'Correct',
      value: '(−10) + 131 = 121, and Q₂ = 3 − 1 = 2',
    })
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '12 | 121' })
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
      value: 'Q₃ = 10 + (−1) = 9; Q₂ = 4 − 1 = 3',
    })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 139 × 102 + 11 = 14189 ✓',
    })

    // No compare-and-correct step exists here (no divisor-range correction
    // was needed), so the carry chip lands on the preceding "sum the RHS
    // columns" step instead — and it's a borrow (negative amount), the only
    // tested case where the carry direction reverses.
    expect(steps.some((s) => s.title.includes('compare and correct'))).toBe(false)
    const sumStep = steps.find((s) => s.title.includes('sum the RHS columns'))!
    expect(sumStep.carries).toEqual([{ fromCol: 2, toCol: 1, amount: -1 }])
    expect(last.carries).toBeUndefined()
  })

  it('settles a positive raw remainder and quotient in one step when no carry cascade is needed (30122 ÷ 87)', () => {
    // Hand-verified against the source PDF's own worked example (343/281 → 346/20).
    const steps = computeBaseMethodSteps(30122, 87)
    const last = steps[steps.length - 1]
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '346 | 20' })
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
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '96 | 1' })
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

    // The carry chip: shown on the preceding "compare and correct" step,
    // while Q₃ (col index 2) is still raw (11) — Q₂ (col index 1, still
    // showing its own raw total of 1) is the receiver. The normalize step
    // itself (`last`) settles clean, with no carries left to flag.
    const compareStep = steps.find((s) => s.title.includes('compare and correct'))!
    expect(compareStep.carries).toEqual([{ fromCol: 2, toCol: 1, amount: 1 }])
    expect(last.carries).toBeUndefined()
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

describe('computeBaseMethodSteps with substituted digits', () => {
  const hasLabel = (lines: CalcLine[], label: string) => lines.some((l) => 'label' in l && l.label === label)

  it('shows substituted digits in Setup, one digit per column in multiply steps (10030 ÷ 827, [2,-3,3])', () => {
    const steps = computeBaseMethodSteps(10030, 827, [2, -3, 3])

    expect(steps[0].lines).toContainEqual({ kind: 'calc', label: 'Substituted', value: '173 → 2, −3, 3' })

    const multiplyQ1 = steps.find((s) => s.title.includes('multiply Q₁'))!
    expect(multiplyQ1.lines).toContainEqual({
      kind: 'calc',
      label: 'Multiply',
      value: 'Q₁ × difference = 1 × (2, −3, 3) = (2, −3, 3)',
    })
    expect(multiplyQ1.lines).toContainEqual({
      kind: 'note',
      tone: 'warn',
      text: 'One digit per column: 2 under column 2, −3 under column 3, 3 under column 4.',
    })
    expect(multiplyQ1.cols[1].contributions).toEqual([2])
    expect(multiplyQ1.cols[2].contributions[0]).toBe(-3)
    expect(multiplyQ1.cols[3].contributions[0]).toBe(3)

    const multiplyQ2 = steps.find((s) => s.title.includes('multiply Q₂'))!
    expect(multiplyQ2.lines).toContainEqual({
      kind: 'calc',
      label: 'Multiply',
      value: 'Q₂ × difference = 2 × (2, −3, 3) = (4, −6, 6)',
    })

    expect(steps.some((s) => s.title.includes('compare and correct'))).toBe(false)
    expect(steps.some((s) => s.title.includes('normalize the remainder'))).toBe(false)

    expect(steps.at(-1)!.lines).toContainEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 827 + 106 = 10030 ✓',
    })
  })

  it('normalizes the remainder as the final step when substituted RHS needs a borrow (10000 ÷ 819, [2,-2,1])', () => {
    const steps = computeBaseMethodSteps(10000, 819, [2, -2, 1])

    expect(steps.some((s) => s.title.includes('compare and correct'))).toBe(false)
    const normalizeStep = steps.find((s) => s.title.includes('normalize the remainder'))!
    expect(normalizeStep.title).toBe(`Step ${steps.length - 1} — normalize the remainder`)
    expect(steps.at(-1)).toBe(normalizeStep)

    expect(steps.at(-1)!.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 819 + 172 = 10000 ✓',
    })
  })

  it('omits the redundant RHS-total note on a final normalize-the-remainder step (10000 ÷ 819, [2,-2,1])', () => {
    const steps = computeBaseMethodSteps(10000, 819, [2, -2, 1])
    const normalizeStep = steps.find((s) => s.title.includes('normalize the remainder'))!

    expect(normalizeStep.lines.some((l) => l.kind === 'note' && l.tone === 'warn' && /RHS total is now/.test(l.text))).toBe(false)
    expect(steps.at(-1)).toBe(normalizeStep)
    expect(normalizeStep.lines.some((l) => l.kind === 'result' && l.value === '12 | 172')).toBe(true)
    expect(normalizeStep.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 819 + 172 = 10000 ✓',
    })
  })

  it('uses the sign of the difference for a Paravartya substitution (1693 ÷ 146, [5,-4])', () => {
    const steps = computeBaseMethodSteps(1693, 146, [5, -4])

    expect(steps[0].lines).toContainEqual({ kind: 'calc', label: 'Substituted', value: '46 → 5, −4' })

    const multiplyQ1 = steps.find((s) => s.title.includes('multiply Q₁'))!
    expect(multiplyQ1.lines).toContainEqual({
      kind: 'calc',
      label: 'Multiply',
      value: 'Q₁ × difference = 1 × (5, −4) = (−5, 4)',
    })

    expect(steps.at(-1)!.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 11 × 146 + 87 = 1693 ✓',
    })
  })

  it('omits the Substituted setup line when no digits are given (10030 ÷ 827)', () => {
    const steps = computeBaseMethodSteps(10030, 827)
    expect(hasLabel(steps[0].lines, 'Substituted')).toBe(false)
  })
})

describe('computeScaledBaseMethodSteps', () => {
  it('computes 5428 ÷ 35 via multiply candidate k=3 (scaledDivisor=105)', () => {
    const dividend = 5428
    const divisor = 35
    const candidates = findScalingCandidates(divisor)
    const candidate = candidates.find((c) => c.k === 3 && c.direction === 'multiply')

    expect(candidate).toBeDefined()
    expect(candidate!.scaledDivisor).toBe(105)

    const steps = computeScaledBaseMethodSteps(dividend, divisor, candidate!)
    const innerSteps = computeBaseMethodSteps(dividend, 105)

    // Steps = patchedSetupStep + innerSteps.slice(1) + closingStep (length = innerSteps.length + 1)
    expect(steps.length).toBe(innerSteps.length + 1)

    // First step: Setup with patched first line
    expect(steps[0].title).toBe('Setup')
    expect(steps[0].lines[0]).toEqual({
      kind: 'calc',
      label: 'Scaled divisor',
      value: '105 (35 × 3)',
    })
    // Remaining lines should match innerSteps[0]
    expect(steps[0].lines.slice(1)).toEqual(innerSteps[0].lines.slice(1))

    // Last step: descale the answer
    expect(steps.at(-1)!.title.toLowerCase()).toContain('descale')

    // Verify result lines
    expect(steps.at(-1)!.lines).toContainEqual({
      kind: 'result',
      label: 'Quotient · Remainder',
      value: '155 | 3',
    })
    expect(steps.at(-1)!.lines).toContainEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 155 × 35 + 3 = 5428 ✓',
    })
  })

  it('computes 5428 ÷ 35 via multiply candidate k=2 (scaledDivisor=70)', () => {
    const dividend = 5428
    const divisor = 35
    const candidates = findScalingCandidates(divisor)
    const candidate = candidates.find((c) => c.k === 2 && c.direction === 'multiply')

    expect(candidate).toBeDefined()
    expect(candidate!.scaledDivisor).toBe(70)

    const steps = computeScaledBaseMethodSteps(dividend, divisor, candidate!)

    // First step shows multiply by k=2
    expect((steps[0].lines[0] as Extract<CalcLine, { kind: 'calc' }>).value).toBe('70 (35 × 2)')

    // Same final answer regardless of k
    expect(steps.at(-1)!.lines).toContainEqual({
      kind: 'result',
      label: 'Quotient · Remainder',
      value: '155 | 3',
    })
  })

  it('computes 12657 ÷ 791 via divide candidate k=7 (scaledDivisor=113)', () => {
    const dividend = 12657
    const divisor = 791
    const candidates = findScalingCandidates(divisor)
    const candidate = candidates.find((c) => c.k === 7 && c.direction === 'divide')

    expect(candidate).toBeDefined()
    expect(candidate!.scaledDivisor).toBe(113)

    const steps = computeScaledBaseMethodSteps(dividend, divisor, candidate!)

    // First step shows divide by k=7
    expect((steps[0].lines[0] as Extract<CalcLine, { kind: 'calc' }>).value).toBe('113 (791 ÷ 7)')

    // Check final result
    expect(steps.at(-1)!.lines).toContainEqual({
      kind: 'result',
      label: 'Quotient · Remainder',
      value: '16 | 1',
    })
  })

  it('preserves column structure: Setup and closing steps match inner width', () => {
    const dividend = 5428
    const divisor = 35
    const candidates = findScalingCandidates(divisor)
    const candidate = candidates.find((c) => c.k === 3 && c.direction === 'multiply')!

    const steps = computeScaledBaseMethodSteps(dividend, divisor, candidate)
    const innerSteps = computeBaseMethodSteps(dividend, 105)

    // Steps is now patchedSetupStep + innerSteps.slice(1) + closingStep
    expect(steps.length).toBe(innerSteps.length + 1)
    expect(steps[0].cols.length).toBe(innerSteps[0].cols.length)
    expect(steps.at(-1)!.cols.length).toBe(innerSteps.at(-1)!.cols.length)
  })
})

describe('learner-facing negatives use U+2212', () => {
  const valuesOf = (steps: { lines: CalcLine[] }[]) =>
    steps.flatMap((s) => s.lines.flatMap((l) => ('value' in l ? [l.value] : [])))
  const allText = (steps: { title: string; lines: CalcLine[] }[]) =>
    steps.flatMap((s) => [
      s.title,
      ...s.lines.flatMap((l) => ('value' in l ? [l.value] : ('text' in l ? [l.text] : []))),
    ])

  it('parenthesises negative sum terms and signs results in the substituted 10000 ÷ 819 sum lines', () => {
    const steps = computeBaseMethodSteps(10000, 819, [2, -2, 1])
    const values = valuesOf(steps)

    expect(values).toContain('0 + (−2) + 4 = 2')
    expect(values).toContain('0 + 1 + (−4) = −3')
    expect(values).toContain('0 + 2 = 2')
    expect(values).toContain('2 × 10 + (−3) × 10 + 2 = 172')
  })

  it('parenthesises a negative multiplicand and signs a negative product (1693 ÷ 131)', () => {
    const steps = computeBaseMethodSteps(1693, 131)
    const multiplyQ1 = steps.find((s) => s.title.includes('multiply Q₁'))!

    expect(valuesOf([multiplyQ1]).some((v) => v.includes('1 × (−31) = −31'))).toBe(true)
  })

  it('signs the Setup difference (100 − 131 = −31)', () => {
    const steps = computeBaseMethodSteps(1693, 131)
    expect(steps[0].lines).toContainEqual({ kind: 'calc', label: 'Difference', value: '100 − 131 = −31' })
  })

  it.each([
    ['10000 ÷ 819 (substituted)', () => computeBaseMethodSteps(10000, 819, [2, -2, 1])],
    ['10030 ÷ 827 (substituted)', () => computeBaseMethodSteps(10030, 827, [2, -3, 3])],
    ['1693 ÷ 131', () => computeBaseMethodSteps(1693, 131)],
    ['14189 ÷ 102', () => computeBaseMethodSteps(14189, 102)],
    ['5428 ÷ 35 ×3 candidate', () => computeScaledBaseMethodSteps(5428, 35, findScalingCandidates(35).find((c) => c.k === 3 && c.direction === 'multiply')!)],
  ])('has no ASCII-hyphen negatives in any title, value or text: %s', (_name, build) => {
    const text = allText(build())
    for (const t of text) expect(t).not.toMatch(/-\d/)
  })
})
