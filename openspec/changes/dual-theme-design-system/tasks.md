# Tasks: Dual Real Light/Dark Theme System

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | ~590-620 (global.css ~130, portfolio.css ~150-250, tailwind.config.mjs -206, BaseLayout.astro +15, icons.ts +20-30, Navbar.tsx +30-50) |
| 400-line budget risk | High (aggregate); Low-Medium per work unit |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 -> PR 2 -> PR 3 -> PR 4 (stacked-to-main) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Note: `portfolio.css` is the highest-uncertainty line count — the exact tier-3 literal count is only known once task 2.2-2.4's sweep runs.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
| ------ | ------ | ----------- | ---------------------- | ----------------- | ------------------- |
| 1 | Unified `@theme` + `@custom-variant` in `global.css` | PR 1 | `pnpm run build` | `pnpm dev`, visual check homepage dark (default) unchanged | Revert `global.css` diff only |
| 2 | `portfolio.css` tiered token conversion + `.theme-toggle` styles | PR 2 | `pnpm run build` | `pnpm dev`, DevTools-set `data-theme=light`, visual sweep for unconverted literals | Revert `portfolio.css` diff only; PR 1 tokens remain valid standalone |
| 3 | Delete `tailwind.config.mjs` | PR 3 | `pnpm run build` | N/A — deletion has no visual surface; build pass is the harness | `git checkout HEAD~1 -- tailwind.config.mjs`, independent of PR 1/2 |
| 4 | No-flash script + Navbar toggle + icons | PR 4 | `pnpm run build` | `pnpm dev`, click toggle, hard reload, confirm persistence + no FOUC | Revert `BaseLayout.astro`, `Navbar.tsx`, `icons.ts` diffs only; PR 1/2 tokens still resolve via dark default |

## Phase 1: Design Tokens Foundation (`global.css`) — Work Unit 1 / PR 1

- [x] 1.1 In `src/styles/global.css`, add `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` after `@import "tailwindcss";`.
- [x] 1.2 Replace the `@theme` block with the unified dark-default token set exactly per design.md's "Token Architecture" section.
- [x] 1.3 Add the `[data-theme="light"]` override block with the full light-mode token set exactly per design.md.
- [x] 1.4 Add `[data-theme="dark"] { color-scheme: dark; }` and `[data-theme="light"] { color-scheme: light; }`.
- [x] 1.5 Delete the dead `.light` class block, the duplicate `@media (prefers-color-scheme: light)` block, and the redundant `html{color-scheme: dark light}` rule.
- [x] 1.6 Verify: exactly one `@theme` block remains in the codebase; no `.light` class or duplicate media block remains.

## Phase 2: Portfolio Retheme (`portfolio.css`) — Work Unit 2 / PR 2

- [x] 2.1 Delete the redundant `:root { --color-* }` block (8 tokens, now defined in `global.css`).
- [x] 2.2 Tier 1: convert every hex literal that exact-matches a core token to `var(--color-*)`.
- [x] 2.3 Tier 2: convert clear tints of a core token to `color-mix(in srgb, var(--color-accent) N%, var(--color-surface))`, or a new named token if a tint recurs 3+ times.
- [x] 2.4 Tier 3: for true one-offs, spot-verify contrast against the light surface (`#f3eadc`) via the relative-luminance formula in design.md; keep the literal if it passes AA, else adjust. Record the final tier-3 list.
- [x] 2.5 Add `.theme-toggle` button styles, reusing `.menu-toggle`'s pattern (44x44px, `border:1px solid var(--color-border)`, `border-radius:4px`, transparent background).
- [x] 2.6 Verify: no cyan-family literal (e.g. `#00d4ff`) remains in `portfolio.css`.

## Phase 3: Tailwind Config Removal — Work Unit 3 / PR 3

- [x] 3.1 Delete `tailwind.config.mjs` outright (no migration step, per design.md's grep evidence).
- [x] 3.2 Verify: `pnpm run build` succeeds with Tailwind config resolved purely from `global.css`'s CSS-first `@theme`/`@custom-variant`.

## Phase 4: No-Flash Init (`BaseLayout.astro`) — Work Unit 4 / PR 4

- [x] 4.1 Insert the no-flash inline `<script is:inline>` (exact script from design.md's "No-Flash Init Script" section) as the first child of `<head>`, before the favicon link and the injected `global.css` stylesheet link.
- [x] 4.2 Verify the existing static `<meta name="theme-color" content="#080909">` stays as the SSR/no-JS fallback.

## Phase 5: Toggle Control (`icons.ts`, `Navbar.tsx`) — Work Unit 4 / PR 4

- [x] 5.1 In `src/lib/icons.ts`, add a `sun` glyph (24px grid, 1.6px stroke, matching existing icon style).
- [x] 5.2 In `src/lib/icons.ts`, add a `moon` glyph (24px grid, 1.6px stroke, matching existing icon style).
- [x] 5.3 In `src/components/ui/Navbar.tsx`, add a real `<button className="theme-toggle" aria-label="..." aria-pressed={isLight}>` as a sibling of `.menu-toggle` inside `<nav className="nav-wrap">` (not inside `.desktop-nav`).
- [x] 5.4 Add a mount-time `useEffect` reading `document.documentElement.dataset.theme` into local state (SSR markup defaults to the dark icon to avoid hydration mismatch).
- [x] 5.5 Add the click handler: set `data-theme` attribute, `localStorage.setItem('dreamfolio-theme', next)`, update the `theme-color` meta `content`.

## Phase 6: Verification

- [x] 6.1 Verify (read-only): `src/pages/404.astro` (read-only) renders the unified brand, no cyan, under both `data-theme` values. Grep-confirmed: only `var(--color-accent)` references, zero `00d4ff`/`0088bb`.
- [x] 6.2 Verify (read-only): `src/pages/projects/[id].astro` (read-only) renders the unified brand, no cyan, under both `data-theme` values. Grep-confirmed: only `var(--color-*)` references, zero cyan literals.
- [x] 6.3 Manual: Navbar toggle switches theme, persists across reload, no FOUC (DevTools throttled paint check). **Performed against the deployed site on 2026-09-14** — the blocker recorded here was environmental (*"no connected browser available in this session"*), not a property of the change. Toggle: `data-theme` light→dark with `aria-pressed` `true`→`false`, label and `theme-color` updated; persists across reload; no FOUC, measured three ways. Detail and numbers in `verification-6.3.md`.
- [x] 6.4 Manual: WCAG spot-check every tier-3 literal from 2.4 against the light surface (≥4.5:1 body / ≥3:1 UI-large-text). Done in design.md + apply-progress.md: `#64685f` at 4.77:1 on light surface (passes AA body); `#0007`/`#0006`/`#0003`/`#fff3` are decorative (shadows/highlights), excluded from WCAG 1.4.3 text-contrast scope.
- [x] 6.5 Run `pnpm run build`; confirm green, 10 static pages, no meaningful bundle-size regression. Verified independently after every PR in this change; final state green.
