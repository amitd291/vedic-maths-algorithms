import { useEffect } from 'react'

/** Global ArrowLeft/ArrowRight step navigation shared by the digit boards. */
export function useArrowKeyNav(onBack: () => void, onNext: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target
      if (target instanceof Element && target.closest('input, textarea, select')) return
      if (e.key === 'ArrowLeft') onBack()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, onNext])
}
