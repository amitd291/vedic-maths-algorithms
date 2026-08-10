import { describe, it, expect } from 'vitest'
import { computeSteps } from './computeSteps'

describe('computeSteps', () => {
  it('reproduces the 5428 ÷ 35 worked example exactly', () => {
    const steps = computeSteps(5428, 35)
    expect(steps).toHaveLength(6)

    expect(steps[0]).toEqual({
      title: 'Setup',
      done: [],
      active: [],
      quotientDigits: [null, null, null],
      r: null,
      carry: null,
      lines: [
        { kind: 'calc', label: 'Divisor', value: '35' },
        { kind: 'calc', label: 'Working divisor (first digit)', value: '3' },
        { kind: 'calc', label: 'Flag digit (remaining digits)', value: '5' },
        {
          kind: 'note',
          tone: 'warn',
          text: 'Pattern: at each step, subtract flag × previous quotient digit from the gross dividend before dividing by the working divisor.',
        },
      ],
      flagFires: false,
    })

    expect(steps[1]).toEqual({
      title: 'Step 1 — first digit',
      done: [],
      active: [0],
      quotientDigits: [1, null, null],
      r: null,
      carry: 2,
      lines: [
        { kind: 'calc', label: 'Gross dividend', value: 'GD = 5' },
        { kind: 'calc', label: 'No flag adjustment on first digit', value: 'ND = 5' },
        { kind: 'calc', label: 'Divide by working divisor', value: '5 ÷ 3 = 1 remainder 2' },
        { kind: 'result', label: 'Q₁', value: '1' },
      ],
      flagFires: false,
    })

    expect(steps[2]).toEqual({
      title: 'Step 2 — second digit (raw)',
      done: [0],
      active: [1],
      quotientDigits: [1, 6, null],
      r: null,
      carry: 1,
      lines: [
        { kind: 'calc', label: 'Gross dividend', value: 'GD = carry(2) × 10 + 4 = 24' },
        { kind: 'calc', label: 'Flag subtraction', value: 'ND = 24 − 5×1 = 19' },
        {
          kind: 'calc',
          label: 'Divide by working divisor',
          value: '19 ÷ 3 = 6 remainder 1 (raw)',
        },
        {
          kind: 'note',
          tone: 'warn',
          text: "Checking ahead: keeping Q₂ = 6 would make the next digit's ND₃ = carry(1)×10 + 2 − 5×6 = 12 − 30 = -18 (negative).",
        },
        { kind: 'result', label: 'Q₂', value: '6' },
      ],
      flagFires: true,
      phase: 'raw',
    })

    expect(steps[3]).toEqual({
      title: 'Step 2 — second digit (adjusted)',
      done: [0],
      active: [1],
      quotientDigits: [1, 5, null],
      r: null,
      carry: 4,
      lines: [
        {
          kind: 'note',
          tone: 'warn',
          text: 'Reduce the quotient by 1 to Q₂ = 5, and add the working divisor back into the carry: 1 + 3 = 4.',
        },
        { kind: 'result', label: 'Q₂', value: '5' },
      ],
      flagFires: true,
      phase: 'adjusted',
    })

    expect(steps[4]).toEqual({
      title: 'Step 3 — third digit',
      done: [0, 1],
      active: [2],
      quotientDigits: [1, 5, 5],
      r: null,
      carry: 2,
      lines: [
        { kind: 'calc', label: 'Gross dividend', value: 'GD = carry(4) × 10 + 2 = 42' },
        { kind: 'calc', label: 'Flag subtraction', value: 'ND = 42 − 5×5 = 17' },
        { kind: 'calc', label: 'Divide by working divisor', value: '17 ÷ 3 = 5 remainder 2' },
        { kind: 'result', label: 'Q₃', value: '5' },
      ],
      flagFires: true,
    })

    expect(steps[5]).toEqual({
      title: 'Step 4 — remainder',
      done: [0, 1, 2],
      active: [3],
      quotientDigits: [1, 5, 5],
      r: 3,
      carry: null,
      lines: [
        { kind: 'calc', label: 'Gross dividend', value: 'GD = carry(2) × 10 + 8 = 28' },
        { kind: 'calc', label: 'Flag subtraction', value: 'ND = 28 − 5×5 = 3' },
        { kind: 'result', label: 'Remainder', value: '3' },
        { kind: 'note', tone: 'success', text: 'Verify: 155 × 35 + 3 = 5428 ✓' },
      ],
      flagFires: true,
    })
  })

  it('exercises the adjustment/backtrack path (5428 ÷ 35 step 2)', () => {
    const steps = computeSteps(5428, 35)
    const raw = steps[2]
    const adjusted = steps[3]
    expect(raw.phase).toBe('raw')
    expect(raw.quotientDigits).toEqual([1, 6, null])
    expect(raw.carry).toBe(1)
    const lookaheadNote = raw.lines.find((l) => l.kind === 'note' && l.tone === 'warn')
    expect(lookaheadNote).toBeDefined()

    expect(adjusted.phase).toBe('adjusted')
    const reduceNote = adjusted.lines.find((l) => l.kind === 'note' && l.tone === 'warn')
    expect(reduceNote).toBeDefined()
    expect(adjusted.quotientDigits).toEqual([1, 5, null])
    expect(adjusted.carry).toBe(4)
  })

  it('handles exact division (4900 ÷ 35 -> Q=140 R=0)', () => {
    const steps = computeSteps(4900, 35)
    const last = steps[steps.length - 1]
    expect(last.r).toBe(0)
    const qDigits = last.quotientDigits.map((d) => String(d)).join('')
    expect(qDigits).toBe('140')
    expect(Number(qDigits) * 35 + (last.r ?? 0)).toBe(4900)
  })

  it('handles divisor > dividend (5 ÷ 12 -> Q=0 R=5)', () => {
    const steps = computeSteps(5, 12)
    const last = steps[steps.length - 1]
    expect(last.quotientDigits).toEqual([])
    expect(last.r).toBe(5)
  })

  it('handles a single-digit result (15 ÷ 12 -> Q=1 R=3)', () => {
    const steps = computeSteps(15, 12)
    const last = steps[steps.length - 1]
    expect(last.quotientDigits).toEqual([1])
    expect(last.r).toBe(3)
  })

  it('handles leading-zero quotient digits without dropping them structurally', () => {
    // 1015 / 99 -> Q = 10 R = 25; the middle quotient digit is 0
    const steps = computeSteps(1015, 99)
    const last = steps[steps.length - 1]
    expect(last.quotientDigits.length).toBe(3)
    const q = Number(last.quotientDigits.map((d) => String(d)).join(''))
    expect(q * 99 + (last.r ?? 0)).toBe(1015)
  })

  it('throws on out-of-range or non-integer inputs', () => {
    expect(() => computeSteps(0, 35)).toThrow()
    expect(() => computeSteps(1.5, 35)).toThrow()
    expect(() => computeSteps(5428, 9)).toThrow()
    expect(() => computeSteps(5428, 100)).toThrow()
    expect(() => computeSteps(5428, 35.5)).toThrow()
  })

  it('property: every displayed "Divide by working divisor" line is arithmetically true', () => {
    const divideLineRe = /^(\d+) ÷ (\d+) = (\d+) remainder (\d+)(?: \(raw\))?$/
    for (let divisor = 10; divisor <= 99; divisor++) {
      for (let dividend = 1; dividend <= 9999; dividend += 37) {
        const steps = computeSteps(dividend, divisor)
        for (const step of steps) {
          for (const line of step.lines) {
            if (line.kind !== 'calc' || line.label !== 'Divide by working divisor') continue
            const match = divideLineRe.exec(line.value)
            expect(match, `unparseable line: ${line.value}`).not.toBeNull()
            const [, nd, working, q, r] = match!
            expect(Number(q) * Number(working) + Number(r)).toBe(Number(nd))
          }
        }
      }
    }
  })

  it('property: Q × D + R === N and 0 <= R < D across a range of inputs', () => {
    for (let divisor = 10; divisor <= 99; divisor++) {
      const dividends = [1, 7, 42, 99, 500, 999, 1000, 4321, 8765, 9999]
      for (const dividend of dividends) {
        const steps = computeSteps(dividend, divisor)
        const last = steps[steps.length - 1]
        const r = last.r ?? 0
        const q = last.quotientDigits.length > 0 ? Number(last.quotientDigits.map((d) => String(d)).join('')) : 0
        expect(q * divisor + r).toBe(dividend)
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThan(divisor)
      }
    }
  })
})
