import type { Step } from '../types'
import { useArrowKeyNav } from '../hooks/useArrowKeyNav'

interface DigitBoardProps {
  digits: number[]
  step: Step
  onBack: () => void
  onNext: () => void
  isFirst: boolean
  isLast: boolean
}

export default function DigitBoard({ digits, step, onBack, onNext, isFirst, isLast }: DigitBoardProps) {
  const quotientLabels = step.quotientDigits.map((_, i) => `Q${i + 1}`)

  useArrowKeyNav(onBack, onNext)

  return (
    <div className="digit-board">
      <button type="button" className="arrow-btn" aria-label="Previous step" onClick={onBack} disabled={isFirst}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </button>

      <div className="digit-board-cols">
        <div className="digit-row">
          {digits.map((digit, i) => {
            const isActive = step.active.includes(i)
            const isDone = step.done.includes(i)
            const cls = ['digit-box', isActive ? 'active' : '', isDone ? 'done' : '']
              .filter(Boolean)
              .join(' ')
            return (
              <div key={i} className={cls}>
                {digit}
              </div>
            )
          })}
        </div>

        <hr className="digit-divider" />

        <div className="quotient-row">
          {step.quotientDigits.map((value, i) => {
            const isRaw = step.phase === 'raw' && step.active.includes(i)
            const tone = value === null ? '' : isRaw ? ' show-raw' : ' show'
            return (
              <div key={i} className={`quotient-slot${tone}`}>
                {value !== null ? value : quotientLabels[i]}
              </div>
            )
          })}
          <div className={`quotient-slot${step.r !== null ? ' show-rem' : ''}`}>
            {step.r !== null ? step.r : 'R'}
          </div>
        </div>

        <div
          className={`carry-badge${step.carry !== null ? ' show' : ''}${step.phase === 'raw' ? ' show-raw' : ''}`}
        >
          carry → {step.carry ?? 0}
        </div>
      </div>

      <button type="button" className="arrow-btn" aria-label="Next step" onClick={onNext} disabled={isLast}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
    </div>
  )
}
