# Base Method / Paravartya Division — Build Plan

Companion to `dhvajanka-build-plan.md`. Source: `base-method-division.pdf`
(ch. 15 Base Method, ch. 16 Paravartya). The book treats these as one
algorithm with a sign flip on the difference, so this plan builds a single
sign-generic engine rather than two separate ones.

## Method recap

- `base` = nearest power of 10 to the divisor. `difference = base − divisor`.
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
  and 100). Any valid nearest base is fine for now — see iteration F for
  the future optimization/UX vision here.

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
- `computeSteps` for this method — column/cross-multiplication engine,
  independent of the flag-subtraction logic.
- A new board component (working name `BaseDigitBoard`) — LHS/RHS split
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

## Iteration F — smarter base selection (future)

Today, any valid nearest base is fine, chosen arbitrarily on a tie. Future:
optimize the choice (e.g. via multiplying/scaling techniques instead of
just nearest-power-of-10), and where more than one approach is genuinely
viable, prompt the user to pick. See `base-method-execution-plan.md`
Iteration F.

## Worked examples from the source PDF (for future reference)

Pulled from `base-method-division.pdf` (ch. 15 — this PDF covers Base Method
only). Paravartya (negative-difference) cases aren't in this PDF, but real,
manually-verified examples now exist below under "Examples with steps".
Useful as a bank of test cases when building `computeSteps` and its unit tests.

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

**10030 ÷ 827 (substitution method, out of scope)** — same problem solved
by substituting a scaled 3-digit difference `2,−3,3` instead of `173`
directly:

| Step | Action | Digits after |
|---|---|---|
| 0 | Split | `10 \| 030` |
| 1 | Digit₁ = 1; 1×(2,−3,3), add at positions 2–4 | `12 \| (−360)` |
| 2 | Digit₂ = 2; 2×(2,−3,3)=(4,−6,6), add at positions 3–5 | `12 \| 106` |

Quotient = 12, Remainder = 106 — same answer as the standard method above,
confirming the substituted digits are self-correcting. Kept only as
reference; the substitution technique itself stays out of scope (see below).

**5428 ÷ 35 (advanced variant: scale the divisor to a nearby multiple of a base, out of scope)**

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

## Out of scope (not planned)

- Substitution method (ch.16 section (b): scaling the divisor to approximate
  a base) — noted in the book as an alternative technique, not core to the
  algorithm; revisit only if requested.
