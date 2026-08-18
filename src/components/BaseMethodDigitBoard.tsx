import { Fragment } from 'react'
import type { BaseMethodStep } from '../types'
import { useArrowKeyNav } from '../hooks/useArrowKeyNav'

function signed(delta: number): string {
  return delta < 0 ? `− ${-delta}` : `+ ${delta}`
}

interface BaseMethodDigitBoardProps {
  step: BaseMethodStep
  onBack: () => void
  onNext: () => void
  isFirst: boolean
  isLast: boolean
}

export default function BaseMethodDigitBoard({ step, onBack, onNext, isFirst, isLast }: BaseMethodDigitBoardProps) {
  const maxContributions = Math.max(1, ...step.cols.map((c) => c.contributions.length))
  const carries = step.carries ?? []
  const carryFor = (colIndex: number) => carries.find((c) => c.fromCol === colIndex || c.toCol === colIndex)

  useArrowKeyNav(onBack, onNext)

  return (
    <div className="digit-board">
      <button type="button" className="arrow-btn" aria-label="Previous step" onClick={onBack} disabled={isFirst}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </button>

      <div className="digit-board-cols">
        <div className="board-row">
          {step.cols.map((col, i) => {
            const carry = carryFor(i)
            const carryGap = carries.find((c) => c.toCol === i - 1 && c.fromCol === i)
            return (
              <Fragment key={i}>
                {i > 0 && (
                  <div className="board-connector">
                    <span className={`connector-arrow${step.connectors[i - 1] ? ' show' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="4" x2="18" y2="18" />
                        <polyline points="10 18 18 18 18 10" />
                      </svg>
                    </span>
                    <span className={`carry-connector${carryGap ? ' show' : ''}`}>
                      {carryGap && carryGap.amount < 0 ? (
                        // Borrow: value flows right, from toCol into fromCol.
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="6" y1="12" x2="20" y2="12" />
                          <polyline points="13 6 19 12 13 18" />
                        </svg>
                      ) : (
                        // Carry: value flows left, from fromCol into toCol.
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="20" y1="12" x2="6" y2="12" />
                          <polyline points="11 6 5 12 11 18" />
                        </svg>
                      )}
                      {carryGap && <span>{Math.abs(carryGap.amount)}</span>}
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
                  <div className={`carry-chip${carry ? ' show' : ''}`}>
                    {carry ? signed(carry.fromCol === i ? -10 * carry.amount : carry.amount) : ''}
                  </div>
                </div>
              </Fragment>
            )
          })}
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
