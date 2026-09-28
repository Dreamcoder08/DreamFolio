# Explore: Dual real light/dark theme system for DreamFolio

## Current State

No theme toggle exists anywhere. `src/layouts/BaseLayout.astro` has zero `data-theme`/`localStorage`/JS toggle logic — the only branching is a static `<meta name="theme-color" content="#080909">` (always dark, no light-mode counterpart). `src/components/ui/Navbar.tsx` has no toggle control. The only light-mode signal today is a `@media (prefers-color-scheme: light)` block in `global.css`.

Three fragmented token systems coexist:

1. **`tailwind.config.mjs`** — dead code. `astro.config.mjs` wires Tailwind 4 through `@tailwindcss/vite` with no config path, and no `@config` directive exists in any `src/styles/*.css`. Its shadcn HSL tokens and cyberpunk keyframes are never read by the build.
2. **`src/styles/global.css`** — real active `@theme` (Tailwind 4 CSS-first). OLED-black + cyan system (`--color-surface:#000000`, `--color-accent:#00d4ff`). Defines the light override **twice**, redundantly: once as a `.light` class block (confirmed dead — nothing in the codebase ever sets a `.light` class) and once as `@media (prefers-color-scheme: light)`.
3. **`src/styles/portfolio.css`** — warm amber/cocoa hardcoded hex system (`#080909` surface, `#dda783` accent), no light-mode variant at all, unrelated to global.css's `@theme`.

Import map: `global.css` loads once via `BaseLayout.astro` (every page). `portfolio.css` loads redundantly 3× (`index.astro`, `projects/index.astro`, `Navbar.tsx`).

**Page-level brand split (verified, real user-visible bug)**: `src/pages/404.astro` and `src/pages/projects/[id].astro` consume global.css's cyan tokens via Tailwind arbitrary syntax (`text-[var(--color-accent)]`, confirmed at 404.astro:12 and projects/[id].astro:44/91/98), while `index.astro`, `projects/index.astro`, and `Navbar.tsx` render under portfolio.css's amber system. A user going from homepage → project detail page sees a different brand mid-session.

**`.opencode/skills/tailwind.md`** documents a 4th, entirely aspirational palette (`#0066FF`/`#9933FF`/`#0a0a0f`) matching none of the three real systems — stale doc, needs correcting alongside consolidation.

