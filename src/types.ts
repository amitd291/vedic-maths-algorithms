export type CalcLine =
  | { kind: 'calc'; label: string; value: string } // .co + .cn
  | { kind: 'result'; label: string; value: string } // .ch highlighted chip
  | { kind: 'note'; tone: 'warn' | 'success'; text: string }

export interface Step {
  title: string
  done: number[] // digit-box indices -> green
  active: number[] // digit-box indices -> amber
  quotientDigits: (number | null)[] // null = not revealed
  r: number | null
  carry: number | null
  lines: CalcLine[]
  flagFires: boolean // true when this step's ND actually subtracts flag × previous quotient digit
  phase?: 'raw' | 'adjusted' // set on the two steps an overshoot digit is split into; absent otherwise
}
