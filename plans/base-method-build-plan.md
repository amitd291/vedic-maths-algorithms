# Base Method / Paravartya Division — Build Plan

Companion to `dhvajanka-build-plan.md`. Source: `base-method-division.pdf`
(ch. 15 Base Method, ch. 16 Paravartya). The book treats these as one
algorithm with a sign flip on the difference, so this plan builds a single
sign-generic engine rather than two separate ones.

## Method recap

- `base` = nearest power of 10 to the divisor, at least 10. `difference = base − divisor`.
  - `difference > 0` → Base Method (divisor's leading digit is high, e.g. 88 → base 100).
  - `difference < 0` → Paravartya (divisor sits just above the base, e.g. 113 → base 100).
- Dividend splits into LHS (quotient region, variable width) and RHS (fixed
  width = number of zeros in `base`).
- Bring down each LHS digit left to right; multiply it by `difference`;
  write the product diagonally under the next column(s) to the right; sum
  each column top-to-bottom (with carry) to get the next LHS digit or,
  for RHS columns, a component of the remainder.
- Final normalization: if the remainder is negative or ≥ divisor, adjust
  quotient by ∓1 and remainder by ±divisor.
- Base selection can tie (e.g. divisor 55 is equidistant between bases 10
  and 100). Any valid nearest base is fine; iteration F covers simplifying
  an unfriendly `difference` instead.
- Inputs: dividend 1..99999, divisor 1..999. The quotient must fit the
  board's LHS width (see "Out of scope").

Iteration B is scoped to single-digit `difference` and a 1-digit LHS to
prove the board first; iteration C generalizes to a multi-digit
`difference` (RHS carry cascade included) and adds the Paravartya sign
flip. Cascading carries across a multi-digit LHS and the full input
range are further generalized and tested in iteration D, ahead of the
dynamic-input iteration E, so v2 doesn't need a second engine rework.

## Reuse from the Dhvajanka codebase

Reused as-is: `Header`, `Footer`, `ErrorBanner`, `InputForm` pattern,
`NavControls`, keyboard nav, dot navigation, `StepPanel` + `CalcPrimitives`
(structured `CalcLine[]` rendering), the `Q×D+R===N` self-check pattern,
`global.css` tokens, Vite single-file build, Vitest setup.

New, not reused:
- `computeBaseMethodSteps` for this method — column/cross-multiplication engine,
  independent of the flag-subtraction logic.
- A new board component (now `BaseMethodDigitBoard`) — LHS/RHS split
  with diagonal contribution lines, replacing the single-carry-badge model.
- A new `DivisorCard`-equivalent — shows `base` / `difference` instead of
  `working` / `flag`.
- `Step` type gets a sibling shape (or a discriminated union) since a
  scalar `carry` doesn't fit column sums.

Per-iteration checklists live in `base-method-execution-plan.md`; the
summaries below are just enough to identify each iteration's scope and
example problem.

## Iteration A — app-level method selector (prerequisite)

Resolves the open item already flagged in `dhvajanka-execution-plan.md`. See
`base-method-execution-plan.md` Iteration A for the full checklist.

## Iteration B — v1 hardcoded example, Base Method only

Single hardcoded walkthrough, no user input, proving the column-board UI:
**divide 123 by 9** (base 10, difference 1, 2-digit LHS, 1-digit RHS —
single-digit difference but wide enough to exercise an internal LHS column
carry). See `base-method-execution-plan.md` Iteration B for the full
checklist.

## Iteration C — Generic logic & Paravartya sign variant

Generalizes the engine/board beyond iteration B's hardcode (multi-digit
`difference` fan-out, right-to-left carry, RHS overflow correction) via
**divide 10030 by 827**, and proves the Paravartya sign flip via **divide
1693 by 131** (see "Examples with steps" below for both) — see mockup
`plans/mockups/iteration-c-generic-logic-v1.html`. See
`base-method-execution-plan.md` Iteration C for the full checklist.

## Iteration D — LHS carry cascade + full-range coverage

