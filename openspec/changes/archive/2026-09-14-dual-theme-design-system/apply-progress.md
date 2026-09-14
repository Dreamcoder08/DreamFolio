# Apply Progress: Dual Real Light/Dark Theme System

## Work Unit 1 / PR 1 — Design Tokens Foundation (`global.css`) — COMPLETE

**Mode**: Standard (no strict TDD active for this project; verification via build + grep checks).

### Completed Tasks

- [x] 1.1 Added `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` after `@import "tailwindcss";`.
- [x] 1.2 Replaced the `@theme` block with the unified dark-default token set exactly per design.md's "Token Architecture" section. Preserved all pre-existing non-color tokens (spacing scale, fluid typography scale) verbatim.
- [x] 1.3 Added the `[data-theme="light"]` override block with the full light-mode token set exactly per design.md.
- [x] 1.4 Added `[data-theme="dark"] { color-scheme: dark; }` and `[data-theme="light"] { color-scheme: light; }`.
- [x] 1.5 Deleted the dead `.light` class block, the duplicate `@media (prefers-color-scheme: light)` block, and the redundant `html{color-scheme: dark light}` rule.
- [x] 1.6 Verified: exactly one `@theme` block remains; no `.light` class selector or duplicate `prefers-color-scheme` media block remains.

### Files Changed

| File | Action | What Was Done |
| ------ | -------- | ---------------- |
| `src/styles/global.css` | Modified | Consolidated cyan `@theme` into unified amber dark-default token set; added `@custom-variant dark`; added `[data-theme="light"]` override block; added `[data-theme="dark"/"light"] { color-scheme }` rules; deleted dead `.light` class, duplicate `prefers-color-scheme` media block, and redundant `html { color-scheme: dark light }` |
| `openspec/changes/dual-theme-design-system/tasks.md` | Modified | Marked tasks 1.1-1.6 `[x]` |

### Work Unit Evidence

| Evidence | Value |
| --- | --- |
| Focused test command and exact result | `pnpm run build` — exit 0, "10 page(s) built", no errors |
| Runtime harness command/scenario and exact result | N/A for visual dark-mode regression: no visual change occurred because dark remains the only active theme (no toggle exists until PR 4); `pnpm run build` static generation is the correct and sufficient harness per tasks.md's own Unit 1 harness definition |
| Rollback boundary | Revert `src/styles/global.css` diff only; no other file touched in this unit |

### Verification detail

- `grep -c "^@theme" src/styles/global.css` → `1`
- `grep -n "^\.light\b" src/styles/global.css` → no match
- `grep -n "prefers-color-scheme" src/styles/global.css` → no match
- `grep -n "color-scheme: dark light" src/styles/global.css` → no match
- `pnpm run build` → succeeded, 10 static pages (404, projects/index, projects/[id] x7, index), no errors, dist/ removed after check (gitignored)
- `src/styles/global.css` SHA-256 after edit: `517586e6a8da1612f8fe45d06ab47da2ff4decd60545af3e572def12e08dee7f`

### Deviations from Design

None — implementation matches design.md's "Token Architecture" section exactly. Non-color tokens (spacing/typography) were preserved as design.md's snippet comment instructed ("spacing/typography scale unchanged from current global.css").

### Issues Found

None.

### Out of Scope for This Run (untouched, confirmed)

- `src/styles/portfolio.css` (Work Unit 2 / PR 2)
- `tailwind.config.mjs` (Work Unit 3 / PR 3)
- `src/layouts/BaseLayout.astro`, `src/lib/icons.ts`, `src/components/ui/Navbar.tsx` (Work Unit 4 / PR 4)

### Workload / PR Boundary

- Mode: stacked-to-main (Chain strategy per tasks.md Review Workload Forecast)
- Current work unit: Unit 1 of 4
- Boundary: starts from unmodified `global.css`, ends with the consolidated single-source `@theme` + `[data-theme]` override, ready to be committed as PR 1
- Estimated review budget impact: well under 400 lines (global.css diff only, ~50-60 changed lines)

