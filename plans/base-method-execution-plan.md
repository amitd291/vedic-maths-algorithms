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
`plans/mockups/iteration-c-generic-logic-v1.html` (10030 ÷ 827 walkthrough —
fan-out connector, right-to-left carry, per-column baseline alignment).

- [x] Generalize `computeBaseMethodSteps` for a multi-digit `difference`
      (product fans out across several columns to the right)
- [x] Generalize the board's connector into a fan-out (one column → several
      columns to the right) — already generic from iteration B (per-gap
      `connectors[]` booleans); no board change needed
- [x] Column running-totals stay on one visual baseline regardless of how
      many contributions a column holds that step (already implemented in
      iteration B via `MAX_CONTRIBUTIONS`; carried forward unchanged)
- [x] Right-to-left carry cascade across RHS columns
- [x] Two-pass RHS overflow correction (RHS total ≥ divisor)
- [x] Confirm engine/board handle the Paravartya sign flip and
      negative-remainder normalization
- [x] Contribution chips render sign-aware (`+7` / `−31`), not a hardcoded `+`
- [x] Method rules gain the multi-digit-difference/carry-cascade bullet
      and the Paravartya normalization bullet
- [x] Test coverage pass: unit tests for the new engine paths (fan-out,
      RHS carry cascade, two-pass overflow, Paravartya sign flip); component
      tests for sidebar open/close via scrim click and arrow-key
      (`ArrowLeft`/`ArrowRight`) board navigation (gap noted after iteration
      B, deferred here); e2e coverage for the Base Method pane (iteration B
      only has the Dhvajanka dist-bundle smoke test)

---

## Iteration D — LHS carry cascade + full-range coverage ✅

Spec: build plan Iteration D. Brought forward ahead of dynamic inputs so
v2 doesn't need a second engine rework. Iteration C already proves
multi-digit `difference`, RHS carry, and single-subtraction overflow
correction — this iteration covers only what those examples don't exercise.

- [x] Refactor: `App.tsx` becomes a shell (routing only — `method` state,
      `Header`/`Footer`, picks the pane); extract `DhvajankaPane` and
      `BaseMethodPane` out of `App.tsx` into their own components
      (`DhvajankaPage.tsx`, `BaseMethodPage.tsx`), each owning its own
      state/logic unchanged. Default pane on load stays Dhvajanka (no
      behavior change, just relocated code)
- [x] Refactor: `App.test.tsx` mocks the two page components and covers routing only
      (default pane, menu-driven switch, default pane re-render after
      switching back — panes unmount on switch, so no in-progress-state
      persistence to test: kept the existing conditional-render behavior
      over a keep-both-mounted approach, since `DigitBoard`/
      `BaseMethodDigitBoard` each attach a global `window` keydown listener
      and a CSS-hidden inactive pane would leave its listener live,
      fighting the active pane for ArrowLeft/ArrowRight); move the existing
      step-walkthrough/assertion coverage into dedicated
      `DhvajankaPage.test.tsx` / `BaseMethodPage.test.tsx` files with
      extensive coverage there instead — done
