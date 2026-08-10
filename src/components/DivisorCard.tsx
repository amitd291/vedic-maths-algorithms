interface DivisorCardProps {
  working: number
  flag: number
  flagFires: boolean
}

export default function DivisorCard({ working, flag, flagFires }: DivisorCardProps) {
  return (
    <div className="divisor-card">
      <div className="divisor-col">
        <span className="divisor-label">working</span>
        <span className="divisor-digit">{working}</span>
      </div>
      <div className="divisor-separator" />
      <div className="divisor-col">
        <span className="divisor-label">flag</span>
        <span className={`divisor-digit divisor-digit-flag${flagFires ? ' active' : ''}`}>
          {flag}
        </span>
      </div>
    </div>
  )
}
