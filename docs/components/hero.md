# EnhancedHero

`src/components/sections/EnhancedHero.tsx` is the first-fold positioning island.

## Purpose

It states the core thesis directly: fiscal AI systems must be auditable before they are trusted.

## Hydration

`client:idle` because the page should render useful content before the signal selector hydrates.

## Interaction

The right-side signal selector uses regular toggle buttons with `aria-pressed`; it intentionally avoids incomplete ARIA tab semantics.