- [x] Before thinning e2e, add the unit/component coverage that would
      otherwise be lost — each of these currently exists only in an e2e
      spec:
  - [x] `InputForm.test.tsx` (didn't exist yet): the full validation
        matrix from `e2e/input-form.spec.ts` — empty dividend/divisor,
        non-integer dividend, out-of-range divisor, both-fields-invalid,
        boundary values (dividend 1, divisor 99), error clearing on a
        subsequent valid solve
  - [x] `DhvajankaPage.test.tsx`: per-case coverage from
        `e2e/edge-case-problems.spec.ts` (divisor > dividend, exact
        division/zero remainder, leading-zero quotient digit,
        quotient-digit adjustment/backtrack) — quotient-slot values and
        the success/verify note per case; plus the raw-lookahead-note vs.
        adjusted-reduction-note swap across steps 3→4 of 5428÷35
  - [x] `BaseMethodPage.test.tsx`: the RHS carry-first column-sum
        explainer ordering (rightmost column first) and the Q2-multiply
        contribution-chip alignment checks (same-row landing across every
        column reached, placeholder vs. real chip) from
        `e2e/base-method.spec.ts`
  - [x] Gap audit against every e2e scenario turned up two real gaps, now
        closed: the boundary-value case (dividend 1, divisor 99) didn't
        have a page-level assertion that no `.error-banner` appears
        (added to `DhvajankaPage.test.tsx`); and arrow-key clamping at
        the first/last step was never tested anywhere, in e2e or unit
        (added to both `DhvajankaPage.test.tsx` and
        `BaseMethodPage.test.tsx`). `dist-bundle.spec.ts` stays e2e-only
        (real build artifact over `file://`, not unit-testable). The
        cross-pane "switching back restores its own walkthrough" case is
        covered by composition (mocked `App.test.tsx` routing +
        `DhvajankaPage.test.tsx` default-render) rather than one
        end-to-end integration test — accepted trade-off of mocking
        `App.test.tsx`'s children
- [x] Refactor: Thin the e2e specs down to simple happy/unhappy-path smoke checks
      only after the above unit/component coverage is in place. Result:
      23 → 6 e2e tests. `walkthrough.spec.ts` and `input-form.spec.ts`
      slimmed to one happy + one unhappy path each; `edge-case-problems.spec.ts`
      deleted (the default problem 5428÷35 already IS its most complex
      case, "quotient-digit adjustment/backtrack", so it's exercised by
      the other specs; the rest moved to `DhvajankaPage.test.tsx`);
      `base-method.spec.ts` slimmed to the happy-path walkthrough plus
      the one real e2e-only case, the cross-pane "switching back restores
      its own walkthrough" integration check. `dist-bundle.spec.ts`
      untouched (already a single smoke test)
- [x] **Design finalized** (superseding the fixed-point-redo approach
      committed earlier): no mid-pass redo at all. Each column's raw total
      (`digit[i] + incoming[i]`) is used as-is as its own multiplicand, even
      when ≥10 or negative — never reduced to a single digit until the very
      end. Fanning a contribution out still uses exactly `rhsWidth` target
      columns, but only the rightmost `rhsWidth − 1` are forced to a single
      digit (`% 10`); the leftmost absorbs all remaining magnitude
      (`contribution / 10^(rhsWidth-1)`, floored), so it can itself be
      multi-digit. One closing step then: compares the assembled raw
      remainder to the divisor in a *loop* (not a single `if`), adds that
      correction onto the last raw LHS chunk, then carry-normalizes across
      the LHS chunks right-to-left. Verified by hand against the source
      PDF's own **30122 ÷ 87** example (343/281 → 346/20) plus 10600 ÷ 87,
      865 ÷ 9, 9995 ÷ 9, 1693 ÷ 131, 14189 ÷ 102 — all match. This resolves
      the LHS-carry-cascade item, the RHS-overflow-into-LHS guard (865 ÷ 9),
      and remainder-correction-beyond-one-subtraction, all as one mechanism
      — no separate handling needed for any of them. Mockup:
      `plans/mockups/iteration-d-lhs-carry-cascade-v1.html` (865 ÷ 9).
      Board/UX consequence: a column stays amber (`active`) through every
      step it appears in, even mid-computation with a raw ≥10 value (e.g.
      "Q₂ = 14"); only the closing step flips LHS (and RHS, once corrected)
      to green (`done`) together, once. One case still throws, for a
      display reason, not a math one: if the final LHS carry pass would
      overflow past the first column, the quotient genuinely needs a wider
      board than the assumed LHS width (e.g. 9995 ÷ 9 → 1110 needs 4
      columns, board has 3) — no box to put the extra digit in
- [x] Implement the design above in `computeBaseMethodSteps`, replacing the
      fixed-point loop; keep `BaseMethodPage`'s hardcoded example at
      10600 ÷ 87; add a positive `865 ÷ 9` test (was a throw-guard test);
      update the 9995 ÷ 9 test to assert the display-width-only guard;
      verify all existing cases still pass. Added a `30122 ÷ 87` test (the
      source PDF's own example) per the design note above. Updated
      `BaseMethodPage.test.tsx` and `e2e/base-method.spec.ts` for the new
      step count/titles (10600 ÷ 87 now runs 10 steps instead of 8: the RHS
      sum, compare-and-correct, and normalize are three distinct steps
      rather than two). Verified visually with Playwright screenshots
      against the running dev server: LHS columns stay amber with raw
      (possibly ≥10) totals through every step until the closing
      compare-and-correct/normalize steps flip everything to green
      together, matching the mockup.
- [x] Verify the baseline-alignment padding (iteration C) against an LHS
      column that holds a contribution, not just RHS columns — already
      exercised by the existing 10030 ÷ 827 example (Q₁'s 3-digit
      contribution fans across one LHS column and two RHS columns); added an
      explicit test asserting the LHS column's chip lands correctly

---

## Iteration E — dynamic inputs (v2) ⬜

Spec: build plan Iteration E.

- [ ] Refactor: split `computeBaseMethodSteps.ts` (grown long) into:
  - [ ] `baseMethodMath.ts` — pure calc (`nearestBase`, `normalizeDigit`,
        `solveBaseMethod`), no step/narration concerns
  - [ ] `baseMethodNarration.ts` — builds `BaseMethodStep[]` from the solve result
  - [ ] Bonus: closing-step branches (trivial/fold/compare/normalize) → one `buildClosingSteps` helper
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
