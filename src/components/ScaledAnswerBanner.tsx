interface DescaleRowProps {
  divisor: number
  quotient: number
  remainder: number
}

export default function DescaleRow({ divisor, quotient, remainder }: DescaleRowProps) {
  return (
    <div className="descale-row">
      <span className="descale-row-label">Real answer (÷ {divisor})</span>
      <span className="descale-row-value">{quotient} | {remainder}</span>
    </div>
  )
}
