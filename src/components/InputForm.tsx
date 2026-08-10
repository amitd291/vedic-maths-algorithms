import { useState } from 'react'

interface InputFormProps {
  onSolve: (dividend: number, divisor: number) => void
}

const DEFAULT_DIVIDEND = '5428'
const DEFAULT_DIVISOR = '35'

function validateDividend(raw: string): string | null {
  if (raw.trim() === '') return 'Enter a dividend.'
  const n = Number(raw)
  if (!Number.isInteger(n)) return 'Dividend must be a whole number.'
  if (n < 1 || n > 9999) return 'Dividend must be between 1 and 9999.'
  return null
}

function validateDivisor(raw: string): string | null {
  if (raw.trim() === '') return 'Enter a divisor.'
  const n = Number(raw)
  if (!Number.isInteger(n)) return 'Divisor must be a whole number.'
  if (n < 10 || n > 99) return 'Divisor must be a two-digit number (10-99).'
  return null
}

export default function InputForm({ onSolve }: InputFormProps) {
  const [dividend, setDividend] = useState(DEFAULT_DIVIDEND)
  const [divisor, setDivisor] = useState(DEFAULT_DIVISOR)
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
    <form className="input-form" onSubmit={handleSubmit}>
      <div className="input-field">
        <label htmlFor="dividend-input">Dividend</label>
        <input
          id="dividend-input"
          type="number"
          min={1}
          max={9999}
          value={dividend}
          onChange={(e) => setDividend(e.target.value)}
          aria-invalid={dividendError !== null}
          aria-describedby={dividendError ? 'dividend-error' : undefined}
        />
        {dividendError && (
          <span className="field-error" id="dividend-error">
            {dividendError}
          </span>
        )}
      </div>

      <span className="input-divide-sign">÷</span>

      <div className="input-field">
        <label htmlFor="divisor-input">Divisor</label>
        <input
          id="divisor-input"
          type="number"
          min={10}
          max={99}
          value={divisor}
          onChange={(e) => setDivisor(e.target.value)}
          aria-invalid={divisorError !== null}
          aria-describedby={divisorError ? 'divisor-error' : undefined}
        />
        {divisorError && (
          <span className="field-error" id="divisor-error">
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
