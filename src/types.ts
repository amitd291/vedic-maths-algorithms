export type CalcLine =
  | { kind: 'calc'; label: string; value: string } // .co + .cn
  | { kind: 'result'; label: string; value: string } // .ch highlighted chip
  | { kind: 'note'; tone: 'warn' | 'success'; text: string }

// Common shape every method's steps share: a title and the narrative lines
// rendered in StepPanel. Board-specific state (digit highlighting, column
// totals, etc.) is method-specific and lives on top of this.
export interface StepBase {
  title: string
  lines: CalcLine[]
}

export interface Step extends StepBase {
  done: number[] // digit-box indices -> green
  active: number[] // digit-box indices -> amber
  quotientDigits: (number | null)[] // null = not revealed
  r: number | null
  carry: number | null
  flagFires: boolean // true when this step's ND actually subtracts flag × previous quotient digit
  phase?: 'raw' | 'adjusted' // set on the two steps an overshoot digit is split into; absent otherwise
}

export type BaseMethodColumnKind = 'lhs' | 'rhs'

export interface BaseMethodColumn {
  kind: BaseMethodColumnKind
  digit: number // original dividend digit at this column
  contributions: number[] // indexed by source LHS digit (row = Q1, Q2, …); holes where that digit's multiply never reached this column
  total: number | null // revealed once this column is finalized
  colState: '' | 'active' | 'done'
}

export interface BaseMethodStep extends StepBase {
  cols: BaseMethodColumn[]
  connectors: boolean[] // length cols.length - 1; whether the arrow between col i and i+1 is lit this step
}
