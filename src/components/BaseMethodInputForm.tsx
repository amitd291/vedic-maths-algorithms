import { useState } from 'react'

interface BaseMethodInputFormProps {
  onSolve: (dividend: number, divisor: number) => void
  initialDividend?: number
  initialDivisor?: number
}

function validateDividend(raw: string): string | null {
  if (raw.trim() === '') return 'Enter a dividend.'
  const n = Number(raw)
  if (!Number.isInteger(n)) return 'Dividend must be a whole number.'
  if (n < 1 || n > 99999) return 'Dividend must be between 1 and 99999.'
  return null
}

function validateDivisor(raw: string): string | null {
  if (raw.trim() === '') return 'Enter a divisor.'
  const n = Number(raw)
  if (!Number.isInteger(n)) return 'Divisor must be a whole number.'
  if (n < 1 || n > 999) return 'Divisor must be between 1 and 999.'
  return null
}

export default function BaseMethodInputForm({ onSolve, initialDividend = 10600, initialDivisor = 87 }: BaseMethodInputFormProps) {
  const [dividend, setDividend] = useState(String(initialDividend))
  const [divisor, setDivisor] = useState(String(initialDivisor))
  const [dividendError, setDividendError] = useState<string | null>(null)
  const [divisorError, setDivisorError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dErr = validateDividend(dividend)
    const vErr = validateDivisor(divisor)
    setDividendError(dErr)
    setDivisorError(vErr)
    if (dErr || vErr) return
    onSolve(Number(dividend), Number(divisor))
  }

  return (
    <form className="input-form" onSubmit={handleSubmit} noValidate>
      <div className="input-field">
        <label htmlFor="base-dividend-input">Dividend</label>
        <input
          id="base-dividend-input"
          type="number"
          min={1}
          max={99999}
          value={dividend}
          onChange={(e) => setDividend(e.target.value)}
          aria-invalid={dividendError !== null}
          aria-describedby={dividendError ? 'base-dividend-error' : undefined}
        />
        {dividendError && (
          <span className="field-error" id="base-dividend-error">
            {dividendError}
          </span>
        )}
      </div>

      <span className="input-divide-sign">÷</span>

      <div className="input-field">
        <label htmlFor="base-divisor-input">Divisor</label>
        <input
          id="base-divisor-input"
          type="number"
          min={1}
          max={999}
          value={divisor}
          onChange={(e) => setDivisor(e.target.value)}
          aria-invalid={divisorError !== null}
          aria-describedby={divisorError ? 'base-divisor-error' : undefined}
        />
        {divisorError && (
          <span className="field-error" id="base-divisor-error">
            {divisorError}
          </span>
        )}
      </div>

      <button type="submit" className="solve-button">
        Solve
      </button>
    </form>
  )
}
