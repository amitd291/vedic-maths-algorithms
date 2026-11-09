import { formatDigitList, formatSigned } from '../lib/baseMethodMath'

interface BaseMethodDivisorCardProps {
  base: number | null
  difference: number | null
  substituted?: number[] | null
}

export default function BaseMethodDivisorCard({ base, difference, substituted }: BaseMethodDivisorCardProps) {
  return (
    <div className="divisor-card">
      <div className="divisor-col">
        <span className="divisor-label">base</span>
        <span className="divisor-digit">{base ?? '—'}</span>
      </div>
      <div className="divisor-separator" />
      <div className="divisor-col">
        <span className="divisor-label">difference</span>
        <span className="divisor-digit divisor-digit-diff">{difference === null ? '—' : formatSigned(difference)}</span>
      </div>
      {substituted && (
        <>
          <div className="divisor-separator" />
          <div className="divisor-col">
            <span className="divisor-label">substituted</span>
            <span className="divisor-digit divisor-digit-subst">{formatDigitList(substituted)}</span>
          </div>
        </>
      )}
    </div>
  )
}
