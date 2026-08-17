import { describe, it, expect } from 'vitest'
import { computeBaseMethodSteps, nearestBase } from './computeBaseMethodSteps'

describe('nearestBase', () => {
  it('picks the nearest power of 10', () => {
    expect(nearestBase(9)).toBe(10)
    expect(nearestBase(95)).toBe(100)
    expect(nearestBase(12)).toBe(10)
  })
})

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
    expect(last.title).toMatch(/compare and normalize/)
    expect(last.cols.map((c) => c.total)).toEqual([1, 2, 1, 0, 6])
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '12 · 106' })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 827 + 106 = 10030 ✓',
    })
  })

  it('flips sign for a negative (Paravartya) difference and normalizes a negative remainder (1693 ÷ 131)', () => {
    const steps = computeBaseMethodSteps(1693, 131)
    const last = steps[steps.length - 1]
    expect(last.title).toMatch(/compare and normalize/)
    expect(last.lines).toContainEqual({ kind: 'result', label: 'Quotient · Remainder', value: '12 · 121' })
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 12 × 131 + 121 = 1693 ✓',
    })
  })

  it('normalizes a signed intermediate LHS digit with no RHS correction needed (14189 ÷ 102)', () => {
    const steps = computeBaseMethodSteps(14189, 102)
    const last = steps[steps.length - 1]
    expect(last.title).toBe(`Step ${steps.length - 1} — remainder`)
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 139 × 102 + 11 = 14189 ✓',
    })
  })

  it('redoes an already-finalized LHS digit when a later column carries back into it (10600 ÷ 87)', () => {
    const steps = computeBaseMethodSteps(10600, 87)
    const last = steps[steps.length - 1]
    expect(last.title).toBe(`Step ${steps.length - 1} — remainder`)
    expect(last.cols.map((c) => c.total)).toEqual([1, 2, 1, 7, 3])
    expect(last.lines.at(-1)).toEqual({
      kind: 'note',
      tone: 'success',
      text: 'Verify: 121 × 87 + 73 = 10600 ✓',
    })

    // Q₂'s finalize step surfaces the carry-back and the redone value (1 → 2),
    // rather than silently overwriting it.
    const q2Step = steps.find((s) => s.title.includes('second LHS digit'))!
    expect(q2Step.lines).toContainEqual({ kind: 'result', label: 'Q₂', value: '2' })
    expect(q2Step.lines).toContainEqual({
      kind: 'note',
      tone: 'warn',
      text: "Includes a carry of 1 from column 3's overflow — Q₂'s multiply below uses this corrected value.",
    })
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

  it('throws when the RHS overflow carries back into an already-placed LHS digit (865 ÷ 9)', () => {
    expect(() => computeBaseMethodSteps(865, 9)).toThrow(/iteration D/)
  })

  it('throws when the quotient would need an extra leading digit beyond the LHS width', () => {
    expect(() => computeBaseMethodSteps(9995, 9)).toThrow(/iteration D/)
  })

  it('throws for a self-check mismatch', () => {
    expect(() => computeBaseMethodSteps(1, 2)).toThrow()
  })
})
