
# Design: Dual Real Light/Dark Theme System

## Technical Approach

Replace three fragmented token systems with one Tailwind 4 CSS-first `@theme` block in `src/styles/global.css`, activated by `data-theme="dark"|"light"` on `<html>`. Dark values are copied verbatim from `portfolio.css` (never re-derived). Light values are a newly designed amber-family palette (parchment/cocoa surfaces, hue-locked to the dark accent), verified below with explicit WCAG relative-luminance math per the `design-tokens` spec's contrast-guardrail requirement. A synchronous inline script in `BaseLayout.astro`'s `<head>` resolves and applies the attribute pre-paint; a persisted `Navbar.tsx` toggle lets the user override it, per the `theme-toggle` spec.

## Architecture Decisions

### Decision: Single `@theme` + `[data-theme="light"]` override block, dark stays the implicit default
**Choice**: One `@theme { ... }` in `global.css` holds dark values (today's implicit default via `:root`); `[data-theme="light"] { ... }` overrides the same `--color-*` names. No explicit `[data-theme="dark"]` block is needed — dark is the fallback if JS never runs, matching current site behavior.
**Alternatives considered**: Explicit blocks for both attribute values (symmetric but redundant); Dreamcoder's literal palette (rejected per confirmed pre-proposal decision — amber is the brand).
**Rationale**: Zero risk of dark-mode regression (values untouched), minimal diff, graceful no-JS fallback.

### Decision: WCAG-verified light-mode accent, hue-locked to `#dda783`, distinct from Dreamcoder's `#824f16`
**Choice**: `--color-accent` (light) = `#8a4e26`. HSL of `#dda783` ≈ (24°, 57%, 69%); HSL of `#8a4e26` ≈ (24°, 57%, 35%) — same hue/saturation family, darkened for legibility on a light surface. Dreamcoder's rejected brown `#824f16` is HSL ≈ (32°, 71%, 30%) — a distinguishably different hue/saturation, confirming this is not that palette.
**Alternatives considered**: `#9a5a2e` (24.4°) — computed contrast 4.54:1, too close to the 4.5:1 floor for a safety margin; `#dda783` used directly on light surface — computed ~1.8:1, fails outright (light-on-light).
**Rationale**: Same hue as the dark identity (design continuity) with enough lightness reduction to clear AA with margin.

### Decision: Surface layering — dark preserves 3-tier `surface/surface-alt/surface-elevated`, light mirrors it in the "elevation = lighter" direction
**Choice**: Dark: `surface=#080909` (canvas/surface0) → `surface-alt=#111212` (surface1, cards) → `surface-elevated=#191a1a` (surface2, top overlays) — literal `portfolio.css` values, unchanged. Light: `surface=#f3eadc` (canvas, Dreamcoder-neutral) → `surface-alt=#fff7ea` (Dreamcoder-neutral) → `surface-elevated=#fffdf6` (new, brighter near-white for modals).
**Alternatives considered**: Light surfaces getting *darker* with elevation (typical for dark-only systems) — rejected, inconsistent with the existing dark-mode elevation direction and with standard light-theme practice.
**Rationale**: Elevation consistently reads as "lighter" in both modes; light surfaces borrow Dreamcoder's neutral warmth per the proposal's explicit inspiration note, keeping only the accent amber-family and brand-specific.

### Decision: `portfolio.css` retheming is tiered, not a full literal rewrite
**Choice**: `portfolio.css`'s `:root { --color-* }` block (8 tokens, redundant with the new single source) is deleted. Its ~60+ inline hex literals are triaged in three tiers at apply/tasks time: (1) exact matches to a core token → `var(--color-*)`; (2) clear tints of a core token (e.g. accent at lower opacity) → `color-mix(in srgb, var(--color-accent) N%, var(--color-surface))` or a new named token if reused 3+ times; (3) rare true one-offs with no semantic mapping → flagged, left literal, verified per-instance against the light surface using the same relative-luminance formula in this document.
**Alternatives considered**: Full one-by-one hex-to-token mapping done now in design — rejected as implementation-phase granularity for a ~200-line, densely-packed file; leaving all literals untouched — rejected, would render most of `portfolio.css` non-reactive to light mode, defeating the change's purpose.
**Rationale**: Matches the proposal's constraint ("token-value-under-existing-selectors, not a layout rewrite") while giving tasks-phase a bounded, auditable classification rule instead of an open-ended rewrite.

### Decision: Delete `tailwind.config.mjs` outright — no migration step
**Choice**: Skip the proposal's "migrate `darkMode`/`screens`/`fontFamily` then delete" step; delete directly.
**Alternatives considered**: Porting `screens`/`fontFamily` into CSS-first `@theme` per the proposal's literal wording.
**Rationale**: Grep confirms `darkMode:['class']` is fully superseded by `@custom-variant dark`, not merely migratable. Custom `screens` (`laptop:`, `tablet:`, etc.) and `fontFamily` (`font-display`, `font-tech`) are used only in components with zero import chain from any `src/pages/*.astro` (`EnhancedHero.tsx`, `link-button.tsx`, `EvidenceEngine.tsx`, `FeaturedProjectsSection.astro`, `ProjectsSection.astro`, `SystemUnit.astro`, `TechSection.astro`, `TechnicalIntake.tsx` — verified via grep across `src/pages`, none appear). Porting would resurrect utilities for orphaned code and `font-display`/`font-tech` reference Poppins/Space Grotesk, which aren't even loaded by `BaseLayout.astro`'s Google Fonts `<link>` — reviving them would render the wrong fallback font. This is a broader pre-existing orphaned-component footprint than explore found (previously only 2 files), documented here as a discovery, not addressed (matches proposal's existing out-of-scope framing for orphaned code).

## WCAG 2.1 AA Contrast Verification (relative-luminance formula, `L = 0.2126R + 0.7152G + 0.0722B` on linearized sRGB channels; ratio `(L1+0.05)/(L2+0.05)`)

| Pairing | Dark values | Dark ratio | Light values | Light ratio | Threshold |
|---|---|---|---|---|---|
| surface + text | `#080909` / `#f0efeb` | **17.34:1** | `#f3eadc` / `#17120d` | **15.59:1** | 4.5:1 body |
| surface + text-secondary | `#080909` / `#a5a6a2` | **8.15:1** | `#f3eadc` / `#6b5947` | **5.60:1** | 4.5:1 body |
| surface + accent | `#080909` / `#dda783` | **9.43:1** | `#f3eadc` / `#8a4e26` | **5.50:1** | 3:1 large/UI |
| accent + on_accent | `#dda783` / `#080909` | **9.43:1** | `#8a4e26` / `#fff7ea` | **6.17:1** | 4.5:1 (button label) |
| surface + danger | `#080909` / `#ff4d4d` | **6.10:1** | `#f3eadc` / `#b3261e` | **5.48:1** | 4.5:1 body |
| focus ring on surface | accent `#dda783` on `#080909` | **9.43:1** | accent `#8a4e26` on `#f3eadc` | **5.50:1** | 3:1 UI |
| border on surface | `rgba(255,255,255,.11)` on `#080909` | ~1.28:1 (decorative) | `rgba(0,0,0,.10)` on `#f3eadc` | ~similar low ratio (decorative) | N/A — hairline dividers, not WCAG 1.4.11 functional UI boundaries; excluded from the 3:1 requirement by design, preserved verbatim per constraint |

All required pairings clear their threshold with margin. Worked example (surface+accent, light): `L(#f3eadc)=0.8302`, `L(#8a4e26)=0.1100`; `(0.8302+0.05)/(0.1100+0.05)=5.50`.

## Token Architecture (unified `@theme`, `src/styles/global.css`)

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme {
  --color-surface: #080909;          /* surface0 — canvas */
  --color-surface-alt: #111212;      /* surface1 — cards */
  --color-surface-elevated: #191a1a; /* surface2 — overlays */
  --color-surface-glass: rgba(255,255,255,0.03);
  --color-text: #f0efeb;
  --color-text-secondary: #a5a6a2;
  --color-accent: #dda783;
  --color-accent-muted: rgba(221,167,131,0.07);
  --color-on-accent: #080909;
  --color-border: rgba(255,255,255,0.11);
  --color-border-hover: rgba(255,255,255,0.24);
  --color-danger: #ff4d4d;
  --color-on-danger: #080909;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  /* spacing/typography scale unchanged from current global.css */
}

[data-theme="light"] {
  --color-surface: #f3eadc;
  --color-surface-alt: #fff7ea;
  --color-surface-elevated: #fffdf6;
  --color-surface-glass: rgba(0,0,0,0.02);
  --color-text: #17120d;
  --color-text-secondary: #6b5947;
  --color-accent: #8a4e26;
  --color-accent-muted: rgba(138,78,38,0.10);
  --color-on-accent: #fff7ea;
  --color-border: rgba(0,0,0,0.10);
  --color-border-hover: rgba(0,0,0,0.18);
  --color-danger: #b3261e;
  --color-on-danger: #fff7ea;
}

[data-theme="dark"] { color-scheme: dark; }
[data-theme="light"] { color-scheme: light; }
```

Delete: the dead `.light` class block, the duplicate `@media (prefers-color-scheme: light)` block, `html{color-scheme: dark light}` (superseded by the two rules above).

## No-Flash Init Script (`src/layouts/BaseLayout.astro`)

Placed as the **first child of `<head>`**, before the favicon link and before Astro's injected `global.css` stylesheet link, so the attribute is set before any theme-dependent CSS custom property is read for paint:

```html
<script is:inline>
  (function () {
    var KEY = 'dreamfolio-theme';
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f3eadc' : '#080909');
  })();
</script>
```

The existing static `<meta name="theme-color" content="#080909">` stays as the SSR/no-JS fallback; the script above overwrites its `content` synchronously.

## Navbar Toggle (`src/components/ui/Navbar.tsx`)

- New icons: add `sun` and `moon` glyphs to `src/lib/icons.ts` (24px grid, 1.6px stroke, matching the existing set) — no sun/moon glyph exists today; this extends the existing shared icon registry rather than creating a parallel system.
- Markup: new `<button className="theme-toggle" aria-label="..." aria-pressed={isLight}>` inserted as a sibling of `.menu-toggle` inside `<nav className="nav-wrap">` (not inside `.desktop-nav`, which is `display:none` below 720px — the toggle must stay reachable on mobile). Real `<button>`, `aria-pressed` reflects boolean light/dark state per `code-standards.md`'s ARIA-state rule.
- State sync: `useEffect` on mount reads `document.documentElement.dataset.theme` (already set by the inline script) into local React state — SSR-rendered markup defaults to the dark icon to avoid a hydration-mismatch warning; the 1-frame icon swap is non-blocking (only the icon glyph, not FOUC-critical surface/text colors).
- On click: set `data-theme` attribute, `localStorage.setItem('dreamfolio-theme', next)`, update the `theme-color` meta `content` — same three effects as the init script, mirrored client-side.
- Styling: `.theme-toggle` reuses `.menu-toggle`'s existing pattern (`min-height:44px; min-width:44px; border:1px solid var(--color-border); border-radius:4px; background:transparent`), added to `portfolio.css`.

## `404.astro` / `projects/[id].astro` Reconciliation

Every `var(--color-*)` reference already resolves through the same custom-property names; once `global.css` is the sole source, these pages automatically consume the unified tokens with no class renames needed. Confirmed sites: `404.astro:12` (`text-[var(--color-accent)]`), `projects/[id].astro:44,91,98` (`text-[var(--color-accent)]`, `hover:text-[var(--color-accent)]`) — no substitution required, only the definition changes underneath them.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/styles/global.css` | Modify | Single `@theme`, `@custom-variant dark`, `[data-theme=light]` block; drop dead `.light` class + duplicate media query |
| `src/styles/portfolio.css` | Modify | Delete redundant `:root{--color-*}` block; tiered literal→token conversion (see decision above); add `.theme-toggle` styles |
| `tailwind.config.mjs` | Delete | Confirmed fully dead; no migration needed (see decision above) |
| `src/layouts/BaseLayout.astro` | Modify | Add inline no-flash script as first `<head>` child |
| `src/components/ui/Navbar.tsx` | Modify | Add `.theme-toggle` button, state sync, persistence handler |
| `src/lib/icons.ts` | Modify | Add `sun`, `moon` glyphs |
| `src/pages/404.astro`, `src/pages/projects/[id].astro` | No change | Already reference `var(--color-*)`; correctness flows from the token-source change |

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Contrast math | Every documented token pairing | Relative-luminance formula, computed and shown inline above (this document is the record) |
| Manual/visual | Toggle switches theme, persists across reload, no flash | `pnpm dev`, toggle in Navbar, hard reload, DevTools throttled paint check |
| Manual/visual | `404.astro` and `projects/[id].astro` render unified brand in both modes | Navigate to each route under both `data-theme` values |
| Build | `pnpm run build` stays green, 10 static pages | Run build after `tailwind.config.mjs` deletion and CSS consolidation |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary in this change.

## Migration / Rollout

1. Add unified `@theme` + `@custom-variant` + `[data-theme=light]` to `global.css`; remove dead selectors.
2. Delete `portfolio.css`'s redundant `:root` block; apply tiered literal→token conversion.
3. Add no-flash script to `BaseLayout.astro`.
4. Add toggle to `Navbar.tsx`; add `sun`/`moon` icons.
5. Delete `tailwind.config.mjs`.
6. Verify `404.astro`/`projects/[id].astro` render correctly in both modes (no code change expected).
7. `pnpm run build`.

No data/schema migration; no feature flag (single atomic CSS/markup change per proposal's rollback plan).

## Open Questions

- [ ] Tier-3 one-off literals in `portfolio.css` (rare, no clean semantic mapping) — exact list only surfaces once the tiering sweep runs at tasks/apply time; each must be spot-verified against the light surface before merge.
- [ ] Whether to also fix the broader orphaned-component set discovered here (`EvidenceEngine.tsx`, `FeaturedProjectsSection.astro`, `ProjectsSection.astro`, `SystemUnit.astro`, `TechSection.astro`, `TechnicalIntake.tsx`) — currently out of scope, same class as `EnhancedHero.tsx`/`link-button.tsx`; flagged for a follow-up decision, not blocking this change.
