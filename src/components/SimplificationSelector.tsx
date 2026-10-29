import { useState } from 'react'
import type { ScalingCandidate } from '../lib/baseMethodMath'
import {
  findScalingCandidates,
  nearestBase,
  needsSimplification,
} from '../lib/baseMethodMath'

interface SimplificationSelectorProps {
  divisor: number
  onSelect: (candidate: ScalingCandidate) => void
}

export default function SimplificationSelector({
  divisor,
  onSelect,
}: SimplificationSelectorProps) {
  const [expanded, setExpanded] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const plainDiff = nearestBase(divisor) - divisor
  const candidates = findScalingCandidates(divisor)

  if (!needsSimplification(divisor)) {
    return null
  }

  const handleCandidateClick = (candidate: ScalingCandidate) => {
    setSelectedKey(`${candidate.direction}-${candidate.k}`)
    onSelect(candidate)
    setExpanded(false)
  }

  const handleToggle = () => {
    setExpanded(!expanded)
  }

  const getToggleLabel = () => {
    if (selectedKey === null) {
      return 'How should this be simplified?'
    }
    const candidate = candidates.find((c) => selectedKey === `${c.direction}-${c.k}`)
    if (candidate) {
      const op = candidate.direction === 'multiply' ? '×' : '÷'
      return `✓ ${candidate.scaledDivisor}: Scaled divisor (${divisor} ${op} ${candidate.k})`
    }
    return 'How should this be simplified?'
  }

  return (
    <div className="simplification-selector">
      <div
        className={`simplification-toggle${selectedKey !== null ? ' selected' : ''}`}
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
        {getToggleLabel()}
      </div>

      {expanded && (
        <div className="simplification-options">
          <div className="select-intro">
            The plain difference (<b>{plainDiff}</b>) isn't simple to calculate with. Pick how to simplify.
            <br />
            Note that only one option is ever applied.
          </div>

          {candidates.map((candidate) => {
            const op = candidate.direction === 'multiply' ? '×' : '÷'
            const candidateKey = `${candidate.direction}-${candidate.k}`
            return (
              <button
                key={candidateKey}
                type="button"
                className={`simplification-option scaled-option scaled-${candidate.direction}${selectedKey === candidateKey ? ' selected' : ''}`}
                onClick={() => handleCandidateClick(candidate)}
              >
                <div className="simplification-option-head">
                  <span className="simplification-option-name">
                    <b className="simplification-option-result">{candidate.scaledDivisor}: </b> Scaled divisor ({divisor} {op} {candidate.k})
                  </span>
                </div>
                <div className="simplification-option-line combined">
                  Base: <b>{candidate.base}</b> | Difference: <b>{candidate.difference}</b>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
