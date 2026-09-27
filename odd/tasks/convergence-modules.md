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

- [x] T1 Extract field graph/hub sampling while preserving RNG call order and `createField` API. Route: delegated writer; commit `d51036e`, PR #68 merged into `main` as `9aa05a5`; independent sampled parity, unit/CI E2E and Pages deployment passed.
- [x] T2 Extract renderer low-level shader/program/buffer helpers without changing lifecycle/restore semantics. Route: delegated writer; commit `7c60eb7`, PR #70 merged as `0968f83`, unit/CI E2E and Pages run passed.
- [x] T3 Extract controller geometry preparation and uniform synchronization without moving rAF/listener ownership. Route: delegated writer; commit `1da7fad`, PR #72 merged as `80ee33c`; CI E2E and Pages run passed.
- [x] T4 Confirm exceptions shrink, CI E2E and deployment; record remaining debt truthfully. Route: parent; this evidence-only follow-up closes issue #73.

## Acceptance and evidence

- Each slice passes focused unit/type/format/size checks; CI runs convergence normal and forced WebGL E2E, build and deployment. Never claim byte-identical generated GPU output without proof.
- Budget allowlist ceilings decrease only when actual files shrink; do not raise ceilings to accommodate splits.
- Preserve original contracts, seeded field outputs, clean WebGL disposal/context restoration and reduced-motion fallback.

## Progress

- T1 delivered: `field.ts` 380→232 lines; new `graph.ts` (60) and `hubs.ts` (64); allowlist ceiling 380→232. The seeded regression and task document made this slice 342 changed lines, below the 400-line PR heuristic.
- Independent verifier compared six complete field fixtures against an executable copy of the original implementation and confirmed the new seeded fixture matches the original. `pnpm test:unit` 122/122, `pnpm run check`, Prettier and tracked diff check passed. No browser/build/E2E run locally due heat.
- T1 native review approved; PR #68 merged and Pages run `36268418646` passed for merge SHA `9aa05a5` (incl. E2E); deployment `6683682021` succeeded and the homepage returned HTTP 200. No live GPU/visual observation is claimed.
- T2 delivered: `renderer.ts` 648→534 lines; `gl-resources.ts` 118 lines holds the original async compile/yield/buffer helpers; fake-WebGL unit test 40 lines covers upload order and null buffer. The renderer allowlist ceiling drops 648→534. One worker was interrupted after changing the import; its continuation completed the missing module and tests without discarding the partial work.
- T2 writer checks: `pnpm test:unit` 124/124 and `pnpm run check` passed. Independent readback confirmed helper bodies/GL operation order against `origin/main`; a stale renderer header was corrected. After indexing new files, `pnpm run check:size` passed for 138 files, `pnpm run format:check` and staged diff check passed. The five-path candidate is about 303 changed lines, below 400. No local browser/build/E2E due heat.
- T2 native review approved; PR #70 merged and Pages run `36290498656` succeeded for SHA `0968f83` (incl. E2E); homepage returned HTTP 200. No byte-level or live GPU observation claimed.
- T3 code prepared: `controller.ts` 725→691 lines; new `controller-geometry.ts` (60) centralizes DOM-to-field measurement, exclusions and protection-uniform packing; unit test (61) covers narrow/wide exclusions and uniform capacity/reuse. The controller ceiling drops 725→691. Writer checks: `pnpm test:unit` 126/126, `pnpm run check`, focused Prettier and tracked diff check passed. The first unit run caught an exact-decimal expectation in the new test, which was corrected. No local browser/build/E2E due heat.
- T3 independent readback found no source-level divergence in exclusions, layout, uniform packing/reuse or resize/upload/hero measurement order; rAF/listeners/observers/disposal remain in the controller. Size and format checks passed for all 140 budgeted files; the staged five-path slice was 225 changed lines. Native review approved; PR #72 merged and Pages run `36291612580` succeeded for SHA `80ee33c` (incl. E2E); homepage returned HTTP 200 without redirects. No local browser/build/E2E or live GPU inspection due heat.
- Final debt: `field.ts` 232 (+32), `renderer.ts` 534 (+334) and `controller.ts` 691 (+491) lines still exceed the default 200-line TypeScript limit, although all three ratcheted ceilings decreased from 380/648/725. The new `graph.ts` (60), `hubs.ts` (64), `gl-resources.ts` (118) and `controller-geometry.ts` (60) are below 200. The size-check passes under the reduced exceptions; it does **not** prove the default budget has been met. Stop here rather than extract the closely coupled WebGL lifecycle or controller event/render loop solely to chase a line count; revisit with a concrete functional change and independent tests.
