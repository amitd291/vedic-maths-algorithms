import { useMemo, useState } from 'react'
import BaseMethodDivisorCard from '../components/BaseMethodDivisorCard'
import BaseMethodDigitBoard from '../components/BaseMethodDigitBoard'
import BaseMethodRules from '../components/BaseMethodRules'
import StepPanel from '../components/StepPanel'
import NavControls from '../components/NavControls'
import { computeBaseMethodSteps, nearestBase } from '../lib/computeBaseMethodSteps'
import { useStepNav } from '../hooks/useStepNav'

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

export default function BaseMethodPage() {
  const [dividend, setDividend] = useState(BASE_DIVIDEND)
  const [divisor, setDivisor] = useState(BASE_DIVISOR)
  const steps = useMemo(() => computeBaseMethodSteps(dividend, divisor), [dividend, divisor])
  const base = nearestBase(divisor)
  const difference = base - divisor
  const total = steps.length
  const { cur, setCur, isFirst, isLast, onBack, onNext, onDot } = useStepNav(total)

  const onSelectExample = (value: string) => {
    const [d, n] = value.split('/').map(Number)
    setDividend(d)
    setDivisor(n)
    setCur(0)
  }

  return (
    <>
      {import.meta.env.MODE === 'development' && (
        <div className="problem-badge-row">
          <select
            aria-label="Dev example picker"
            value={`${dividend}/${divisor}`}
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
      <div className="problem-badge-row">
        <span className="problem-badge">{dividend} ÷ {divisor}</span>
      </div>
      <BaseMethodDivisorCard base={base} difference={difference} />
      <BaseMethodDigitBoard step={steps[cur]} onBack={onBack} onNext={onNext} isFirst={isFirst} isLast={isLast} />
      <NavControls cur={cur} total={total} onDot={onDot} />
      <StepPanel steps={steps} cur={cur} />
      <BaseMethodRules />
    </>
  )
}
