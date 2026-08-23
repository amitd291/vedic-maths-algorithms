# Base Method / Paravartya Division — Execution Plan

Execution state for this method. The requirements spec lives in
`base-method-build-plan.md`; this file tracks what is done and
what is next.

**Stack:** same as Dhvajanka (see `dhvajanka-execution-plan.md`) — Vite +
React 19 + TypeScript, single-file build, Vitest.

---

## Iteration A — app-level method selector ✅

- [x] Method switcher (Dhvajanka / Base Method) in `App.tsx`
- [x] Generalize app chrome no longer hardcoded to "Dhvajanka Division":
      `index.html` title, `Header.tsx` h1/subtitle, `Footer.tsx`
- [x] Rename `package.json` `name` (currently `vedic-maths-dhvajanka`);
      check build/preview script output references it
- [x] Update `e2e/dist-bundle.spec.ts`'s heading assertion for the new chrome

---

## Iteration B — v1 hardcoded example (123 ÷ 9) ✅

- [x] `computeBaseMethodSteps` for this method (column/cross-multiplication engine)
- [x] New board component (LHS/RHS split, diagonal contribution indicator,
      running column sum)
- [x] New divisor-card equivalent (`base` / `difference`)
- [x] Reference section: Base Method rules
- [x] Renamed `computeBaseSteps`/`BaseColumn(Kind)`/`BaseDigitBoard`/`BaseDivisorCard`
      to their `BaseMethod`-prefixed forms to avoid confusion with `StepBase`
      (base-interface) naming

---

## Iteration C — Generic logic & Paravartya sign variant (10030 ÷ 827 or 1693 ÷ 131) ✅

Spec: build plan Iteration C. Mockup:
`plans/mockups/iteration-c-generic-logic-v1.html`.

- [x] Generalize `computeBaseMethodSteps` for a multi-digit `difference`
      (product fans out across several columns to the right)
- [x] Fan-out connector, right-to-left RHS carry cascade, two-pass RHS
      overflow correction, per-column baseline alignment
- [x] Paravartya sign flip and negative-remainder normalization; sign-aware
      contribution chips (`+7` / `−31`)
- [x] Method rules gain the multi-digit-difference/carry-cascade and
      Paravartya normalization bullets
- [x] Test coverage: engine (fan-out, RHS carry cascade, two-pass overflow,
      Paravartya sign flip); component (sidebar scrim/arrow-key nav); e2e
      for the Base Method pane

---

## Iteration D — LHS carry cascade + full-range coverage ✅

Spec: build plan Iteration D. Brought forward ahead of dynamic inputs so
v2 doesn't need a second engine rework.

- [x] Refactor: `App.tsx` → shell only (routing); extracted `DhvajankaPage.tsx`
      / `BaseMethodPage.tsx`, each owning its own state/logic. `App.test.tsx`
      mocks both pages and covers routing only; step-walkthrough coverage
      moved into the two page test files
- [x] Added unit/component coverage that previously existed only in e2e
      (`InputForm.test.tsx` validation matrix, `DhvajankaPage.test.tsx`
      per-case edge coverage, `BaseMethodPage.test.tsx` RHS-carry/contribution-
      chip coverage, arrow-key clamping), then thinned e2e specs to
      happy/unhappy smoke checks (23 → 6 e2e tests); `dist-bundle.spec.ts`
      untouched
