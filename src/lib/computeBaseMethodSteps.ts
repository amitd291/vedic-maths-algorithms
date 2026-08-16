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

/** Splits |magnitude| into exactly `width` decimal digits, zero-padded on the left. */
function splitDigits(magnitude: number, width: number): number[] {
  const str = String(magnitude).padStart(width, '0')
  if (str.length > width) {
    throw new Error('contribution too large for this base is not yet supported (iteration D)')
  }
  return str.split('').map(Number)
}

function cloneCols(cols: BaseMethodColumn[]): BaseMethodColumn[] {
  return cols.map((c) => ({ ...c, contributions: [...c.contributions] }))
}

/**
 * Computes the Base Method / Paravartya division walkthrough for
 * `dividend ÷ divisor`, using the nearest power of 10 as the base.
 *
 * Supports a multi-digit (and possibly negative, i.e. Paravartya) `difference`:
 * each LHS digit's contribution fans out across every RHS column, and the RHS
 * columns are summed right to left with carry/borrow, followed by a
 * single-subtraction overflow/negative-remainder correction when needed.
 *
 * Scope note (iteration C): a carry cascading back into an already-finalized
 * LHS digit (redo-on-carry), and a corrected quotient that needs an extra
 * leading digit, are iteration D work — both throw rather than producing an
 * incorrect walkthrough.
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

  const incoming: number[] = Array(n).fill(0)
  const contributionsByCol: number[][] = Array.from({ length: n }, () => [])
  const lhsTotals: number[] = []

  // Pass 1a: finalize each LHS digit and fan its contribution across every RHS column.
  for (let i = 0; i < lhsWidth; i++) {
    const total = digits[i] + incoming[i]
    if (Math.abs(total) > 9) {
      throw new Error(`column ${i + 1} carry into an already-finalized column is not yet supported (iteration D)`)
    }
    lhsTotals.push(total)

    const contribution = total * difference
    const sign = Math.sign(contribution)
    const magnitudeDigits = splitDigits(Math.abs(contribution), rhsWidth)
    for (let k = 0; k < rhsWidth; k++) {
      const idx = i + 1 + k
      const signedDigit = sign * magnitudeDigits[k]
      incoming[idx] += signedDigit
      contributionsByCol[idx][i] = signedDigit
    }
  }

  // Pass 1b: sum the RHS columns right to left, carrying/borrowing into the column to the left.
  const rhsDigits: number[] = Array(rhsWidth).fill(0)
  const rhsLines: CalcLine[] = []
  let carry = 0
  for (let k = rhsWidth - 1; k >= 0; k--) {
    const colIdx = lhsWidth + k
    const hadCarryIn = carry !== 0
    const terms = [digits[colIdx], ...contributionsByCol[colIdx].filter((v) => v !== undefined)]
    if (hadCarryIn) terms.push(carry)
    const value = terms.reduce((a, b) => a + b, 0)

    let digitOut: number
    let carryOut: number
    if (value >= 10) {
      carryOut = Math.floor(value / 10)
      digitOut = value - carryOut * 10
    } else if (value <= -10) {
      carryOut = Math.ceil(value / 10)
      digitOut = value - carryOut * 10
    } else {
      carryOut = 0
      digitOut = value
    }
    rhsDigits[k] = digitOut

    const carrySuffix =
      carryOut !== 0 ? ` → write ${digitOut}, ${carryOut > 0 ? 'carry' : 'borrow'} ${Math.abs(carryOut)} left` : ''
    rhsLines.push({
      kind: 'calc',
      label: `Sum column ${colIdx + 1}${hadCarryIn ? ' (with carry)' : ''}`,
      value: `${terms.join(' + ')} = ${value}${carrySuffix}`,
    })
    carry = carryOut
  }
  if (carry !== 0) {
    throw new Error('carry into an already-finalized LHS digit is not yet supported (iteration D)')
  }
  // Keep rhsLines in the order columns were summed (rightmost first) — that's
  // the order the carry actually flows, and reversing it to left-to-right
  // reading order hides where each carry came from.

  const rhsTotal = rhsDigits.reduce((acc, d) => acc * 10 + d, 0)
  const preCorrectionQuotient = lhsTotals.reduce((acc, d) => acc * 10 + d, 0)

  let quotient = preCorrectionQuotient
  let remainder = rhsTotal
  let correctionDelta: 1 | -1 | 0 = 0
  if (remainder >= divisor) {
    remainder -= divisor
    quotient += 1
    correctionDelta = 1
  } else if (remainder < 0) {
    remainder += divisor
    quotient -= 1
    correctionDelta = -1
  }
  if (correctionDelta !== 0) {
    const newLastDigit = lhsTotals[lhsWidth - 1] + correctionDelta
    if (newLastDigit < 0 || newLastDigit > 9) {
      throw new Error('correction cascading into an earlier LHS digit is not yet supported (iteration D)')
    }
  }

  if (quotient * divisor + remainder !== dividend) {
    throw new Error(`computeBaseMethodSteps self-check failed: ${quotient} × ${divisor} + ${remainder} !== ${dividend}`)
  }

  // Pass 2: narrate the steps, mutating a running column-state array
  // (finalized totals + placed contributions) that each step snapshots.
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

  // LHS digits: finalize, then multiply and fan the contribution to the right.
  for (let i = 0; i < lhsWidth; i++) {
    const total = lhsTotals[i]
    const quotientLabel = `Q${subscript(i + 1)}`

    cols[i].total = total
    cols[i].colState = 'active'
    stepNum += 1

    const finalizeLines: CalcLine[] =
      i === 0
        ? [{ kind: 'calc', label: 'Bring down', value: `first LHS digit, ${digits[0]}, as it is` }]
        : [{ kind: 'calc', label: `Sum column ${i + 1}`, value: `${digits[i]} + ${incoming[i]} = ${total}` }]
    finalizeLines.push({ kind: 'result', label: quotientLabel, value: String(total) })

    steps.push({
      title: `Step ${stepNum} — ${ORDINALS[i]} LHS digit`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines: finalizeLines,
    })

    cols[i].colState = 'done'

    const contribution = total * difference
    const sign = Math.sign(contribution)
    const magnitudeDigits = splitDigits(Math.abs(contribution), rhsWidth)
    for (let k = 0; k < rhsWidth; k++) {
      // Indexed (not pushed) by source LHS digit i, so a column's chip row
      // lines up with every other column touched by that same multiply step,
      // even when this column doesn't receive a contribution from an earlier digit.
      cols[i + 1 + k].contributions[i] = sign * magnitudeDigits[k]
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
            text: `Difference has ${rhsWidth} digits (${magnitudeDigits.map((d) => (sign < 0 ? -d : d)).join(' · ')}) — write them diagonally under the next ${rhsWidth} columns.`,
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

  // RHS columns: one combined right-to-left sum step.
  for (let k = 0; k < rhsWidth; k++) {
    const colIdx = lhsWidth + k
    cols[colIdx].total = rhsDigits[k]
    cols[colIdx].colState = 'active'
  }
  stepNum += 1

  const correctionNeeded = correctionDelta !== 0
  const sumLines = [...rhsLines]
  if (!correctionNeeded) {
    sumLines.push({ kind: 'result', label: 'Remainder', value: String(remainder) })
    sumLines.push({ kind: 'note', tone: 'success', text: `Verify: ${quotient} × ${divisor} + ${remainder} = ${dividend} ✓` })
  } else {
    sumLines.push({ kind: 'result', label: 'RHS total', value: String(rhsTotal) })
  }

  steps.push({
    title: correctionNeeded ? `Step ${stepNum} — sum the RHS columns, right to left` : `Step ${stepNum} — remainder`,
    cols: cloneCols(cols),
    connectors: noConnectors,
    lines: sumLines,
  })

  for (let k = 0; k < rhsWidth; k++) cols[lhsWidth + k].colState = 'done'

  // Optional correction step: RHS total ≥ divisor, or negative (Paravartya).
  if (correctionNeeded) {
    stepNum += 1

    // The correction never cascades past the last LHS digit (guarded above),
    // so redrawing it is safe. The corrected remainder can still outgrow
    // rhsWidth (a Paravartya remainder can need more digits than the RHS had
    // columns) — in that case leave the columns as-is; the text lines above
    // and the result line below carry the true corrected value.
    cols[lhsWidth - 1].total = lhsTotals[lhsWidth - 1] + correctionDelta
    const remainderStr = String(remainder)
    if (remainder >= 0 && remainderStr.length <= rhsWidth) {
      const remainderDigits = remainderStr.padStart(rhsWidth, '0').split('').map(Number)
      for (let k = 0; k < rhsWidth; k++) cols[lhsWidth + k].total = remainderDigits[k]
    }

    const compareLine: CalcLine =
      correctionDelta === 1
        ? { kind: 'calc', label: 'Compare', value: `RHS total ${rhsTotal} ≥ divisor ${divisor}` }
        : { kind: 'calc', label: 'Compare', value: `RHS total ${rhsTotal} is negative` }
    const lastLhsLabel = `Q${subscript(lhsWidth)}`
    const oldLastDigit = lhsTotals[lhsWidth - 1]
    const correctLine: CalcLine =
      correctionDelta === 1
        ? {
            kind: 'calc',
            label: 'Correct',
            value: `${rhsTotal} − ${divisor} = ${remainder}, and ${lastLhsLabel} = ${oldLastDigit} + 1 = ${oldLastDigit + 1}`,
          }
        : {
            kind: 'calc',
            label: 'Correct',
            value: `${rhsTotal} + ${divisor} = ${remainder}, and ${lastLhsLabel} = ${oldLastDigit} − 1 = ${oldLastDigit - 1}`,
          }

    steps.push({
      title: `Step ${stepNum} — compare and normalize`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines: [
        compareLine,
        correctLine,
        { kind: 'result', label: 'Quotient · Remainder', value: `${quotient} · ${remainder}` },
        { kind: 'note', tone: 'success', text: `Verify: ${quotient} × ${divisor} + ${remainder} = ${dividend} ✓` },
      ],
    })
  }

  return steps
}
