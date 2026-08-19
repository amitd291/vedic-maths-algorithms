# Vedic Maths Algorithms

[![Build and Test](https://github.com/amitd291/vedic-maths-algorithms/actions/workflows/build.yml/badge.svg)](https://github.com/amitd291/vedic-maths-algorithms/actions/workflows/build.yml)

An interactive, step-by-step visualisation of Vedic Mathematics algorithms,
built with React + TypeScript + Vite.

Currently it supports two division methods, switchable from the app's
hamburger menu:

- **Dhvajanka ("flag") division** — enter any 4-digit dividend and 2-digit
  divisor; the app computes the step-by-step walkthrough (setup, one step
  per dividend digit, remainder) and lets you navigate through it.
- **Base Method / Paravartya division** — enter any dividend/divisor pair;
  the app picks the nearest power-of-10 base, then walks through the
  column/cross-multiplication method (including carry cascades and the
  Paravartya sign-flip variant when the divisor exceeds the base). A
  "Try a worked example" picker offers a curated set of examples covering
  each of the method's distinct closing-step scenarios.

## Method summaries

**Dhvajanka**: split the divisor into a **working divisor** (its first
digit) and a **flag digit** (the rest). At each step, compute the gross
dividend from the carry and the next dividend digit, subtract
`flag × previous quotient digit` to get the net dividend, then divide by
the working divisor to get the next quotient digit and carry.

**Base Method**: pick the nearest power of 10 as the **base**, and compute
the **difference** (base − divisor). Split the dividend into an LHS
(quotient) region and an RHS (remainder) region sized to the base's zeros,
then bring down and cross-multiply each LHS digit by the difference into
the columns to its right, summing and normalizing to get the final quotient
and remainder.

## Running

```bash
npm install
npm run dev      # local dev server with HMR (http://localhost:5173)
npm run build    # produces dist/index.html — a single, self-contained file
npm run preview  # preview the production build
npm test         # run the vitest suite
npm run test:e2e # run the playwright e2e suite (auto-starts the dev server;
                  # run `npm run build` first — one spec opens dist/index.html)
npm run lint     # oxlint
npm run typecheck # tsc -b (project-references-aware type check, no emit)
```

`npm run build` emits **one** offline-capable `dist/index.html` with all CSS
and JS inlined (via `vite-plugin-singlefile`) — no `assets/` directory, no
CDN dependencies, no external fonts. Open it directly via `file://` in any
modern browser.
