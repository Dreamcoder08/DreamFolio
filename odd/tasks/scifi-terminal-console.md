# Feature: Sci-fi narrative — Phase 3, MU-TH-UR contact terminal + ⌘K ship console

## Objective

Give the portfolio two interactive sci-fi instruments that are also genuinely useful: a ⌘K "ship console" (command palette) to jump anywhere — sections, projects, theme, contact — and a MU-TH-UR 6000–style transmission terminal in the contact section (a nod to _Alien_) that composes an email to the owner.

## Why

Phase 3 of the approved sci-fi redesign; user authorized autonomous implementation and delivery (2026-09-25) and asked for obsessive self-critique.

## Scope (authorized)

- T1 ⌘K ship console on every page.
- T2 Transmission terminal in `#connect`.
- Out of scope: any backend, analytics events, copy rewrites outside the new UI.

## Constraints

- No backend: the terminal composes a `mailto:` (subject + body, URL-encoded, length-capped); CSP stays `form-action 'none'` — never submit a form, handle it in script.
- Progressive enhancement: without JS the page is exactly today's (existing mailto button and links stay); the composer and console trigger are hidden until script enhances them.
- Performance: zero cost until used — the console module is loaded with a dynamic `import()` on the first ⌘K / Ctrl+K or trigger click; the terminal script is small and deferred.
- Accessibility first: native `<dialog>` with `showModal()` (focus trap, Esc, inert background), ARIA 1.2 combobox + listbox with `aria-activedescendant`, full keyboard (↑/↓/Enter/Esc/Home/End), visible focus, screen-reader announcements via a polite live region, labelled textarea, 44px targets, both themes AA, `prefers-reduced-motion` respected (typing effect off).
- Clean architecture: pure command registry + fuzzy filter + mailto builder in `src/lib/console/` and `src/lib/terminal/` with unit tests; DOM drivers thin.
- CSP: no inline `style=""`; scripts bundled by Astro (`script-src 'self'`).
- Laptop safety: heavy checks via `scripts/safe-run.sh`, sequential, cool < 75 °C, Playwright 1 worker.
- Artifacts English (UI copy Spanish, matching the site); Conventional Commits; no AI attribution.

## TDD

- Mode: not configured → ordinary functional checks; pure modules get unit tests first. Runners: `pnpm test:unit`, `pnpm test:e2e`, `pnpm check`, `pnpm run format:check`.

## Checklist

- [x] T1 ⌘K console: pure registry/filter + tests; lazy dialog; navbar trigger with shortcut hint; commands (sections, all projects, theme toggle, copy email, open GitHub/X, contact); e2e incl. keyboard + axe-style checks — route: delegated writer — commit `01892df`
- [x] T2 MU-TH-UR terminal: pure mailto builder + tests; enhanced composer in `#connect`; boot lines with CSS typing under no-preference; live-region status; e2e — route: delegated writer — commit `4f48292`
- [ ] T3 Verification (snapshots, perf probe, real Chrome), RDD review, stacked PRs, merge, live check — route: parent (build/unit/e2e/snapshots/perf verified in-task; RDD review, PR, merge and live check still pending)

## Acceptance criteria

- ⌘K / Ctrl+K opens the console from any page; typing filters with fuzzy matching; Enter runs the active command; Esc closes and returns focus to the trigger.
- The console trigger is visible and usable on touch/mobile.
- The terminal composes a correct mailto (subject/body encoded, capped) and announces what happened; without JS the existing mailto link still works.
- No regression: all existing tests green, Lighthouse a11y 100, no horizontal overflow, perf probe within budget.

## Progress

- Branch `feat/scifi-terminal-console` from `origin/main` c421a12 (phase 2 merged).
- T1 and T2 implemented and committed (`01892df`, `4f48292`). Next: T3 (RDD review / PR / merge / live check), owned by the parent.

## Verification evidence

Per-task (`pnpm check`, `pnpm test:unit`, `pnpm run format:check`, affected e2e specs) — all green on both T1 and T2, re-run after each fix.

- `pnpm check`: pass (astro sync + tsc --noEmit, no errors).
- `pnpm test:unit`: 101/101 pass, incl. the 14 new console-filter/registry tests and 11 new mailto tests.
- `pnpm run format:check`: pass.
- `tests/console/*` + `tests/terminal/*` (chromium project): 18/18 pass.