### Remaining Tasks (as of end of Work Unit 1)

- [ ] Phase 2 (2.1-2.6): `portfolio.css` tiered token conversion + `.theme-toggle` styles — Work Unit 2 / PR 2
- [ ] Phase 3 (3.1-3.2): Delete `tailwind.config.mjs` — Work Unit 3 / PR 3
- [ ] Phase 4 (4.1-4.2): No-flash init script in `BaseLayout.astro` — Work Unit 4 / PR 4
- [ ] Phase 5 (5.1-5.5): Toggle control in `icons.ts`/`Navbar.tsx` — Work Unit 4 / PR 4
- [ ] Phase 6 (6.1-6.5): Final verification

### Status (as of end of Work Unit 1)

6/29 tasks complete (Phase 1 fully done). Ready for commit/PR of Work Unit 1; next apply batch should target Work Unit 2 (`portfolio.css`).

---

## Work Unit 2 / PR 2 — Portfolio Retheme (`portfolio.css`) — COMPLETE

**Mode**: Standard (no strict TDD active for this project; verification via build + grep checks, consistent with Work Unit 1).

### Completed Tasks

- [x] 2.1 Deleted the redundant `:root { --color-* }` block (8 tokens: `--color-surface`, `--color-surface-alt`, `--color-surface-elevated`, `--color-text`, `--color-text-secondary`, `--color-accent`, `--color-accent-muted`, `--color-border`, `--color-border-hover`), now fully defined in `global.css`'s unified `@theme`.
- [x] 2.2 Tier 1: converted every hex literal exact-matching a core token to `var(--color-*)` — `#080909`→`var(--color-surface)`, `#111212`→`var(--color-surface-alt)`, `#191a1a`→`var(--color-surface-elevated)`, `#f0efeb`→`var(--color-text)`, `#a5a6a2`→`var(--color-text-secondary)`, `#dda783`→`var(--color-accent)`, applied exhaustively across every occurrence (grep-verified before and after; alpha-suffixed variants like `#080909ee` handled separately as Tier 2 to avoid corrupting the exact-match substring).
- [x] 2.3 Tier 2: converted clear tints:
  - Accent-alpha tints (`#dda78308/09/35/55/65`, `#d7c1af25`) → `color-mix(in srgb, var(--color-accent) N%, var(--color-surface))` with N derived from the literal alpha (3%, 4%, 21%, 33%, 40%, 15%).
  - Surface-alpha translucency (`#080909ee`, `#0a0b0be8`, used for backdrop-blur header and portrait caption chip) → `color-mix(in srgb, var(--color-surface) N%, transparent)` (93%, 91%) — mixed toward `transparent` instead of `var(--color-surface)` to preserve the intended translucency/backdrop-blur effect, a deliberate deviation from the design.md literal template justified by functional necessity.
  - White-alpha border family (`#ffffff1c/17/20/22/24/25/28/2b` → `var(--color-border)`; `#ffffff30/32/33/35` → `var(--color-border-hover)`) — bucketed by nearest-alpha proximity to the two canonical border tokens (0.11 / 0.24), per the explicit normalization instruction, even where the literal alpha differed slightly from the canonical value.
  - `#ffffff04` (subtle hover-background tint) → `var(--color-surface-glass)` (semantically the closest existing token, both representing a faint white overlay).
  - Near-duplicate surface tints (`#101111`, `#101213`, `#111314` → `var(--color-surface-alt)`; `#1c1c1b`, `#1b1e1e`, `#161919`, `#191713`, `#17191a` → `var(--color-surface-elevated)`) collapsed into the nearest canonical surface tier.
  - Second `:root` block's portfolio.css-local semantic aliases (`--portrait-surface`, `--line-subtle`, `--line-strong`) redefined to reference `var(--color-surface-alt)`, `var(--color-border)`, `var(--color-border-hover)` respectively — this single change makes every existing consumer of these aliases (`.profile-card`, `.profile-portrait`, `.profile-project`, `.module-icon`) automatically theme-reactive without touching each usage site.
  - ~40 remaining light-toned foreground literals (near-white/tan text and icon colors used throughout the "Personal identity" portrait/icon subsystem) classified by nearest-anchor brightness/warmth heuristic into `var(--color-text)` (near-white, neutral, avg brightness ≥215, warmth ≤15), `var(--color-text-secondary)` (neutral, avg brightness 140-215), or `var(--color-accent)` (warm-tan hue family, R-B channel delta >15) — full mapping table in the apply-phase report.
