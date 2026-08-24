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
      >
        How should this be simplified?
      </div>

      {expanded && (
        <div className="simplification-options">
          <button
            className="simplification-option plain-option"
            onClick={handlePlainClick}
            type="button"
          >
            Plain (diff {plainDiff})
          </button>

          {candidates.map((candidate) => (
            <button
              key={`${candidate.direction}-${candidate.k}`}
              className={`simplification-option scaled-option scaled-${candidate.direction}`}
              onClick={() => handleCandidateClick(candidate)}
              type="button"
            >
              Scaled {candidate.direction === 'multiply' ? '×' : '÷'}
              {candidate.k} (diff {candidate.difference})
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
