import type { CalcLine } from '../types'

export function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="calc-line">
      <span className="co">{label}</span>
      <span className="cn">{value}</span>
    </div>
  )
}

export function ResultChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="calc-line">
      <span className="co">{label}</span>
      <span className="ch">{value}</span>
    </div>
  )
}

export function Note({ tone, text }: { tone: 'warn' | 'success'; text: string }) {
  const cls = tone === 'warn' ? 'warn-note' : 'success-note'
  return <div className={cls}>{text}</div>
}

export function CalcLineView({ line }: { line: CalcLine }) {
  switch (line.kind) {
    case 'calc':
      return <CalcRow label={line.label} value={line.value} />
    case 'result':
      return <ResultChip label={line.label} value={line.value} />
    case 'note':
      return <Note tone={line.tone} text={line.text} />
  }
}
