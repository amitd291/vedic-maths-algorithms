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

## Iteration D — LHS carry cascade + full-range coverage ⬜

Spec: build plan Iteration D. Brought forward ahead of dynamic inputs so
v2 doesn't need a second engine rework. Iteration C already proves
multi-digit `difference`, RHS carry, and single-subtraction overflow
correction — this iteration covers only what those examples don't exercise.

- [ ] Refactor: `App.tsx` becomes a shell (routing only — `method` state,
      `Header`/`Footer`, picks the pane); extract `DhvajankaPane` and
      `BaseMethodPane` out of `App.tsx` into their own components
      (`DhvajankaPage.tsx`, `BaseMethodPage.tsx`), each owning its own
      state/logic unchanged. Default pane on load stays Dhvajanka (no
      behavior change, just relocated code)
- [ ] Refactor: `App.test.tsx` mocks the two page components and covers routing only
      (default pane, menu-driven switch, per-pane state preserved across
      switches); move the existing step-walkthrough/assertion coverage into
      dedicated `DhvajankaPage.test.tsx` / `BaseMethodPage.test.tsx` files
      with extensive coverage there instead
- [ ] Refactor: Thin the e2e specs down to simple happy/unhappy-path smoke checks now
      that the component tests carry the detailed coverage
- [ ] Cascading carries across a multi-digit LHS — worked example:
      **10600 ÷ 87 = 121 r73** (base 100, difference 13), see build plan
      "Examples with steps"; verified with `plans/base-method-verifier.py`
- [ ] Redo-on-carry, not just digit-carry: a carry into an already-finalized
      LHS digit invalidates that digit's already-distributed multiply — the
      digit alone can't just be bumped, its multiply (and everything it fed
      forward) has to be redone, which can cascade further left. This is
      materially more than a display/carry mechanic; resolve the actual
      algorithm design for it during implementation, not from this plan doc
- [ ] Verify the baseline-alignment padding (iteration C) against an LHS
      column that holds a contribution, not just RHS columns
- [ ] Remainder correction beyond one subtraction (partially redundant with
      iteration C's single-subtraction case; here for the repeated-correction
      case where the RHS overflow exceeds what one divisor subtraction fixes)
      — no verified example found yet; every candidate tried also triggered
      the redo-on-carry case above or a quotient-overflow-beyond-LHS-width
      edge case, so treat as open until a clean case is found or the scope
      is reconsidered
- [ ] Prove against a hardcoded example exercising the LHS carry cascade,
      before wiring dynamic inputs
- [ ] Unit tests for the LHS-carry-cascade and full-range remainder-correction
      paths

---

## Iteration E — dynamic inputs (v2) ⬜

Spec: build plan Iteration E.

- [ ] The quotient remainder main section is cropped in mobile,
      font size may need to be dynamic (to verify)
- [ ] Input form: dividend + divisor, full range per iteration D's engine
- [ ] `Q × D + R === N` self-check + error banner
- [ ] Unit tests: both sign cases, normalization edge cases, full input range

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
