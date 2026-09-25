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

- [x] T0 Extract pure helpers from `src/lib/convergence/controller.ts` (`parseHexColor`, `readThemeColors`, `pickParticleCount`, `domRectToFieldAnchor`) into a tested module; document why the remaining closures stay (shared mount state) — route: delegated writer
- [x] T1 Cross-document View Transitions: opt-in, sci-fi root transition, shared project art + title for the 3 projects, reduced-motion off — route: delegated writer
- [x] T2 Scroll-driven section narrative + HUD progress rail, `@supports`-gated, replaces `data-reveal` where taken over — route: delegated writer
- [ ] T3 e2e + snapshots + perf probe + real-Chrome check; RDD review; PR(s) — route: parent + writer

## Acceptance criteria

- Navigating home → project detail in Chromium shows the project art morphing into the detail cover; back navigation reverses it.
- Sections enter with scroll-linked motion in supporting browsers; unsupported browsers/reduced motion see content immediately (no hidden content, ever).
- No CLS, no horizontal overflow, Lighthouse a11y 100, perf not regressed vs main; all existing tests green.

## Progress

- Branch `feat/scifi-scroll-narrative` from `origin/main` 71a0ddd (phase 1 merged via #51–#54).
- T0 340700c, T1 8622f4b, T2 (this commit) committed by the writer.
- Phase 1 live: Pages deploy 71a0ddd success; live headless probe `idle-settled`, no errors.
- Next: T3 (parent) — real-Chrome visual check of the wipe/morph transition and the scroll narrative, RDD review, PR(s).

## Verification evidence

- `pnpm test:unit`: 76/76 pass (includes 10 new tests for `theme-geometry.ts`; `transition-contract.test.ts` stays green).
- `pnpm check`: clean (astro sync + tsc --noEmit).
- `pnpm run format:check`: clean.
- `pnpm test:e2e` (full suite, build + Playwright): 114/114 pass, including the new `tests/transitions/view-transitions.spec.ts` (10 tests) and `tests/home/scroll-narrative.spec.ts` (4 tests), and the updated `tests/theme-state/motion.spec.ts` (`.module-row`'s reveal is now scroll-narrated in a supporting browser — 3 of its assertions were rewritten to match, not skipped).
- `pnpm snapshots`: 6/6 viewport×theme combos, 0 horizontal overflow, 0 console errors; desktop-dark-scroll40 shows the HUD rail + swept-in kicker underline + settled heading/cards; mobile-light-scroll20 shows no rail (desktop-only, as designed).
- `pnpm perf:probe`: field adds 20 ms of blocking time at 4x CPU (budget 250 ms) — unaffected by T1/T2 (no new JS).
- Real bugs found and fixed by this verification pass (not just theoretical): (1) the build's CSS minifier folds a separate `animation-timeline` declaration into the `animation` shorthand, which this repo's own Chromium accepts as a _longhand_ property but not yet as a shorthand component — silently dropping every scroll-driven rule; fixed by spelling out `animation-name`/`-timing-function`/`-fill-mode`/`-timeline` as longhands. (2) `.about-section`/`.contact-section`'s `overflow: hidden` (for a bleeding decorative glyph) made each section a CSS scroll container, which silently became the `view()` timeline's reference scroller for their kicker/heading instead of the document — fixed with `overflow: clip`, which clips the same way without creating a scroll container.
- Not verified here: the real-GPU visual quality of the transition/narrative in a real browser (headless/software-rendered only) — flagged for T3's real-Chrome check.
- Parent verification (capped, sequential): unit 76/76; check 0; format:check clean; full e2e 115/115; stress run of motion + transitions + narrative specs ×3: 99/99.
- RDD review lineage review-3f773a2620796bf9 (medium, reliability) on 71a0ddd..895e0a5: APPROVED, acknowledged, burned. Its 4 advisory findings fixed: rail-fill test now polls (e18234e), motion contracts skip without scroll-timeline support + deterministic trace (4252130), view-transition nesting proven (9c68ddd), particle budget wording (f241c3b). Follow-ups assessed: medium, under_budget (187 lines) → pending, no review due.
- Found by the parent: missing stagger coverage (added, e18234e); a flaky motion trace (~1 in 8 under load). Root cause: the site's `scroll-behavior: smooth` turns programmatic `scrollTo` into smooth scrolls that skip frames under load, so scroll-driven reveals crossed their entry range in one frame. Fixed with an instant jump + 8 px instant steps.
