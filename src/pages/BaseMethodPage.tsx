import { useMemo, useRef, useState } from 'react'
import BaseMethodDivisorCard from '../components/BaseMethodDivisorCard'
import BaseMethodDigitBoard from '../components/BaseMethodDigitBoard'
import BaseMethodRules from '../components/BaseMethodRules'
import StepPanel from '../components/StepPanel'
import NavControls from '../components/NavControls'
import BaseMethodInputForm from '../components/BaseMethodInputForm'
import ErrorBanner from '../components/ErrorBanner'
import SimplificationSelector from '../components/SimplificationSelector'
import { computeBaseMethodSteps, computeScaledBaseMethodSteps, nearestBase } from '../lib/computeBaseMethodSteps'
import { describeBaseMethodError, needsSimplification, solveScaledBaseMethod } from '../lib/baseMethodMath'
import { useStepNav } from '../hooks/useStepNav'
import type { BaseMethodStep } from '../types'
import type { SimplificationCandidate } from '../lib/baseMethodMath'

const BASE_DIVIDEND = 123
const BASE_DIVISOR = 9

const EXAMPLES = [
  { dividend: 123, divisor: 9, desc: 'Default, the simplest case, solved in one pass' },
  { dividend: 865, divisor: 9, desc: 'The quotient needs a quick fix at the end' },
  { dividend: 10600, divisor: 87, desc: 'A carry ripples back through the quotient' },
  { dividend: 30122, divisor: 87, desc: 'A multi-step remainder fix, not just a single correction' },
  { dividend: 10030, divisor: 827, desc: 'The remainder needs a quick fix at the end' },
  { dividend: 14189, divisor: 102, desc: 'Paravartya technique, only the quotient needs fixing up' },
  { dividend: 1693, divisor: 131, desc: 'Paravartya technique, i.e. the divisor sits above the base, so signs flip' },
  { dividend: 5428, divisor: 35, desc: 'Needs divisor scaling to keep every multiplier friendly' },
  { dividend: 12657, divisor: 791, desc: 'Divisor scaling via division, not multiplication' },
]

interface Problem {
  dividend: number
  divisor: number
  steps: BaseMethodStep[]
  scaledAnswer: { quotient: number; remainder: number } | null
}

function solve(
  dividend: number,
  divisor: number,
  candidate: SimplificationCandidate | null,
): { problem: Problem | null; error: string | null; friendly: boolean } {
  try {
    if (candidate?.kind === 'substitution') {
      const steps = computeBaseMethodSteps(dividend, divisor, candidate.digits)
      return { problem: { dividend, divisor, steps, scaledAnswer: null }, error: null, friendly: false }
    }
    if (candidate !== null) {
      const steps = computeScaledBaseMethodSteps(dividend, divisor, candidate)
      const { quotient, remainder } = solveScaledBaseMethod(dividend, divisor, candidate)
      return { problem: { dividend, divisor, steps, scaledAnswer: { quotient, remainder } }, error: null, friendly: false }
    }
    const steps = computeBaseMethodSteps(dividend, divisor)
    return { problem: { dividend, divisor, steps, scaledAnswer: null }, error: null, friendly: false }
  } catch (err) {
    const { message, friendly } = describeBaseMethodError(err)
    return { problem: null, error: message, friendly }
  }
}

// Plain solve is deferred while a simplification choice is pending, so its
// error (e.g. the hidden board's width) isn't shown before the user picks.
function solvePlain(dividend: number, divisor: number) {
  if (needsSimplification(divisor)) return { problem: null, error: null, friendly: false }
  return solve(dividend, divisor, null)
}

