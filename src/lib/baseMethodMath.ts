/** Nearest power of 10 to `divisor` (ties broken arbitrarily — see iteration F). */
export function nearestBase(divisor: number): number {
  const width = String(divisor).length
  const lower = 10 ** (width - 1)
  const upper = 10 ** width
  return upper - divisor <= divisor - lower ? upper : lower
}

/** Normalizes a raw chunk into a single 0–9 digit plus the carry/borrow it produces. */
export function normalizeDigit(value: number): [digit: number, carry: number] {
  let d = value
  let carry = 0
  while (d < 0) {
    d += 10
    carry -= 1
  }
  while (d >= 10) {
    d -= 10
    carry += 1
  }
  return [d, carry]
}

export interface BaseMethodSolution {
  base: number
  difference: number
  rhsWidth: number
  rightWidth: number
  lhsWidth: number
  n: number
  digits: number[]
  incoming: number[]
  contributionsByCol: number[][]
  lhsRaw: number[]
  rhsRaw: number[]
  rawRemainder: number
  remainder: number
  correctionCount: number
  correctionApplies: boolean
  rhsNormalizeChanged: boolean
  lastLhsChunks: number[]
  finalLhsDigits: number[]
  lhsNormalizeChanged: boolean
  quotient: number
  finalRhsDigits: number[]
  remainderFits: boolean
}

/**
 * Pure calculation for the Base Method / Paravartya division of
 * `dividend ÷ divisor`, using the nearest power of 10 as the base.
 *
 * Each LHS column's raw total (its own digit plus whatever contributions
 * fanned into it) is used as-is as its own multiplicand, even when it's
 * ≥ 10 or negative — nothing is reduced to a single digit until the very
 * end. A contribution fans out across exactly `rhsWidth` columns to the
 * right; only the rightmost `rhsWidth − 1` of those are forced to a single
 * digit, while the leftmost absorbs all remaining magnitude and so can
 * itself be multi-digit. This means no mid-pass redo is ever needed when a
 * later column overflows: there's nothing to redo, since nothing was
 * reduced yet.
 *
 * Two closing corrections (surfaced as flags for the narration layer to
 * decide whether to show them) finish the job: first, the assembled raw
 * remainder is compared against the divisor in a loop (not a single
 * subtraction) and that correction is folded onto the last raw LHS chunk;
 * then the LHS chunks are carry-normalized right to left into real digits.
 * This one mechanism resolves the LHS carry cascade, RHS overflow into the
 * LHS, and remainder corrections needing more than one subtraction, all at
 * once.
 *
 * Scope note (still open, for a display reason rather than a math one): if
 * the final carry-normalize pass overflows past the leftmost LHS digit,
 * the quotient genuinely needs a wider board than the assumed LHS width —
 * this throws rather than growing the board.
 */