Covers what iteration C's examples don't
exercise: cascading carries across a multi-digit LHS (worked example:
10600 ÷ 87 = 121 r73, see "Examples with steps" below), remainder correction
beyond a single subtraction, and unit tests across the full input range.
See `base-method-execution-plan.md` Iteration D for the full checklist.

## Iteration E — v2, dynamic inputs

Dividend/divisor input form, self-check, error banner, and unit tests
across the full input range, now that iteration D's engine is generalized.
See `base-method-execution-plan.md` Iteration E for the full checklist.

## Iteration F — smarter base selection

Goal: when the plain `difference` is awkward to multiply by, simplify it so
every multiplier used inside a step is a small digit (0–5). Two techniques:

- **Divisor scaling:** scale the divisor to a nearby multiple of a base
  (e.g. 5428 ÷ 35 via 35×3=105, or 12657 ÷ 791 via ÷7), solve, then descale
  the answer. Built.
- **Substitution:** rewrite the `difference` in a signed-digit form
  (e.g. 10030 ÷ 827's 173 → `2,−3,3`). Built.

Behaviour:

- Exactly one technique is applied per solve, never combined.
- Nothing is offered when the plain difference is already friendly.
- Otherwise the user picks from a generic candidate list; the board and
  steps stay hidden until a choice is made.

See "Examples with steps" below, "Decisions" for the base-selection rule, and
`base-method-execution-plan.md` Iteration F for the checklist and status.

## Decisions

### Heavy scaling candidates (iteration F)

**Decision: (a).** It removes the confusing case without losing the scaling
teaching examples, and substitution covers the divisors it empties. (b) was
not taken: only 19 divisors end up with a no-op option, and they still
follow the ordinary steps.

**Context.** `findScalingCandidates` accepts a candidate purely on "every
column part of its difference is 0-5". That is valid, but can offer a
candidate that is clearly heavier than the plain solve. Example: 10030 ÷ 827
(plain base 1000, difference 173) offers only ×7 (5789, base 10000,
difference 4211): every digit is 0-5, yet it fans the product across four
columns instead of three and looks confusing next to the plain solve.
Substitution (`173` → `[2,−3,3]`, same width as plain, digits in `[−4,5]`)
is the alternative.

**Options.**

- **(a) Drop scaling candidates whose difference has more digits than
  plain's.** 827: 3 digits plain vs 4 for ×7, so ×7 is dropped. 35: plain
  difference −25 (2 digits), so ×2 (30), ×3 (−5), ×4 (−40) and ÷5 (3) all
  stay. Removes the confusing cases while keeping the teaching examples.
  Cost: some divisors are left with no scaling option and rely on
  substitution alone; the digit count is a heuristic (30 and −25 both
  count as 2 digits).
- **(b) Keep every candidate, order them.** Sort by difference digit count,
  then scale factor, so the lightest options come first. No coverage lost
  and the simplest rule. Cost: heavy candidates like 827's ×7 remain
  visible next to the substituted one, so the confusion is reduced, not
  removed.
- **(c) Drop scaling candidates whose base is wider (`rhsWidth`) than
  plain's.** Tested and rejected: too blunt. It also drops 35's ×2/×3/×4,
  since scaling 35 moves the base from 10 to 100, even though ×3 gives a
  single-digit difference (−5) and is the simplest option. It would leave
  270 of the 606 divisors needing simplification with no scaling candidate
  (216 more lose only some), against 112 (and 94) for (a).

**Results** (`findSimplificationCandidates`, divisors 1..999; re-run the
counts with `node --experimental-strip-types
plans/scripts/simplification-candidate-stats.mts`, local-only). Indented
rows are subsets of the row above.

| Group | Divisors | Notes |
|---|---|---|
| Friendly (nothing offered) | 250 | |
| Unfriendly | 749 | |
| &emsp;Keep at least one scaling candidate after rule (a) | 494 | 142 of these also have a no-op substitution, harmless |
| &emsp;**Rely on substitution alone** | **255** | 236 are a real rewrite, 19 a no-op |
| &emsp;&emsp;Had scaling candidates, all removed by rule (a) | 112 | all real rewrites, e.g. 73, 93, 173, 184-188 |
| &emsp;&emsp;Never had a scaling candidate (the UI offers nothing today) | 143 | |
| &emsp;&emsp;&emsp;Real rewrite | 124 | |
| &emsp;&emsp;&emsp;**No-op (the only option is identical to plain)** | **19** | see below |

Fixtures: 10030 ÷ 827 (a drops ×7), 5428 ÷ 35 (all four stay), 12657 ÷ 791
(÷7, difference −13, stays).

No-op divisors: 53, 213, 314, 321, 403, 421, 422, 431, 442, 454, 503, 523,
530, 533, 535, 541, 542, 543, 545. Their difference digits are already 0-5,
so substitution changes nothing, yet the column split puts the leading
digits together in one chunk (the left part), which is above 5. Neither
technique helps, so they use the plain solve, a little denser than usual
(a 2-digit chunk in one column). Examples (rest follow the same pattern,
left parts 22-44):

| Divisor | Base | Difference | Split (left, right) | Left part |
|---|---|---|---|---|
| 53 | 10 | −43 | 43 | 43 |
| 213 | 100 | −113 | 11, 3 | 11 |
| 314 | 100 | −214 | 21, 4 | 21 |
| 421 | 100 | −321 | 32, 1 | 32 |
| 545 | 100 | −445 | 44, 5 | 44 |

**Invariant test** (unit, `baseMethodMath.test.ts`, "holds the candidate
invariants for every divisor 1..999"): every divisor is either friendly or
has at least one candidate in the final list (filtered scaling plus
substituted).

### Substitution that doesn't fit the board (iteration F)

**Decision: drop the substituted candidate when `substituteDigits(|difference|)`
has more digits than `rhsWidth`.** Applied after the no-op filter. Those
divisors keep their scaling cards, or fall back to the plain solve when they
have none.

**Why.** A multiply fans out into `rhsWidth` slots, right-aligned: slot
`k` is column `i+1+k` (`i` is the multiplied column). A substituted array of
`rhsWidth + 1` digits puts its leading digit at the weight of column `i`
itself, i.e. the column whose total is being multiplied, so it would change
its own input. There is no valid place for it, and a wider board doesn't
help. (Earlier assumption "a multi-digit source never grows" was wrong: it
fails for negative differences between 0.5B and B, e.g. 182.)

| Field | 182 | 46 | 93 | 827 |
|---|---|---|---|---|
| Base | 100 | 10 | 100 | 1000 |
| Difference | −82 | −36 | 7 | 173 |
| `rhsWidth` (slots) | 2 | 1 | 2 | 3 |
| Plain split `[left, ...right]` | `[8, 2]` | `[36]` | `[0, 7]` | `[1, 7, 3]` |
| `substituteDigits(\|diff\|)` | `[1, −2, 2]` | `[4, −4]` | `[1, −3]` | `[2, −3, 3]` |
| Digits vs slots | 3 > 2 | 2 > 1 | 2 = 2 | 3 = 3 |
| Fits | no | no | yes | yes |
| Scaling candidates (raw) | none | none | ×6 → 558 (base 1000, diff 442) | ×7 → 5789 (base 10000, diff 4211) |
| Kept after rule (a) | none | none | none (442 is wider than 7) | none (4211 is wider than 173) |
| **Final card list** | none, plain solve | none, plain solve | substituted only | substituted only |

182: 82 = 1×100 − 2×10 + 2, the `1` lands on column `i`. 93 fits because 7
is padded to `[0, 7]` and `[1, −3]` (10 − 3) uses the same 2 slots. Overflow
needs `|diff|` to fill every slot with a leading digit of 6-9 (or carry into
a new place).

**Results** (divisors 1..999, after the no-op filter; script as above).

| Group | Divisors | Outcome |
|---|---|---|
| Substitution too long | 276 | |
| &emsp;Also has scaling candidates | 220 | scaling cards only |
| &emsp;**Substitution was the only option** | **56** | plain solve (46, 157, 159, 162, 164, 173, 179, 181-188, 218, 238, 273, 274, 277, 317, 318, 327, 346, 357, 359, 362, 364, 365, 382, 387, 391, 397, 409, 419, 427, 436, 446, 457, 458, 461, 463, 466, 482, 486, 487, 491, 497, 509, 519, 529, 537, 538, 547-549) |

Plain-solve fallbacks are now **75** divisors: the 19 no-op ones above plus
these 56 (disjoint: the 56 were counted after the no-op filter). Their plain
difference stays unfriendly (digits above 5 in a column), same as the 19.
The "every divisor is friendly or has a candidate" invariant becomes:
friendly, or non-empty list, or one of these 75.

**Cumulative outcome** for the 749 unfriendly divisors (rule (a) unchanged;
a heuristic comparing digit counts, e.g. 827's ×7 gives 4211, 4 digits
against 173's 3, so it is dropped):

| Outcome | Divisors |
|---|---|
| Scaling card(s), with or without a substituted card | 494 |
| Substituted card only | 180 |
| **Plain solve (no cards)** | **75** (19 no-op + 56 too-long) |

Fixtures kept: 10030 ÷ 827, 10000 ÷ 819, 12657 ÷ 791 (all fit). Engine
tests use 182 as the too-long case (the engine still throws for it).

### Input limits (iteration F)

- **Divisor stays 1..999**, no ≥10 restriction like Dhvajanka. Single-digit
  divisors cost a base-10 floor, a `divideScaled >= 6` guard and a few
  fixtures, but keep the simplest teaching case, 123 ÷ 9.
- **Dividend < divisor** skips the selector and shows the "too few digits"
  banner (trivial Q=0, R=dividend, no valid board).
- **Known limitation:** dividend == divisor (e.g. 35 ÷ 35) still offers the
  selector, and a candidate whose scaled divisor exceeds the dividend (×2 = 70)
  then shows the same banner. Accepted, not a realistic learner problem.

## Worked examples from the source PDF (for future reference)

Pulled from `base-method-division.pdf` (ch. 15 — this PDF covers Base Method
only). Paravartya (negative-difference) cases aren't in this PDF, but real,
manually-verified examples now exist below under "Examples with steps".
Useful as a bank of test cases when building `computeBaseMethodSteps` and its unit tests.

| Problem | Base | Difference | LHS \| RHS | Quotient | Remainder | Notes |
|---|---|---|---|---|---|---|
| 23 ÷ 9 | 10 | 1 | 2 \| 3 | 2 | 5 | Simplest case; book's opening example |
| 31 ÷ 9 | 10 | 1 | 3 \| 1 | 3 | 4 | |
| 44 ÷ 9 | 10 | 1 | 4 \| 4 | 4 | 8 | |
| 71 ÷ 9 | 10 | 1 | 7 \| 1 | 7 | 8 | |
| 31 ÷ 8 | 10 | 2 | 3 \| 1 | 3 | 7 | |
| 24 ÷ 8 | 10 | 2 | 2 \| 4 | 3 | 0 | Raw remainder (8) equals the divisor — quotient +1, remainder reset to 0. Good edge case for normalization. |
| 42 ÷ 8 | 10 | 2 | 4 \| 2 | 5 | 2 | Raw remainder (10) exceeds the divisor — quotient +1, remainder −8. Two-pass normalization edge case. |
| 502 ÷ 99 | 100 | 1 | 5 \| 02 | 5 | 7 | 2-digit RHS |
| 617 ÷ 95 | 100 | 5 | 6 \| 17 | 6 | 47 | 2-digit RHS, single-digit difference |
| 123 ÷ 9 | 10 | 1 | 12 \| 3 | 13 | 6 | 2-digit LHS with an internal column carry |
| 1234 ÷ 98 | 100 | 2 (written as 02) | 12 \| 34 | 12 | 58 | Multi-digit-difference example (difference must be kept as 2 digits, not 1, to land in the right columns) |
| 2122 ÷ 97 | 100 | 3 (written as 03) | 21 \| 22 | 21 | 85 | |

### Examples with steps (manually solved, for future test/verification use)

Each example is written as: initial split → a "finalize digit → multiply by
difference → add the product into the following position(s)" step for
every LHS digit → final quotient/remainder (with any overflow/negative
normalization spelled out). The multi-digit-difference cases confirm the
general rule: split `difference` into its own decimal digits (sign carried
per digit where negative) and add them place-wise, starting one position to
the right of the digit that was just multiplied.

**1234 ÷ 98** — base 100, difference 2, LHS `12` | RHS `34`

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `12 \| 34` |
| 1 | Digit₁ = 1 (finalizes Q₁=1); 1×02=02, add at positions 2–3 | `12 \| 54` |
| 2 | Digit₂ = 2 (finalizes Q₂=2); 2×02=04, add at positions 3–4 | `12 \| 58` |

Quotient = 12, Remainder = 58. Verify: 12 × 98 + 58 = 1234 ✓

**2122 ÷ 97** — base 100, difference 3, LHS `21` | RHS `22`

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `21 \| 22` |
| 1 | Digit₁ = 2 (finalizes Q₁=2); 2×03=06, add at positions 2–3 | `21 \| 82` |
| 2 | Digit₂ = 1 (finalizes Q₂=1); 1×03=03, add at positions 3–4 | `21 \| 85` |

Quotient = 21, Remainder = 85. Verify: 21 × 97 + 85 = 2122 ✓

**14189 ÷ 102** (Paravartya) — base 100, difference −2, LHS `141` | RHS `89`

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `141 \| 89` |
| 1 | Digit₁ = 1 (finalizes Q₁=1); 1×(−02)=−02, add at positions 2–3 | `14(−1) \| 89` |
| 2 | Digit₂ = 4 (finalizes Q₂=4); 4×(−02)=−08, add at positions 3–4 | `14(−1) \| 09` |
| 3 | Digit₃ = −1 (finalizes Q₃=−1); −1×(−02)=+02, add at positions 4–5 (position 5 carries: 9+2=11 → digit₅=1, +1 carried into digit₄) | `14(−1) \| 11` |
| 4 | Normalize the signed LHS `1,4,−1` → 100+40−1 = 139 | `139 \| 11` |

Quotient = 139, Remainder = 11. Verify: 139 × 102 + 11 = 14189 ✓ — a good
reference for the "signed intermediate digit, normalized at the end" case.

**1693 ÷ 131** (Paravartya) — base 100, difference −31, LHS `16` | RHS `93`

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `16 \| 93` |
| 1 | Digit₁ = 1 (finalizes Q₁=1); 1×(−31)=−31, add at positions 2–3 | `13 \| 83` |
| 2 | Digit₂ = 3 (finalizes Q₂=3); 3×(−31)=−93, add at positions 3–4 | `13 \| (−10)` |
| 3 | Remainder is negative (−10): reduce quotient by 1, add divisor back: −10 + 131 = 121 | `12 \| 121` |

Quotient = 12, Remainder = 121. Verify: 12 × 131 + 121 = 1693 ✓ — simplest
available real sign-flip case; a good candidate to replace the invented
31 ÷ 12 tentative example in iteration C (single normalization step, only
one intermediate negative value).

**10030 ÷ 827 (standard base method)** — base 1000, difference 173,
LHS `10` | RHS `030`

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `10 \| 030` |
| 1 | Digit₁ = 1 (finalizes Q₁=1); 1×173=173, add at positions 2–4 | `11 \| 760` |
| 2 | Digit₂ = 1 (finalizes Q₂=1); 1×173=173, add at positions 3–5 (position 4 carries: 6+7=13 → digit₄=3, +1 carried into digit₃) | `11 \| 933` |
| 3 | RHS total (933) ≥ divisor (827): subtract divisor, quotient +1: 933 − 827 = 106 | `12 \| 106` |

Quotient = 12, Remainder = 106. Verify: 12 × 827 + 106 = 10030 ✓ — a
concrete, verified example of the "RHS total exceeds the divisor,
single-subtraction" correction; pairs with 1234 ÷ 98 and 2122 ÷ 97 as
multi-digit-difference test cases.

**10600 ÷ 87 (LHS carry cascade)** — base 100, difference 13, LHS `106` |
RHS `00`. A carry that lands on an already-finalized *and already
multiplied* LHS digit invalidates that digit's distributed contribution —
fixing the digit alone isn't enough; its multiply must be redone with the
corrected value, which can itself cascade further left. Shown here as two
passes: a tentative first pass that discovers the carry, then a second
pass using the corrected digit from the start.

First pass (tentative):

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `106 \| 00` |
| 1 | Digit₁ = 1 (Q₁=1); 1×13=13, add at positions 2–3 | `119 \| 00` |
| 2 | Digit₂ = 1 (tentative Q₂=1); 1×13=13, add at positions 3–4 | `11(10) \| 30` |
| 3 | Position 3 total (10) ≥ 10: write 0, carry 1 back into Q₂ (already finalized!) → Q₂ = 1+1 = 2 | — |

Second pass (Q₂ = 2 from the start, since its multiply must be redone):

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `106 \| 00` |
| 1 | Digit₁ = 1 (Q₁=1); 1×13=13, add at positions 2–3 | `119 \| 00` |
| 2 | Digit₂ = 2 (carried in); 2×13=26, add at positions 3–4 | `12(11) \| 60` |
| 3 | Position 3 total (11) ≥ 10: write 1 (Q₃=1), carry 1 back into Q₂ — already 2, no further change (fixed point); 1×13=13, add at positions 4–5 | `121 \| 73` |

Quotient = 121, Remainder = 73. Verify: 121 × 87 + 73 = 10600 ✓ — divisor
87 is the same one flagged as an aside under iteration D; this is that case
worked and checked. Derived and verified with `plans/base-method-verifier.py`
(no verified example of the separate "repeated remainder correction, 2+
subtractions" case exists yet — every candidate found so far also triggers
this same redo-on-carry complexity, or a further edge case where the
quotient needs an extra leading digit beyond the assumed LHS width).

**10030 ÷ 827 (substitution method, in scope for iteration F)** — same
problem solved by substituting a scaled 3-digit difference `2,−3,3`
instead of `173` directly. The substituted digits come from rounding `173`
up to the nearest hundred (`200`), then expressing the `27` gap the same
way one place down (round up to `30`, gap `3`): `173 = 200 − 30 + 3`.

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `10 \| 030` |
| 1 | Digit₁ = 1; 1×(2,−3,3), add at positions 2–4 | `12 \| (−360)` |
| 2 | Digit₂ = 2; 2×(2,−3,3)=(4,−6,6), add at positions 3–5 | `12 \| 106` |

Quotient = 12, Remainder = 106 — same answer as the standard method above,
confirming the substituted digits are self-correcting; note this variant
never needs the standard method's closing "RHS ≥ divisor" correction step
(3 steps → 2), since the chosen digits already land on the right total.

**10000 ÷ 819 (substitution method)** — base 1000, difference 181, LHS
`10` | RHS `000`. Substituted digits for `181`: round up to `200`, gap `19`
→ round up to `20`, gap `1`: `181 = 200 − 20 + 1`.

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `10 \| 000` |
| 1 | Digit₁ = 1; 1×(2,−2,1), add at positions 2–4 | `12 \| (−210)` |
| 2 | Digit₂ = 2; 2×(2,−2,1)=(4,−4,2), add at positions 3–5 | `12 \| 2,−3,2` |
| 3 | Normalize the raw remainder (position 4 is negative): borrow 1 from position 3 into position 4 → `2,−3,2` becomes `1,7,2` | `12 \| 172` |

Quotient = 12, Remainder = 172. Verify: 12 × 819 + 172 = 10000 ✓ — unlike
10030 ÷ 827 above, this one doesn't land clean; it still needs a closing
fixup. But compare it to the *standard* method on the same problem
(difference 181 used directly): that one's raw RHS total is 991, which
exceeds the divisor 819 and needs a full divisor subtraction
(991 − 819 = 172, quotient +1) — the harder "compare and correct" step.
The substituted-digit path instead only ever needs the lighter "normalize
the remainder" borrow/carry step (already in the engine, see iteration
D.1), never a full divisor-magnitude subtraction — that's the substitution
method's real benefit, not "always finishes clean" (10030 ÷ 827 happens to,
10000 ÷ 819 doesn't, but neither ever needs to compare against the full
divisor).

**5428 ÷ 35 (advanced variant: scale the divisor to a nearby multiple of a base — in scope for iteration F)**

35 isn't close to any power of 10, so this trick divides by a convenient
multiple of 35 instead (105 = 35×3, or 70 = 35×2), then rescales the
result. Preserved close to the original manual working rather than
re-derived, since the digit-by-digit arithmetic here is rougher than the
examples above; both variants land on the same final answer, matching the
existing Dhvajanka example for 5428 ÷ 35 in `dhvajanka-build-plan.md`.

*Via 105 (= 35×3):*
```
35×3=105 → dividing 5428 by 105 gives Q=51, R=73
54 | 28
(5×0,−5)
54 | (−23)8
54 | −222
(4×0,−5)
54 | −242
51 | −242 + 315
51 | 73
(Q×3, then adjust the 73 remainder for 35: 73 = 2×35 + 3)
153 | 73  →  155 | 3
```

*Via 70 (= 35×2):*
```
35×2=70 → dividing 5428 by 70 gives Q=77, R=38
54 | 28
(5×30)
5(19) | 28
69 | 28
(19×30)
69 | (570+28)
77 | 38
(Q×2, then adjust the 38 remainder for 35: 38 = 1×35 + 3)
154 | 38  →  155 | 3
```

Both give Quotient = 155, Remainder = 3. Verify: 155 × 35 + 3 = 5428 ✓ —
same problem as the Dhvajanka app's built-in example (5428 ÷ 35, Q=155 R=3),
useful as a cross-check between methods but not itself a planned iteration.

**12657 ÷ 791 (advanced variant: divide the divisor by a factor — the other
scaling direction, in scope for iteration F)** — source PDF example (n).
791 = 7 × 113, so instead of scaling the divisor *up* to a multiple of a
base (as in 5428 ÷ 35 above), it's scaled *down*: solve 12657 ÷ 113 (base
100, difference −13, both digits friendly) then descale by dividing the
resulting quotient by 7.

