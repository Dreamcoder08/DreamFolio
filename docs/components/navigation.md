# Navbar

`src/components/ui/Navbar.tsx` is a hydrated React island.

## Why React

- Tracks scroll state.
- Opens/closes the mobile inspection menu.
- Smooth-scrolls to in-page sections.

## Hydration

`client:load` because navigation must be available immediately.

## Quality notes

- External links include `rel="noopener noreferrer"`.
- The menu button exposes `aria-expanded` and `aria-controls`.
- Brand link points through `withBase('/')` for GitHub Pages compatibility.
