# Tasks: Project Hardening (Repo Hygiene Closeout)

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | ~1550-1650 total across all units (see per-unit estimates below); no single non-docs unit exceeds ~90 lines |
| 400-line budget risk | High (driven entirely by unit 6 / docs Batch C2) |
| Chained PRs recommended | Yes — 8 independent work units |
| Suggested split | PR 1 → PR 8 (see table); Batch C further split into C1 (getting-started) and C2 (best-practices), C2 may need an internal 2-commit split |
| Delivery strategy | auto-chain |
| Chain strategy | pending — **not yet chosen this session; flagged for the orchestrator to ask the user** (see Risks) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Per-Unit Line Estimates (additions + deletions)

| Unit | Files | Existing lines | Estimated changed lines | Risk |
| ------ | ------- | ----------------- | -------------------------- | ------ |
| 1 — 404 e2e spec | `tests/404/404-page.ts`, `tests/404/404.spec.ts` (new) | 0 | ~65-85 | Low |
| 2 — `.env.example` cleanup | `.env.example` | unknown (permission-denied) | ~15-30 | Low |
| 3 — docs Batch A (root+arch) | 4 files | 127 | ~250-290 | Low-Medium |
| 4 — docs Batch B (components) | 5 files (4 deleted) | 90 | ~110-135 | Low |
| 5 — docs Batch C1 (getting-started.md) | 1 file | 200 | ~130-180 | Medium |
| 6 — docs Batch C2 (best-practices.md) | 1 file | 553 | **~750-950** | **High — exceeds budget alone** |
| 7 — docs Batch D (lib) | 1 file | 16 | ~40-50 | Low |
| 8 — LICENSE | `LICENSE` (new) | 0 | ~21 | Low |

Unit 6 alone is confirmed to exceed the 400-line budget: `best-practices.md` is 553 lines of "extensively fictional" content (proposal.md) describing a React 19.2/Motion/Zod/shadcn stack that does not exist. A rewrite touching most of the file yields an estimated 750-950 changed lines even before counting Unit 5. It MUST ship as its own PR, separate from Units 3/4/5/7/8, and task 6.2 requires measuring the actual diff before commit and splitting into 2 sequential section-based commits if it still exceeds ~400.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
| ------ | ------ | ----------- | ---------------------- | ----------------- | ------------------- |
| 1 | 404 e2e spec | PR 1 | `pnpm run test:e2e -- tests/404` | Playwright against `astro preview` (existing CI harness) | Delete `tests/404/` |
| 2 | `.env.example` cleanup | PR 2 | `grep -E "SUPABASE\|OPENAI_API_KEY\|ANTHROPIC_API_KEY\|GOOGLE_AI_API_KEY" .env.example` (expect no match) | N/A — static config file, no runtime effect | `git revert` single commit |
| 3 | docs Batch A | PR 3 | N/A — docs only | N/A — no build/runtime dependency on `docs/` | `git revert` single commit |
| 4 | docs Batch B | PR 4 | N/A — docs only | N/A | `git revert` single commit |
| 5 | docs Batch C1 | PR 5 | N/A — docs only | N/A | `git revert` single commit |
| 6 | docs Batch C2 | PR 6 (possibly 2 commits) | N/A — docs only | N/A | `git revert` per commit |
| 7 | docs Batch D | PR 7 | N/A — docs only | N/A | `git revert` single commit |
| 8 | LICENSE | PR 8 | `test -s LICENSE && grep -q "MIT License" LICENSE` | N/A — static file | `git revert` single commit |

Units 1, 2, 4, 7, 8 have no ordering dependency on each other. Units 3, 5, 6 (docs) are content-independent of the rest but sequenced after per the proposal so sub-slicing doesn't block the quick wins.

## Phase 1: 404 e2e spec

- [x] 1.1 Create `tests/404/404-page.ts`: `NotFoundPage extends BasePage`, `heading` locator (`getByRole('heading', { name: 'Página no encontrada' })`), `backLink` locator (`getByRole('link', { name: /Volver al inicio/ })`), `goto()` override navigating to `/nonexistent-route-hardening-test` (read-only).
- [x] 1.2 Create `tests/404/404.spec.ts`: 2 tests tagged `@critical`, `@404`, `@404-E2E-001` and `@404-E2E-002` — (a) unknown route renders `heading` + `page.getByText('404')` visible; (b) `backLink` href resolves to base path and click navigates to the home page.
- [x] 1.3 Run `pnpm run test:e2e` and confirm both new tests pass with zero regressions in existing suites.

## Phase 2: `.env.example` cleanup

