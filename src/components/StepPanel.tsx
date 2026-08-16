import type { StepBase } from '../types'
import { CalcLineView } from './CalcPrimitives'

interface StepPanelProps {
  steps: StepBase[]
  cur: number
}

export default function StepPanel({ steps, cur }: StepPanelProps) {
  return (
    <div className="step-panel">
      <div className="step-stack">
        {steps.map((step, i) => {
          const isActive = i === cur
          return (
            <div key={i} aria-hidden={!isActive} inert={!isActive || undefined}>
              <h2 className="step-title">{step.title}</h2>
              <div className="step-content">
                {step.lines.map((line, j) => (
                  <CalcLineView key={j} line={line} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
