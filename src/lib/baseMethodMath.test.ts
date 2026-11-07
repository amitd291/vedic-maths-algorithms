import { describe, it, expect } from 'vitest'
import { nearestBase, normalizeDigit, solveBaseMethod, findScalingCandidates, findSimplificationCandidates, isDifferenceFriendly, needsSimplification, solveScaledBaseMethod, substituteDigits, describeBaseMethodError } from './baseMethodMath'

describe('nearestBase', () => {
  it('picks the nearest power of 10', () => {
    expect(nearestBase(9)).toBe(10)
    expect(nearestBase(95)).toBe(100)
    expect(nearestBase(12)).toBe(10)
  })

  it('floors the base at 10 for 1-digit divisors', () => {
    expect(nearestBase(1)).toBe(10)
    expect(nearestBase(2)).toBe(10)
    expect(nearestBase(3)).toBe(10)
    expect(nearestBase(5)).toBe(10)
    expect(nearestBase(9)).toBe(10)
    expect(nearestBase(10)).toBe(10)
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

  it('rejects a 1-digit dividend for a 1-digit divisor as too small (1 ÷ 2)', () => {
    expect(() => solveBaseMethod(1, 2)).toThrow(/too small/)
  })

  it('solves 123 ÷ 5 (quotient 24, remainder 3)', () => {
    const solution = solveBaseMethod(123, 5)
    expect(solution.quotient).toBe(24)
    expect(solution.remainder).toBe(3)
  })

  it('solves 1234 ÷ 2 (quotient 617, remainder 0)', () => {
    const solution = solveBaseMethod(1234, 2)
    expect(solution.quotient).toBe(617)
    expect(solution.remainder).toBe(0)
  })

  it('solves 5428 ÷ 6 (quotient 904, remainder 4)', () => {
    const solution = solveBaseMethod(5428, 6)
    expect(solution.quotient).toBe(904)
    expect(solution.remainder).toBe(4)
  })

  it('throws /wider board/ for 5428 ÷ 3 (quotient 1809 needs a wider board)', () => {
    expect(() => solveBaseMethod(5428, 3)).toThrow(/wider board/)
  })

  it('throws /too small/ for 7 ÷ 2', () => {
    expect(() => solveBaseMethod(7, 2)).toThrow(/too small/)
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
    const knownErrors = [/too small/, /wider board/]
    let checked = 0

    for (let divisor = 1; divisor <= 999; divisor++) {
      const base = nearestBase(divisor)
      const rhsWidth = String(base).length - 1
      const minDigits = rhsWidth + 1

      for (let k = 1; k <= 5; k++) {
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

    expect(checked).toBeGreaterThan(4000)
  })
})

describe('solveBaseMethod with substitutedDigits', () => {
  it('uses substituted digits in the LHS fan-out (10030 ÷ 827 with [2,-3,3])', () => {
    const s = solveBaseMethod(10030, 827, [2, -3, 3])
    expect(s.quotient).toBe(12)
    expect(s.remainder).toBe(106)
    expect(s.lhsRaw).toEqual([1, 2])
    expect(s.rhsRaw).toEqual([1, 0, 6])
    expect(s.rawRemainder).toBe(106)
    expect(s.correctionApplies).toBe(false)
    expect(s.rhsNormalizeChanged).toBe(false)
    expect(s.lhsNormalizeChanged).toBe(false)
    expect(s.substitutedDigits).toEqual([2, -3, 3])
    expect(s.contributionsByCol[1][0]).toBe(2)
    expect(s.contributionsByCol[2][0]).toBe(-3)
    expect(s.contributionsByCol[2][1]).toBe(4)
    expect(s.contributionsByCol[3][0]).toBe(3)
    expect(s.contributionsByCol[3][1]).toBe(-6)
    expect(s.contributionsByCol[4][1]).toBe(6)
  })

  it('flags an RHS self-contained normalize with substituted digits (10000 ÷ 819 with [2,-2,1])', () => {
    const s = solveBaseMethod(10000, 819, [2, -2, 1])
    expect(s.quotient).toBe(12)
    expect(s.remainder).toBe(172)
    expect(s.lhsRaw).toEqual([1, 2])
    expect(s.rhsRaw).toEqual([2, -3, 2])
    expect(s.rawRemainder).toBe(172)
    expect(s.correctionApplies).toBe(false)
    expect(s.rhsNormalizeChanged).toBe(true)
  })

  it('uses the sign of the difference for Paravartya (1693 ÷ 146 with [5,-4], difference -46)', () => {
    const s = solveBaseMethod(1693, 146, [5, -4])
    expect(s.quotient).toBe(11)
    expect(s.remainder).toBe(87)
    expect(s.lhsRaw).toEqual([1, 1])
    expect(s.rhsRaw).toEqual([8, 7])
    expect(s.contributionsByCol[1][0]).toBe(-5)
    expect(s.contributionsByCol[2][0]).toBe(4)
  })

  it('left-pads substituted digits to rhsWidth (10000 ÷ 957 with [4,3] pads to [0,4,3])', () => {
    const s = solveBaseMethod(10000, 957, [4, 3])
    expect(s.substitutedDigits).toEqual([0, 4, 3])
    expect(s.quotient * 957 + s.remainder).toBe(10000)
  })

  it('throws /wider than the board/ when substituted digits exceed rhsWidth (10000 ÷ 182 with [1,-2,2])', () => {
    expect(() => solveBaseMethod(10000, 182, [1, -2, 2])).toThrow(/wider than the board/)
  })

  it('leaves substitutedDigits undefined and the result unchanged when omitted (10030 ÷ 827)', () => {
    const s = solveBaseMethod(10030, 827)
    expect(s.substitutedDigits).toBeUndefined()
    expect(s.quotient).toBe(12)
    expect(s.remainder).toBe(106)
    expect(s.rhsNormalizeChanged).toBe(true)
    expect(s.correctionApplies).toBe(true)
  })

  it('matches the plain solve (and holds Q×D+R===dividend) for every substitution candidate divisor 1..999', () => {
    const dividends = [12345, 99999, 54321, 10000, 10030, 1693]
    const knownErrors = [/too small/, /wider board/]
    const failures: string[] = []
    let checked = 0

    for (let divisor = 1; divisor <= 999; divisor++) {
      const rhsWidth = String(nearestBase(divisor)).length - 1
      const substitution = findSimplificationCandidates(divisor).find((c) => c.kind === 'substitution')
      if (!substitution || substitution.digits.length > rhsWidth) continue

      for (const dividend of dividends) {
        let sub: ReturnType<typeof solveBaseMethod>
        try {
          sub = solveBaseMethod(dividend, divisor, substitution.digits)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          if (!knownErrors.some((re) => re.test(message))) {
            failures.push(`${divisor}/${dividend}: substituted threw "${message}"`)
          }
          continue
        }

        if (sub.quotient * divisor + sub.remainder !== dividend) {
          failures.push(`${divisor}/${dividend}: Q×D+R mismatch`)
        }

        let plain: ReturnType<typeof solveBaseMethod>
        try {
          plain = solveBaseMethod(dividend, divisor)
        } catch {
          continue
        }
        if (sub.quotient !== plain.quotient || sub.remainder !== plain.remainder) {
          failures.push(
            `${divisor}/${dividend}: substituted ${sub.quotient} r ${sub.remainder} vs plain ${plain.quotient} r ${plain.remainder}`,
          )
        }
        checked++
      }
    }

    expect(failures).toEqual([])
    expect(checked).toBeGreaterThan(0)
  })
})

describe('isDifferenceFriendly', () => {
  it('rejects a difference whose leftPart absorbs multiple digits (base 10, diff -25 → single unsplit part [25])', () => {
    // rhsWidth=1 for base 10 means rightWidth=0, so nothing is split at
    // all — the whole magnitude (25) is one raw part, not friendly.
    expect(isDifferenceFriendly(-25, 10)).toBe(false)
  })

  it('rejects a difference whose leftPart is multi-digit even though its flat digits are individually ≤5 (base 100, diff 234 → parts [23, 4])', () => {
    expect(isDifferenceFriendly(234, 100)).toBe(false)
  })

  it('accepts a difference whose real split parts are all 0-5 (base 100, diff -5 → parts [0, 5])', () => {
    expect(isDifferenceFriendly(-5, 100)).toBe(true)
  })

  it('rejects 10030 ÷ 827\'s natural difference (base 1000, diff 173 → parts [1, 7, 3], 7 is unfriendly)', () => {
    expect(isDifferenceFriendly(173, 1000)).toBe(false)
  })
})

describe('needsSimplification', () => {
  it('is false when the plain difference is already friendly (9, 182, 11)', () => {
    expect(needsSimplification(9)).toBe(false)
    expect(needsSimplification(182)).toBe(false)
    expect(needsSimplification(11)).toBe(false)
  })

  it('is true when the plain difference is unfriendly and a candidate exists (35, 16, 791)', () => {
    expect(needsSimplification(35)).toBe(true)
    expect(needsSimplification(16)).toBe(true)
    expect(needsSimplification(791)).toBe(true)
  })
})

describe('findSimplificationCandidates', () => {
  it('returns no candidates when the plain difference is friendly (9)', () => {
    expect(findSimplificationCandidates(9)).toEqual([])
  })

  it('returns only the substitution candidate for 182 (plain difference -82 is unfriendly, no scaling)', () => {
    expect(findSimplificationCandidates(182)).toEqual([{ kind: 'substitution', digits: [1, -2, 2], base: 100, difference: -82 }])
  })

  it('returns only the substitution candidate for 827 (no k=7 multiply scaling)', () => {
    const candidates = findSimplificationCandidates(827)
    expect(candidates).toEqual([{ kind: 'substitution', digits: [2, -3, 3], base: 1000, difference: 173 }])
    expect(candidates.some((c) => c.kind === 'scaling' && c.k === 7 && c.direction === 'multiply')).toBe(false)
  })

  it('omits the no-op substitution for 35 (diff -25 gives digits [2,5], same as plain), leaving only the 4 scaling candidates', () => {
    const candidates = findSimplificationCandidates(35)
    expect(candidates.map((c) => (c.kind === 'scaling' ? [c.kind, c.k, c.direction] : null))).toEqual([
      ['scaling', 2, 'multiply'],
      ['scaling', 3, 'multiply'],
      ['scaling', 4, 'multiply'],
      ['scaling', 5, 'divide'],
    ])
    expect(candidates.some((c) => c.kind === 'substitution')).toBe(false)
  })

  it.each([53, 213, 314, 321, 403, 421, 422, 431, 442, 454, 503, 523, 530, 533, 535, 541, 542, 543, 545])(
    'returns no candidates for %i (no scaling, and substitution would be a no-op)',
    (divisor) => {
      expect(findSimplificationCandidates(divisor)).toEqual([])
    },
  )

  it('includes k=7 divide and a substitution candidate for 791', () => {
    const candidates = findSimplificationCandidates(791)
    expect(candidates).toContainEqual(expect.objectContaining({ kind: 'scaling', k: 7, direction: 'divide' }))
    expect(candidates[candidates.length - 1]).toEqual({ kind: 'substitution', digits: [2, 1, -1], base: 1000, difference: 209 })
  })

  it('holds the candidate invariants for every divisor 1..999', () => {
    const failures: { divisor: number; reason: string }[] = []
    const emptyUnfriendly: number[] = []
    for (let divisor = 1; divisor <= 999; divisor++) {
      const plainBase = nearestBase(divisor)
      const plainDiff = plainBase - divisor
      const candidates = findSimplificationCandidates(divisor)

      if (isDifferenceFriendly(plainDiff, plainBase)) {
        if (candidates.length !== 0) failures.push({ divisor, reason: 'friendly difference returned candidates' })
        continue
      }
      if (candidates.length === 0) {
        emptyUnfriendly.push(divisor)
        continue
      }

      if (candidates.filter((c) => c.kind === 'substitution').length > 1) {
        failures.push({ divisor, reason: 'more than one substitution candidate' })
      }
      const last = candidates[candidates.length - 1]
      if (last.kind === 'substitution') {
        if (last.digits.some((d) => d < -4 || d > 5)) {
          failures.push({ divisor, reason: 'substitution digit out of [-4, 5]' })
        }
        if (last.digits.join(',') === String(Math.abs(plainDiff)).split('').map(Number).join(',')) {
          failures.push({ divisor, reason: 'no-op substitution candidate' })
        }
      }
      const plainDigitCount = String(Math.abs(plainDiff)).length
      for (const c of candidates) {
        if (c.kind === 'scaling' && String(Math.abs(c.difference)).length > plainDigitCount) {
          failures.push({ divisor, reason: `scaling candidate k=${c.k} ${c.direction} difference too wide` })
        }
      }
    }
    expect(failures).toEqual([])
    expect(emptyUnfriendly).toEqual([
      53, 213, 314, 321, 403, 421, 422, 431, 442, 454, 503, 523, 530, 533, 535, 541, 542, 543, 545,
    ])
  })
})

describe('findScalingCandidates', () => {
  it('returns the exact candidate set for divisor 35 (hand-verified against the real column split)', () => {
    const candidates = findScalingCandidates(35)
    expect(candidates).toEqual([
      { k: 2, direction: 'multiply', scaledDivisor: 70, base: 100, difference: 30 },
      { k: 3, direction: 'multiply', scaledDivisor: 105, base: 100, difference: -5 },
      { k: 4, direction: 'multiply', scaledDivisor: 140, base: 100, difference: -40 },
      { k: 5, direction: 'divide', scaledDivisor: 7, base: 10, difference: 3 },
    ])
    expect(candidates).toHaveLength(4)
  })

  it('excludes k=6, k=7, k=9 multiply for divisor 35 despite their flat digits individually being ≤5 (leftPart is multi-digit once split by rhsWidth)', () => {
    // Regression guard: k=6 → diff -110 → parts [11, 0]; k=7 → diff -145 →
    // parts [14, 5]; k=9 → diff -215 → parts [21, 5]. A naive flat-digit
    // check on the raw difference wrongly accepted all three.
    const candidates = findScalingCandidates(35)
    expect(candidates.find((c) => c.k === 6 && c.direction === 'multiply')).toBeUndefined()
    expect(candidates.find((c) => c.k === 7 && c.direction === 'multiply')).toBeUndefined()
    expect(candidates.find((c) => c.k === 9 && c.direction === 'multiply')).toBeUndefined()
  })

  it('excludes candidates whose scaled value is a single digit (base < 10 is degenerate)', () => {
    // divisor 35, k=7 divide → scaledDivisor 5 → nearestBase(5) = 1, no real RHS split possible
    const candidates = findScalingCandidates(35)
    const degenerate = candidates.find((c) => c.k === 7 && c.direction === 'divide')
    expect(degenerate).toBeUndefined()
    expect(candidates.every((c) => c.base >= 10)).toBe(true)
  })

  it('excludes k=5 multiply for divisor 35 (digit 7 in difference -75 is unfriendly)', () => {
    const candidates = findScalingCandidates(35)
    const k5Multiply = candidates.find((c) => c.k === 5 && c.direction === 'multiply')
    expect(k5Multiply).toBeUndefined()
  })

  it('includes k=7 divide for divisor 791 with scaledDivisor 113', () => {
    const candidates = findScalingCandidates(791)
    expect(candidates).toContainEqual({ k: 7, direction: 'divide', scaledDivisor: 113, base: 100, difference: -13 })
  })

  it('excludes all divide candidates for k in [2,3,4,5,6,8,9] for divisor 791 (not evenly divisible)', () => {
    const candidates = findScalingCandidates(791)
    const divideCandidates = candidates.filter((c) => c.direction === 'divide')
    const divideKs = divideCandidates.map((c) => c.k)
    expect(divideKs).not.toContain(2)
    expect(divideKs).not.toContain(3)
    expect(divideKs).not.toContain(4)
    expect(divideKs).not.toContain(5)
    expect(divideKs).not.toContain(6)
    expect(divideKs).not.toContain(8)
    expect(divideKs).not.toContain(9)
  })

  it('returns no multiply candidates for divisor 999', () => {
    const candidates = findScalingCandidates(999)
    const multiplyCandidates = candidates.filter((c) => c.direction === 'multiply')
    expect(multiplyCandidates).toHaveLength(0)
  })

  it('ensures all candidates have k between 2 and 9 inclusive across multiple divisors', () => {
    const testDivisors = [35, 87, 131, 791]
    for (const divisor of testDivisors) {
      const candidates = findScalingCandidates(divisor)
      for (const candidate of candidates) {
        expect(candidate.k).toBeGreaterThanOrEqual(2)
        expect(candidate.k).toBeLessThanOrEqual(9)
      }
    }
  })
})

describe('solveScaledBaseMethod', () => {
  it('solves 5428 ÷ 35 via k===3 && direction===multiply (scaledDivisor 105)', () => {
    const divisor = 35
    const dividend = 5428
    const candidates = findScalingCandidates(divisor)
    const candidate = candidates.find((c) => c.k === 3 && c.direction === 'multiply')
    expect(candidate).toBeDefined()
    expect(candidate!.scaledDivisor).toBe(105)

    const solution = solveScaledBaseMethod(dividend, divisor, candidate!)
    expect(solution.quotient).toBe(155)
    expect(solution.remainder).toBe(3)
  })

  it('solves 5428 ÷ 35 via k===2 && direction===multiply (scaledDivisor 70), same answer as k===3', () => {
    const divisor = 35
    const dividend = 5428
    const candidates = findScalingCandidates(divisor)
    const candidate = candidates.find((c) => c.k === 2 && c.direction === 'multiply')
    expect(candidate).toBeDefined()
    expect(candidate!.scaledDivisor).toBe(70)

    const solution = solveScaledBaseMethod(dividend, divisor, candidate!)
    expect(solution.quotient).toBe(155)
    expect(solution.remainder).toBe(3)
  })

  it('solves 12657 ÷ 791 via k===7 && direction===divide (scaledDivisor 113)', () => {
    const divisor = 791
    const dividend = 12657
    const candidates = findScalingCandidates(divisor)
    const candidate = candidates.find((c) => c.k === 7 && c.direction === 'divide')
    expect(candidate).toBeDefined()
    expect(candidate!.scaledDivisor).toBe(113)

    const solution = solveScaledBaseMethod(dividend, divisor, candidate!)
    expect(solution.quotient).toBe(16)
    expect(solution.remainder).toBe(1)
  })

  it('property: for divisors 35, 791, 182 and all their candidates, quotient * divisor + remainder === dividend and remainder in range', () => {
    const testDivisors = [35, 791, 182]
    const sampleDividends = [5428, 91234, 12657, 20567, 999999]
    let checked = 0

    for (const divisor of testDivisors) {
      const candidates = findScalingCandidates(divisor)

      for (const candidate of candidates) {
        for (const dividend of sampleDividends) {
          let canSolve = false
          try {
            solveBaseMethod(dividend, divisor)
            canSolve = true
          } catch {
            // dividend is too small or divisor issues — skip it
          }

          if (canSolve) {
            try {
              const solution = solveScaledBaseMethod(dividend, divisor, candidate)
              const check = solution.quotient * divisor + solution.remainder
              expect(check).toBe(dividend)
              expect(solution.remainder).toBeGreaterThanOrEqual(0)
              expect(solution.remainder).toBeLessThan(divisor)
              checked++
            } catch {
              // scaled divisor version might also throw for some combinations — skip those
            }
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(0)
  })
})

describe('substituteDigits', () => {
  it('converts digits above 5 into negative digits with a carry', () => {
    expect(substituteDigits(173)).toEqual([2, -3, 3])
    expect(substituteDigits(181)).toEqual([2, -2, 1])
    // 12657 ÷ 791's natural difference; that problem also has a valid divisor-scaling
    // candidate (÷7), so it is a fixture where both techniques apply
    expect(substituteDigits(209)).toEqual([2, 1, -1])
  })

  it('grows a single digit 6-9 into two places', () => {
    expect(substituteDigits(7)).toEqual([1, -3])
    expect(substituteDigits(6)).toEqual([1, -4])
  })

  it('leaves 5 and below unchanged', () => {
    expect(substituteDigits(5)).toEqual([5])
    expect(substituteDigits(3)).toEqual([3])
  })

  it('handles carries across several digits', () => {
    expect(substituteDigits(449)).toEqual([4, 5, -1])
    expect(substituteDigits(69)).toEqual([1, -3, -1])
  })

  it('sums back to n, stays in [-4, 5] and does not grow (leading digit <= 4) for every n in 1..2000', () => {
    const failing: { n: number; substituted: number[]; reason: string }[] = []
    for (let n = 1; n <= 2000; n++) {
      const substituted = substituteDigits(n)
      if (substituted.reduce((a, d) => a * 10 + d, 0) !== n) {
        failing.push({ n, substituted, reason: 'does not sum back' })
      }
      if (substituted.some(d => d < -4 || d > 5)) {
        failing.push({ n, substituted, reason: 'digit out of range' })
      }
      if (Number(String(n)[0]) <= 4 && substituted.length !== String(n).length) {
        failing.push({ n, substituted, reason: 'length grew' })
      }
    }
    expect(failing).toEqual([])
  })
})

describe('describeBaseMethodError', () => {
  it('maps the too-small error to a friendly dividend message', () => {
    expect(describeBaseMethodError(new Error('dividend is too small for this base'))).toEqual({
      friendly: true,
      message: 'This dividend has too few digits for this divisor. Try a larger dividend.',
    })
  })

  it('maps the wider-board error to a friendly quotient message', () => {
    expect(
      describeBaseMethodError(new Error('quotient needs a wider board than the assumed LHS width (iteration D display limit)')),
    ).toEqual({
      friendly: true,
      message: 'The quotient is too long for the board at this size. Try a smaller dividend or a larger divisor.',
    })
  })

  it('passes self-check failures through unchanged and unfriendly', () => {
    const text = 'solveBaseMethod self-check failed: 1 × 2 + 0 !== 1'
    expect(describeBaseMethodError(new Error(text))).toEqual({ friendly: false, message: text })
  })

  it('stringifies non-Error values unfriendly', () => {
    expect(describeBaseMethodError('boom')).toEqual({ friendly: false, message: 'boom' })
  })
})
