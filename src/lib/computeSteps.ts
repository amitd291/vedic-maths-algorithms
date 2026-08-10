import type { CalcLine, Step } from '../types'

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

function subscript(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUBSCRIPT_DIGITS[Number(d)])
    .join('')
}

const ORDINALS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
]

interface DigitResult {
  digit: number
  carryIn: number
  prevQuotientDigit: number
  grossDividend: number
  netDividend: number
  isLast: boolean
  quotientDigit: number | null // adjusted quotient digit for this position (null when isLast)
  carryOut: number | null // adjusted carry out of this step (null when isLast)
  remainder: number | null // only set when isLast
  rawQuotientDigit: number | null // pre-adjustment quotient, set only when an adjustment happened
  rawRemainder: number | null // pre-adjustment remainder, set only when an adjustment happened
  overshootCount: number // number of times the quotient digit was reduced by 1
  overshootNextNetDividend: number | null // the next digit's ND the raw quotient would have produced (negative), set only when an adjustment happened
}

/**
 * Computes the Dhvajanka (flag) division walkthrough for `dividend ÷ divisor`.
 *
 * `divisor` is split into a single-digit `working` divisor (tens digit) and a
 * single-digit `flag` (units digit). Dividend digits are walked left to
 * right; at each step `grossDividend = carry * 10 + digit` and
 * `netDividend = grossDividend - flag * prevQuotientDigit`. For every digit
 * except the last, the quotient digit is `floor(netDividend / working)` with
 * `carry = netDividend mod working`; the last digit's netDividend is the
 * remainder instead of being divided further.
 *
 * Adjustment rule: if a quotient digit is chosen such that the *next*
 * digit's netDividend would go negative, that quotient digit must be reduced by 1
 * (looping if needed) with `working` added back into its carry each time.
 * This is resolved via one-step lookahead *before* the offending step is
 * emitted, so the returned `Step` for that digit already shows the adjusted
 * quotient/carry, with a warn note documenting the raw value and the
 * reduction — matching how the original v1 hand-authored walkthrough
 * presents the 5428 ÷ 35 adjustment at step 2.
 */
