import { useEffect } from 'react'
import type { Method } from './MethodNav'

const METHOD_TITLES: Record<Method, string> = {
  dhvajanka: 'Dhvajanka Division',
  base: 'Base Method Division',
}

interface HeaderProps {
  method: Method
}

export default function Header({ method }: HeaderProps) {
  const title = METHOD_TITLES[method]

  useEffect(() => {
    document.title = `${title} — Vedic Maths`
  }, [title])

  return (
    <header className="app-header">
      <h1>{title}</h1>
      <p className="subtitle">Interactive step-by-step walkthroughs</p>
    </header>
  )
}
