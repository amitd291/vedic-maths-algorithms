import { useMemo, useState } from 'react'
import BaseMethodDivisorCard from '../components/BaseMethodDivisorCard'
import BaseMethodDigitBoard from '../components/BaseMethodDigitBoard'
import BaseMethodRules from '../components/BaseMethodRules'
import StepPanel from '../components/StepPanel'
import NavControls from '../components/NavControls'
import BaseMethodInputForm from '../components/BaseMethodInputForm'
import ErrorBanner from '../components/ErrorBanner'
import { computeBaseMethodSteps, nearestBase } from '../lib/computeBaseMethodSteps'
import { useStepNav } from '../hooks/useStepNav'
import type { Step } from '../types'

const BASE_DIVIDEND = 10600
const BASE_DIVISOR = 87

const DEV_EXAMPLES = [
  { dividend: 123, divisor: 9, label: '123 ÷ 9 (no closing steps)' },
  { dividend: 865, divisor: 9, label: '865 ÷ 9 (normalize quotient)' },
  { dividend: 10030, divisor: 827, label: '10030 ÷ 827 (normalize remainder)' },
  { dividend: 10600, divisor: 87, label: '10600 ÷ 87 (quotient carry cascade)' },
  { dividend: 30122, divisor: 87, label: '30122 ÷ 87 (quotient carry cascade 2)' },
  { dividend: 1693, divisor: 131, label: '1693 ÷ 131 (Paravartya sign flip)' },
  { dividend: 14189, divisor: 102, label: '14189 ÷ 102 (quotient-only normalize)' },
]

interface Problem {
  dividend: number
  divisor: number
  steps: Step[]
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
  const total = problem?.steps.length ?? 0
  const { cur, setCur, isFirst, isLast, onBack, onNext, onDot } = useStepNav(total)

  function handleSolve(dividend: number, divisor: number) {
    const result = solve(dividend, divisor)
    setProblem(result.problem)
    setError(result.error)
    setCur(0)
  }

  const onSelectExample = (value: string) => {
    const [d, n] = value.split('/').map(Number)
    handleSolve(d, n)
    setExampleKey(value)
  }

  const [initialDividend, initialDivisor] = exampleKey.split('/').map(Number)

  const base = problem ? nearestBase(problem.divisor) : 0
  const difference = problem ? base - problem.divisor : 0

  return (
    <>
      {import.meta.env.MODE === 'development' && (
        <div className="problem-badge-row">
          <select
            aria-label="Dev example picker"
            value={exampleKey}
            onChange={(e) => onSelectExample(e.target.value)}
          >
            {DEV_EXAMPLES.map((ex) => (
              <option key={`${ex.dividend}/${ex.divisor}`} value={`${ex.dividend}/${ex.divisor}`}>
                {ex.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <BaseMethodInputForm
        key={exampleKey}
        initialDividend={initialDividend}
        initialDivisor={initialDivisor}
        onSolve={handleSolve}
      />

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
