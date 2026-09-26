# Feature: Split portfolio CSS without changing rendered styles

## Objective

Replace the 2,299-line `src/styles/portfolio.css` with ordered, unlayered partials below the 250-line CSS budget while preserving effective rules and cascade.

## Why

The sci-fi redesign left this single file too large to maintain. The prior session began the split on `refactor/split-portfolio-css`; this session resumes its staged work.

## Scope and constraints

- Preserve original declarations and order. Do not introduce cascade layers or change page appearance.
- Keep contract tests reading the effective imported CSS and file-size budget truthful.
- Verify with focused unit checks and a thermal-protected build; laptop must not overheat (`scripts/safe-run.sh`, one Playwright worker if needed).
- Preserve unrelated untracked `odd/tasks/aurelia21-professional-redesign.md` untouched.
- TDD mode not configured; ordinary functional verification (`pnpm test:unit`, `pnpm run check:size`, `pnpm run check`, `pnpm run format:check`, `pnpm run build`).
- Delivery strategy: auto-chain if needed, but this is a mechanical split in one work unit; do not create PR or push until verified.

## Checklist

- [x] T1 Reconcile staged split against original source and prove semantic CSS equivalence. Route: delegated read-only verifier; exact declarations/order retained. Compiled byte identity is not established and may be impossible because the last guard is reopened.
- [x] T2 Verify contracts, size, type/format and production build under thermal guard. Route: delegated verifier; all checks passed after formatting the new task document.
- [ ] T3 Review scope and deliver one reviewable work unit, leaving unrelated file untouched. Route: parent; review and delivery pending.

## Acceptance

- All 22 partials are imported in original order, unlayered, and each fits the size budget.
- No effective selector/declaration difference or changed cascade relative to HEAD prior to the split.
- Unit, size, type, format and build checks pass; report any skipped checks.

## Current evidence and next step

- Branch `refactor/split-portfolio-css` at `63099c2`; 26 staged files comprise the split, allowlist adjustment and contract-test updates. Pre-existing untracked AURELIA21 document is out of scope.
- T1 verification: `git show` comparison established that the split changes only the top-level title comment, 18 blank separators, and closes/reopens an identical `@supports`/`@media` wrapper between partials 21/22; no declarations/selectors or source order differ. 22 unlayered imports are ordered; `git diff --cached --check` passes; no URL or actual `@layer` in partials. Semantic rule/order equivalence is established; compiled byte identity was not tested and is not an acceptance gate when equivalent adjacent guards compile separately.
- A mapping worker identified misleading line locations in state-border contract failures after import inlining. Follow up if checks expose an issue; otherwise keep scope to the mechanical split.
- T2 observed: `pnpm test:unit` 121/121 pass; `pnpm run check:size` 132 files pass; `pnpm run check` pass; `scripts/safe-run.sh pnpm run build` generated 12 pages (safe-run paused twice for temperature; Shiki/CSP warning). `pnpm run format:check` passed after formatting this task document. E2E skipped for this mechanical split to avoid another full build and browser load after the thermal guard paused twice; unit contracts and a production build passed.
- Next: review staged scope, assess candidate and close the work unit.
