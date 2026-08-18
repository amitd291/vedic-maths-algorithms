import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useStepNav } from './useStepNav'

describe('useStepNav', () => {
  it('starts at step 0', () => {
    const { result } = renderHook(() => useStepNav(3))
    expect(result.current.cur).toBe(0)
    expect(result.current.isFirst).toBe(true)
    expect(result.current.isLast).toBe(false)
  })

  it('advances and retreats with onNext/onBack', () => {
    const { result } = renderHook(() => useStepNav(3))

    act(() => result.current.onNext())
    expect(result.current.cur).toBe(1)

    act(() => result.current.onBack())
    expect(result.current.cur).toBe(0)
  })

  it('clamps at both ends', () => {
    const { result } = renderHook(() => useStepNav(2))

    act(() => result.current.onBack())
    expect(result.current.cur).toBe(0)

    act(() => result.current.onNext())
    act(() => result.current.onNext())
    expect(result.current.cur).toBe(1)
    expect(result.current.isLast).toBe(true)
  })

  it('jumps to a clamped index with onDot', () => {
    const { result } = renderHook(() => useStepNav(5))

    act(() => result.current.onDot(3))
    expect(result.current.cur).toBe(3)

    act(() => result.current.onDot(99))
    expect(result.current.cur).toBe(4)
  })

  it('exposes setCur for external resets', () => {
    const { result } = renderHook(() => useStepNav(5))

    act(() => result.current.onNext())
    act(() => result.current.setCur(0))
    expect(result.current.cur).toBe(0)
  })
})
