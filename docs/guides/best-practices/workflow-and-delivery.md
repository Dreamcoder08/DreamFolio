# Workflow and Delivery

[Back to the index](./README.md)

## Before publishing

- [ ] `pnpm verify` — build, typecheck, and file-size budget
- [ ] `pnpm test:unit`
- [ ] `pnpm test:e2e` — the Playwright suite (through `scripts/safe-run.sh` on the dev laptop)
- [ ] `pnpm format:check`
- [ ] `pnpm secret:scan` — needs `gitleaks` installed locally
- [ ] `git diff --check`

There is no ESLint. The gate is CI (`.github/workflows/ci.yml`), which runs on every pull request:
secret scan, format check, typecheck, file-size budget, unit tests, E2E, and a production build
with the `/DreamFolio` base path.

## Commits

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, with a scope
  when it helps (`refactor(convergence): …`).
- One work unit per commit, with its tests and docs alongside the behavior.
- When a change shrinks an allowlisted file, lower its ceiling in its own commit:
  `chore(ci): lower the … file-size ceiling`.
- Prefer atomic follow-up commits over rewriting history that is already shared.

## Pull requests

- One PR per cohesive unit. About 400 authored changed lines is the review budget; beyond it,
  slice into chained PRs or justify a size exception.
- The PR body states what changed and the evidence: commands run and their observed results. List
  skipped checks and why.

## Reviews

- An approved review merges. Advisory or informational findings become GitHub issues, not another
  review → fix → review loop on the same PR.
- A blocking finding gets one scoped correction, then the review closes.
- Record which follow-up issue holds each deferred finding.

## Deployment

- GitHub Pages is primary: the `Deploy to GitHub Pages` workflow (`.github/workflows/deploy.yml`)
  builds under `/DreamFolio`.
- Vercel is secondary: `pnpm deploy` (production) or `pnpm deploy:staging` (preview), served from
  `/`.
- After a merge, confirm CI and the deploy succeeded and probe the live site before calling the
  work done.
