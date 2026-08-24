import type { BaseMethodStep } from '../types'
import { solveBaseMethod, type ScalingCandidate } from './baseMethodMath'
import { buildBaseMethodSteps, buildScaledBaseMethodSteps } from './baseMethodNarration'

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

/**
 * Computes the scaled Base Method / Paravartya division walkthrough for
 * `dividend ÷ divisor` using a scaling candidate.
 */
export function computeScaledBaseMethodSteps(
  dividend: number,
  divisor: number,
  candidate: ScalingCandidate,
): BaseMethodStep[] {
  return buildScaledBaseMethodSteps(dividend, divisor, candidate)
}
