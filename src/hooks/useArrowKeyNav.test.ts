import { describe, it, expect, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useArrowKeyNav } from './useArrowKeyNav'

describe('useArrowKeyNav', () => {
  it('calls onBack/onNext on ArrowLeft/ArrowRight', () => {
    const onBack = vi.fn()
    const onNext = vi.fn()
    renderHook(() => useArrowKeyNav(onBack, onNext))

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onBack).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('ignores ArrowLeft/ArrowRight fired while focus is inside a form field', () => {
    const onBack = vi.fn()
    const onNext = vi.fn()
    renderHook(() => useArrowKeyNav(onBack, onNext))

    const input = document.createElement('input')
    document.body.appendChild(input)

    fireEvent.keyDown(input, { key: 'ArrowRight' })
    fireEvent.keyDown(input, { key: 'ArrowLeft' })
    expect(onNext).not.toHaveBeenCalled()
    expect(onBack).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('ignores other keys', () => {
    const onBack = vi.fn()
    const onNext = vi.fn()
    renderHook(() => useArrowKeyNav(onBack, onNext))

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onBack).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('removes the listener on unmount', () => {
    const onBack = vi.fn()
    const onNext = vi.fn()
    const { unmount } = renderHook(() => useArrowKeyNav(onBack, onNext))

    unmount()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNext).not.toHaveBeenCalled()
  })

  it('rebinds to updated callbacks', () => {
    const onBack = vi.fn()
    const onNextA = vi.fn()
    const onNextB = vi.fn()
    const { rerender } = renderHook(({ onNext }) => useArrowKeyNav(onBack, onNext), {
      initialProps: { onNext: onNextA },
    })

    rerender({ onNext: onNextB })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNextA).not.toHaveBeenCalled()
    expect(onNextB).toHaveBeenCalledTimes(1)
  })
})
