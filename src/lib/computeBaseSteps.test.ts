import { describe, it, expect } from 'vitest'
import { computeBaseSteps, nearestBase } from './computeBaseSteps'

describe('nearestBase', () => {
  it('picks the nearest power of 10', () => {
    expect(nearestBase(9)).toBe(10)
    expect(nearestBase(95)).toBe(100)
    expect(nearestBase(12)).toBe(10)
  })
})

describe('computeBaseSteps', () => {
  it('reproduces the 123 ÷ 9 worked example', () => {
    const steps = computeBaseSteps(123, 9)

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

  it('throws for a multi-digit difference (out of scope until iteration C)', () => {
    expect(() => computeBaseSteps(10030, 827)).toThrow(/multi-digit difference/)
  })

  it('throws for an LHS column carry (out of scope until iteration D)', () => {
    expect(() => computeBaseSteps(1234, 98)).toThrow(/carry\/overflow/)
  })

  it('throws for a self-check mismatch', () => {
    expect(() => computeBaseSteps(1, 2)).toThrow()
  })
})
