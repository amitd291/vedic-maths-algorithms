import { useState } from 'react'

export type Method = 'dhvajanka' | 'base'

const METHODS: { id: Method; label: string; sub: string }[] = [
  { id: 'base', label: 'Base Method', sub: '+ Paravartya' },
  { id: 'dhvajanka', label: 'Dhvajanka', sub: 'flag method' },
]

interface MethodNavProps {
  method: Method
  onSelect: (method: Method) => void
}

export default function MethodNav({ method, onSelect }: MethodNavProps) {
  const [open, setOpen] = useState(false)

  function select(next: Method) {
    onSelect(next)
    setOpen(false)
  }

  return (
    <>
      <div className="topbar">
        <button
          type="button"
          className="menu-btn"
          aria-label="Open method menu"
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="topbar-brand">
          Vedic Maths
          <div className="topbar-brand-sub">Division methods</div>
        </div>
      </div>

      <div className={`sidebar-scrim${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <aside id="sidebar" className={`sidebar${open ? ' open' : ''}`} aria-label="Division methods">
        <nav className="sidebar-nav" role="tablist" aria-label="Division method">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`sidebar-link${m.id === method ? ' active' : ''}`}
              role="tab"
              aria-selected={m.id === method}
              onClick={() => select(m.id)}
            >
              {m.label}
              <span className="sidebar-link-sub">{m.sub}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
