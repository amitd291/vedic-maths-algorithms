interface BaseMethodDivisorCardProps {
  base: number
  difference: number
}

export default function BaseMethodDivisorCard({ base, difference }: BaseMethodDivisorCardProps) {
  return (
    <div className="divisor-card">
      <div className="divisor-col">
        <span className="divisor-label">base</span>
        <span className="divisor-digit">{base}</span>
      </div>
      <div className="divisor-separator" />
      <div className="divisor-col">
        <span className="divisor-label">difference</span>
        <span className="divisor-digit divisor-digit-diff">{difference}</span>
      </div>
    </div>
  )
}
