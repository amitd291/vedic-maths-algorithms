import { describe, it, expect } from 'vitest'
import { nearestBase, normalizeDigit, solveBaseMethod } from './baseMethodMath'

describe('nearestBase', () => {
  it('picks the nearest power of 10', () => {
    expect(nearestBase(9)).toBe(10)
    expect(nearestBase(95)).toBe(100)
    expect(nearestBase(12)).toBe(10)
  })
})

describe('normalizeDigit', () => {
  it('leaves an already-valid digit untouched', () => {
    expect(normalizeDigit(5)).toEqual([5, 0])
    expect(normalizeDigit(0)).toEqual([0, 0])
  })

  it('carries a value ≥ 10 into a single digit plus carry', () => {
    expect(normalizeDigit(13)).toEqual([3, 1])
    expect(normalizeDigit(24)).toEqual([4, 2])
  })

  it('borrows a negative value into a single digit plus a negative carry', () => {
    expect(normalizeDigit(-1)).toEqual([9, -1])
    expect(normalizeDigit(-15)).toEqual([5, -2])
  })
})

describe('solveBaseMethod', () => {
  it('rejects a non-positive-integer dividend or divisor', () => {
    expect(() => solveBaseMethod(0, 9)).toThrow(/dividend/)
    expect(() => solveBaseMethod(1.5, 9)).toThrow(/dividend/)
    expect(() => solveBaseMethod(123, 0)).toThrow(/divisor/)
    expect(() => solveBaseMethod(123, -9)).toThrow(/divisor/)
  })

  it('rejects a dividend too small for the chosen base', () => {
    // divisor 9 → base 10, rhsWidth 1 — a 1-digit dividend leaves no LHS.
    expect(() => solveBaseMethod(5, 9)).toThrow(/too small/)
  })

  it('throws when the quotient needs an extra leading digit beyond the LHS width (9995 ÷ 9)', () => {
    // True quotient (1110) needs 4 columns; the board only has 3 — a
    // display-width limit, not a math failure.
    expect(() => solveBaseMethod(9995, 9)).toThrow(/wider board/)
  })

  it('throws a self-check failure when nearestBase picks a base at or below the divisor (1 ÷ 2)', () => {
    // divisor 2's nearest power of 10 is 1 (tie-break favors the smaller
    // side), which is ≤ the divisor itself — the base/difference math is
    // no longer meaningful, and the self-check catches it rather than
    // silently returning a wrong quotient/remainder.
    expect(() => solveBaseMethod(1, 2)).toThrow(/self-check failed/)
  })

  it('flags a correction and an LHS normalize together (865 ÷ 9)', () => {
    const solution = solveBaseMethod(865, 9)
    expect(solution.correctionApplies).toBe(true)
    expect(solution.lhsNormalizeChanged).toBe(true)
    expect(solution.quotient).toBe(96)
    expect(solution.remainder).toBe(1)
  })

  it('flags a self-contained RHS normalize ahead of a correction (10030 ÷ 827)', () => {
    const solution = solveBaseMethod(10030, 827)
    expect(solution.correctionApplies).toBe(true)
    expect(solution.rhsNormalizeChanged).toBe(true)
    expect(solution.lhsNormalizeChanged).toBe(false)
    expect(solution.quotient).toBe(12)
    expect(solution.remainder).toBe(106)
  })

  it('needs no closing corrections at all (123 ÷ 9)', () => {
    const solution = solveBaseMethod(123, 9)
    expect(solution.correctionApplies).toBe(false)
    expect(solution.lhsNormalizeChanged).toBe(false)
    expect(solution.quotient).toBe(13)
    expect(solution.remainder).toBe(6)
  })

  it('holds Q×D+R===dividend (or throws a known boundary error) across divisor 1..999', () => {
    // Full-range sweep supplementing the hand-picked edge cases above — it
    // won't reliably hit the narrow throw-boundary/flag combinations those
    // cover on purpose, but it does exercise the self-check across a wide,
    // deterministic spread of divisors and dividend widths.
    const knownErrors = [/too small/, /wider board/, /self-check failed/]
    let checked = 0

    for (let divisor = 1; divisor <= 999; divisor++) {
      const base = nearestBase(divisor)
      const rhsWidth = String(base).length - 1
      const minDigits = rhsWidth + 1

      for (let k = 1; k <= 10; k++) {
        const digits = minDigits + (k % 4)
        const span = 10 ** digits - 10 ** (digits - 1)
        const dividend = 10 ** (digits - 1) + ((divisor * 97 + k * 131) % span)

        try {
          const solution = solveBaseMethod(dividend, divisor)
          expect(solution.quotient * divisor + solution.remainder).toBe(dividend)
          checked++
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          expect(knownErrors.some((re) => re.test(message))).toBe(true)
        }
      }
    }

    expect(checked).toBeGreaterThan(8000)
  })
})
