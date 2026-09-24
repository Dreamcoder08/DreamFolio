# Feature: Sci-fi narrative — Phase 2, scroll narrative + cross-document transitions

## Objective

Make moving through the portfolio feel like one continuous sci-fi sequence: pages hand off to each other with native cross-document View Transitions (project art "travels" from the homepage card to its case study), and the homepage reads as a mission log whose sections enter with native CSS scroll-driven animations, tracked by a HUD-style progress rail.

## Why

Phase 2 of the approved sci-fi redesign (2026-09-24). User authorized full autonomous implementation and delivery (2026-09-25).

## Scope (authorized)

- T0 prep refactor of the phase-1 controller (modularity debt flagged in PR #53).
- Cross-document View Transitions for `/`, `/projects/`, `/projects/[id]/`.
- Scroll-driven section narrative + progress rail on the homepage.
- Out of scope: phase 3 (MU-TH-UR contact terminal, ⌘K console); content/copy changes.

## Constraints

- Zero new runtime dependencies and zero new JS for the effects: CSS `@view-transition`, `view-transition-name`, `animation-timeline: view()/scroll()`.
- Progressive enhancement: unsupported browsers and `prefers-reduced-motion: reduce` get today's behavior (global reduced-motion guard in `global.css:264-275` already neutralizes `animation`).
- One mechanism per property: elements taken over by `animation-timeline` drop `data-reveal` (no double animation of opacity/transform with the IntersectionObserver reveal).
- CSP: no inline `style` attributes (not hashed) — all rules in `portfolio.css` / `global.css` / component `<style>`; `view-transition-name` per project via classes (names unique per document).
- Only 3 projects have art on both ends (drenyra, dreamcoder-workbench, digital-public-peru) — shared-element scope is those 3; homepage cards are hand-authored.
- `tests/unit/transition-contract.test.ts` must stay green (no bare-time `transition*` literals, no universal transition rule).
- Laptop safety: heavy checks via `scripts/safe-run.sh`, one at a time, cool < 75 °C, Playwright 2 workers.
- Artifacts English; Conventional Commits; no AI attribution.

## TDD

- Mode: not configured → ordinary functional checks. Runner: `pnpm test:unit`, `pnpm test:e2e`, `pnpm check`, `pnpm run format:check`.

## Checklist

- [ ] T0 Extract pure helpers from `src/lib/convergence/controller.ts` (`parseHexColor`, `readThemeColors`, `pickParticleCount`, `domRectToFieldAnchor`) into a tested module; document why the remaining closures stay (shared mount state) — route: delegated writer
- [ ] T1 Cross-document View Transitions: opt-in, sci-fi root transition, shared project art + title for the 3 projects, reduced-motion off — route: delegated writer
- [ ] T2 Scroll-driven section narrative + HUD progress rail, `@supports`-gated, replaces `data-reveal` where taken over — route: delegated writer
- [ ] T3 e2e + snapshots + perf probe + real-Chrome check; RDD review; PR(s) — route: parent + writer

## Acceptance criteria

- Navigating home → project detail in Chromium shows the project art morphing into the detail cover; back navigation reverses it.
- Sections enter with scroll-linked motion in supporting browsers; unsupported browsers/reduced motion see content immediately (no hidden content, ever).
- No CLS, no horizontal overflow, Lighthouse a11y 100, perf not regressed vs main; all existing tests green.

## Progress

- Branch `feat/scifi-scroll-narrative` from `origin/main` 71a0ddd (phase 1 merged via #51–#54).
- Next: T0.

## Verification evidence

(filled per task)
