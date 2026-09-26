# Feature: Modularize convergence without changing rendering

## Objective

Reduce the three oversized `src/lib/convergence/` modules into cohesive, small units while preserving field determinism, WebGL lifecycle, DOM/rAF behavior and both theme geometries.

## Why

`field.ts` (380 lines), `renderer.ts` (648) and `controller.ts` (725) remain ratcheted exceptions to the 200-line TypeScript budget. Smaller units should reflect actual responsibilities, not arbitrary line cuts.

## Scope and constraints

- Extract one independently testable responsibility at a time; preserve public entrypoints and output/cleanup behavior.
- Keep PRs independent against `main` (`auto-chain`, `stacked-to-main`, selected by user). Forecast >400 authored changed lines in aggregate; target cohesive PR slices around 400 lines without code-golf. An unavoidable larger slice needs a separate maintainer `size:exception` decision.
- TDD not configured; ordinary functional checks. Field determinism via `pnpm test:unit`; `pnpm run check`, `pnpm run check:size`, `pnpm run format:check`; remote CI E2E for WebGL paths. No local Chromium/build until laptop is demonstrably cool: previous run paused at 81°C and 88°C.
- Work in isolated sibling worktrees. Preserve the unrelated untracked `odd/tasks/aurelia21-professional-redesign.md` in the original worktree.
- No UI copy or visual redesign.

## Checklist

- [ ] T1 Extract field graph/hub sampling while preserving RNG call order and `createField` API. Route: delegated writer (multi-file); verify deterministic unit tests and remote CI. Candidate branch `refactor/convergence-field-graph` based on `origin/main` at `3cfbb74`.
- [ ] T2 Extract renderer low-level shader/program/buffer helpers without changing lifecycle/restore semantics. Route: delegated writer after T1 lands; branch from then-current `main`.
- [ ] T3 Extract controller geometry preparation and uniform synchronization without moving rAF/listener ownership. Route: delegated writer after T2 lands; branch from then-current `main`.
- [ ] T4 Confirm exceptions shrink, CI E2E and deployed behavior; record remaining debt truthfully. Route: parent.

## Acceptance and evidence

- Each slice passes focused unit/type/format/size checks; CI runs convergence normal and forced WebGL E2E, build and deployment. Never claim byte-identical generated GPU output without proof.
- Budget allowlist ceilings decrease only when actual files shrink; do not raise ceilings to accommodate splits.
- Preserve original contracts, seeded field outputs, clean WebGL disposal/context restoration and reduced-motion fallback.

## Progress

- T1 code prepared: `field.ts` 380→232 lines; new `graph.ts` (60) and `hubs.ts` (64); allowlist ceiling 380→232. A seeded regression was added; the staged candidate including this document is about 342 changed lines, below the 400-line PR heuristic.
- Independent verifier compared six complete field fixtures against an executable copy of the original implementation and confirmed the new seeded fixture matches the original. `pnpm test:unit` 122/122, `pnpm run check`, Prettier and tracked diff check passed. No browser/build/E2E run locally due heat.
- All six intended paths are staged; `pnpm run check:size` passed for 136 indexed files (including both new modules), `pnpm run format:check` passed and the staged diff has no whitespace errors. Next: native review, issue/PR, remote CI E2E and deployment before marking T1 complete.