End-of-task, once:

- `scripts/safe-run.sh pnpm test:e2e` (full suite, both Playwright projects): **135/135 passed** (2.2m), zero CSP violations, zero console errors.
- `scripts/safe-run.sh pnpm snapshots http://localhost:4399/ …`: desktop/tablet/mobile × dark/light, all `idle-settled`, `overflow: false`, `errors: 0`.
- `scripts/safe-run.sh pnpm perf:probe`: hero convergence field adds **-17 ms** blocking at 4x CPU (budget 250 ms) — no regression from this change (probe targets the existing hero field, not the console/terminal).
- Console chunks (gzip): eager listener `CommandConsole.astro_astro_type_script_index_0_lang.*.js` 1122 B; lazy driver (filter + driver) `driver.*.js` 1840 B — loads only on first ⌘K/Ctrl+K or trigger click.
- Extra screenshots (desktop dark console open, mobile light console open, desktop light terminal section) taken and reviewed — see task closure notes.

### Notable bug caught by the reduced-motion e2e test

The MU-TH-UR boot lines were first built with a per-line inline `style="--mu-chars:…"` attribute (to size a `ch`-based typewriter effect). This site's CSP has no `style-src-attr` override — Astro only auto-hashes `<style>` blocks, never inline `style=""` attributes — so Chromium silently dropped the whole attribute (`el.style.length === 0`), collapsing every boot line to `width: 0` permanently, in _both_ the reduced-motion and motion-enabled paths. The `TERMINAL-005` reduced-motion e2e test (`toBeVisible()` on the first boot line) caught it before the motion-enabled test did, because the motion-enabled test only asserted `animation-name`, not visibility. Fixed by moving the per-line values out of inline style into discrete `:nth-child` rules and a `width: 100%` typewriter target instead of a computed `ch` width — no client-computed per-line styling at all now. This is also explicitly called out as a constraint in this doc ("CSP: no inline `style=\"\"`") — worth flagging for future `odd`/motion work in this repo.

### Round 2: parent review found real defects — fixed

Parent review of the screenshots caught what an "all green" test run had missed:

1. **Dialog pinned top-left, not centered.** Root cause confirmed: Tailwind's preflight resets `margin: 0` on every element including `<dialog>`, which silently kills the UA stylesheet's `dialog:modal { margin: auto }` centering. First fix attempt used `left: 50%; transform: translateX(-50%)`, which _itself_ got clobbered — the open-entrance animation's `animation-fill-mode: both` settles `transform` on the `to` keyframe's `transform: none`, permanently erasing a transform-based centering trick once the animation finished. Real fix: `position: fixed; top: 12vh; margin: 0 auto;` — re-enables the UA's own auto-margin centering technique instead of fighting it with `transform`, so it can't collide with the entrance animation. Added `tests/console/console-position.spec.ts`: horizontal centering (`|left − (vw − right)| ≤ 2px`) and mobile gutters (`≥ 12px`) at 1440px and 375px.
2. **Terminal read as a form, not a screen.** Added a `--terminal-*` component token set in `global.css` (dark: phosphor, near-black + accent; light: paper/e-ink, a warm cream _distinct from_ the page's own surface, dark-brown ink, burnt-orange prompts/caret) — every value derived via `var()` from the already-declared `--color-*` palette, never a new raw literal, so it stays outside the audited `--color-*`/color-mix() contract by construction. Fields restyled as prompt lines (`>` marker, borderless baseline for the single-line subject, a still-flat raised panel for the multi-line body since a textarea can't do a baseline-only rule), added a static (non-animated, `pointer-events: none`) scanline overlay via `repeating-linear-gradient` tinted from the same token, `caret-color` on inputs, and an explicit `::placeholder` color (previously unset/browser-default).
3. **Contrast measured, not assumed** (`tests/support/contrast.ts`, the project's own WCAG relative-luminance module) for header/boot-lines/labels/placeholder/input text/button/focus-ring, both themes — see table below. Everything was already ≥ 4.5:1 (worst case 4.72:1, the unchanged navbar hint in light mode); the token move mostly _increases_ the margin (dark unaffected; light gains ~1 point since `--terminal-surface` is now `--color-surface-elevated`, lighter than the page's own `--color-surface`).
4. **Mobile placeholder truncation** at 375px: shortened to "Buscar…" everywhere (simplest of the two options the review offered — no JS, no risk of the two-element approach going stale).
5. **File size**: moved all console/terminal CSS out of `portfolio.css` (already 2,704 lines with the phase-3 additions) into `src/styles/components/console.css` (182 lines) and `terminal.css` (207 lines) — `portfolio.css` is back to its pre-phase-3 2,299 lines. Split `src/lib/console/driver.ts` (270 lines) into `driver.ts` (193, orchestration/keyboard/state), `render.ts` (68, listbox DOM building), and `actions.ts` (52, CommandActionDescriptor → clipboard/navigation/theme). Extended `tests/unit/tokens.test.ts`'s `SHEETS` to scan the two new CSS files too, so moving code out of the audited `portfolio.css` didn't silently drop it from the A10/A11 checks.

