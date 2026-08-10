# Dhvajanka Division — Execution Plan

Execution state for the app. The requirements spec lives in
`dhvajanka-build-plan.md`; this file tracks what is done and what is next.

**Stack:** Vite + React 19 + TypeScript, `vite-plugin-singlefile` (build emits a
single self-contained offline `dist/index.html`), Vitest. No CSS framework, no
CDN, no external fonts.

---

## Iteration 1 — skeleton + v1 hardcoded example (5428 ÷ 35) ✅ complete

- [x] Vite + React + TS scaffold, single-file build, Vitest with smoke tests
- [x] `src/types.ts` (`Step`, `CalcLine`) and `src/data/example.ts`
- [x] Token-based `global.css`, light + dark via `prefers-color-scheme`
- [x] Components: Header, DivisorCard, DigitBoard, StepPanel, CalcPrimitives,
      NavControls, MethodRules, Footer
- [x] Step content as structured data rendered by `StepPanel` (no HTML strings),
      so v2 reuses the same renderer
- [x] Keyboard ← / → navigation, clickable dots
- [x] `tsc --noEmit` clean, tests passing, README

---

## Iteration 2 — dynamic inputs (v2) ✅ complete

4-digit dividend, 2-digit divisor. UI structure from v1 stays; only input
handling and data generation change.

- [x] Input form with validation (dividend 1–9999, divisor 10–99)
- [x] `computeSteps(dividend, divisor)` algorithm
- [x] Dynamic board driven by computed steps; deleted `src/data/example.ts`
- [x] Edge cases + `Q × D + R === N` self-check with error banner
- [x] Unit tests for `computeSteps`
- [x] Fixed-height step panel so the nav row stops moving

---

## Iteration 2.1 — corrections ✅ complete

Defects found in post-v2 code review and manual testing.

- [x] Update method rule & warning when raw quotient overshoots scenario
- [x] Remove the false `rawQ > 9` clamp in `computeSteps`
- [x] Reserve space for the carry badge so the board height stays constant
- [x] Test asserting every displayed "raw" division is arithmetically true
- [x] Browser pass: dark mode contrast and 375px layout
- [x] Highlight the flag digit only on steps where the flag subtraction fires
- [x] Rename internal identifiers to ubiquitous language (decrements →
      overshootCount, rawCarry → rawRemainder, GD/ND → grossDividend/
      netDividend, Q → quotientDigit(s) incl. the public `Step.quotientDigits`
      field)

<!-- Detail stripped; see git history for the original write-up. -->

---

## Iteration 2.2 — e2e tests + GitHub Pages release ⬜ next

- [ ] Commit and push to GitHub
- [ ] End-to-end tests against the dev server and the built `file://` bundle
- [ ] CI pipeline (refer similar repo at ../task)
- [x] Nav button redesign: icon-only, squarish arrow buttons inside digit board
- [x] Follow-up: move the keyboard listener out of `NavControls` into `DigitBoard`,
      and relocate `NavControls` next to the digit board

<!-- Detail below; strip once the checklist above is fully ticked. -->

**End-to-end tests** — still open: input-form and edge-case-problem specs
(skeleton and dev-server/bundle nav specs already in place, see
`e2e/*.spec.ts`).

---

## Iteration 2.3
- [ ] Release on GitHub Pages

<!-- Detail below; strip once the checklist above is fully ticked. -->

**Release on GitHub Pages**
- [ ] Push repo to GitHub (confirm remote/org, `git init` + first push if not
      already a git repo — currently this directory has no `.git`)
- [ ] Add `vite.config.ts` `base: '/<repo-name>/'` (Pages serves from a
      subpath, not root) — but check this doesn't break the offline
      single-file `dist/index.html` deliverable, which expects `base: '/'`
      or relative paths
- [ ] Add a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs
      `npm ci && npm run build` and deploys `dist/` via
      `actions/deploy-pages`
- [ ] Enable Pages in repo settings (source: GitHub Actions)
- [ ] Verify the deployed URL loads and the walkthrough works end to end

---

## Iteration 3 — extended inputs (v3) ⬜ deferred

6-digit dividend, 3-digit divisor.

- [ ] Extend divisor split to two flag digits
- [ ] Multi-flag subtraction per step (`flag[0] × Q[i−1] + flag[1] × Q[i−2]`)
- [ ] Two-pass remainder computation for the final steps
- [ ] Widen input ranges and board sizing
- [ ] Unit tests for the two-flag paths

<!-- Detail below; strip once the checklist above is fully ticked. -->

Detailed tasks TBD — to be scoped once v2 lands.

---

## Open items

- How the e2e testing skill gets authored is still undecided (no
  `run-skill-generator` skill exists on this machine; `skill-creator` is cached
  but not installed). Parked — the specs themselves can be written without it.

---

## Verification

1. `npm run dev` — walk all steps forward and back; digit boxes amber → green in
   order, quotient slots reveal correctly, carry badge shows/hides, counter
   accurate
2. Back arrow disabled on the first step; next arrow disabled on the last
3. DevTools → Rendering → emulate dark mode; check contrast in both themes
4. 375px width — no horizontal scroll
5. `npm run build` — `dist/` contains only `index.html`; open it over `file://`
   with the network offline and confirm the walkthrough works fully
6. `npx tsc --noEmit` clean, `npm test` passing
