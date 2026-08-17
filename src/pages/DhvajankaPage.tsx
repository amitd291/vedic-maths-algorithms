import { useMemo, useState } from 'react'
import DivisorCard from '../components/DivisorCard'
import DigitBoard from '../components/DigitBoard'
import StepPanel from '../components/StepPanel'
import NavControls from '../components/NavControls'
import MethodRules from '../components/MethodRules'
import InputForm from '../components/InputForm'
import ErrorBanner from '../components/ErrorBanner'
import { computeSteps } from '../lib/computeSteps'
import type { Step } from '../types'

interface Problem {
  dividend: number
  divisor: number
  steps: Step[]
}

function solve(dividend: number, divisor: number): { problem: Problem | null; error: string | null } {
  try {
    const steps = computeSteps(dividend, divisor)
    return { problem: { dividend, divisor, steps }, error: null }
  } catch (err) {
    return { problem: null, error: err instanceof Error ? err.message : String(err) }
  }
}

export default function DhvajankaPage() {
  const initial = useMemo(() => solve(5428, 35), [])
  const [problem, setProblem] = useState<Problem | null>(initial.problem)
  const [error, setError] = useState<string | null>(initial.error)
  const [cur, setCur] = useState(0)

  function handleSolve(dividend: number, divisor: number) {
    const result = solve(dividend, divisor)
    setProblem(result.problem)
    setError(result.error)
    setCur(0)
  }

  const total = problem?.steps.length ?? 0
  const clamp = (i: number) => Math.min(Math.max(i, 0), total - 1)

  const working = problem ? Math.floor(problem.divisor / 10) : 0
  const flag = problem ? problem.divisor % 10 : 0
  const digits = problem ? String(problem.dividend).split('').map(Number) : []

  return (
    <>
      <InputForm onSolve={handleSolve} />

      {error && <ErrorBanner message={error} />}

      {problem && (
        <>
          <DivisorCard working={working} flag={flag} flagFires={problem.steps[cur].flagFires} />
          <DigitBoard
            digits={digits}
            step={problem.steps[cur]}
            onBack={() => setCur((c) => clamp(c - 1))}
            onNext={() => setCur((c) => clamp(c + 1))}
            isFirst={cur === 0}
            isLast={cur === total - 1}
          />
          <NavControls cur={cur} total={total} onDot={(i) => setCur(clamp(i))} />
          <StepPanel steps={problem.steps} cur={cur} />
        </>
      )}

      <MethodRules />
    </>
  )
}
