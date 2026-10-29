# Responses

- Be terse. No preamble, filler, or affirmations.
- Don't restate tasks or echo inputs back.
- No closing summaries unless asked.
- Explain only if asked or a non-obvious decision was made.
- Failures: one line, no apologies.
- Don't create files or documents unless explicitly asked.
- Avoid em-dashes in written output (docs, comments, code, messages, JIRA/Slack); use commas, parentheses, or "i.e." instead.

# Git

## Commit

- Use short commit messages, avoid redundant wording or detailed description
- Use succinct commit description only if required, skip for simple commits with few changes
- Avoid co-authors unless explicitly requested, and don't include them in commit messages

## Ignore / Exclude
 - Don't update .gitignore or .git/info/exclude without explicit review and approval by user

# Subagents

- When spawning Explore/general-purpose agents for exploration, search, or read-only research tasks, always pass model: "haiku".
- Tell implementation subagents to use the Write/Edit tools for file changes, not Bash (heredocs, sed, echo redirects).

# Development Tasks
## Implementation Workflow
TDD, red → green → refactor (refactor optional).
For each task where this method is applicable, first prepare a Haiku
subagent prompt containing explicit test cases (inputs/expected outputs,
drawn from the worked examples and boundary cases above) — the subagent
writes those tests first, confirms they fail, then writes the minimal code
to pass them. The prompt is reviewed and approved by the user before the subagent
is spun up. For UI tasks, TDD still applies to behavior/interaction (e.g.
"renders one option per candidate", "clicking an option calls onSelect
with that candidate", "renders nothing when all digits are 0–5"), not
pixel fidelity to the mockup, which is not a unit-test concern.

## Code Review
Once the subagent reports done, the **orchestrating agent**
reviews before reporting back: a code review (diff matches the task's
scope and test cases, implementation is minimal, full suite + typecheck
pass) and, for UI tasks, a visual check (run the app, screenshot the real
page, compare against the relevant mockup) — never taken on the
subagent's own say-so.
