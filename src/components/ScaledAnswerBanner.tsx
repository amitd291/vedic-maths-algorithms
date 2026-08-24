interface ScaledAnswerBannerProps {
  divisor: number
  quotient: number
  remainder: number
}

export default function ScaledAnswerBanner({ divisor, quotient, remainder }: ScaledAnswerBannerProps) {
  return (
    <div className="scaled-answer">
      <span className="scaled-answer-label">Real answer (÷ {divisor})</span>
      <span className="scaled-answer-value">{quotient} | {remainder}</span>
    </div>
  )
}