Contrast (WCAG relative luminance, before → after; all normal text ≥ 4.5:1, focus ring ≥ 3:1):

| Pair                                | Dark                                | Light            |
| ----------------------------------- | ----------------------------------- | ---------------- |
| Header (accent on terminal-surface) | 8.05 → 8.05                         | 5.51 → 6.45      |
| Boot lines (ink-muted on surface)   | 10.52 → 10.52                       | 5.60 → 6.56      |
| Field labels                        | 5.22 → 10.52 (moved tertiary→muted) | 4.72 → 6.56      |
| Placeholder                         | unset → 10.52                       | unset → 6.56     |
| Input/textarea text                 | 16.55 → 16.55                       | 17.49 → 17.49    |
| Button text on accent               | 7.59 → 7.59                         | 6.17 → 6.17      |
| Focus ring vs surface (non-text)    | 8.05 → 8.05                         | 5.51 → 6.45      |
| Navbar trigger hint ("Ctrl K")      | 5.22 (unchanged)                    | 4.72 (unchanged) |

Re-verified after all fixes: `pnpm check`, `pnpm test:unit` (101/101), `pnpm run format:check`, affected specs (20/20, incl. the 2 new positioning tests), full `scripts/safe-run.sh pnpm test:e2e` (**137/137**). Six screenshots retaken (console: desktop dark/light, mobile dark/light; terminal: desktop dark/light) — dialog now visibly centered with even gutters at all four console shots; terminal now reads as a distinct dark/paper "screen" with visible scanlines and prompt-line fields in both themes.

### Round 3: 4-lens review findings — fixed (bounded writer, 2026-09-25)

All 8 findings from an approved 4-lens review verified and fixed: the
thermal watchdog could die mid-run and leave a scope frozen (`set -e`
via a pipefail'd `cat`, cleanup only trapped INT/TERM); the console's
copy fallback was invisible on failure (dialog closed before the
async copy resolved); a lazy chunk-load failure was swallowed with no
recovery; TERMINAL-003 was vacuous (a `window.location` redefinition
that always threw); a lazy `import()` rejection had no handling;
Ctrl+K while already open reset the query and could clobber
`returnFocusTo`; the light-theme terminal tokens repeated 10 of 11
identical declarations; several stale comments and a duplicated
stylesheet-loading block in the test suite. See commits `d86201c`,
`ae7dbbf`, `67094e8`, `a6b52b4`.

Re-verified: `pnpm check` pass; `pnpm test:unit` 115/115 (101 baseline

- 14 new, incl. 4 chunk-recovery unit tests — also fixed a pre-existing
  gap in the mutation-proof harness left by the base-layer split, unrelated
  to these findings, that was silently failing `pnpm test:unit`);
  `pnpm run format:check` pass; `node scripts/check-file-size.mjs` — 108
  files, all within budget; affected specs (console + terminal, 22/22);
  full `scripts/safe-run.sh pnpm test:e2e` — 138/139, one unrelated flake
  (`THEME-STATE-FORCED-PRESSED`, a `locator.hover()` 30s timeout landing
  right after back-to-back thermal freezes) confirmed non-reproducing in
  isolation (15.6s). PR / merge / live check remain pending, owned by the
  parent.
