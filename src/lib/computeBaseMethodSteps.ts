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

interface ColumnResult {
  kind: 'lhs' | 'rhs'
  digit: number
  incoming: number // sum of contributions received before this column is finalized
  total: number // digit + incoming; the finalized quotient digit (lhs) or remainder (rhs, last column)
  contribution: number | null // total × difference, placed into the next column; null on the last column
}

function cloneCols(cols: BaseMethodColumn[]): BaseMethodColumn[] {
  return cols.map((c) => ({ ...c, contributions: [...c.contributions] }))
}

/**
 * Computes the Base Method / Paravartya division walkthrough for
 * `dividend ÷ divisor`, using the nearest power of 10 as the base.
 *
 * Scope note (iteration B): only single-digit `difference` (|base − divisor|
 * ≤ 9) with no LHS column carry and no RHS overflow correction is supported —
 * those are iteration C/D work. Anything outside that throws rather than
 * producing an incorrect walkthrough.
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
  if (Math.abs(difference) > 9) {
    throw new Error('multi-digit difference is not yet supported (iteration C)')
  }

  const rhsWidth = String(base).length - 1
  const digits = String(dividend).split('').map(Number)
  const n = digits.length
  if (n <= rhsWidth) {
    throw new Error('dividend is too small for this base')
  }
  const lhsWidth = n - rhsWidth

  // First pass: compute the arithmetic for every column, left to right.
  const incomingByCol: number[] = Array(n).fill(0)
  const results: ColumnResult[] = []

  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1
    const kind = i < lhsWidth ? 'lhs' : 'rhs'
    const incoming = incomingByCol[i]
    const total = digits[i] + incoming

    if (!isLast && (total >= 10 || total < 0)) {
      throw new Error(`column ${i + 1} carry/overflow is not yet supported (iteration D)`)
    }
    if (isLast && (total < 0 || total >= divisor)) {
      throw new Error('remainder normalization is not yet supported (iteration C)')
    }

    let contribution: number | null = null
    if (!isLast) {
      contribution = total * difference
      incomingByCol[i + 1] += contribution
    }

    results.push({ kind, digit: digits[i], incoming, total, contribution })
  }

  const quotient = Number(
    results
      .slice(0, lhsWidth)
      .map((r) => r.total)
      .join(''),
  )
  const remainder = results[n - 1].total
  if (quotient * divisor + remainder !== dividend) {
    throw new Error(`computeBaseMethodSteps self-check failed: ${quotient} × ${divisor} + ${remainder} !== ${dividend}`)
  }

  // Second pass: narrate the steps, mutating a running column-state array
  // (finalized totals + placed contributions) that each step snapshots.
  const cols: BaseMethodColumn[] = results.map((r) => ({
    kind: r.kind,
    digit: r.digit,
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

  for (let i = 0; i < n; i++) {
    const r = results[i]
    const isLast = i === n - 1
    const quotientLabel = `Q${subscript(i + 1)}`

    // Finalize (bring down / sum) column i.
    cols[i].total = r.total
    cols[i].colState = 'active'
    stepNum += 1

    const finalizeLines: CalcLine[] =
      i === 0
        ? [{ kind: 'calc', label: 'Bring down', value: `first LHS digit, ${r.digit}, as it is` }]
        : [{ kind: 'calc', label: `Sum column ${i + 1}`, value: `${r.digit} + ${r.incoming} = ${r.total}` }]
    finalizeLines.push({ kind: 'result', label: isLast ? 'Remainder' : quotientLabel, value: String(r.total) })
    if (isLast) {
      finalizeLines.push({
        kind: 'note',
        tone: 'success',
        text: `Verify: ${quotient} × ${divisor} + ${remainder} = ${dividend} ✓`,
      })
    }

    steps.push({
      title: isLast
        ? `Step ${stepNum} — remainder`
        : `Step ${stepNum} — ${ORDINALS[i]} ${r.kind === 'lhs' ? 'LHS' : 'RHS'} digit`,
      cols: cloneCols(cols),
      connectors: noConnectors,
      lines: finalizeLines,
    })

    cols[i].colState = 'done'
    if (isLast) continue

    // Multiply column i by the difference and place the contribution.
    cols[i + 1].contributions.push(r.contribution!)
    const connectors = Array(n - 1).fill(false)
    connectors[i] = true
    stepNum += 1

    steps.push({
      title: `Step ${stepNum} — multiply ${quotientLabel} by the difference`,
      cols: cloneCols(cols),
      connectors,
      lines: [
        {
          kind: 'calc',
          label: 'Multiply',
          value: `${quotientLabel} × difference = ${r.total} × ${difference} = ${r.contribution}`,
        },
        { kind: 'note', tone: 'warn', text: `Write ${r.contribution} diagonally under column ${i + 2}.` },
      ],
    })
  }

  return steps
}
