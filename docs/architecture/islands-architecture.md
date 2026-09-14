# Islands Architecture

DreamFolio has **no islands**. The site previously used Astro's islands model; it does not any more,
and this page records what replaced it rather than describing components that no longer exist.

## Current state

- Zero `client:*` directives — `grep -rn "client:" src/` returns nothing.
- Zero `.tsx` files, and no React, Preact, Svelte, Vue or Solid dependency in `package.json`.
- Every component is an `.astro` file that renders to HTML at build time.

## What the JavaScript is

Two scripts, neither of them a hydrated component:

| Script | Where | Why |
|--------|-------|-----|
| Theme bootstrap | `public/theme-init.js`, a blocking classic script loaded from `BaseLayout.astro` | Applies the stored theme before the first paint, so the page never flashes the wrong one. |
| Menu and theme toggle | one inline `<script>` in `Navbar.astro` | The mobile menu and the toggle need the browser, and are small enough to stay vanilla. |

## Rule

If a section only presents content it stays static, which today is all of them. Adding a client
framework would require a real interaction that vanilla JavaScript cannot express, and that argument
has not been made.

## Anti-patterns avoided

- Adding a framework to animate a card on hover.
- Shipping a form library for a `mailto:` flow.
- Using ARIA tab roles without the full keyboard tab behaviour.
- Keeping documentation that describes code which has been deleted.
