# Design Tokens Specification

## Purpose

Single `@theme` source of truth in `global.css` covering both `dark` and `light` modes, replacing three fragmented legacy systems (dead `tailwind.config.mjs`, unused cyan `@theme`, hardcoded amber `portfolio.css`). Defines token categories, semantic `on_*` pairs, surface-layering policy, and WCAG 2.1 AA contrast guardrails.

## Requirements

### Requirement: Single Token Source of Truth
The system MUST define exactly one `@theme` block in `src/styles/global.css` covering both modes. The system MUST NOT retain `tailwind.config.mjs` as a token source after migration, and MUST NOT keep the dead `.light` class block or the duplicate `prefers-color-scheme` media block in `global.css`.

#### Scenario: One theme definition after consolidation
- GIVEN the codebase after this change is applied
- WHEN searching for `@theme` blocks and `--color-*` definitions across the codebase
- THEN exactly one `@theme` block exists, in `global.css`, and no legacy `.light` class or duplicate media block remains

### Requirement: Token Categories and Semantic Pairs
The `@theme` MUST define, per mode, surface/text/accent/border/focus tokens plus semantic `on_*` pairs (`on_surface`, `on_accent`, `on_error`, `on_focus`) naming the legible foreground for each corresponding background token.

#### Scenario: Semantic pairs resolve for every background token
- GIVEN a component renders text atop `--color-accent`, `--color-surface`, or an error/focus state
- WHEN it needs a legible foreground color
- THEN the matching `on_*` semantic token is defined for the active mode

### Requirement: Surface Layering Policy
Dark mode MUST use a pure-black canvas for the outermost page background, and MUST define a distinct near-black `surface0`-equivalent token for scrollable/functional surfaces (cards, panels, scroll containers) to avoid OLED smear.

#### Scenario: Canvas vs. functional surface distinction
- GIVEN dark mode is active
- WHEN a scrollable panel or card renders on the page canvas
- THEN the panel uses the `surface0`-equivalent token, not the pure-black canvas token, and the two are visually distinguishable

### Requirement: Dark Theme Values Preserved
The dark theme MUST preserve the already-verified literal values unchanged: accent `#dda783` on surface `#080909` (~9.5:1 contrast). These values MUST NOT be re-derived during consolidation.
(Fixed constraint, not a design decision — see proposal.)

#### Scenario: Dark accent/surface unchanged after migration
- GIVEN the pre-change dark palette (`#dda783` accent, `#080909` surface)
- WHEN tokens are migrated into the single `@theme` block
- THEN dark-mode `--color-accent` is `#dda783`, `--color-surface` is `#080909`, and measured contrast remains ≥ 9.5:1

### Requirement: Light Theme Contract
The light theme MUST use parchment/warm surface tones and an amber-family accent consistent with the dark-theme identity, MUST define every token category and `on_*` pair that dark mode defines, and MUST meet the same WCAG guardrails. Exact hex values are NOT specified here; they are determined during design.

#### Scenario: Light theme structurally mirrors dark theme
- GIVEN the light-mode token set
- WHEN compared against the dark-mode token set
- THEN every dark-mode token key has a corresponding light-mode value, the accent is amber-family (not cyan), and the surface is a warm parchment/cocoa tone, not pure white

### Requirement: WCAG 2.1 AA Contrast Guardrails
Every text/background token pairing, in both modes, MUST meet WCAG 2.1 AA: ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components.

#### Scenario: Body and large-text/UI pairings meet AA
- GIVEN any text/surface pairing used for body copy, and any accent/border/focus pairing used for large text or UI, in either mode
- WHEN the relative-luminance contrast ratio is computed
- THEN body pairings are ≥ 4.5:1 and large-text/UI pairings are ≥ 3:1

#### Scenario: Candidate pairing fails AA (edge case)
- GIVEN a candidate light-mode accent value producing < 4.5:1 against its paired text
- WHEN evaluated against this guardrail
- THEN the pairing is rejected and MUST NOT ship until adjusted to meet the ratio

### Requirement: Unified Token Consumption on All Pages
Every page, including `404.astro` and `projects/[id].astro`, MUST consume the single token system exclusively; no page MUST render cyan-family values from the deleted legacy systems.

#### Scenario: 404 and project-detail pages render unified tokens in both modes
- GIVEN `data-theme` is set to `dark`, then to `light`
- WHEN `404.astro` and `projects/[id].astro` are rendered under each mode
- THEN their accent and text colors resolve to the active mode's unified tokens and no cyan value (e.g. `#00d4ff`) appears on either page
