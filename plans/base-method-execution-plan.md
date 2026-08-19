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
- [ ] Expose the dev-only example picker to end users: a checkbox/link
      toggle reveals the (redesigned) example dropdown on click, no longer
      dev-gated. Mockup first before implementation.

---

## Iteration F — smarter base selection (future) ⬜

Spec: build plan Iteration F. Speculative — no committed timeline.

- [ ] Implement divisor-scaling (multiply the divisor up to a nearby base
      multiple, e.g. 35×3=105 or 35×2=70) as a real engine path, not just a
      discussion point: 5428 ÷ 35, see build plan "Examples with steps"
- [ ] Optimize base choice instead of an arbitrary tie-break (e.g. via
      multiplying/scaling techniques rather than only nearest-power-of-10)
- [ ] Where multiple approaches are genuinely viable, prompt the user to
      choose one

---

## Out of scope (not planned)

- Substitution method (ch.16 section (b)) — see build plan.