export default function BaseMethodPage() {
  const initial = useMemo(() => solvePlain(BASE_DIVIDEND, BASE_DIVISOR), [])
  const [problem, setProblem] = useState<Problem | null>(initial.problem)
  const [error, setError] = useState<string | null>(initial.error)
  const [errorFriendly, setErrorFriendly] = useState<boolean>(initial.friendly)
  const [formSeed, setFormSeed] = useState({ dividend: BASE_DIVIDEND, divisor: BASE_DIVISOR, seq: 0 })
  const [current, setCurrent] = useState({ dividend: BASE_DIVIDEND, divisor: BASE_DIVISOR })
  const [candidate, setCandidate] = useState<SimplificationCandidate | null>(null)
  const [solveSeq, setSolveSeq] = useState(0)
  const exampleToggleRef = useRef<HTMLInputElement>(null)
  const total = problem?.steps.length ?? 0
  const { cur, setCur, isFirst, isLast, onBack, onNext, onDot } = useStepNav(total)

  function handleSolve(dividend: number, divisor: number) {
    setCurrent({ dividend, divisor })
    setCandidate(null)
    setSolveSeq((n) => n + 1)
    const result = solvePlain(dividend, divisor)
    setProblem(result.problem)
    setError(result.error)
    setErrorFriendly(result.friendly)
    setCur(0)
  }

  function handleSelectCandidate(selectedCandidate: SimplificationCandidate) {
    setCandidate(selectedCandidate)
    const result = solve(current.dividend, current.divisor, selectedCandidate)
    setProblem(result.problem)
    setError(result.error)
    setErrorFriendly(result.friendly)
    setCur(0)
  }

  const onSelectExample = (dividend: number, divisor: number) => {
    handleSolve(dividend, divisor)
    setFormSeed((s) => ({ dividend, divisor, seq: s.seq + 1 }))
    if (exampleToggleRef.current) exampleToggleRef.current.checked = false
  }

  const pending = needsSimplification(current.divisor) && candidate === null
  const plainBase = nearestBase(current.divisor)
  const base = pending ? null : candidate ? candidate.base : plainBase
  const difference = pending ? null : candidate ? candidate.difference : plainBase - current.divisor
  const finalAnswer =
    problem?.scaledAnswer && isLast
      ? { divisor: current.divisor, quotient: problem.scaledAnswer.quotient, remainder: problem.scaledAnswer.remainder }
      : null

  return (
    <>
      <BaseMethodInputForm
        key={`seed-${formSeed.seq}`}
        initialDividend={formSeed.dividend}
        initialDivisor={formSeed.divisor}
        onSolve={handleSolve}
      />

      <div className="example-toggle-row">
        <input type="checkbox" id="toggle-examples" ref={exampleToggleRef} className="example-toggle-input" />
        <label htmlFor="toggle-examples" className="example-toggle-label">
          <svg className="chevron" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
          Try a worked example
        </label>

        <div className="example-panel">
          <div className="example-list">
            {EXAMPLES.map((ex) => (
              <button
                key={`${ex.dividend}/${ex.divisor}`}
                type="button"
                className={`example-item${current.dividend === ex.dividend && current.divisor === ex.divisor ? ' selected' : ''}`}
                onClick={() => onSelectExample(ex.dividend, ex.divisor)}
              >
                <span className="ex-problem">{ex.dividend} ÷ {ex.divisor}</span>
                <span className="ex-desc">{ex.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} showPrefix={!errorFriendly} />}

      <SimplificationSelector
        key={solveSeq}
        divisor={current.divisor}
        onSelect={handleSelectCandidate}
      />
      {(pending || problem) && (
        <BaseMethodDivisorCard
          base={base}
          difference={difference}
          substituted={candidate?.kind === 'substitution' ? candidate.digits : null}
        />
      )}

      {problem && !pending && (
        <>
          <BaseMethodDigitBoard
            step={problem.steps[cur]}
            onBack={onBack}
            onNext={onNext}
            isFirst={isFirst}
            isLast={isLast}
            finalAnswer={finalAnswer}
          />
          <NavControls cur={cur} total={total} onDot={onDot} />
          <StepPanel steps={problem.steps} cur={cur} />
        </>
      )}

      <BaseMethodRules />
    </>
  )
}
