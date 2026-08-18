import type { BaseMethodStep } from '../types'
import { solveBaseMethod } from './baseMethodMath'
import { buildBaseMethodSteps } from './baseMethodNarration'

export { nearestBase } from './baseMethodMath'

/**
 * Computes the Base Method / Paravartya division walkthrough for
 * `dividend ÷ divisor`. See `baseMethodMath.ts` (the calculation) and
 * `baseMethodNarration.ts` (the step-by-step narration built from it) for
 * how it works.
 */
export function computeBaseMethodSteps(dividend: number, divisor: number): BaseMethodStep[] {
  const solution = solveBaseMethod(dividend, divisor)
  return buildBaseMethodSteps(dividend, divisor, solution)
}
