import { Fragment, useEffect } from 'react'
import type { BaseMethodStep } from '../types'

interface BaseMethodDigitBoardProps {
  step: BaseMethodStep
  onBack: () => void
  onNext: () => void
  isFirst: boolean
  isLast: boolean
}

export default function BaseMethodDigitBoard({ step, onBack, onNext, isFirst, isLast }: BaseMethodDigitBoardProps) {
  const maxContributions = Math.max(1, ...step.cols.map((c) => c.contributions.length))

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') onBack()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, onNext])

  return (
    <div className="digit-board">
      <button type="button" className="arrow-btn" aria-label="Previous step" onClick={onBack} disabled={isFirst}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </button>

      <div className="digit-board-cols">
        <div className="board-row">
          {step.cols.map((col, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <div className="board-connector">
                  <span className={`connector-arrow${step.connectors[i - 1] ? ' show' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="4" x2="18" y2="18" />
                      <polyline points="10 18 18 18 18 10" />
                    </svg>
                  </span>
                </div>
              )}
              <div className={`board-col${col.kind === 'rhs' && i > 0 && step.cols[i - 1].kind === 'lhs' ? ' rhs-first' : ''}`}>
                <span className="col-label">{col.kind}</span>
                <div className={`digit-box${col.colState ? ` ${col.colState}` : ''}`}>{col.digit}</div>
                <div className="contributions">
                  {Array.from({ length: maxContributions }, (_, j) => {
                    const value = col.contributions[j]
                    return (
                      <span key={j} className={`contribution-chip${value === undefined ? ' placeholder' : ''}`}>
                        {value === undefined ? '0' : value < 0 ? `−${-value}` : `+${value}`}
                      </span>
                    )
                  })}
                </div>
                <hr className={`col-divider${col.total !== null ? ' show' : ''}`} />
                <div className={`total-slot${col.total !== null ? ` show ${col.colState === 'done' ? 'done' : col.kind}` : ''}`}>
                  {col.total !== null ? col.total : ''}
                </div>
              </div>
            </Fragment>
          ))}
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