**Correction to an initial exploration finding**: `src/components/sections/EnhancedHero.tsx` and `src/components/ui/link-button.tsx` use `bg-primary`/`border-primary`/`text-primary` Tailwind utilities that reference a `--color-primary` token which only ever existed in the dead `tailwind.config.mjs` (confirmed: no `--color-primary` anywhere in live CSS). However, verification shows **neither component is imported/rendered by any page** (`grep -rl` for both finds only the component's own file). This is dead/orphaned code, not a live visual bug — it does not affect the deployed site today. Still worth deleting or fixing while touching this area, but it is not a user-facing defect.

**Contrast verification performed** (WCAG relative-luminance formula): portfolio.css's existing dark palette is already good — `#dda783` accent on `#080909` ≈ 9.5:1 (exceeds AAA), `#a5a6a2` secondary text on `#080909` ≈ 7.8:1 (exceeds AA). The real gap is not dark-mode legibility; it's zero light-mode coverage for portfolio.css, zero switch mechanism, and the fragmentation itself.

## Reference Palette (fetched live from `Dreamcoder08/Dreamcoder-Workbench`, `DreamcoderThemes/dreamcoder/tokens.json`)

Ships explicit guardrails (`minimum_text_contrast: 4.5`, `preferred_main_text_contrast: 7.0`, APCA thresholds) plus a `surface_policy` (pure-black canvas, but `surface0 #060608` for scrollable/functional areas to avoid OLED smear) and full `on_*` semantic pairs (`on_surface`, `on_accent`, `on_error`, `on_focus`) — token discipline worth adopting architecturally regardless of which palette wins.

- **Dreamcoder Dark**: `bg:#000000`, `surface0:#060608`, `surface1:#0D0D11`, `surface2:#16161D`, `text:#E2E8F0`, `border:#68788F`, `focus:#3B82F6`, `accent:#A5B4FC`, `brand:#6366F1`, `success:#34D399`, `warning:#FBBF24`, `error:#F87171`, `on_accent:#000000`.
- **Dreamcoder Light**: `bg:#f3eadc` (warm cocoa/parchment, not stark white), `surface0:#fff7ea`, `text:#17120d`, `border:#8a7358`, `focus:#0f6570`, `accent:#824f16`, `accent_2:#a7471c`, `on_accent:#fff7ea`.

## Affected Areas

- `tailwind.config.mjs` — dead; delete or migrate `darkMode`/`fontFamily`/`screens` into CSS-first `@theme`.
- `src/styles/global.css` — dead `.light` selector plus duplicate `prefers-color-scheme` block; needs restructuring into one `[data-theme]`-driven `@theme`.
- `src/styles/portfolio.css` — good dark-mode contrast, zero light variant; its amber identity is the key fork-point decision.
- `src/layouts/BaseLayout.astro` — correct location for a no-flash inline theme-init `<script>` and a `theme-color` meta pair.
- `src/components/ui/Navbar.tsx` — no toggle exists; has an existing icon-button pattern (`.menu-toggle`) to model a toggle on.
- `src/pages/404.astro`, `src/pages/projects/[id].astro` — on the cyan system; must reconcile onto whichever palette is chosen.
- `src/components/sections/EnhancedHero.tsx`, `src/components/ui/link-button.tsx` — orphaned/unused; broken token reference is latent, not live. Candidate for deletion or fix, low priority.
- `.opencode/skills/tailwind.md` — stale doc to update post-consolidation.

## Approaches

1. **Full Dreamcoder OS adoption** — replace both amber and cyan with the fetched Dreamcoder Dark/Light verbatim. Pros: canonical, guardrails baked in, single pass eliminates all 3 legacy systems. Cons: discards the just-merged amber brand entirely; indigo accent is a big visual departure. Effort: Medium.
2. **Hybrid** — keep portfolio.css's amber as dark-theme identity, design an amber-compatible light theme, borrow Dreamcoder's *architecture* (surface_policy, `on_*` pairs, data-theme mechanism) not its literal hex. Pros: preserves recently-shipped brand, still gets senior-grade architecture, less regression risk on dark mode's already-good contrast. Cons: light-mode accent still needs designing. Effort: Medium.
3. **Minimal incremental fix** — leave the two palettes as today's de-facto per-route split, only add toggle + per-route light variants. Not recommended: doesn't fix fragmentation, dead config, or the page-level brand split; contradicts the user's explicit ask. Effort: Low.

## Recommendation

Consolidate into one `@theme` source of truth in `global.css` (delete/fold `tailwind.config.mjs`), activated via `data-theme="light"|"dark"` on `<html>` set by a no-flash inline `<head>` script (localStorage → `prefers-color-scheme` fallback, applied pre-paint), plus a persisted `Navbar.tsx` toggle. Use Tailwind 4's `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` idiom so `dark:` tracks the attribute. Adopt Dreamcoder OS's *architecture* (surface layering, `on_*` semantic pairs, documented guardrails) regardless of outcome; leave the amber-vs-Dreamcoder-palette choice to the proposal gate — that is a product decision, not a technical one.

## Risks

- Amber-brand-vs-Dreamcoder-palette ambiguity must be resolved before `sdd-propose` (pending user decision).
- 404.astro / projects/[id].astro need reconciliation onto the chosen palette or the cyan/amber split persists on a subset of routes.
- No automated contrast-regression tooling exists; new light theme's WCAG compliance needs manual verification or a small script.

## Ready for Proposal

Yes — pending one product decision: amber-identity vs. Dreamcoder-palette for dark mode, and by extension the light-mode accent choice. Everything else is unambiguous.
