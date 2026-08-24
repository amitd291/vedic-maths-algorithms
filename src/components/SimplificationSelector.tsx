import { useState } from 'react'
import type { ScalingCandidate } from '../lib/baseMethodMath'
import {
  findScalingCandidates,
  nearestBase,
  isDifferenceFriendly,
} from '../lib/baseMethodMath'

interface SimplificationSelectorProps {
  divisor: number
  onSelect: (candidate: ScalingCandidate | null) => void
}

export default function SimplificationSelector({
  divisor,
  onSelect,
}: SimplificationSelectorProps) {
  const [expanded, setExpanded] = useState(true)

  const plainBase = nearestBase(divisor)
  const plainDiff = plainBase - divisor
  const candidates = findScalingCandidates(divisor)

  if (isDifferenceFriendly(plainDiff, plainBase) || candidates.length === 0) {
    return null
  }

  const handlePlainClick = () => {
    onSelect(null)
    setExpanded(false)
  }

  const handleCandidateClick = (candidate: ScalingCandidate) => {
    onSelect(candidate)
    setExpanded(false)
  }

  const handleToggle = () => {
    setExpanded(!expanded)
  }

  return (
    <div className="simplification-selector">
      <div
        className="simplification-toggle"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
      >
        <svg className="chevron" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
        How should this be simplified?
      </div>

      {expanded && (
        <div className="simplification-options">
          <button type="button" className="simplification-option plain-option" onClick={handlePlainClick}>
            <div className="simplification-option-head">
              <span className="simplification-option-name">Plain</span>
              <span className="simplification-option-tag">diff {plainDiff}</span>
            </div>
            <div className="simplification-option-line"><span>Base</span><span>{plainBase}</span></div>
            <div className="simplification-option-line"><span>Difference</span><span>{plainDiff}</span></div>
          </button>

          {candidates.map((candidate) => (
            <button
              key={`${candidate.direction}-${candidate.k}`}
              type="button"
              className={`simplification-option scaled-option scaled-${candidate.direction}`}
              onClick={() => handleCandidateClick(candidate)}
            >
              <div className="simplification-option-head">
                <span className="simplification-option-name">
                  Scaled {candidate.direction === 'multiply' ? '×' : '÷'}{candidate.k}
                </span>
                <span className="simplification-option-tag">
                  {divisor} {candidate.direction === 'multiply' ? '×' : '÷'} {candidate.k} = {candidate.scaledDivisor}
                </span>
              </div>
              <div className="simplification-option-line"><span>Base</span><span>{candidate.base}</span></div>
              <div className="simplification-option-line"><span>Difference</span><span>{candidate.difference}</span></div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
