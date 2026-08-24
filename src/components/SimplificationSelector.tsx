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
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const plainBase = nearestBase(divisor)
  const plainDiff = plainBase - divisor
  const candidates = findScalingCandidates(divisor)

  if (isDifferenceFriendly(plainDiff, plainBase) || candidates.length === 0) {
    return null
  }

  const handlePlainClick = () => {
    setSelectedKey('plain')
    onSelect(null)
    setExpanded(false)
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
    if (selectedKey === 'plain') {
      return '✓ Plain selected'
    }
    const candidate = candidates.find((c) => selectedKey === `${c.direction}-${c.k}`)
    if (candidate) {
      const op = candidate.direction === 'multiply' ? '×' : '÷'
      return `✓ Scaled divisor ${candidate.scaledDivisor} (${divisor} ${op} ${candidate.k}) selected`
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
          <button
            type="button"
            className={`simplification-option plain-option${selectedKey === 'plain' ? ' selected' : ''}`}
            onClick={handlePlainClick}
          >
            <div className="simplification-option-head">
              <span className="simplification-option-name">Plain</span>
              <span className="simplification-option-tag">diff {plainDiff}</span>
            </div>
            <div className="simplification-option-line combined">
              Base: <b>{plainBase}</b> | Difference: <b>{plainDiff}</b>
            </div>
          </button>

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
                    <b className="simplification-option-result">{candidate.scaledDivisor}</b> – Scaled {op}{candidate.k} ({divisor} {op} {candidate.k})
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
