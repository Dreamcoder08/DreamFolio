# Feature: Sci-fi narrative — Phase 1, hero "convergence field"

## Objective

Turn the hero headline "Ideas que se vuelven sistemas" into a signature interactive moment: a WebGL particle field that starts as scattered "ideas" (chaos) and converges into a structured "system" graph (hubs + edges) as the visitor arrives and scrolls. Inspired by Asimov's psychohistory (chaos becoming predictable), Arrival's logograms and HAL 9000's amber eye (existing accent `#ff7a18`).

## Why

User request (2026-09-24): elevate the portfolio to award-winning level (Awwwards/FWA tier), sci-fi inspired; approved the phased direction and authorized full implementation, plus automation of repeated work (scripts for anything done >2 times, skills via skill-creator for repeated workflows) and clean architecture / modularity / code quality.

## Scope (authorized)

- Phase 1 only in this document: hero convergence field.
- Later phases (separate documents): 2) scroll narrative + cross-document View Transitions for `/projects/[id]`; 3) MU-TH-UR style contact terminal + ⌘K ship console.

## Constraints

- Zero new runtime dependencies: raw WebGL2, no Three.js/OGL, no React.
- Progressive enhancement: no JS / no WebGL2 / `prefers-reduced-motion: reduce` → current hero unchanged and fully readable.
- CSP stays as is (`default-src 'self'`); script ships as an Astro-bundled module.
- Performance budget: Lighthouse performance ≥ 95 on the homepage; hero script ≤ ~12 KB gzip; render loop pauses when off-screen or tab hidden; DPR capped.
- Accessibility: canvas `aria-hidden`, text contrast on hero stays WCAG AA in both themes.
- Colors read from theme tokens, so light and dark theme both work and theme toggles update live.
- Clean architecture: pure domain (field generation, progress mapping) separated from the WebGL adapter and the DOM driver; pure modules unit-tested with `node --test`.
- Artifacts in English; Conventional Commits; no AI attribution.

## Architecture

```
src/lib/convergence/
  random.ts      pure  seeded PRNG (deterministic layouts, testable)
  field.ts       pure  chaos + order positions, per-particle delay/size
  progress.ts    pure  intro(time) + scroll(rect, viewport) → 0..1
  shaders.ts     data  GLSL ES 3.00 sources
  renderer.ts    adapter  WebGL2 program/buffers/draw, context loss
  controller.ts  driver   rAF, IntersectionObserver, visibility, theme, pointer
src/components/ui/ConvergenceField.astro   canvas + <script> entry
```

## TDD

- Mode: not configured in project/session (no TDD setting found) → ordinary functional checks.
- Runner: `pnpm test:unit` (node --test, strip-types), `pnpm test:e2e` (Playwright), `pnpm check`.
- Pure modules still get unit tests alongside the code.

## Checklist

- [x] T1 Pure domain: `random.ts`, `field.ts`, `progress.ts` + unit tests — route: delegated writer (2+ non-trivial files)
- [x] T2 WebGL adapter + driver + `ConvergenceField.astro`, mounted in hero, CSS layering — route: delegated writer
- [x] T3 E2E coverage (canvas present + aria-hidden, reduced-motion static state, no console errors, hero text visible) — route: same writer as T2
- [x] T4a Fix visual findings (orbit around portrait, edge lines, timing, full-bleed, mask) — route: same delegated writer — 373fcd1
- [x] T4b Distribute constellation around content (rejection sampling + targeted contrast protection) — route: fresh delegated writer; reason: pass 2 showed hubs piled on card border, column mask left ~100px visible band — 1998fc5 (also fixed aspect-domain sampling bug)
- [x] T4c Protect all small hero text (kicker, intro, brief, ticker) from edges/hubs — route: same writer as T4b — e504544
- [x] T4d Performance: on-demand rendering, no per-frame layout reads, deferred mount, failIfMajorPerformanceCaveat — route: same writer; reason: Lighthouse mobile perf 64, TBT 5,400 ms — a0c4f9d
- [x] T6 Reliability hardening from RDD advisory findings: reduced-motion resize/theme blank, context-restore redraw, setField upload failure, e2e exercising the running path via forced WebGL — route: delegated writer — 8570a2c, 1f9dffa
- [x] T4f Split the field mount long task — 66c1d69; probe now median-gated (3899c25): field adds 54 ms median, PASS
- [x] T7 Review follow-ups (lineage review-c33426cce1406d5b, approved): context-restore async window draws stale handles (R3+R4), restore test doesn't prove redraw, readPixels on every draw in forced suite, resize-after-degrade, stale comments (compileProgram ref, `!created` typo, T4f rationale), untested earlyAbort/failed-restore paths — route: delegated writer. safe-run fallback fixed inline (ad703ce). Done: cd6ac8d, 214b3f6, 5fa97b5 (earlyAbort test skipped: not deterministic).
- [x] T8 Real-GPU verification in the user's Chrome (visual both themes, FPS/long tasks, console) — route: inline (parent), window must be foreground
- [ ] T4e (optional, aesthetic) Constellation density: sparse in headless 1440px snapshots but reads well on the user's real 1490px screen; lines cross the display headline at low alpha by design. Revisit only if the user wants more density.
- [x] T4 Visual/perf verification: browser check both themes + mobile width, contrast, Lighthouse — route: inline (parent)
- [x] T5 Automation review — done so far: `scripts/visual-snapshots.mjs` + `pnpm snapshots` (0a4f1a2), created after the 3rd manual visual check; background Chrome tabs never run rAF, so headless Playwright is the reliable path.
      Plus `scripts/perf-probe.mjs` + `pnpm perf:probe` and shared `scripts/lib/force-webgl.mjs` (04a27a2) after the 3rd manual perf measurement; local skill `.claude/skills/creative-motion-feature` (gitignored dir, like the other project skills) for the WebGL/motion workflow reused in phases 2–3.

