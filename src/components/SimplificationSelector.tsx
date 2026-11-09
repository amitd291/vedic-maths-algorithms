import { useState } from 'react'
import type { SimplificationCandidate } from '../lib/baseMethodMath'
import {
  findSimplificationCandidates,
  formatDigitList,
  formatSigned,
  formatSubstitution,
  nearestBase,
} from '../lib/baseMethodMath'

interface SimplificationSelectorProps {
  divisor: number
  onSelect: (candidate: SimplificationCandidate) => void
}

function candidateKey(candidate: SimplificationCandidate): string {
  return candidate.kind === 'substitution' ? 'substitution' : `${candidate.direction}-${candidate.k}`
}

export default function SimplificationSelector({
  divisor,
  onSelect,
}: SimplificationSelectorProps) {
  const [expanded, setExpanded] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const plainDiff = nearestBase(divisor) - divisor
  const candidates = findSimplificationCandidates(divisor)

  if (candidates.length === 0) {
    return null
  }

  const handleCandidateClick = (candidate: SimplificationCandidate) => {
    setSelectedKey(candidateKey(candidate))
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
    const candidate = candidates.find((c) => selectedKey === candidateKey(c))
    if (candidate?.kind === 'substitution') {
      return `✓ ${formatDigitList(candidate.digits)}: Substituted difference (${formatSigned(candidate.difference)})`
    }
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
            The plain difference (<b>{formatSigned(plainDiff)}</b>) isn't simple to calculate with. Pick how to simplify.
            <br />
            Note that only one option is ever applied.
          </div>

          {candidates.map((candidate) => {
            const key = candidateKey(candidate)
            const selected = selectedKey === key ? ' selected' : ''
            if (candidate.kind === 'substitution') {
              const derivation =
                candidate.difference < 0
                  ? `${formatSigned(candidate.difference)} = −(${formatSubstitution(candidate.digits)})`
                  : `${candidate.difference} = ${formatSubstitution(candidate.digits)}`
              return (
                <button
                  key={key}
                  type="button"
                  className={`simplification-option substituted-option${selected}`}
                  onClick={() => handleCandidateClick(candidate)}
                >
                  <div className="simplification-option-head">
                    <span className="simplification-option-name">
                      <b className="simplification-option-result">{formatDigitList(candidate.digits)}: </b> Substituted difference ({formatSigned(candidate.difference)})
                    </span>
                  </div>
                  <div className="simplification-option-line combined">
                    Base: <b>{candidate.base}</b> | Difference: <b>{derivation}</b>
                  </div>
                </button>
              )
            }
            const op = candidate.direction === 'multiply' ? '×' : '÷'
            return (
              <button
                key={key}
                type="button"
                className={`simplification-option scaled-option scaled-${candidate.direction}${selected}`}
                onClick={() => handleCandidateClick(candidate)}
              >
                <div className="simplification-option-head">
                  <span className="simplification-option-name">
                    <b className="simplification-option-result">{candidate.scaledDivisor}: </b> Scaled divisor ({divisor} {op} {candidate.k})
                  </span>
                </div>
                <div className="simplification-option-line combined">
                  Base: <b>{candidate.base}</b> | Difference: <b>{formatSigned(candidate.difference)}</b>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