- [x] 2.4 Tier 3: identified and left literal (spot-verified against both surfaces):
  - `#64685f` (`.toolbelt p span`, muted separator/punctuation color) — contrast 3.50:1 on dark surface `#080909` (pre-existing, below the 4.5:1 body floor but unchanged from original production value; non-critical punctuation glyph, not primary content), 4.77:1 on light surface `#f3eadc` (passes AA body threshold). Left literal: converting to `var(--color-text-secondary)` was rejected because that token's darker light-mode value would look visually different from this specific muted low-emphasis tone across both themes, and the literal itself does not regress in light mode.
  - `#0007`, `#0006`, `#0003` (box-shadow drop-shadow colors, `.project-visual img`, `.profile-card`) — decorative depth cues, not text; excluded from WCAG 1.4.3 text-contrast requirements (same exclusion class as design.md's own hairline-border table entry). Left literal; a dark shadow reads as valid depth cue on both a dark and a light surface (standard cross-theme practice).
  - `#fff3` (`.solid-link` inset box-shadow highlight) — decorative inset highlight, not text; on light surface this highlight becomes visually faint (white-on-near-white), a minor, non-blocking cosmetic softening with zero legibility impact (the shadow is additive, not load-bearing for content). Left literal.
- [x] 2.5 Added `.theme-toggle` styling, mirroring `.menu-toggle`'s full declared pattern (color, min-height/min-width 44px, border, border-radius, background, padding, align-items, justify-content) — deliberately omitting `.menu-toggle`'s `display:none` desktop-hidden behavior since the toggle must stay visible at all breakpoints per design.md; no hover/focus rule added because `.menu-toggle` itself declares none beyond the shared global `button:focus-visible` rule, which `.theme-toggle` (a `<button>`) inherits automatically.
- [x] 2.6 Verified: `grep -c "00d4ff|0088bb" src/styles/portfolio.css` → `0`.

### Files Changed

| File | Action | What Was Done |
| ------ | -------- | ---------------- |
| `src/styles/portfolio.css` | Modified | Deleted redundant 8-token `:root` block; converted ~110 hex-literal occurrences (Tier 1 exact matches, Tier 2 tints/color-mix/border normalization, Tier 3 spot-verified) across the giant single-line rule block and the readable "Personal identity" block; redefined 3 local semantic aliases to canonical tokens; added `.theme-toggle` rule; left 5 literals (Tier 3, documented above) |
| `openspec/changes/dual-theme-design-system/tasks.md` | Modified | Marked tasks 2.1-2.6 `[x]` |

### Work Unit Evidence

| Evidence | Value |
| --- | --- |
| Focused test command and exact result | `pnpm run build` — exit 0, "10 page(s) built", no errors; compiled CSS spot-checked (`grep -o 'data-theme=light...'`) confirms the light override block compiles and `color-mix()` resolves (90 occurrences in output CSS, no Lightning CSS transform errors) |
| Runtime harness command/scenario and exact result | No browser tooling available in this environment to visually toggle `data-theme="light"` live; relied instead on (a) exhaustive grep-based literal inventory before/after conversion (zero unmapped literals besides the 5 documented Tier-3 exceptions), and (b) relative-luminance contrast math for the one Tier-3 literal with a plausible text role (`#64685f`). This is reported honestly as a non-visual verification, per the task's explicit fallback allowance |
| Rollback boundary | Revert `src/styles/portfolio.css` diff only (68 changed lines); Work Unit 1's `global.css` tokens remain valid and unaffected standalone |

### Verification detail

- `grep -c "00d4ff\|0088bb" src/styles/portfolio.css` → `0`
- `grep -o '#[0-9a-fA-F]\{3,8\}' src/styles/portfolio.css | sort -u` → only `#0003`, `#0006`, `#0007`, `#64685f`, `#fff3` remain (the documented Tier-3 set)
- `grep -n "^:root" src/styles/portfolio.css` → 1 match (the portfolio.css-local semantic-alias block; the 8-token duplicate root from task 2.1 is gone)
- `pnpm run build` → succeeded, 10 static pages, no errors; `dist/` removed after check
- `git diff --stat -- src/styles/portfolio.css openspec/changes/dual-theme-design-system/tasks.md` → 1 file changed (portfolio.css), 34 insertions(+), 34 deletions(-) = 68 changed lines total, well under the 400-line PR budget

### Deviations from Design

- Surface-alpha translucency literals (`#080909ee`, `#0a0b0be8`) were mixed toward `transparent` rather than `var(--color-surface)` as design.md's literal Tier-2 template specifies, to preserve the backdrop-blur/translucency effect these two rules depend on (`.site-header`'s `backdrop-filter:blur(18px)` and `.portrait-caption`'s layered chip over a portrait image). Mixing toward an opaque `var(--color-surface)` would have flattened these into fully opaque colors, breaking the intended visual effect. This is a deliberate, narrow, functionally-justified deviation from the literal template wording, not a departure from its intent (both still use `color-mix()` derived from the alpha value).
- The ~40 Tier-3-adjacent light-toned foreground literals were resolved via a documented nearest-anchor brightness/warmth heuristic (not exhaustive per-pixel WCAG math for each one individually) since design.md explicitly deferred exact tiering to apply-time and did not mandate a specific classification algorithm. All resulting choices land on the 3 already-WCAG-verified core tokens (text/text-secondary/accent), so every conversion inherits design.md's own verified contrast ratios for both themes.

### Issues Found

None. No visual browser regression check was possible in this environment (documented above as a verification gap, not silently skipped).

### Out of Scope for This Run (untouched, confirmed)

- `tailwind.config.mjs` (Work Unit 3 / PR 3)
- `src/layouts/BaseLayout.astro`, `src/lib/icons.ts`, `src/components/ui/Navbar.tsx` (Work Unit 4 / PR 4)

### Workload / PR Boundary

- Mode: stacked-to-main (Chain strategy per tasks.md Review Workload Forecast)
- Current work unit: Unit 2 of 4
- Boundary: starts from Work Unit 1's committed `global.css` tokens (assumed available, untouched here), ends with a fully theme-reactive `portfolio.css` ready to be committed as PR 2
- Estimated review budget impact: 68 changed lines (well under 400), single file

### Remaining Tasks

- [ ] Phase 4 (4.1-4.2): No-flash init script in `BaseLayout.astro` — Work Unit 4 / PR 4
- [ ] Phase 5 (5.1-5.5): Toggle control in `icons.ts`/`Navbar.tsx` — Work Unit 4 / PR 4
- [ ] Phase 6 (6.1-6.5): Final verification

### Status

12/29 tasks complete (Phases 1-2 fully done). Working tree left uncommitted for the orchestrator; next apply batch should target Work Unit 3 (`tailwind.config.mjs` deletion).

---

## Work Unit 3 / PR 3 — Tailwind Config Removal — COMPLETE

**Mode**: Standard. Performed directly by the orchestrator (mechanical single-file deletion, no design ambiguity — skipped the sub-agent hop per delegation rules).

### Completed Tasks

- [x] 3.1 Deleted `tailwind.config.mjs` outright.
- [x] 3.2 Verified `pnpm run build` succeeds with Tailwind resolving purely from `global.css`'s CSS-first `@theme`/`@custom-variant` — 10 static pages, no errors.

### Files Changed

| File | Action | What Was Done |
| ------ | -------- | ---------------- |
| `tailwind.config.mjs` | Deleted | Confirmed dead in explore/design phases (no `@config` directive anywhere); grep after deletion found only inert `Read()` permission-allowlist entries in `.claude/settings.json`/`@.claude/agents/session-config.ts`/`.gemini/settings.json` referencing the old path — harmless, out of scope, not touched |
| `openspec/changes/dual-theme-design-system/tasks.md` | Modified | Marked tasks 3.1-3.2 `[x]` |

### Work Unit Evidence

| Evidence | Value |
| --- | --- |
| Focused test command and exact result | `pnpm run build` — exit 0, "10 page(s) built", no errors |
| Runtime harness | N/A — deletion has no visual surface; build-green is the harness, per tasks.md |
| Rollback boundary | `git checkout HEAD~1 -- tailwind.config.mjs`, independent of PR 1/2 |

### Status

14/29 tasks complete (Phases 1-3 fully done). Ready for commit/PR of Work Unit 3; next apply batch targets Work Unit 4 (no-flash script + Navbar toggle + icons).

---

## Work Unit 4 / PR 4 — No-Flash Init + Navbar Toggle + Icons — COMPLETE (FINAL WORK UNIT)

**Mode**: Standard (no strict TDD active for this project; verification via build + compiled-output tracing, consistent with prior units).

### Completed Tasks

- [x] 4.1 Inserted the exact no-flash inline `<script is:inline>` from design.md's "No-Flash Init Script" section as the true first child of `<head>` in `src/layouts/BaseLayout.astro` — even before `<meta charset="UTF-8">`, the favicon `<link>`, and Astro's injected `global.css` stylesheet link. Confirmed in compiled `dist/index.html`: the `<script>` tag is the first byte after `<head>`.
- [x] 4.2 Verified the existing static `<meta name="theme-color" content="#080909">` tag was left untouched as the SSR/no-JS fallback — the inline script only calls `meta.setAttribute('content', ...)` at runtime, it does not remove or replace the tag. Confirmed in compiled output: `content="#080909"` unchanged in the static HTML.
- [x] 5.1 Added `sun` glyph to `src/lib/icons.ts` — `<circle cx="12" cy="12" r="4"/>` plus an 8-ray `<path>` (cardinal + diagonal rays), 24px grid, matching the file's existing multi-subpath-in-one-`<path>` convention (same pattern as `agents`/`memory` glyphs) and the file's documented 1.6px stroke (applied by the consuming `NavIcon` component, not baked into the glyph markup, exactly like every other entry).
- [x] 5.2 Added `moon` glyph to `src/lib/icons.ts` — single crescent `<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/>`, 24px grid, one-path minimal style consistent with `location`'s pin glyph.
- [x] 5.3 Added `<button className="theme-toggle" aria-label="..." aria-pressed={isLight}>` in `src/components/ui/Navbar.tsx`, placed as a direct sibling of `.menu-toggle` inside `<nav className="nav-wrap">` (between `.desktop-nav` and `.menu-toggle`), NOT inside `.desktop-nav` — reused the file's own established `NavIcon` inline-SVG pattern (`dangerouslySetInnerHTML` from `icons.ts`) rather than importing the `.astro`-only `Icon` component, matching how `menu`/`close`/`arrow`/`mark` icons are already rendered in this exact file. `.theme-toggle`'s CSS (added in Work Unit 2) is `display:inline-flex` at all breakpoints — unlike `.menu-toggle`'s `display:none` until the 720px media query — so the toggle stays reachable on mobile, per design.md.
- [x] 5.4 Added a mount-time `useEffect(() => { setIsLight(document.documentElement.dataset.theme === 'light'); }, [])` — local `isLight` state defaults to `false` (dark) for the initial `useState`, matching SSR-rendered markup exactly, so no hydration-mismatch warning is expected from this read alone (React only warns when server and client *first-render* markup differ, and both render the dark icon on first paint since the effect runs after mount). Documented as a design-anticipated edge case in the component's own inline comment.
- [x] 5.5 Added `toggleTheme` click handler: computes `next` from current `isLight`, calls `document.documentElement.setAttribute('data-theme', next)`, `localStorage.setItem('dreamfolio-theme', next)` (wrapped in `try/catch`, matching the init script's own defensive `try/catch` around `localStorage.getItem`), updates `meta[name="theme-color"]`'s `content` to `#f3eadc`/`#080909`, then `setIsLight(next === 'light')`. The `THEME_KEY` constant `'dreamfolio-theme'` was verified to exactly string-match the init script's `KEY` constant (byte-for-byte, confirmed via grep on both source files and the compiled bundles — each contains exactly one occurrence of the literal).

### Files Changed

| File | Action | What Was Done |
| ------ | -------- | ---------------- |
| `src/layouts/BaseLayout.astro` | Modified | Inserted the no-flash inline script as the literal first child of `<head>` |
| `src/lib/icons.ts` | Modified | Added `sun` and `moon` glyph entries to the shared icon registry |
| `src/components/ui/Navbar.tsx` | Modified | Added `.theme-toggle` button, `isLight` state, mount-time sync `useEffect`, `toggleTheme` click handler |
| `openspec/changes/dual-theme-design-system/tasks.md` | Modified | Marked tasks 4.1, 4.2, 5.1-5.5 `[x]` |

### Work Unit Evidence

| Evidence | Value |
| --- | --- |
| Focused test command and exact result | `pnpm run build` — exit 0, "10 page(s) built", no errors |
| Runtime harness command/scenario and exact result | No browser automation tool was available in this environment (no MCP browser/Playwright tool in the active toolset) — a live `pnpm dev` click-through was NOT performed and is NOT claimed. Instead verified via compiled-output tracing: (1) `dist/index.html` confirms the script is the literal first byte inside `<head>`; (2) `dist/index.html` retains the static `theme-color` meta at `#080909`; (3) `dist/index.html` and `dist/_astro/Navbar*.js` each contain exactly one occurrence of the literal `dreamfolio-theme`, confirming the localStorage key matches exactly between the init script and the click handler; (4) the compiled Navbar bundle contains the minified `setAttribute("data-theme",a)` and `localStorage.setItem(b,a)` calls plus exactly one `aria-pressed` occurrence and both the sun (`circle cx="12" cy="12" r="4"`) and moon (`M21 12.79`) glyph markup; (5) manually traced all four logic paths in the init script's resolution order: stored=`light`→`data-theme="light"` regardless of OS; stored=`dark`→`data-theme="dark"` regardless of OS; no stored value + OS dark→`matchMedia('(prefers-color-scheme: light)').matches` is `false`→`data-theme="dark"`; no stored value + OS light→matches `true`→`data-theme="light"`. All four resolve correctly per the spec's documented resolution order (stored first, then OS, default dark) |
| Rollback boundary | Revert `src/layouts/BaseLayout.astro`, `src/lib/icons.ts`, `src/components/ui/Navbar.tsx` diffs only (35 changed lines, all additions, 0 deletions); Work Units 1-2's `global.css`/`portfolio.css` tokens (including the pre-existing `.theme-toggle` CSS class) remain valid and unaffected standalone — dark mode continues to work exactly as before since it stays the attribute-less/no-JS fallback |

### Verification detail

- `pnpm run build` → succeeded, 10 static pages, no errors; `dist/` removed after check (gitignored)
- `head -1` of compiled `dist/index.html` `<head>` content → the inline script, confirmed literal first child, before `<meta charset>`, before the favicon `<link>`, before Astro's injected `global.css` link
- `grep -o 'theme-color" content="[^"]*"' dist/index.html` → `theme-color" content="#080909"` (static SSR fallback unchanged)
- `grep -c "dreamfolio-theme" dist/index.html` → `1`; `grep -c "dreamfolio-theme" dist/_astro/Navbar*.js` → `1` (exact key match confirmed between both write sites)
- `grep -o 'setAttribute(.data-theme.[^)]*)' dist/_astro/Navbar*.js` → `setAttribute("data-theme",a)` present
- `grep -o 'localStorage.setItem([^)]*)' dist/_astro/Navbar*.js` → `localStorage.setItem(b,a)` present
- `grep -c "aria-pressed" dist/_astro/Navbar*.js` → `1`
- `grep -o 'circle cx="12" cy="12" r="4"' dist/_astro/Navbar*.js` and `grep -o 'M21 12.79' dist/_astro/Navbar*.js` → both present (sun/moon glyphs compiled into the bundle)
- `git diff --stat` (implementation files only) → `Navbar.tsx` +20/-0, `BaseLayout.astro` +13/-0, `icons.ts` +2/-0 = 35 lines added, 0 removed
- `git status --porcelain` → only the 4 tracked modified files; zero untracked files created (no new asset files)

### Deviations from Design

None — implementation matches design.md's "No-Flash Init Script" and "Navbar Toggle" sections exactly, including the exact script text (byte-for-byte) and the exact three client-side effects (`setAttribute`, `localStorage.setItem`, meta `content` update) mirrored in the click handler. `Icon.astro` was read and confirmed unusable directly from a `.tsx` React component (Astro components cannot be imported into React islands); the file's own pre-existing `NavIcon` inline-SVG pattern was reused instead, which is the design-anticipated integration approach ("match whatever pattern Navbar.tsx already uses for icons elsewhere in the file").

### Issues Found

No browser automation tool (e.g. Playwright/Puppeteer MCP) was available in this environment's active toolset, so a live visual dark→light→reload click-through could not be performed and is not claimed. This is reported honestly per the task's explicit fallback instructions; verification instead relied on build success, compiled-output byte-level tracing, and manual logic-path tracing of all four resolution scenarios (documented above).

### Out of Scope for This Run (untouched, confirmed)

- Phase 6 (6.1-6.5): final verification — explicitly the orchestrator's/user's manual-check phase per the task prompt, not part of this apply batch

### Orchestrator Correction (post-apply review, before commit)

Reviewing the diff, placing the script as the *literal* first child of `<head>` (before `<meta charset>` and before `<meta name="theme-color">`) means `document.querySelector('meta[name="theme-color"]')` runs before the HTML parser has reached that tag — the synchronous script executes with only what precedes it already in the DOM. Confirmed via byte-offset inspection of the compiled `dist/index.html` (script at byte 57 vs. `theme-color` meta at byte 2286 in the pre-fix build): the `querySelector` call returns `null` on every page load, so the `if (meta)` guard silently no-ops and the meta tag never syncs to the resolved theme.

**Fix**: moved the script block to immediately after the `<meta name="theme-color">` tag (still well before the Google Fonts `<link>` and the bundled stylesheet `<link>` — confirmed the stylesheet link lands at byte 3834 in the rebuilt output, script now at byte 2069, so the FOUC-prevention property design.md cared about is fully preserved). `data-theme` still gets set on `<html>` before any paint either way, since `document.documentElement` always exists once the parser reaches `<html>`; only the meta-color sync was affected by the original ordering.

Rebuilt and reverified after the fix: `pnpm run build` green, 10 pages; byte-offset check confirms `theme-color meta (2032) < script (2069) < stylesheet link (3834)`.

### Workload / PR Boundary

- Mode: stacked-to-main (Chain strategy per tasks.md Review Workload Forecast)
- Current work unit: Unit 4 of 4 (FINAL)
- Boundary: starts from Work Unit 3's committed state (`global.css`/`portfolio.css` tokens + `tailwind.config.mjs` deleted, assumed available, untouched here), ends with a fully functional, reachable light/dark toggle — ready to be committed as PR 4
- Estimated review budget impact: 35 changed lines in implementation files (well under 400), 3 files

### Status

21/29 tasks complete (Phases 1, 2, 3, 4, 5 fully done). Working tree left uncommitted for the orchestrator. Native SDD attempt settled with outcome `passed` (state: `complete` — this attempt's runtime objective, PR4, is finished). Next: Phase 6 (6.1-6.5) is the orchestrator's/user's manual verification phase — not another apply batch.
