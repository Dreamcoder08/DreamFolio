# Proposal: Project Hardening (Repo Hygiene Closeout)

## Intent

A same-session documentation-accuracy pass already fixed `.claude/CLAUDE.md`, `.claude/rules/code-standards.md`, and `README.md` (commits `842b1c3`, `af68540`), which had drifted to describe a removed React 19 + Supabase stack. The user asked what else remained and requested SDD to close the rest of the gap to "10/10". Exploration (`explore.md`) confirmed four concrete gaps: no e2e coverage for `404.astro`, dead env vars in `.env.example`, an extensively fictional `docs/` folder describing 10+ nonexistent React components, and no `LICENSE` file. This change closes all four.

## Scope

### In Scope

- Add a Playwright e2e spec for `404.astro`, following the existing `tests/home/` Page Object pattern.
- Remove dead `SUPABASE_*`/`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GOOGLE_AI_API_KEY` vars from `.env.example` (confirmed unused anywhere in `src/`).
- Rewrite `docs/` in place to describe the current real architecture (confirmed decision — not trim/centralize). Covers `docs/README.md`, `docs/architecture/*`, `docs/components/*`, `docs/guides/*`, `docs/lib/README.md`. `docs/profile-assets.md` is already accurate and untouched. `docs/github-profile-README.md` placement is flagged only, not fixed here.
- Add a root `LICENSE` file (MIT — confirmed decision).

### Out of Scope

- `docs/github-profile-README.md` relocation/removal (unresolved placement question, deferred).
- Any change to the deployed site (`docs/` is not referenced by `astro.config.mjs` or `public/`).
- Any stack or dependency change — this is documentation and hygiene only.

## Capabilities

### New Capabilities

None — pure repo-hygiene work with no user-facing behavior contract.

### Modified Capabilities

None.

## Approach

Four independent, mechanical work units, sliced to respect the 400-changed-line review budget (`delivery_strategy: auto-chain` — chained PRs are created automatically if `sdd-tasks` forecasts risk):

1. **404 e2e spec** — mechanical, templated off `tests/home/home-page.ts` + `home.spec.ts`. No design decision.
2. **`.env.example` cleanup** — mechanical deletion of confirmed-dead vars.
3. **`docs/` rewrite** — the largest unit. `docs/guides/best-practices.md` alone is 554 lines of fictional content, so this unit is expected to sub-slice further by folder (`architecture/`, `components/`, `guides/`, plus `docs/README.md` and `docs/lib/README.md`) once `sdd-tasks` sizes it.
4. **`LICENSE`** — mechanical addition of the standard MIT text with copyright holder/year.

Units 1, 2, and 4 have no ordering dependency and can proceed in parallel or any order. Unit 3 is independent in content but largest in size; it is sequenced last so its sub-slicing doesn't block the three quick wins.

## Affected Areas

| Area | Impact | Description |
| ------ | -------- | -------------- |
| `tests/404/` (new) | New | Playwright Page Object + spec for the 404 page |
| `.env.example` | Modified | Remove unused Supabase/AI-provider vars |
| `docs/README.md`, `docs/architecture/*`, `docs/components/*`, `docs/guides/*`, `docs/lib/README.md` | Modified | Rewritten to describe the current static Astro architecture |
| `LICENSE` (new) | New | MIT license text |

## Risks

| Risk | Likelihood | Mitigation |
| ------ | ------------ | ------------ |
| `docs/` rewrite exceeds 400-line budget in one PR | High | Sub-slice by folder in `sdd-tasks`; `auto-chain` creates chained PRs automatically |
| `.env.example` content was triangulated (session denies direct `.env*` reads), not read directly | Low | Apply phase attempts a direct read/diff first before deleting |
| `docs/github-profile-README.md` left unresolved | Low | Explicitly flagged as out of scope; not silently dropped |

## Rollback Plan

Each of the four units is an independent commit/PR touching disjoint files (tests, `.env.example`, `docs/`, `LICENSE`). Revert any single unit via `git revert` without affecting the others.

## Dependencies

None external. No new npm packages.

## Success Criteria

- [x] `404.astro` has a passing Playwright e2e spec
- [x] `.env.example` contains no vars unused in `src/`
- [x] Every file under `docs/` describes the actual current architecture (verified against `src/`), except the flagged-out-of-scope `docs/github-profile-README.md`
- [x] Root `LICENSE` file exists with MIT text
- [x] `pnpm run build` and `pnpm test` (Playwright) stay green throughout
