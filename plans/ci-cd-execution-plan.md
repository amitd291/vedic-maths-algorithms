## Iteration A
- [ ] Release on GitHub Pages via workflow

<!-- Detail below; strip once the checklist above is fully ticked. -->

**Release on GitHub Pages**
- [x] Push repo to GitHub (confirm remote/org, `git init` + first push if not
      already a git repo — currently this directory has no `.git`)
- [x] `vite.config.ts` `base` not needed — `vite-plugin-singlefile` inlines
      all assets into one `dist/index.html`, so there are no subpath asset
      URLs to break
- [x] `.github/workflows/deploy-to-github-pages.yml` builds from source
      (`npm ci && npm run build`) and deploys the fresh `dist/` via
      `actions/deploy-pages`; `dist/` is gitignored again, no manual build
      commit needed
- [x] Enable Pages in repo settings (source: GitHub Actions)
- [x] Trigger set to `workflow_dispatch` only (manual release cycle, avoids
      a deploy per commit to `main`)
- [ ] Verify the deployed URL loads and the walkthrough works end to end