export function computeSteps(dividend: number, divisor: number): Step[] {
  if (!Number.isInteger(dividend) || dividend <= 0) {
    throw new Error('dividend must be a positive integer')
  }
  if (!Number.isInteger(divisor) || divisor < 10 || divisor > 99) {
    throw new Error('divisor must be a two-digit integer (10-99)')
  }

  const digits = String(dividend).split('').map(Number)
  const n = digits.length
  const working = Math.floor(divisor / 10)
  const flag = divisor % 10
  const quotientSlotCount = n - 1 // the last digit's step yields the remainder, not a quotient digit

  const results: DigitResult[] = []
  let carry = 0
  let prevQuotientDigit = 0

  for (let i = 0; i < n; i++) {
    const digit = digits[i]
    const isLast = i === n - 1
    const grossDividend = carry * 10 + digit
    const netDividend = grossDividend - flag * prevQuotientDigit

    if (isLast) {
      results.push({
        digit,
        carryIn: carry,
        prevQuotientDigit,
        grossDividend,
        netDividend,
        isLast: true,
        quotientDigit: null,
        carryOut: null,
        remainder: netDividend,
        rawQuotientDigit: null,
        rawRemainder: null,
        overshootCount: 0,
        overshootNextNetDividend: null,
      })
      break
    }

    const rawQuotientDigit = Math.floor(netDividend / working)
    const rawRemainder = netDividend - working * rawQuotientDigit

    let quotientDigit = rawQuotientDigit
    let carryOut = rawRemainder
    let overshootCount = 0
    let overshootNextNetDividend: number | null = null

    if (i + 1 < n) {
      const nextDigit = digits[i + 1]
      let nextGrossDividend = carryOut * 10 + nextDigit
      let nextNetDividend = nextGrossDividend - flag * quotientDigit
      while (nextNetDividend < 0 && quotientDigit > 0) {
        if (overshootNextNetDividend === null) overshootNextNetDividend = nextNetDividend
        quotientDigit -= 1
        carryOut += working
        overshootCount += 1
        nextGrossDividend = carryOut * 10 + nextDigit
        nextNetDividend = nextGrossDividend - flag * quotientDigit
      }
    }

    results.push({
      digit,
      carryIn: carry,
      prevQuotientDigit,
      grossDividend,
      netDividend,
      isLast: false,
      quotientDigit,
      carryOut,
      remainder: null,
      rawQuotientDigit: overshootCount > 0 ? rawQuotientDigit : null,
      rawRemainder: overshootCount > 0 ? rawRemainder : null,
      overshootCount,
      overshootNextNetDividend,
    })

    carry = carryOut
    prevQuotientDigit = quotientDigit
  }

  const steps: Step[] = []
  const quotientDigits: (number | null)[] = new Array(quotientSlotCount).fill(null)

  // Setup step
  steps.push({
    title: 'Setup',
    done: [],
    active: [],
    quotientDigits: [...quotientDigits],
    r: null,
    carry: null,
    lines: [
      { kind: 'calc', label: 'Divisor', value: String(divisor) },
      { kind: 'calc', label: 'Working divisor (first digit)', value: String(working) },
      { kind: 'calc', label: 'Flag digit (remaining digits)', value: String(flag) },
      {
        kind: 'note',
        tone: 'warn',
        text: 'Pattern: at each step, subtract flag × previous quotient digit from the gross dividend before dividing by the working divisor.',
      },
    ],
    flagFires: false,
  })

  for (let i = 0; i < results.length; i++) {
    const res = results[i]
    const done = Array.from({ length: i }, (_, k) => k)
    const active = [i]
    const lines: CalcLine[] = []

    if (i === 0) {
      lines.push({ kind: 'calc', label: 'Gross dividend', value: `GD = ${res.digit}` })
      lines.push({
        kind: 'calc',
        label: 'No flag adjustment on first digit',
        value: `ND = ${res.digit}`,
      })
    } else {
      lines.push({
        kind: 'calc',
        label: 'Gross dividend',
        value: `GD = carry(${res.carryIn}) × 10 + ${res.digit} = ${res.grossDividend}`,
      })
      lines.push({
        kind: 'calc',
        label: 'Flag subtraction',
        value: `ND = ${res.grossDividend} − ${flag}×${res.prevQuotientDigit} = ${res.netDividend}`,
      })
    }

    if (res.isLast) {
      lines.push({ kind: 'result', label: 'Remainder', value: String(res.remainder) })
    } else {
      const divideValue =
        res.overshootCount > 0
          ? `${res.netDividend} ÷ ${working} = ${res.rawQuotientDigit} remainder ${res.rawRemainder} (raw)`
          : `${res.netDividend} ÷ ${working} = ${res.quotientDigit} remainder ${res.carryOut}`
      lines.push({ kind: 'calc', label: 'Divide by working divisor', value: divideValue })

      if (res.overshootCount > 0) {
        const quotientLabel = `Q${subscript(i + 1)}`
        const checkAhead = `Checking ahead: keeping ${quotientLabel} = ${res.rawQuotientDigit} would make the next digit's ND = ${res.overshootNextNetDividend} (negative).`
        const text =
          res.overshootCount === 1
            ? `${checkAhead} Reduce the quotient by 1 to ${quotientLabel} = ${res.quotientDigit}, and add the working divisor back into the carry: ${res.rawRemainder} + ${working} = ${res.carryOut}.`
            : `${checkAhead} Reduce the quotient by ${res.overshootCount} to ${quotientLabel} = ${res.quotientDigit}, and add the working divisor back into the carry ${res.overshootCount} times: ${res.rawRemainder} + ${res.overshootCount}×${working} = ${res.carryOut}.`
        lines.push({ kind: 'note', tone: 'warn', text })
      }

      lines.push({ kind: 'result', label: `Q${subscript(i + 1)}`, value: String(res.quotientDigit) })
      quotientDigits[i] = res.quotientDigit
    }

    let finalQuotient = 0
    if (res.isLast) {
      finalQuotient =
        quotientSlotCount > 0
          ? Number(quotientDigits.map((v) => (v === null ? '0' : String(v))).join(''))
          : 0
      lines.push({
        kind: 'note',
        tone: 'success',
        text: `Verify: ${finalQuotient} × ${divisor} + ${res.remainder} = ${dividend} ✓`,
      })
    }

    const title = res.isLast ? `Step ${i + 1} — remainder` : `Step ${i + 1} — ${ORDINALS[i]} digit`

    steps.push({
      title,
      done,
      active,
      quotientDigits: [...quotientDigits],
      r: res.isLast ? res.remainder : null,
      carry: res.isLast ? null : res.carryOut,
      lines,
      flagFires: i > 0,
    })
  }

  const last = results[results.length - 1]
  const finalQuotient =
    quotientSlotCount > 0
      ? Number(quotientDigits.map((v) => (v === null ? '0' : String(v))).join(''))
      : 0
  const finalR = last.remainder ?? 0
  if (finalQuotient * divisor + finalR !== dividend) {
    throw new Error(
      `computeSteps self-check failed: ${finalQuotient} × ${divisor} + ${finalR} !== ${dividend}`,
    )
  }

  return steps
}
