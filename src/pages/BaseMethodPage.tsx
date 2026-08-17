import { useMemo, useState } from 'react'
import BaseMethodDivisorCard from '../components/BaseMethodDivisorCard'
import BaseMethodDigitBoard from '../components/BaseMethodDigitBoard'
import BaseMethodRules from '../components/BaseMethodRules'
import StepPanel from '../components/StepPanel'
import NavControls from '../components/NavControls'
import { computeBaseMethodSteps, nearestBase } from '../lib/computeBaseMethodSteps'

const BASE_DIVIDEND = 10030
const BASE_DIVISOR = 827

export default function BaseMethodPage() {
  const steps = useMemo(() => computeBaseMethodSteps(BASE_DIVIDEND, BASE_DIVISOR), [])
  const base = nearestBase(BASE_DIVISOR)
  const difference = base - BASE_DIVISOR
  const [cur, setCur] = useState(0)

  const total = steps.length
  const clamp = (i: number) => Math.min(Math.max(i, 0), total - 1)

  return (
    <>
      <div className="problem-badge-row">
        <span className="problem-badge">{BASE_DIVIDEND} ÷ {BASE_DIVISOR}</span>
      </div>
      <BaseMethodDivisorCard base={base} difference={difference} />
      <BaseMethodDigitBoard
        step={steps[cur]}
        onBack={() => setCur((c) => clamp(c - 1))}
        onNext={() => setCur((c) => clamp(c + 1))}
        isFirst={cur === 0}
        isLast={cur === total - 1}
      />
      <NavControls cur={cur} total={total} onDot={(i) => setCur(clamp(i))} />
      <StepPanel steps={steps} cur={cur} />
      <BaseMethodRules />
    </>
  )
}
