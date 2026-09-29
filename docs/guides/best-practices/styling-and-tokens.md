# Styling and Tokens

[Back to the index](./README.md)

## Where styles live

| File                               | Holds                                                               |
| ---------------------------------- | ------------------------------------------------------------------- |
| `src/styles/global.css`            | Tailwind import, the `@theme` palette, light and contrast overrides |
| `src/styles/tokens/components.css` | Component-scoped token sets (`--terminal-*`)                        |
| `src/styles/base.css`              | The layered base: focus ring, scrollbar, element defaults           |
| `src/styles/portfolio.css`         | Ordered, unlayered imports of the 22 `portfolio/NN-*.css` partials  |
| `src/styles/components/*.css`      | Styles for the console and the terminal                             |

Import order is cascade order. Do not reorder partials or wrap unlayered rules in `@layer` without
proving the cascade is unchanged (see [Testing and verification](./testing-and-verification.md)).

## Two themes, one set of names

The theme is not a `.dark` class. It is the `data-theme` attribute on `<html>`, and every color
comes from a token in `src/styles/global.css`:

```css
@theme {
  /* dark mode: the canonical values */
}
[data-theme="light"] {
  /* light-mode overrides, unlayered so they beat the layered @theme */
}
```

- Semantic tokens are named by role, not by hue: `--color-surface`, `--color-text-secondary`,
  `--color-accent`, `--color-on-accent`, `--color-border-interactive`, `--color-focus`,
  `--color-danger`.
- Every `--color-*` token in `@theme` has a light counterpart that holds contrast in that theme.
  Adding a dark value alone ships a broken light theme.
- `@media (prefers-contrast: more)` blocks strengthen both themes.
- Component CSS never uses raw color literals. It reads `var(--color-*)` or a component token.

## Component tokens

When a component needs its own pairing, declare a namespaced set in
`src/styles/tokens/components.css` instead of new `--color-*` aliases:

- Dark values go in an `@theme` block, and every value is a `var(--color-*)`, never a new literal.
- Light overrides go in a plain, unlayered `[data-theme="light"]` block, and only for values that
  really differ. The terminal overrides just `--terminal-surface`; everything else already
  resolves per theme.

This keeps the design-system palette scoped to the system, and the token contract in
`tests/unit/tokens-*.test.ts` keeps covering every `--color-*` declaration.

## Theme bootstrap

- `public/theme-init.js` loads from `<head>` as a blocking classic script and applies the stored
  theme **before the first paint**. That is its whole reason to exist: deferring it brings back
  the flash of the wrong theme.
- It is a separate file, not an inline script, because Astro does not hash `is:inline` scripts
  for its CSP. An inline version would be blocked silently.
- The storage key is `dreamfolio-theme`. With no stored value, the theme follows the system
  `prefers-color-scheme`.
- The toggle lives in `src/components/ui/Navbar.astro` as vanilla JavaScript in a `<script>`. The
  key and theme colors appear in both files; keep them in step.

## Tailwind 4

Configuration is CSS-first; there is no `tailwind.config.mjs`. Add custom utilities in
`global.css` when needed, and handle conditional classes with a template literal or `class:list`
(there is no `cn()` helper).