- [x] **Design**: no mid-pass redo. Each column's raw total (`digit[i] +
      incoming[i]`) is used as-is, even when ≥10 or negative, until a single
      closing step compares the assembled raw remainder to the divisor in a
      loop, corrects the last raw LHS chunk, then carry-normalizes across LHS
      chunks right-to-left. Verified by hand against the source PDF's
      30122 ÷ 87 example plus 10600 ÷ 87, 865 ÷ 9, 9995 ÷ 9, 1693 ÷ 131,
      14189 ÷ 102. Resolves LHS carry cascade, RHS-overflow-into-LHS, and
      multi-subtraction remainder correction as one mechanism. Mockup:
      `plans/mockups/iteration-d-lhs-carry-cascade-v1.html`. UX: an LHS
      column stays amber through every step, even with a raw ≥10 value;
      only the closing step flips LHS/RHS to green together. Still throws
      if the final LHS carry pass overflows past the first column (board
      too narrow for the quotient, e.g. 9995 ÷ 9 → 1110 needs 4 columns) —
      a display-width guard, not a math error
- [x] Implemented in `computeBaseMethodSteps`; `BaseMethodPage` hardcoded
      example now 10600 ÷ 87 (10 steps); added 865 ÷ 9 and 30122 ÷ 87 tests,
      updated 9995 ÷ 9 to assert the display-width guard; verified visually
      via Playwright screenshots against the mockup
- [x] Verified baseline-alignment padding against an LHS column holding a
      contribution (10030 ÷ 827, Q₁'s 3-digit contribution)

---

## Iteration D.1 — Bug fixes and minor enhancements ✅

- [x] Fixed `lhsNormalizeChanged` to compare `finalLhsDigits` against
      `lastLhsChunks` — same shape as `correctionApplies`. Verified against
      10030 ÷ 827, 1693 ÷ 131 (redundant step now gone) and 865 ÷ 9,
      14189 ÷ 102, 10600 ÷ 87 (genuine carry cases, unchanged)
- [x] New generic **normalize the remainder** step (RHS twin of the LHS
      normalize step, same `normalizeDigit` right-to-left mechanism),
      inserted between `sum the RHS columns` and `compare and correct` —
      shown only when the RHS carry is *self-contained* (doesn't spill past
      RHS's own leftmost column, e.g. 10030 ÷ 827: `[8,13,3]` → `[9,3,3]`).
      When it would spill (e.g. 10600 ÷ 87: `[16,0]`), the step is skipped —
      that crossing isn't an ordinary base-10 carry (base and divisor
      differ by `difference`), so it's left to the existing
      divisor-comparison loop, unchanged
- [x] Title `normalize the remainder`; line label `Normalize`,
      column-referenced (`column 4 = 13 → write 3, carry 1 left into
      column 3`), skip-if-unchanged — mirrors the LHS normalize step
- [x] Tests updated first in `computeBaseMethodSteps.test.ts`: 10030 ÷ 827
      (new step + renumbered final step), 10600 ÷ 87 and 1693 ÷ 131
      (assert no such step for the boundary/no-op cases)
- [x] Implemented in `computeBaseMethodSteps.ts`. Also reverted a stray
      uncommitted `BaseMethodPage.tsx` example change (10030 ÷ 827, left
      over from earlier screenshot-taking, out of sync with its test file)
      back to the committed 865 ÷ 9. Full suite (53 tests) + `tsc --noEmit`
      pass
- [x] Mockups: updated `iteration-c-generic-logic-v1.html` (10030 ÷ 827,
      self-contained case — also fixed its pre-D color-state modeling to
      stay amber until the closing step); new
      `iteration-c-generic-logic-v2.html` for 10600 ÷ 87 (boundary case,
      no interim step)
- [x] Dev-only example-picker dropdown on `BaseMethodPage`, gated on
      `import.meta.env.MODE === 'development'` (not `.DEV`, which is also
      `true` under Vitest). Six examples, one per closing-step scenario.
      Manually verified all six, plus `npm test`, e2e, and `npm run build`
      (dropdown absent from the dist bundle)
- [x] Reworded normalize-step explainer text to read as manual
      borrow/carry subtraction (`Q₃ = 10 + (-1) = 9; Q₂ = 4 − 1 = 3`
      instead of `Q₃ = -1 → write 9, carry -1 left into Q₂`) — same
      `carryMessage` helper used by both the LHS quotient-normalize and
      RHS remainder-normalize steps
- [x] **Bug fix**: 1693 ÷ 131's closing `compare and correct` step marked
      the RHS columns green with stale *pre-correction* digits (`-1`, `0`)
      instead of the corrected remainder (121) — RHS is only 2 columns wide,
      but a Paravartya divisor can exceed the base (131 > 100), so its
      remainder can need one more digit than the board has room for. Fixed
      via `applyFinalRhsTotals`: when the remainder doesn't fit, it's shown
      as one merged, green total in the rightmost RHS column (the other RHS
      column left blank) instead of splitting a digit that has nowhere to
      go — same idiom already used for a raw pre-normalized multi-digit
      column sum. Test added in `computeBaseMethodSteps.test.ts` (1693 ÷ 131,
      asserts `cols` totals `[1, 2, null, 121]`, all `colState: 'done'`)

---

## Iteration E — dynamic inputs (v2) ⬜

Spec: build plan Iteration E.

- [x] Refactor: split `computeBaseMethodSteps.ts` into `baseMethodMath.ts`
      (pure calc), `baseMethodNarration.ts` (step narration, incl. a
      `buildClosingSteps` helper), and a thin orchestrator; new
      `baseMethodMath.test.ts` for the pure layer
- [x] Refactor: extracted shared `useStepNav`/`useArrowKeyNav` hooks (with
      their own tests) out of `DhvajankaPage`/`BaseMethodPage` and
      `DigitBoard`/`BaseMethodDigitBoard`'s duplicated nav logic
- [x] **Carry chip**: violet (new to the palette — amber is active/raw,
      blue is result/quotient/remainder text, green is final), shown only
      on the LHS normalize/RHS remainder-normalize step, on the two columns
      actually involved in a carry (sender/receiver), not as a running
      badge through every step. Placed at the step where the values are
      still interim/raw (e.g. the `compare and correct` step, where the
      raw ≥10 total already implies its own carry-out) — the step that
      turns everything green stays clean with no chips. Chip text is a
      plain signed delta (`− 10` / `+ 1`), no arrows (redundant with the
      digit change itself); the existing top connector between the two
      columns gets a small left-pointing violet arrow + amount instead,
      since that's the one place an arrow actually shows direction.
      Mockup: `plans/mockups/iteration-e-carry-chip-v1.html` (anchored on
      10600 ÷ 87 — the "already-finalized-looking digit gets redone"
      case: Q₂'s raw total is 1, a single digit easy to mistake for
      final, until Q₃'s carry bumps it to 2).
- [x] Page title matches the method name; base-method listed first in the
      hamburger menu.
- [x] e2e coverage for the carry chip + other D/D.1 branches, via the dev
      dropdown: positive carry (10600÷87), borrow (14189÷102), Paravartya
      sign flip + remainder merge (1693÷131), self-contained RHS normalize
      (10030÷827).
- [x] Fixed: `.ch`/`.co`/`.cn` font size now drops to `13px` under the
      existing 400px mobile breakpoint in `global.css`.
- [x] Input form (dividend 1-99999, divisor 1-999) wired into
      `BaseMethodPage`, plus `ErrorBanner` for engine throws
- [x] `Q × D + R === N` self-check + error banner (closed by the above —
      the self-check throw already existed, just had no banner to surface through)
- [x] Full-range sweep test in `baseMethodMath.test.ts`: divisor 1..999 ×
      10 deterministic dividends each, asserting `Q×D+R===dividend` or one
      of the three known boundary errors. Supplements, not replaces, D.1's
      hand-picked examples (865÷9, 10600÷87, 30122÷87, 14189÷102, 10030÷827,
      1693÷131), which stay as explicit pairs for the narrow flag
      combinations the sweep can't reliably hit
- [x] `e2e/base-method.spec.ts` now drives every case through the real
      `BaseMethodInputForm` (a `solve(page, dividend, divisor)` helper),
      no longer relying on the page's default example or the dev-only
      picker. `BaseMethodPage.test.tsx` already got equivalent coverage
      (form-driven solve, error-banner-on-throw) in the input-form task.
- [x] Decoupled `BaseMethodPage.test.tsx`'s two default-dependent tests
      (raw ≥10 LHS total, carry chip) to set up their own 865÷9 example via
      the input form, instead of assuming the page default exercises them.

---

## Iteration F — smarter base selection (future) ⬜

Spec: build plan Iteration F. Speculative — no committed timeline.

**Central goal:** every digit actually multiplied by *inside a step* — an
LHS digit's multiplier, a substituted difference-digit — should be
**0–5 inclusive**. 1–5 are the times tables nobody has to think about; 6–9
means the borrowing/carrying effort this method exists to avoid. Exactly 5
is an accepted, unavoidable tie (see substitution derivation below), not a
defect. The divisor-scaling factor `k` is exempt from this range (kept at
2–9, see its task below) since it's paid at most twice per problem, not
once per step.

**Exactly one simplification technique active per solve** — divisor-scaling
and substitution are never combined. When the plain (nearest-power-of-10)
difference is already all 0–5, no simplification is offered at all; the
selection screen below only appears when actually needed.

**Sliced thin, one technique shipped end-to-end before starting the next**:
scale-factor math → selection UI (scaling-only) → wire scaling into the
board — a complete, shippable feature — *then* substitution derivation →
extend the selection UI → wire substitution into the board. The one thing
that has to be true from the start for the "extend" step to stay trivial:
the selection UI renders from a generic candidate list, not a hardcoded
plain-vs-scaled pair, so adding a second candidate source later is just
adding another function to the list, not restructuring the UI.

**Implementation workflow (each task below)**: TDD, red → green →
refactor (refactor optional). For each task, first prepare a Haiku
subagent prompt containing explicit test cases (inputs/expected outputs,
drawn from the worked examples and boundary cases above) — the subagent
writes those tests first, confirms they fail, then writes the minimal code
to pass them. The prompt is reviewed and approved here before the subagent
is spun up. For UI tasks, TDD still applies to behavior/interaction (e.g.
"renders one option per candidate", "clicking an option calls onSelect
with that candidate", "renders nothing when all digits are 0–5"), not
pixel fidelity to the mockup — that's not a unit-test concern.

Once the subagent reports done, the **orchestrating agent**
reviews before reporting back: a code review (diff matches the task's
scope and test cases, implementation is minimal, full suite + typecheck
pass) and, for UI tasks, a visual check (run the app, screenshot the real
page, compare against the relevant mockup) — never taken on the
subagent's own say-so.

- [x] Exposed the example picker to end users (no longer dev-gated); default
      is now the simplest example (123÷9), list ordered by complexity.
      Mockup: `plans/mockups/iteration-f-example-picker-v1.html`
- [x] Fixed a pre-existing `Step`/`BaseMethodStep` type bug in
      `BaseMethodPage.tsx`; added `npm run typecheck` (`tsc -b`) since bare
      `tsc --noEmit` was a silent no-op
- [ ] **Scale-factor search** (pure math, no board/UI): try `k = 2..9`
      (never `k=1`, trivial; never `k≥10` — not for difficulty, but because
      it's provably useless: scaling by an exact power of 10 rescales base
      and difference together, same digit pattern, a zero appended, so it
      can never fix an unfriendly digit). Compute `D×k`'s nearest
      base/difference for each `k`, keep only the ones where every
      resulting difference digit is 0–5. `k` gets a wider range than the
      0–5 goal itself because it's used at most twice per problem (`D×k`
      once, `Q′×k`/`R′÷D` once in the descale step) rather than once per
      LHS digit — a one-off 6–9 cost is a different trade-off than a
      per-step one. Search is inherently bounded (≤8 candidates); combined
      with the existing divisor≤999 input ceiling, the scaled divisor never
      exceeds 8991, so no separate base cap is needed either.
- [ ] **Simplification selection UI, scaling-only** (depends on the above):
      if the plain difference is already all 0–5, solve directly, no
      screen. Otherwise present each qualifying candidate as a text-only
      preview — `Plain: 173`, `Scaled ×3: −5` — from a generic candidate
      list (options come from real component state/props, computed via the
      scale-factor search above — not hardcoded markup), not a full
      walkthrough; user picks exactly one, which becomes what's actually
      solved and narrated. No automatic "best" scoring — surfacing options
      and letting the human pick is the deliberate design. If no scaling
      `k` qualifies, fall back to solving the plain difference directly, no
      screen. UI: reuses the existing "Try a worked example" chevron
      disclosure pattern (`plans/mockups/iteration-f-example-picker-v1.html`)
      for shape/feel. Two separate pieces of state, both real React state,
      not that mockup's CSS-only checkbox-hack: whether the panel renders
      *at all* is a `baseMethodMath`-derived flag (any candidate besides
      plain qualifies), not a component decision; expanded/collapsed is a
      separate, ordinary `useState` toggle, only relevant once rendering —
      this component needs to react to computed candidate data, which a
      pure-CSS toggle can't branch on.
- [ ] **Wire divisor-scaling into the board** (once a scaling option is
      chosen): no new math engine needed — dividend ÷ `D×k` is just an
      ordinary case `computeBaseMethodSteps` already solves; see build plan
      "Examples with steps" (5428÷35 via 105 and via 70) for the verified
      arithmetic. New work is the wrapper: an intro step showing `D×k=D′`,
      the unmodified board for dividend ÷ `D′`, then a closing descale step
      using `Q = Q′×k + floor(R′/D)`, `R = R′ mod D` (verified k-independent
      against both the ×3 and ×2 variants, both landing on Q=155, R=3).
      **This is a complete, shippable slice** — substitution below builds
      on it but isn't required for it to ship.
- [ ] **Substitution derivation** (pure math, adds a second candidate
      source): standard balanced-digit conversion, least-significant-digit
      first, carry propagating left:
      ```
      substitute(n):                      // digits of n, index 0 = units
        digits = decimalDigitsOf(n); carry = 0; i = 0; result = []
        while i < digits.length || carry != 0:
          d = (digits[i] ?? 0) + carry
          if d > 5: result[i] = d - 10; carry = 1
          else:     result[i] = d;      carry = 0
          i += 1
        return reverse(result)            // MSB-first for display
      ```
      Tie convention `d>5` converts / `d≤5` keeps → range `[−4,5]`, so the
      only digit that can hit the ceiling is a clean `+5`. Verified:
      `173→[2,−3,3]`, `181→[2,−2,1]` (both book examples, see build plan).
      **Growth is bounded and provable, not just "handled":** a *natural*
      (nearest-power-of-10) difference's leading digit is always ≤4 — the
      boundary where "nearest" flips between adjacent bases `B` and `10B`
      sits at `D=5.5B`, capping the worst-case natural difference at
      `4.5B−1` (e.g. base 10 → max 44, base 100 → max 449, base 1000 → max
      4499 — all leading-digit ≤4; a leading digit of 5+ would mean the
      divisor was actually closer to the *other* base, so it'd never be
      "nearest" in the first place). A ≤4 leading digit plus at most a `+1`
      incoming carry tops out at exactly 5, which *stays* — so a
      **multi-digit natural difference's substituted array is always the
      same length as the original, never longer.** The only real growth
      case is a **single-digit** natural difference of 6–9 (e.g. divisor 93
      → base 100 → diff 7 → `[1,−3]`), which always grows from 1 place to
      exactly 2 — general digit-friendliness normalization, not reserved
      for multi-digit differences, but its growth behavior is this one
      narrow, well-understood case, not an open-ended board-width concern.
- [ ] **Simplification selection UI, add substitution** (should be a small
      delta if the scaling-only UI used a generic candidate list): add the
      substitution rewrite of the plain difference as a second candidate,
      e.g. `Substituted: 2,−3,3`.
- [ ] **Wire substitution into the board** (once a substitution option is
      chosen): today `baseMethodMath.ts` computes one
      `contribution = total × difference` per LHS digit, then splits that
      product into decimal digits to fan out across columns. Replace with:
      for each element `d` at index `j` of the substituted-digit array,
      compute `total × d` and lay it at a place-offset of `j` columns —
      reusing the existing column carry-cascade/summation machinery as-is.
      `BaseMethodSolution.difference` needs a sibling optional field (e.g.
      `substitutedDigits?: number[]`) that switches the contribution path;
      narration stays one step per LHS digit. Board width: per the proof
      above, a multi-digit source never grows, so no new width mechanism is
      needed there; a single-digit (6–9) source growing 1→2 places is the
      one real case to verify against the board's existing column-width
      allocation. Test fixtures: 10030 ÷ 827 (clean finish, no closing
      step) and 10000 ÷ 819 (closing "normalize the remainder" step, not
      "compare and correct") — both hand-verified in the build plan,
      covering the two distinct closing-step outcomes.

---

## Out of scope (not planned)
- None currently.