- [ ] 2.1 Read `.env.example` directly (apply-phase read) and capture its current content as a diff baseline before editing.
- [ ] 2.2 Re-verify zero references via `grep -rE "SUPABASE_|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY" src/` (read-only).
- [ ] 2.3 Remove `SUPABASE_*`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` lines and their section headers/comments from `.env.example`; keep the file present — if no vars remain, leave a short comment noting no required env vars (referenced by `README.md` and `docs/guides/getting-started.md`).
- [ ] 2.4 Verify: `grep -E "SUPABASE|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY" .env.example` returns no matches.

## Phase 3: docs/ rewrite — Batch A (root + architecture)

- [ ] 3.1 Rewrite `docs/README.md` to describe the real static Astro architecture (zero islands, 3 UI components).
- [ ] 3.2 Rewrite `docs/architecture/README.md`: remove hydrated-islands/React claims; document actual `src/components/ui/{Icon,Navbar,ProfileCard}.astro` and `src/pages/{index,404,projects/index,projects/[id]}.astro`.
- [ ] 3.3 Rewrite `docs/architecture/stack-comparison.md` to drop the fictional React/Supabase comparison.
- [ ] 3.4 Replace `docs/architecture/islands-architecture.md` content with a short note that the site has zero client-side hydration by design (do not delete — avoid a dangling link from `docs/README.md`).
- [ ] 3.5 Verify: grep `docs/README.md` and `docs/architecture/*.md` for `EnhancedHero`, `EvidenceEngine`, `TechnicalIntake`, `Supabase`; confirm no matches.

## Phase 4: docs/ rewrite — Batch B (components)

- [ ] 4.1 Delete `docs/components/collaboration.md`, `docs/components/technical-intake.md`, `docs/components/hero.md`, `docs/components/navigation.md` (all document nonexistent components).
- [ ] 4.2 Rewrite `docs/components/README.md` as a catalog of the real 3 files in `src/components/ui/` (read-only reference): `Icon.astro`, `Navbar.astro` (vanilla Astro, no hydration, per commit `af68540`), `ProfileCard.astro`.
- [ ] 4.3 Verify: `docs/components/` contains only `README.md`; grep it for `React`, `.tsx`, `hydrat`; confirm no matches.

## Phase 5: docs/ rewrite — Batch C1 (`docs/guides/getting-started.md`)

- [ ] 5.1 Update `docs/guides/getting-started.md`: correct prerequisites to `pnpm@10.33.0` and Node 22 (per `.github/workflows/deploy.yml:38`, read-only), remove `src/components/sections/` from the project-structure diagram, remove the `tailwind.config.mjs` reference (Tailwind 4 is CSS-first, no config file exists), replace the tree with the real `src/` layout (`components/ui/`, `content.config.ts`, `data/`, `layouts/`, `lib/`, `pages/`, `styles/`).
- [ ] 5.2 Verify: grep the file for `Node 18`, `pnpm 8`, `tailwind.config.mjs`, `components/sections`; confirm no matches.

## Phase 6: docs/ rewrite — Batch C2 (`docs/guides/best-practices.md`) — HIGH RISK, own PR

- [ ] 6.1 Rewrite `docs/guides/best-practices.md` around the real conventions in `.claude/rules/code-standards.md` (read-only): TypeScript strict, `.astro` vs `.tsx` usage (repo is currently 100% `.astro`, zero `.tsx`), Tailwind utilities, file naming. Remove the entire "Bleeding Edge Stack" section (React 19.2, Motion v12, Zod, shadcn `ui/button.tsx`, `cn()` helper — confirmed nonexistent, `src/content/config.ts`).
- [ ] 6.2 Before committing, run `git diff --stat -- docs/guides/best-practices.md` to measure the actual changed-line count; if it exceeds ~400, split into 2 sequential commits by section (prerequisites/conventions vs. examples/testing/git) instead of shrinking content to fit budget.
- [ ] 6.3 Verify: grep the file for `React 19`, `Motion`, `shadcn`, `cn()`, `src/content/config.ts`, `Zod`; confirm no matches.

## Phase 7: docs/ rewrite — Batch D (lib)

- [ ] 7.1 Rewrite `docs/lib/README.md` to document the real 4 files (read-only references): `src/lib/site.ts` (`withBase` helper, used in `404.astro`), `src/lib/icons.ts`, `src/lib/project-presentation.ts`, `src/lib/project-case-studies.ts`; remove the reference to nonexistent `src/lib/utils.ts`.
- [ ] 7.2 Verify: grep the file for `utils.ts`; confirm no match; confirm all 4 real filenames appear.

## Phase 8: LICENSE

- [ ] 8.1 Create root `LICENSE` with the standard MIT license text and copyright line `Copyright (c) 2026 Dreamcoder08`.
- [ ] 8.2 Verify: `LICENSE` is non-empty and contains the string `MIT License`.

## Phase 9: Final verification

- [ ] 9.1 Run `pnpm run build`; confirm it stays green with no errors.
- [ ] 9.2 Run `pnpm run test:e2e`; confirm the full Playwright suite passes including the new `tests/404/` spec.
- [ ] 9.3 Re-check proposal.md's Success Criteria against final state (404 spec passes, `.env.example` clean, `docs/` accurate except the flagged-out-of-scope `docs/github-profile-README.md`, `LICENSE` present).
