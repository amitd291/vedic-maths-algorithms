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

  it('throws for an LHS carry cascading into an already-finalized digit (10600 ÷ 87, out of scope until iteration D)', () => {
    expect(() => computeBaseMethodSteps(10600, 87)).toThrow(/iteration D/)
  })

  it('throws when a single-digit-difference LHS column overflows a single digit (865 ÷ 9, Q₂ would be 14)', () => {
    expect(() => computeBaseMethodSteps(865, 9)).toThrow(/iteration D/)
  })

  it('throws for a self-check mismatch', () => {
    expect(() => computeBaseMethodSteps(1, 2)).toThrow()
  })
})