export function solveBaseMethod(dividend: number, divisor: number): BaseMethodSolution {
  if (!Number.isInteger(dividend) || dividend <= 0) {
    throw new Error('dividend must be a positive integer')
  }
  if (!Number.isInteger(divisor) || divisor <= 0) {
    throw new Error('divisor must be a positive integer')
  }

  const base = nearestBase(divisor)
  const difference = base - divisor

  const rhsWidth = String(base).length - 1
  const digits = String(dividend).split('').map(Number)
  const n = digits.length
  if (n <= rhsWidth) {
    throw new Error('dividend is too small for this base')
  }
  const lhsWidth = n - rhsWidth
  const rightWidth = rhsWidth - 1

  // A single left-to-right walk. Each LHS column's raw total is used as-is
  // (no reduction, no redo) to compute its contribution, which fans out
  // across the next rhsWidth columns: the leftmost of those absorbs
  // whatever magnitude doesn't fit in the trailing rightWidth single digits.
  const incoming: number[] = Array(n).fill(0)
  const contributionsByCol: number[][] = Array.from({ length: n }, () => [])
  const lhsRaw: number[] = []

  for (let i = 0; i < lhsWidth; i++) {
    const total = digits[i] + incoming[i]
    lhsRaw.push(total)

    const contribution = total * difference
    const sign = Math.sign(contribution)
    const magnitude = Math.abs(contribution)
    const rightPart = rightWidth > 0 ? magnitude % 10 ** rightWidth : 0
    const leftPart = rightWidth > 0 ? Math.floor(magnitude / 10 ** rightWidth) : magnitude
    const rightDigits = rightWidth > 0 ? String(rightPart).padStart(rightWidth, '0').split('').map(Number) : []
    const parts = [leftPart, ...rightDigits]

    for (let k = 0; k < rhsWidth; k++) {
      const idx = i + 1 + k
      const signedVal = sign * parts[k]
      incoming[idx] += signedVal
      contributionsByCol[idx][i] = signedVal
    }
  }

  // Assemble the RHS's raw per-column totals, then their weighted (place-value)
  // sum — Horner's method works here even though a raw chunk can be ≥10 or
  // negative, since it's just the place-value formula unrolled.
  const rhsRaw: number[] = []
  for (let k = 0; k < rhsWidth; k++) {
    const colIdx = lhsWidth + k
    const contribs = contributionsByCol[colIdx].filter((v) => v !== undefined)
    rhsRaw.push(digits[colIdx] + contribs.reduce((a, b) => a + b, 0))
  }
  const rawRemainder = rhsRaw.reduce((acc, v) => acc * 10 + v, 0)

  // Compare the raw remainder to the divisor in a loop — it can take more
  // than one subtraction (or, for Paravartya, more than one addition) to land
  // in range.
  let remainder = rawRemainder
  let correctionCount = 0
  while (remainder >= divisor) {
    remainder -= divisor
    correctionCount++
  }
  while (remainder < 0) {
    remainder += divisor
    correctionCount--
  }
  const correctionApplies = correctionCount !== 0

  // Self-contained RHS carry-normalize: carrying right-to-left strictly
  // within RHS's own columns, never crossing into LHS. If this doesn't
  // fully resolve (carry-out past RHS's own leftmost column), a raw
  // base-10 carry into LHS would silently compute the wrong
  // quotient/remainder — base and divisor differ by `difference`, so only
  // the divisor-range compare-and-correct below may move value across that
  // boundary. That boundary case is left alone here (`rhsSelfContained`
  // false) and resolved entirely by the existing compare-and-correct step.
  const rhsNormalizeDigits: number[] = Array(rhsWidth).fill(0)
  let rhsCarryOut = 0
  for (let k = rhsWidth - 1; k >= 0; k--) {
    const [d, c] = normalizeDigit(rhsRaw[k] + rhsCarryOut)
    rhsNormalizeDigits[k] = d
    rhsCarryOut = c
  }
  const rhsSelfContained = rhsCarryOut === 0
  const rhsNormalizeChanged = rhsSelfContained && rhsNormalizeDigits.some((d, k) => d !== rhsRaw[k])

  const lastLhsChunks = [...lhsRaw]
  lastLhsChunks[lhsWidth - 1] += correctionCount

  // Carry-normalize the LHS chunks right to left into real 0–9 digits.
  const finalLhsDigits: number[] = Array(lhsWidth).fill(0)
  let lhsCarry = 0
  for (let i = lhsWidth - 1; i >= 0; i--) {
    const [d, c] = normalizeDigit(lastLhsChunks[i] + lhsCarry)
    finalLhsDigits[i] = d
    lhsCarry = c
  }
  if (lhsCarry !== 0) {
    throw new Error('quotient needs a wider board than the assumed LHS width (iteration D display limit)')
  }
  const lhsNormalizeChanged = finalLhsDigits.some((d, i) => d !== lastLhsChunks[i])

  const quotient = finalLhsDigits.reduce((acc, v) => acc * 10 + v, 0)
  if (quotient * divisor + remainder !== dividend) {
    throw new Error(`solveBaseMethod self-check failed: ${quotient} × ${divisor} + ${remainder} !== ${dividend}`)
  }

  const finalRhsDigits = String(remainder).padStart(rhsWidth, '0').split('').map(Number)
  const remainderFits = finalRhsDigits.length === rhsWidth

  return {
    base,
    difference,
    rhsWidth,
    rightWidth,
    lhsWidth,
    n,
    digits,
    incoming,
    contributionsByCol,
    lhsRaw,
    rhsRaw,
    rawRemainder,
    remainder,
    correctionCount,
    correctionApplies,
    rhsNormalizeChanged,
    lastLhsChunks,
    finalLhsDigits,
    lhsNormalizeChanged,
    quotient,
    finalRhsDigits,
    remainderFits,
  }
}
