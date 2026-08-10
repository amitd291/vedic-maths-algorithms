# Dhvajanka Division

An interactive, step-by-step visualisation of the Vedic Mathematics
Dhvajanka ("flag") division method, built with React + TypeScript + Vite.

This is v1: a single hardcoded worked example, **5428 ÷ 35**, walked through
five screens (setup, three quotient-digit steps, remainder). v2 will add an
input form and a computed algorithm for arbitrary 4-digit ÷ 2-digit
divisions.

## Method summary

Split the divisor into a **working divisor** (its first digit) and a
**flag digit** (the rest). At each step, compute the gross dividend from the
carry and the next dividend digit, subtract `flag × previous quotient digit`
to get the net dividend, then divide by the working divisor to get the next
quotient digit and carry.

## Running

```bash
npm install
npm run dev      # local dev server with HMR
npm run build     # produces dist/index.html — a single, self-contained file
npm run preview   # preview the production build
npm test          # run the vitest suite
```
Local server url: http://localhost:5183

`npm run build` emits **one** offline-capable `dist/index.html` with all CSS
and JS inlined (via `vite-plugin-singlefile`) — no `assets/` directory, no
CDN dependencies, no external fonts. Open it directly via `file://` in any
modern browser.
