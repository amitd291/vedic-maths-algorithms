import { useState } from 'react'

/** Clamped step-index navigation shared by the Dhvajanka and Base Method pages. */
export function useStepNav(total: number) {
  const [cur, setCur] = useState(0)
  const clamp = (i: number) => Math.min(Math.max(i, 0), total - 1)

  return {
    cur,
    setCur,
    isFirst: cur === 0,
    isLast: cur === total - 1,
    onBack: () => setCur((c) => clamp(c - 1)),
    onNext: () => setCur((c) => clamp(c + 1)),
    onDot: (i: number) => setCur(clamp(i)),
  }
}
