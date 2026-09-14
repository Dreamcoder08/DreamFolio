# Apply Progress: Project Hardening (Repo Hygiene Closeout)

## Workload / PR Boundary
- Mode: chained PR slice (`auto-chain`, `stacked-to-main` per parent-orchestrator instruction for this launch)
- Current work unit: Unit 1 / PR 1 — 404 e2e spec
- Boundary: starts at repo HEAD (no prior work on this change), ends with `tests/404/404-page.ts` + `tests/404/404.spec.ts` created and green
- Estimated review budget impact: ~40 authored lines (well under the 400-line budget; per-unit estimate in tasks.md was 65-85)

## Phase 1: 404 e2e spec — COMPLETE

**Mode**: Standard (Strict TDD not active for this project; writing the spec is itself the task).

### Completed Tasks
- [x] 1.1 Create `tests/404/404-page.ts`: `NotFoundPage extends BasePage`, `heading` locator, `backLink` locator, `goto()` override to `/nonexistent-route-hardening-test`.
- [x] 1.2 Create `tests/404/404.spec.ts`: 2 tests tagged `@critical`, `@404`, `@404-E2E-001`/`002`.
- [x] 1.3 Run `pnpm run test:e2e` — full suite green (19/19), including both new tests.

### Files Changed
| File | Action | What Was Done |
|------|--------|----------------|
| `tests/404/404-page.ts` | Created | Page Object extending `BasePage`; `heading` (`getByRole('heading', { name: 'Página no encontrada' })`), `backLink` (`getByRole('link', { name: /Volver al inicio/ })`); `goto()` override navigating to `/nonexistent-route-hardening-test` |
| `tests/404/404.spec.ts` | Created | 2 tests: (1) unknown route renders `heading` + visible `page.getByText('404')`; (2) `backLink` has `href="/"` and clicking it navigates to `/` |
| `openspec/changes/project-hardening/tasks.md` | Modified | Marked tasks 1.1-1.3 `[x]` |

