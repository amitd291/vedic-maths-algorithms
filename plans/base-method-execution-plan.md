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

## Iteration D.1 — closing-step bug fix + generic RHS normalize ✅

Bug found post-D: `lhsNormalizeChanged` compared against `lhsRaw`
(pre-correction) instead of `lastLhsChunks` (post-correction), so an RHS
correction folding into the last LHS chunk falsely triggered a redundant
"normalize the quotient" step even when that chunk was already a valid
single digit (10030 ÷ 827, and the same bug in 1693 ÷ 131).

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
- [ ] Dev-only example-picker dropdown on `BaseMethodPage`, so verifying a
      worked example no longer means hand-editing `BASE_DIVIDEND`/
      `BASE_DIVISOR` in the source. Gate on
      `import.meta.env.MODE === 'development'`, **not** `.DEV` — verified by
      hand that Vitest's `import.meta.env.DEV` is `true` too (`MODE` is
      `'test'`, only ever false when `MODE === 'production'`), so `.DEV`
      would leak the dropdown into component tests; `.MODE` is `'test'`
      under Vitest and `'production'` in the built/e2e bundle, so it's
      naturally hidden in both without any test-side change. Replace the
      `BASE_DIVIDEND`/`BASE_DIVISOR` consts with `useState`, recompute
      `steps` via `useMemo` keyed on the selection. Backing list, each
      labeled by the scenario it demonstrates (matches the engine test
      suite): 865 ÷ 9 [normalize quotient], 10030 ÷ 827 [normalize
      remainder], 10600 ÷ 87 [quotient carry cascade], 1693 ÷ 131
      [Paravartya sign flip], 14189 ÷ 102 [quotient-only normalize],
      30122 ÷ 87 [no closing steps]. Small `<select>`, no new dependency.

---

## Iteration E — dynamic inputs (v2) ⬜

Spec: build plan Iteration E.

- [ ] Refactor: split `computeBaseMethodSteps.ts` (grown long) into:
  - [ ] `baseMethodMath.ts` — pure calc (`nearestBase`, `normalizeDigit`,
        `solveBaseMethod`), no step/narration concerns
  - [ ] `baseMethodNarration.ts` — builds `BaseMethodStep[]` from the solve result
  - [ ] Bonus: closing-step branches → one `buildClosingSteps` helper. Grew
        to five branches as of iteration D.1 (trivial / fold-no-correction /
        normalize-the-remainder / compare-and-correct / normalize-the-quotient),
        up from four — makes this split more warranted, not less
  - [ ] `computeBaseMethodSteps.ts` — thin orchestrator + re-exports
- [ ] Refactor (candidate, confirmed real): `DhvajankaPage.tsx` and
      `BaseMethodPage.tsx` duplicate identical step-navigation state
      (`cur`/`clamp`/`isFirst`/`isLast`/`onBack`/`onNext`/`NavControls`
      wiring) — extract to a shared `useStepNav(total)` hook. Separately,
      `DigitBoard.tsx` and `BaseMethodDigitBoard.tsx` each independently
      register the same global `window` ArrowLeft/ArrowRight keydown
      effect — extract to a shared `useArrowKeyNav(onBack, onNext)` hook.
      Surfaced during iteration D's e2e-coverage audit: the boundary
      arrow-key-clamping test had to be duplicated per page because the
      underlying logic is duplicated per page; one hook + one hook test
      each would remove that duplication at the source
- [ ] The carry number is not visible as a chip, we should consider
      showing it with a different color for more clarity visually (though it is in the explainer text).
- [ ] The quotient remainder main section is cropped in mobile,
      font size may need to be dynamic (to verify)
- [ ] Input form: dividend + divisor, full range per iteration D's engine
- [ ] `Q × D + R === N` self-check + error banner
- [ ] Unit tests: both sign cases, normalization edge cases, full input range
- [ ] Once the input form drives the dividend/divisor, update
      `e2e/base-method.spec.ts` to set a specific input (not the page's
      default example) before asserting, so the e2e test stays a
      predictable, hardcoded-expectation check independent of whatever the
      default example happens to be at the time. Optionally do the same in
      `BaseMethodPage.test.tsx` for a couple of cases, now that a specific
      input is choosable rather than only the one hardcoded default.

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
