import type { BaseMethodColumn, BaseMethodStep, CalcLine } from '../types'

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

function subscript(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUBSCRIPT_DIGITS[Number(d)])
    .join('')
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']

/** Nearest power of 10 to `divisor` (ties broken arbitrarily — see iteration F). */
export function nearestBase(divisor: number): number {
  const width = String(divisor).length
  const lower = 10 ** (width - 1)
  const upper = 10 ** width
  return upper - divisor <= divisor - lower ? upper : lower
}

function cloneCols(cols: BaseMethodColumn[]): BaseMethodColumn[] {
  return cols.map((c) => ({ ...c, contributions: [...c.contributions] }))
}

/** Normalizes a raw chunk into a single 0–9 digit plus the carry/borrow it produces. */
function normalizeDigit(value: number): [digit: number, carry: number] {
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

/**
 * Explains a normalize step the way manual borrow/carry subtraction reads:
 * `label = 10 + (before) = digit; nextLabel = nextBefore − n = nextBefore + carry`.
 * `nextLabel`/`nextBefore` are omitted at the leftmost column, where there's
 * nothing further left to borrow from or carry into.
 */
function carryMessage(
  label: string,
  before: number,
  digit: number,
  carry: number,
  next?: { label: string; before: number },
): string {
  const n = Math.abs(carry)
  const applied = carry < 0 ? `${10 * n} + (${before}) = ${digit}` : `${before} − ${10 * n} = ${digit}`
  if (!next) return `${label} = ${applied}`
  const nextAfter = next.before + carry
  const sign = carry < 0 ? '−' : '+'
  return `${label} = ${applied}; ${next.label} = ${next.before} ${sign} ${n} = ${nextAfter}`
}

/**
 * Computes the Base Method / Paravartya division walkthrough for
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
 * Two closing steps (skipped when they'd be no-ops) finish the job: first,
 * the assembled raw remainder is compared against the divisor in a loop
 * (not a single subtraction) and that correction is folded onto the last
 * raw LHS chunk; then the LHS chunks are carry-normalized right to left
 * into real digits. This one mechanism resolves the LHS carry cascade, RHS
 * overflow into the LHS, and remainder corrections needing more than one
 * subtraction, all at once.
 *
 * Scope note (still open, for a display reason rather than a math one): if
 * the final carry-normalize pass overflows past the leftmost LHS digit,
 * the quotient genuinely needs a wider board than the assumed LHS width —
 * this throws rather than growing the board.
 */
export function computeBaseMethodSteps(dividend: number, divisor: number): BaseMethodStep[] {
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

  // Pass 1: a single left-to-right walk. Each LHS column's raw total is
  // used as-is (no reduction, no redo) to compute its contribution, which
  // fans out across the next rhsWidth columns: the leftmost of those
  // absorbs whatever magnitude doesn't fit in the trailing rightWidth
  // single digits.
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
    throw new Error(`computeBaseMethodSteps self-check failed: ${quotient} × ${divisor} + ${remainder} !== ${dividend}`)
  }

  const finalRhsDigits = String(remainder).padStart(rhsWidth, '0').split('').map(Number)
  const remainderFits = finalRhsDigits.length === rhsWidth

  /**
   * Writes the final remainder into the RHS columns. When it fits, one digit
   * per column, as usual. When it doesn't (a Paravartya divisor can exceed
   * the base, so its remainder can need one more digit than the board's RHS
   * width — e.g. 1693 ÷ 131's remainder 121 against a 2-column RHS), there's
   * nowhere to split the extra leading digit, so the whole remainder is
   * shown as one merged total in the rightmost RHS column instead — the
   * same idiom already used for a raw, pre-normalized multi-digit column sum
   * — and the other RHS columns are left blank rather than showing a stale
   * pre-correction value.
   */
  function applyFinalRhsTotals(cols: BaseMethodColumn[]) {
    if (remainderFits) {
      for (let k = 0; k < rhsWidth; k++) cols[lhsWidth + k].total = finalRhsDigits[k]
      return
    }
    for (let k = 0; k < rhsWidth - 1; k++) cols[lhsWidth + k].total = null
    cols[lhsWidth + rhsWidth - 1].total = remainder
  }

  // Pass 2: narrate the steps, mutating a running column-state array
  // (finalized totals + placed contributions) that each step snapshots. A
  // column stays 'active' (raw, amber) through every step it appears in
  // until the closing step(s) settle it to 'done' (green).
  const cols: BaseMethodColumn[] = digits.map((d, i) => ({
    kind: i < lhsWidth ? 'lhs' : 'rhs',
    digit: d,
    contributions: [],
    total: null,
    colState: '',
  }))

  const steps: BaseMethodStep[] = []
  const noConnectors = Array(n - 1).fill(false)
  let stepNum = 0

  steps.push({
    title: 'Setup',
    cols: cloneCols(cols),
    connectors: noConnectors,
    lines: [
      { kind: 'calc', label: 'Divisor', value: String(divisor) },
      { kind: 'calc', label: 'Base (nearest power of 10)', value: String(base) },
      { kind: 'calc', label: 'Difference', value: `${base} − ${divisor} = ${difference}` },
      {
        kind: 'note',
        tone: 'warn',
        text: `Base has ${rhsWidth} zero${rhsWidth === 1 ? '' : 's'}, so the dividend splits into LHS ${digits.slice(0, lhsWidth).join('')} | RHS ${digits.slice(lhsWidth).join('')}.`,
      },
    ],
  })

  // LHS digits: finalize (raw, possibly ≥10 or negative), then multiply and
  // fan the contribution to the right.
  for (let i = 0; i < lhsWidth; i++) {
    const total = lhsRaw[i]
    const quotientLabel = `Q${subscript(i + 1)}`

    cols[i].total = total
    cols[i].colState = 'active'
    stepNum += 1

    const finalizeLines: CalcLine[] =
      i === 0
        ? [{ kind: 'calc', label: 'Bring down', value: `first LHS digit, ${digits[0]}, as it is` }]
        : [{ kind: 'calc', label: `Sum column ${i + 1}`, value: `${digits[i]} + ${incoming[i]} = ${total}` }]
    finalizeLines.push({ kind: 'result', label: quotientLabel, value: String(total) })
    if (total < 0 || total > 9) {
      finalizeLines.push({
        kind: 'note',
        tone: 'warn',
        text: `${quotientLabel} is ${total}, not a single digit — used as-is for its own multiply below. Carries and borrows are resolved once, at the end.`,
      })
    }

    steps.push({
      title: `Step ${stepNum} — ${ORDINALS[i]} LHS digit`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines: finalizeLines,
    })

    const contribution = total * difference
    const sign = Math.sign(contribution)
    const magnitude = Math.abs(contribution)
    const rightPart = rightWidth > 0 ? magnitude % 10 ** rightWidth : 0
    const leftPart = rightWidth > 0 ? Math.floor(magnitude / 10 ** rightWidth) : magnitude
    const rightDigits = rightWidth > 0 ? String(rightPart).padStart(rightWidth, '0').split('').map(Number) : []
    const parts = [leftPart, ...rightDigits]
    for (let k = 0; k < rhsWidth; k++) {
      // Indexed (not pushed) by source LHS digit i, so a column's chip row
      // lines up with every other column touched by that same multiply step,
      // even when this column doesn't receive a contribution from an earlier digit.
      cols[i + 1 + k].contributions[i] = sign * parts[k]
    }

    const connectors = Array(n - 1).fill(false)
    for (let k = 0; k < rhsWidth; k++) connectors[i + k] = true
    stepNum += 1

    const multiplyNote =
      rhsWidth === 1
        ? { kind: 'note' as const, tone: 'warn' as const, text: `Write ${contribution} diagonally under column ${i + 2}.` }
        : {
            kind: 'note' as const,
            tone: 'warn' as const,
            text: `Difference spans ${rhsWidth} columns: the leftmost slot takes whatever remains (${sign * leftPart}) under column ${i + 2}, the rest (${rightDigits.map((d) => (sign < 0 ? -d : d)).join(' · ')}) go one digit each under the next columns.`,
          }

    steps.push({
      title: `Step ${stepNum} — multiply ${quotientLabel} by the difference`,
      cols: cloneCols(cols),
      connectors,
      lines: [
        {
          kind: 'calc',
          label: 'Multiply',
          value: `${quotientLabel} × difference = ${total} × ${difference} = ${contribution}`,
        },
        multiplyNote,
      ],
    })
  }

  // RHS columns: one combined sum step showing each column's raw total.
  for (let k = 0; k < rhsWidth; k++) {
    cols[lhsWidth + k].total = rhsRaw[k]
    cols[lhsWidth + k].colState = 'active'
  }
  stepNum += 1

  const sumLines: CalcLine[] = []
  for (let k = 0; k < rhsWidth; k++) {
    const colIdx = lhsWidth + k
    const contribs = contributionsByCol[colIdx].filter((v) => v !== undefined)
    const terms = [digits[colIdx], ...contribs]
    sumLines.push({
      kind: 'calc',
      label: `Sum column ${colIdx + 1}`,
      value: contribs.length ? `${terms.join(' + ')} = ${rhsRaw[k]}` : String(rhsRaw[k]),
    })
  }
  if (rhsWidth > 1) {
    let expr = String(rhsRaw[0])
    for (let k = 1; k < rhsWidth; k++) expr = `${expr} × 10 + ${rhsRaw[k]}`
    sumLines.push({ kind: 'calc', label: 'Combine columns', value: `${expr} = ${rawRemainder}` })
  }

  const needsClosingSteps = correctionApplies || lhsNormalizeChanged

  if (!needsClosingSteps) {
    // Trivial case: the raw RHS total was already in range, and every raw
    // LHS chunk was already a single 0–9 digit — finish everything here.
    for (let k = 0; k < rhsWidth; k++) cols[lhsWidth + k].colState = 'done'
    for (let i = 0; i < lhsWidth; i++) cols[i].colState = 'done'
    sumLines.push({ kind: 'result', label: 'Remainder', value: String(remainder) })
    sumLines.push({ kind: 'note', tone: 'success', text: `Verify: ${quotient} × ${divisor} + ${remainder} = ${dividend} ✓` })

    steps.push({
      title: `Step ${stepNum} — remainder`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines: sumLines,
    })

    return steps
  }

  if (!correctionApplies) {
    // No correction needed, but an LHS chunk still needs carry-normalizing
    // (e.g. Q's own raw column landed ≥10 with nothing to redistribute it
    // into a valid remainder check) — settle the RHS here directly.
    for (let k = 0; k < rhsWidth; k++) cols[lhsWidth + k].colState = 'done'
    applyFinalRhsTotals(cols)
    sumLines.push({ kind: 'result', label: 'Remainder', value: String(remainder) })
  } else {
    sumLines.push({ kind: 'result', label: 'RHS total', value: String(rawRemainder) })
  }

  steps.push({
    title: `Step ${stepNum} — sum the RHS columns`,
    cols: cloneCols(cols),
    connectors: noConnectors,
    lines: sumLines,
  })

  // Normalize-the-remainder step: the RHS-side twin of the LHS
  // normalize-the-quotient step below, same carry mechanism, shown only
  // when the RHS carry is self-contained (see rhsSelfContained above) and
  // there's a following compare-and-correct step to show it before —
  // without one, the RHS finalizes straight to its correctly-formatted
  // digits with nothing to demonstrate.
  if (correctionApplies && rhsNormalizeChanged) {
    stepNum += 1

    const remainderNormalizeLines: CalcLine[] = []
    let rhsCarry = 0
    for (let k = rhsWidth - 1; k >= 0; k--) {
      const colIdx = lhsWidth + k
      const label = `column ${colIdx + 1}`
      const before = rhsRaw[k] + rhsCarry
      const [d, c] = normalizeDigit(before)
      if (before !== d) {
        const next = k > 0 ? { label: `column ${colIdx}`, before: rhsRaw[k - 1] } : undefined
        remainderNormalizeLines.push({
          kind: 'calc',
          label: 'Normalize',
          value: carryMessage(label, before, d, c, next),
        })
      }
      cols[colIdx].total = d
      rhsCarry = c
    }
    remainderNormalizeLines.push({
      kind: 'note',
      tone: 'warn',
      text: `RHS total is now ${rawRemainder}, after being re-expressed as valid digits.`,
    })

    steps.push({
      title: `Step ${stepNum} — normalize the remainder`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines: remainderNormalizeLines,
    })
  }

  // Compare-and-correct step (only when the raw remainder was out of range).
  if (correctionApplies) {
    stepNum += 1
    for (let k = 0; k < rhsWidth; k++) cols[lhsWidth + k].colState = 'done'
    applyFinalRhsTotals(cols)

    const lastLhsLabel = `Q${subscript(lhsWidth)}`
    const oldLastChunk = lhsRaw[lhsWidth - 1]
    const newLastChunk = lastLhsChunks[lhsWidth - 1]
    const times = Math.abs(correctionCount)
    const compareLine: CalcLine =
      correctionCount > 0
        ? {
            kind: 'calc',
            label: 'Compare',
            value:
              times === 1
                ? `RHS total ${rawRemainder} ≥ divisor ${divisor}`
                : `RHS total ${rawRemainder} ÷ ${divisor} needs ${times} subtractions, not one`,
          }
        : {
            kind: 'calc',
            label: 'Compare',
            value: `RHS total ${rawRemainder} is negative`,
          }
    const correctLine: CalcLine =
      correctionCount > 0
        ? {
            kind: 'calc',
            label: 'Correct',
            value: `${rawRemainder} − ${times > 1 ? `${times} × ` : ''}${divisor} = ${remainder}, and ${lastLhsLabel} = ${oldLastChunk} + ${times} = ${newLastChunk}`,
          }
        : {
            kind: 'calc',
            label: 'Correct',
            value: `${rawRemainder} + ${times > 1 ? `${times} × ` : ''}${divisor} = ${remainder}, and ${lastLhsLabel} = ${oldLastChunk} − ${times} = ${newLastChunk}`,
          }

    cols[lhsWidth - 1].total = newLastChunk

    const lines: CalcLine[] = [compareLine, correctLine]
    if (!lhsNormalizeChanged) {
      for (let i = 0; i < lhsWidth; i++) cols[i].colState = 'done'
      lines.push({ kind: 'result', label: 'Quotient · Remainder', value: `${quotient} · ${remainder}` })
      lines.push({ kind: 'note', tone: 'success', text: `Verify: ${quotient} × ${divisor} + ${remainder} = ${dividend} ✓` })
    } else {
      lines.push({
        kind: 'note',
        tone: 'warn',
        text: `${lastLhsLabel} is ${newLastChunk} — still not a single digit. One more step normalizes the quotient.`,
      })
    }

    steps.push({
      title: `Step ${stepNum} — compare and correct`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines,
    })
  }

  // Carry-normalize step (only when some LHS chunk needed it).
  if (lhsNormalizeChanged) {
    stepNum += 1

    const normalizeLines: CalcLine[] = []
    let carry = 0
    for (let i = lhsWidth - 1; i >= 0; i--) {
      const label = `Q${subscript(i + 1)}`
      const before = lastLhsChunks[i] + carry
      const [d, c] = normalizeDigit(before)
      if (before !== d) {
        const next = i > 0 ? { label: `Q${subscript(i)}`, before: lastLhsChunks[i - 1] } : undefined
        normalizeLines.push({
          kind: 'calc',
          label: 'Normalize',
          value: carryMessage(label, before, d, c, next),
        })
      }
      cols[i].total = d
      carry = c
    }
    for (let i = 0; i < lhsWidth; i++) cols[i].colState = 'done'

    normalizeLines.push({ kind: 'result', label: 'Quotient · Remainder', value: `${quotient} · ${remainder}` })
    normalizeLines.push({
      kind: 'note',
      tone: 'success',
      text: `Verify: ${quotient} × ${divisor} + ${remainder} = ${dividend} ✓`,
    })

    steps.push({
      title: `Step ${stepNum} — normalize the quotient`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines: normalizeLines,
    })
  }

  return steps
}
