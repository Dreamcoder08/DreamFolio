# Proposal: Dual Real Light/Dark Theme System

## Intent

DreamFolio has no working theme toggle and three fragmented, contradictory token systems (dead `tailwind.config.mjs`, an unused cyan `@theme` in `global.css`, and a hardcoded amber system in `portfolio.css`). This causes a real user-visible bug: 404 and project-detail pages render cyan branding while the rest of the site renders amber. There is also zero light-mode coverage for the amber system and no toggle mechanism at all. This change consolidates all token systems into one source of truth, ships a real `data-theme` toggle with persistence and no-flash init, and adds a WCAG-compliant light theme — using the amber identity already shipped in dark mode (confirmed pre-proposal decision) with Dreamcoder OS's token architecture (semantic `on_*` pairs, surface layering, contrast guardrails), not its literal palette.

## Scope

### In Scope
- Single `@theme` source of truth in `global.css` (Tailwind 4 CSS-first), deleting `tailwind.config.mjs` after migrating `darkMode`/`screens`/`fontFamily`
- New amber-compatible light theme (parchment/cocoa surfaces, amber-family accent), dark theme unchanged (`#dda783` on `#080909`)
- `data-theme="dark"|"light"` mechanism: no-flash inline script in `BaseLayout.astro` (`localStorage` → `prefers-color-scheme` fallback, pre-paint)
- Toggle control in `Navbar.tsx`: persists explicit choice to `localStorage`, syncs `theme-color` meta for both modes
- `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` so `dark:` utilities track the attribute
- Reconcile `404.astro` and `projects/[id].astro` off cyan onto the single token system
- Semantic `on_*` token pairs and `surface0`-style layering (pure-black canvas, near-black scrollable surface) for both themes
- Manual WCAG 2.1 AA verification (4.5:1 body / 3:1 large-text/UI) per token pairing, both themes

### Out of Scope
- Deleting/fixing orphaned `EnhancedHero.tsx` / `link-button.tsx` (dead code, no live bug)
- Updating `.opencode/skills/tailwind.md` stale doc (fast-follow)
- Automated contrast-regression tooling (recommend as follow-up)

## Capabilities

### New Capabilities
- `design-tokens`: single `@theme` source of truth for both themes — surface/text/accent/border/focus/on_* semantic pairs, WCAG guardrails, replaces all three legacy systems
- `theme-toggle`: `data-theme` attribute mechanism, no-flash init script, `localStorage` persistence, Navbar UI control, `theme-color` meta sync, `@custom-variant dark`

### Modified Capabilities
None (no prior specs exist for theming).

## Approach

Adopt Dreamcoder OS's *architecture*, not its hex values: attribute-driven theming, semantic token pairs, layered surfaces, documented contrast minimums. Keep amber as the dark-theme identity per the confirmed decision. Consolidate onto `global.css`; delete the dead config. Wire pages currently on cyan onto the unified tokens. No new runtime dependencies.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `tailwind.config.mjs` | Removed | Dead; migrate `darkMode`/`screens`/`fontFamily` into CSS-first `@theme`, then delete |
| `src/styles/global.css` | Modified | Becomes single `@theme` + `[data-theme]` source of truth; drop dead `.light` class and duplicate media block |
| `src/styles/portfolio.css` | Modified | Gains light-theme values under `[data-theme=light]`; dark values preserved |
| `src/layouts/BaseLayout.astro` | Modified | Add no-flash inline theme-init script + dual `theme-color` meta |
| `src/components/ui/Navbar.tsx` | Modified | Add theme toggle control with persistence |
| `src/pages/404.astro` | Modified | Reconcile cyan arbitrary-value classes onto unified tokens |
| `src/pages/projects/[id].astro` | Modified | Reconcile cyan arbitrary-value classes onto unified tokens |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| New light-theme accent fails WCAG contrast | Med | Manual relative-luminance check per pairing before merge; iterate hue/lightness until AA (prefer AAA) |
| Token consolidation regresses existing dark-mode contrast | Low | Dark values copied verbatim from `portfolio.css`, not re-derived |
| `tailwind.config.mjs` deletion breaks a hidden dependency | Low | Confirmed dead via explore (no `@config` directive); grep for remaining references before deletion |
| No-flash script mistimed causes FOUC | Low | Inline, synchronous, placed before first paint in `<head>` |

## Rollback Plan

All changes are CSS/token/markup-level within existing files (no schema/data changes). Revert via `git revert` of the change's commit(s); `tailwind.config.mjs` can be restored from git history if an undiscovered dependency surfaces.

## Dependencies

None external. No new npm packages.

## Success Criteria

- [ ] One `@theme` block in `global.css`; `tailwind.config.mjs` deleted
- [ ] Toggle in `Navbar.tsx` switches themes, persists across reload, no flash on load
- [ ] `404.astro` and `projects/[id].astro` render the same brand as the rest of the site in both themes
- [ ] Every token pairing meets WCAG 2.1 AA (manually verified), dark-mode ratios unregressed
- [ ] `pnpm run build` stays green, 10 static pages, no meaningful bundle regression