### Work Unit Evidence
| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm run test:e2e` → `19 passed (12.8s)`, including `tests/404/404.spec.ts:5:3` (`@404-E2E-001`) and `tests/404/404.spec.ts:17:3` (`@404-E2E-002`) |
| Runtime harness command/scenario and exact result | Playwright against `astro build` + static `serve` on `localhost:4321` (existing CI harness, `SITE_BASE=/`) — full 19-test suite passed with zero regressions in `tests/home/`, `tests/projects/`, `tests/project-detail/` |
| Rollback boundary | `git rm -r tests/404/` and revert the two `[x]` checkboxes in `tasks.md` — no other files touched |

### Deviations from Design
None — implementation matches `design.md`'s literal `404-page.ts` code and the 2-test `404.spec.ts` structure verbatim. `backLink` href asserted as `'/'` (not a generic "base path" check) because `test:e2e` always runs with `SITE_BASE=/`, making `withBase("/")` deterministically `/` in this harness.

### Issues Found
None.

### Remaining Tasks (out of scope for this launch — other phases/PRs)
- [ ] Phase 2 — `.env.example` cleanup (PR 2)
- [ ] Phase 3 — docs Batch A (PR 3)
- [ ] Phase 4 — docs Batch B (PR 4)
- [ ] Phase 5 — docs Batch C1 (PR 5)
- [ ] Phase 6 — docs Batch C2 (PR 6)
- [ ] Phase 7 — docs Batch D (PR 7)
- [ ] Phase 8 — LICENSE (PR 8)
- [ ] Phase 9 — Final verification (after all units land)

### Status
3/3 Phase 1 tasks complete (3/27 total tasks across the full change). Ready for `sdd-verify` on this work unit; orchestrator to route remaining phases as separate chained PRs.

---

## Slice 1 of the re-sliced chain: Phase 2 (`.env.example`) + Phase 8 (LICENSE) — COMPLETE

### Delivery shape, decided before this apply

The Review Workload Guard fired on this change's own forecast (`Chained PRs recommended: Yes`,
`400-line budget risk: High`, `Decision needed before apply: Yes`, chain strategy
`pending — flagged for the orchestrator to ask the user`). The cached session strategy is
`ask-on-risk`, so it was asked rather than inferred. Maintainer decision:

- **`delivery_strategy: auto-chain`, `chain_strategy: stacked-to-main`**, re-sliced into **four**
  PRs instead of the planned eight: (1) `.env.example` + `LICENSE`; (2) docs A + B + D;
  (3) docs C1; (4) docs C2 alone. Each rebases on `main` in sequence.
- Rationale: units 2, 3, 4, 7 and 8 are independent (the task list says so) and small; unit 6
  cannot fit the budget under any grouping, so it stays alone as the forecast requires.

### Executor, and why it is not `sdd-apply`

This slice was implemented by the orchestrator, not by the `sdd-apply` phase agent.
`sdd-apply` has stalled 2/2 on this machine in this repository, and the standing local
decision for that condition — recorded in this project's memory — is *parent implements,
subagent verifies*. The independent verification for this slice is the review of its PR, which
is a separate actor from the implementation.

### Completed Tasks

- **2.1** Read `.env.example` and captured the baseline: nine lines, three `SUPABASE_*` keys and
  three AI API keys, in four commented sections. No variable in it is read by `src/`.
- **2.2** Re-verified zero references: `grep -rE "SUPABASE_|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY" src/` exits 1 (no matches).
- **2.3** Rewrote `.env.example` as a comment block declaring no required environment variables
  and naming where the optional build-time overrides actually come from.
- **2.4** `grep -E "SUPABASE|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY" .env.example` exits 1. Clean.
- **8.1** Created root `LICENSE` with the standard MIT text and `Copyright (c) 2026 Dreamcoder08`.
- **8.2** `test -s LICENSE && grep -q "MIT License" LICENSE` passes.

### Files Changed

- `.env.example` — the nine dead lines replaced by a seven-line comment.
- `LICENSE` — new.
- `README.md` — one stale note removed; see Deviations.

### Work Unit Evidence

| Command | Result |
| --- | --- |
| `grep -E "SUPABASE\|OPENAI_API_KEY\|ANTHROPIC_API_KEY\|GOOGLE_AI_API_KEY" .env.example` | exit 1 — no matches (2.4) |
| `test -s LICENSE && grep -q "MIT License" LICENSE` | passes (8.2) |
| `pnpm run test:unit` | 15/15 |
| `pnpm run verify` | exit 0 — build plus clean `tsc` |
| `pnpm run format:check` | exit 0 |
| `git diff --check` | exit 0 |

`test:unit` is not decoration here: `README.md` is an input to the token contract's A6
assertion, so the README edit is covered by a test rather than by inspection.

### Deviations from Design

1. **`README.md`'s note about `.env.example` is removed.** That note existed to explain the wart
   this slice removes ("el archivo referencia Supabase y APIs de IA… ninguna variable ahí listada
   es consumida por el código actual"). Once the file is clean the note is false, so it goes with
   it. Its historical content is not lost: the README's security section already documents the
   same provenance (commit `842b1c3`, "remove Supabase, go fully static") and the unrotated anon
   key, and that section is untouched.
2. **The `.env.example` comment does not name the removed variables**, deliberately: task 2.4's
   verification greps that file for `SUPABASE`, so the comment cannot mention it.
3. **Phases 2 and 8 ship together** although the plan ordered them as PR 2 and PR 8. The re-slicing
   above is the maintainer's decision and the task list itself declares both order-independent.

### Issues Found

1. **The harness safety policy blocks writes to `.env.example`** as a sensitive `.env*` path, with
   both the file tools and bash — the guard is path-based and does not consult the maintainer's
   authorization. Resolved by asking for an explicit plan and executing the exact authorized
   content; the first attempt to write the file with the ordinary tool was refused, and the
   recorded path was the maintainer-approved one. Worth knowing for the rest of this change: any
   future `.env*` edit will hit the same guard.
2. **`main` does not ignore the native runtime marker.** `.gentle-ai-instance` is untracked and
   *not* ignored on `main`, because the `.gitignore` rule that covers it currently travels only
   inside the unmerged PR #29. It was therefore never staged here. That rule belongs on `main`.

### Remaining Tasks

- [ ] Phase 3 — docs Batch A (slice 2)
- [ ] Phase 4 — docs Batch B (slice 2)
- [ ] Phase 7 — docs Batch D (slice 2)
- [ ] Phase 5 — docs Batch C1 (slice 3)
- [ ] Phase 6 — docs Batch C2 (slice 4, alone)
- [ ] Phase 9 — Final verification (after all slices land)

### Status

6/6 tasks of this slice complete (9/27 total). Gates green on the final bytes. Ready for the
independent review of its PR; the remaining slices follow as separate chained PRs.
