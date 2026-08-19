import { useMemo, useRef, useState } from 'react'
import BaseMethodDivisorCard from '../components/BaseMethodDivisorCard'
import BaseMethodDigitBoard from '../components/BaseMethodDigitBoard'
import BaseMethodRules from '../components/BaseMethodRules'
import StepPanel from '../components/StepPanel'
import NavControls from '../components/NavControls'
import BaseMethodInputForm from '../components/BaseMethodInputForm'
import ErrorBanner from '../components/ErrorBanner'
import { computeBaseMethodSteps, nearestBase } from '../lib/computeBaseMethodSteps'
import { useStepNav } from '../hooks/useStepNav'
import type { BaseMethodStep } from '../types'

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
]

interface Problem {
  dividend: number
  divisor: number
  steps: BaseMethodStep[]
}

function solve(dividend: number, divisor: number): { problem: Problem | null; error: string | null } {
  try {
    const steps = computeBaseMethodSteps(dividend, divisor)
    return { problem: { dividend, divisor, steps }, error: null }
  } catch (err) {
    return { problem: null, error: err instanceof Error ? err.message : String(err) }
  }
}

export default function BaseMethodPage() {
  const initial = useMemo(() => solve(BASE_DIVIDEND, BASE_DIVISOR), [])
  const [problem, setProblem] = useState<Problem | null>(initial.problem)
  const [error, setError] = useState<string | null>(initial.error)
  const [exampleKey, setExampleKey] = useState(`${BASE_DIVIDEND}/${BASE_DIVISOR}`)
  const exampleToggleRef = useRef<HTMLInputElement>(null)
  const total = problem?.steps.length ?? 0
  const { cur, setCur, isFirst, isLast, onBack, onNext, onDot } = useStepNav(total)

  function handleSolve(dividend: number, divisor: number) {
    const result = solve(dividend, divisor)
    setProblem(result.problem)
    setError(result.error)
    setCur(0)
  }

  const onSelectExample = (dividend: number, divisor: number) => {
    handleSolve(dividend, divisor)
    setExampleKey(`${dividend}/${divisor}`)
    if (exampleToggleRef.current) exampleToggleRef.current.checked = false
  }

  const [initialDividend, initialDivisor] = exampleKey.split('/').map(Number)

  const base = problem ? nearestBase(problem.divisor) : 0
  const difference = problem ? base - problem.divisor : 0

  return (
    <>
      <BaseMethodInputForm
        key={exampleKey}
        initialDividend={initialDividend}
        initialDivisor={initialDivisor}
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
                className={`example-item${exampleKey === `${ex.dividend}/${ex.divisor}` ? ' selected' : ''}`}
                onClick={() => onSelectExample(ex.dividend, ex.divisor)}
              >
                <span className="ex-problem">{ex.dividend} ÷ {ex.divisor}</span>
                <span className="ex-desc">{ex.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {problem && (
        <>
          <BaseMethodDivisorCard base={base} difference={difference} />
          <BaseMethodDigitBoard step={problem.steps[cur]} onBack={onBack} onNext={onNext} isFirst={isFirst} isLast={isLast} />
          <NavControls cur={cur} total={total} onDot={onDot} />
          <StepPanel steps={problem.steps} cur={cur} />
        </>
      )}

      <BaseMethodRules />
    </>
  )
}
