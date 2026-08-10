# Dhvajanka Division App — Build Plan

## Requirements

- Single self-contained `index.html` (CSS and JS embedded, no CDN dependencies)
- Works offline, opens in any modern browser
- Light and dark mode via `prefers-color-scheme`
- Mobile-responsive, max-width 680px
- Interactive step-by-step walkthrough with prev/next navigation
- Digit board showing dividend digits, quotient row, and carry state
- Step content panel with arithmetic shown line by line
- Reference section summarising Dhvajanka rules
- Delivered as a downloadable `.zip`

---

## Version 1 — Hardcoded example (5428 ÷ 35)

Scope: static data, no user input. Goal is a polished, complete UI
that can be wired to dynamic data in v2.

### Detailed tasks

#### 1. File scaffold
- Create `index.html` with DOCTYPE, `<meta charset>`, viewport, and title
- Embed all CSS inside `<style>` and all JS inside `<script>` at bottom of body
- No external fonts or libraries

#### 2. CSS foundation
- Define `:root` custom properties: background levels (`--bg`, `--bg2`, `--bg3`),
  text levels (`--text`, `--text2`, `--text3`), border, and semantic colour
  tokens for amber (active), green (done/correct), blue (info/carry)
- Add `@media (prefers-color-scheme: dark)` block overriding all tokens
- Base reset: `box-sizing: border-box`, zero margin/padding on `*`
- `.container`: `max-width: 680px`, `margin: 0 auto`, `padding: 2rem 1.5rem`

#### 3. Header
- `<header>` with `<h1>` ("Dhvajanka Division"), subtitle line, and a
  styled problem badge showing **5428 ÷ 35**

#### 4. Divisor decomposition card
- Two-column card: **working digit 3** | **flag digit 5**
- Label rows ("working", "flag"), vertical separator, large digit display
- Flag digit uses blue token colour to visually distinguish it

#### 5. Digit board
- `.digit-row`: four 52×52px boxes containing digits 5, 4, 2, 8; 8px gap
- Three box states driven by class toggling:
  - default — neutral bg
  - `.active` — amber bg/border/text
  - `.done` — green bg/border/text
- Horizontal rule divider (0.5px)
- `.quotient-row`: four 52px-wide slots (Q1, Q2, Q3, R)
  - Placeholder text when not yet revealed
  - `.show` state — green text, larger font
  - `.show-rem` state — blue text for remainder slot
- Carry badge area below quotient row (hidden when carry is null)

#### 6. Step data array
Define `const STEPS = [...]` with five objects, one per screen:

```
{ title, done[], active[], q[], r, carry, html }
```

- `done[]` — indices of digit boxes to mark green
- `active[]` — indices to mark amber
- `q[]` — quotient digit values; `null` = not yet revealed
- `r` — remainder value or `null`
- `carry` — carry value or `null`
- `html` — pre-written HTML string for the step calculation panel

Step content (the `html` field for each):

| # | Title | Key lines |
|---|-------|-----------|
| 0 | Setup | Divisor 35 split → working 3, flag 5; pattern rule |
| 1 | Step 1 — first digit | GD=5, no flag adj, 5÷3=Q₁=1 R2, carry→2 |
| 2 | Step 2 — second digit (adjustment) | GD=24, 24−5×1=19, raw Q=6→adjusted to 5, carry→4 |
| 3 | Step 3 — third digit | GD=42, 42−5×5=17, 17÷3=Q₃=5 R2, carry→2 |
| 4 | Step 4 — remainder | GD=28, 28−5×5=3, Remainder=3; verify line |

#### 7. Render function
`function render(i)` — called on load and on every navigation:
- Iterate digit boxes, apply `active`/`done` classes from `STEPS[i]`
- Iterate quotient slots, toggle `.show` / `.show-rem` and set inner text
- Show or hide carry badge with correct value
- Inject `STEPS[i].title` and `STEPS[i].html` into step panel
- Update step counter ("1 / 5")
- Update dot indicators (add `.current` to dot `i`)
- Set `prev` button `disabled` if `i === 0`
- Set `next` button text to "✓ done" and `disabled` if `i === STEPS.length - 1`

#### 8. Navigation
- `let cur = 0`
- `function go(dir)` — clamps `cur`, calls `render(cur)`
- `<button id="prev">← back</button>` and `<button id="next">next →</button>`
- Dot row: one `<span class="dot">` per step, `.current` on active dot
- Call `render(0)` on page load

#### 9. Step content styles (used inside `html` strings)
- `.calc-line` — flex row, baseline-aligned, wraps
- `.cn` — number/value (15px, weight 500, primary text)
- `.co` — operator/label (13px, secondary text)
- `.ch` — highlighted result chip (blue bg, padded, rounded)
- `.warn-note` — amber bg box for adjustment explanation
- `.success-note` — green bg box for final answer + verify line

#### 10. Reference section
Below the navigator, separated by a rule:
- Heading: "Method rules"
- Five bullet points:
  1. Split divisor — first digit = working divisor, rest = flag digit(s)
  2. Gross dividend (GD) = carry × 10 + next digit
  3. Net dividend (ND) = GD − (flag × previous Q digit)
  4. If ND < 0 — reduce last Q digit by 1, add working divisor to carry, recompute
  5. Quotient digit = ND ÷ working; carry = ND mod working; final ND = remainder

#### 11. Footer
- Small centred text: "Vedic Mathematics · Dhvajanka (flag) method"

#### 12. Packaging
- `README.md` — one paragraph on what the app is, how to open it, which
  example it uses, and a one-line method summary
- Zip both files as `dhvajanka-v1.zip`

---

## Version 2 — Dynamic inputs (4-digit dividend, 2-digit divisor)

Scope: replace hardcoded data with computed steps from user input.
UI structure from v1 stays intact; only input handling and data
generation change.

### High-level tasks

1. **Input form** — Add a form above the board with two `<input type="number">`
   fields (dividend: 1–9999; divisor: 10–99) and a Solve button. Show inline
   validation messages for out-of-range or non-integer values. Hide the board
   section until a valid solve is triggered.

2. **Algorithm — `computeSteps(dividend, divisor)`** — Split divisor into
   `working` (tens digit) and `flag` (units digit). Iterate through all
   dividend digits left to right: compute `GD = carry × 10 + digit`,
   subtract `flag × prev_Q` to get `ND`, handle negative `ND` by decrementing
   last Q digit and adding `working` to carry, then either divide by `working`
   (quotient steps) or store `ND` directly as remainder. Return an array of
   step objects matching the shape used in v1.

3. **Dynamic board render** — Drive digit box count, quotient slot count, and
   all step data from `computeSteps` output rather than the hardcoded `STEPS`
   array. Board rebuilds on each new solve.

4. **Step content generator — `buildStepHTML(step)`** — Produce the
   calculation HTML string programmatically from each step object's fields
   (`GD`, `flagSub`, `ND`, `q`, `carry`, `adjustments`) instead of
   hand-written strings.

5. **Edge cases** — Quotient 0 when divisor > dividend (show R = dividend);
   dividend exactly divisible (R = 0); single-digit result path (e.g. 15 ÷ 12).
   Verify output with `Q × D + R === N` and surface a visible error banner if
   the check fails.

---

## Version 3 — Extended inputs (6-digit dividend, 3-digit divisor)

> Tasks TBD. Will require extending the algorithm to handle two flag digits,
> multi-flag subtraction per step (`flag[0] × Q[i−1] + flag[1] × Q[i−2]`),
> and a two-pass remainder computation for the final steps.