## Acceptance criteria

- Hero shows scattered particles on load that drift toward a hub-and-edge graph; scrolling through the hero completes the convergence; scrolling back reverses it.
- Subtle pointer influence on desktop; no pointer effect on touch.
- Reduced motion: a single static, fully-converged frame (or none), no loop.
- No WebGL2: canvas removed, no errors.
- All existing Playwright + unit tests stay green; `pnpm check` clean.

## Progress

- Branch `feat/scifi-hero-convergence` from `origin/main` (8bb5607), upstream unset on purpose.
- T1–T3 committed (2b3ae36, 6dd050a).
- T4 in progress: first visual pass FAILED design intent → reopened as T4a (layout-aware orbit around portrait, edge lines, timing, full-bleed, mask).
- T4a committed 373fcd1 (unit 65/65, e2e 92/92, 6492 B gzip).
- Laptop shut down twice under load (7.2 GB RAM, 12 Chromium workers + SwiftShader, 86–89 °C). Added PW local worker cap + `scripts/safe-run.sh` (9e07c0c); heavy checks now sequential with cool-down < 75 °C.
- Reviewed boundary: a0c4f9d; review of a0c4f9d..3899c25 (high, 4 lenses sequential): APPROVED, acknowledged, burned → boundary 3899c25. Review of 3899c25..5fa97b5 (high, 4 lenses sequential): APPROVED, burned → boundary 5fa97b5; its two double-flagged findings (restoreGeneration on loss, safe-run probe properties) fixed inline. T8 done on real GPU. Phase 1 complete pending the user's delivery decision (push/PR). Next phase: 2 (scroll narrative + View Transitions).

## Verification evidence

- T1–T3 (writer, parent spot-checked `pnpm test:unit`: 60/60 pass): check clean; e2e 92/92; chunk 5423 B gzip; WebGL2 available in headless Chromium.
- T4 visual pass 1 (parent, 1705x781, dark+light): state `running`, no errors; BUT converged graph hidden behind opaque portrait card, reads as dust, converges off-screen, canvas limited to 1320px wrap.
- T4 visual pass 2 (parent, `pnpm snapshots`, 6 viewport×theme combos): all `running`, 0 overflow, 0 console errors. Mobile good; light theme not muddy; desktop constellation squeezed into a sliver on the card's left border → T4b.
- T4 visual pass 3 (parent, snapshots of 1998fc5): constellation distributed and legible as a network; defect: edges/hubs over kicker + ticker small text → T4c.
- T4 pass 4 (parent, snapshots of e504544): 6/6 combos running, 0 overflow, 0 errors; small text clean; desktop density dropped (aesthetic follow-up T4e).
- Lighthouse 13.5 mobile on e504544: perf 64, a11y 100, BP 100, SEO 100; TBT 5,400 ms, LCP 2.9 s, CLS 0.001; ConvergenceField chunk 11,012 ms bootup → T4d.
- Lighthouse after a0c4f9d (writer; baseline origin/main = 95/TBT 0): perf 95, TBT 0 ms. Caveat: Lighthouse runs SwiftShader, where the field is now intentionally removed.
- perf:probe (parent, field forced, 4x CPU, 390px): field adds 164–289 ms blocking (noisy; one mount task), then `idle-settled` = no CPU. Over 250 ms budget → T4f.
- RDD review lineage review-cd59ba6c84086315 (medium, lens reliability) on 8bb5607..a0c4f9d: APPROVED, acknowledged, authority burned. 5 advisory findings → T6 (R3-snapshot-state-not-gated fixed in 04a27a2).
- Parent re-verification after restart (capped, sequential): check exit 0; unit 68/68; e2e 99/99 (2 workers, incl. 7 forced-WebGL running-path tests); snapshots exit 0 (6/6, no visual regression); perf:probe median: field adds 54 ms (samples forced 429/230/286, fallback 277/80/232 — single loads are ±100 ms noise).
- T7 (writer, capped/sequential, peak 94 °C): check 0; unit 68/68; forced spec 8/8; e2e 100/100; perf:probe field adds 66 ms median. Parent spot-check: unit 68/68.
- Review 3 follow-ups (parent, capped): check 0; build 0; convergence specs 13/13.
- T8 real GPU (user's Chrome, AMD Radeon Renoir via ANGLE/OpenGL ES 3.2, 1490x907, DPR 1): states idle→running→idle-settled; hidden tab → `paused` (correct); scroll 0→600→0: 212 frames, median/p95/max frame gap 17 ms (60 fps), 0 long tasks during scroll; load-time long tasks 82 + 131 ms (unattributed, unthrottled); live theme switch updates colors; 0 console errors; headline/brief/kicker/ticker legible in light and dark.