```
126 | 57
(1×(−13): −1 into col 2, −3 into col 3)
113 | 57
(1×(−13): −1 into col 3, −3 into RHS col 1)
112 | 27
(2×(−13): −2 into RHS col 1, −6 into RHS col 2)
112 | 01
(112 < 113 divisor, no compare-and-correct needed — cleanest possible case)
112 | 1
(descale: 112 ÷ 7 = 16 remainder 0, so final remainder = 1 + 0×113 = 1)
16 | 1
```

Quotient = 16, Remainder = 1. Verify: 16 × 791 + 1 = 12657 ✓ — the
division-direction descale formula is the mirror of the multiplication one
used for 5428 ÷ 35: `Q = floor(Q′/k)`, `R = R′ + (Q′ mod k) × newDivisor`
(vs. multiplication's `Q = Q′×k + floor(R′/D)`, `R = R′ mod D`). Also a
good division-scaling candidate for `findScalingCandidates`'s test suite,
alongside 5428 ÷ 35's multiplication candidates.

This same problem also has a substitution-method alternative (not in the
source PDF, hand-derived here): the *natural* (unscaled) difference is
base 1000, difference 209 (791 vs. nearest power of 10). Running the
substitution algorithm on 209 (LSB-first, `9→[−1, carry 1]`,
`0+1=1→[1]`, `2→[2]`) gives substituted digits `2, 1, −1` — all friendly,
no scaling needed at all. So 12657 ÷ 791 is a rare case where *both*
simplification techniques (divisor-scaling and substitution) independently
apply to the same problem; a ready cross-reference
fixture for the substitution work.

## Out of scope (not planned)
- Quotient wider than the assumed LHS width (e.g. 9995÷9 → 1110 needs 4
  columns but the board only allocated 3), there's no box to put it in.
  Out of scope as a pure display-width limitation, not a math one; the
  app shows a friendly "quotient too long for the board" message.
