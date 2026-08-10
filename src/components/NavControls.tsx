interface NavControlsProps {
  cur: number
  total: number
  onDot: (i: number) => void
}

export default function NavControls({ cur, total, onDot }: NavControlsProps) {
  return (
    <div className="nav-controls">
      <span className="step-counter">
        {cur + 1} / {total}
      </span>
      <div className="dot-row">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`dot${i === cur ? ' current' : ''}`}
            onClick={() => onDot(i)}
          />
        ))}
      </div>
    </div>
  )
}
