# Accessibility and SEO

[Back to the index](./README.md)

## Accessibility

Each criterion has something that holds it and fails when it breaks, instead of relying on
intent:

| Criterion                            | What holds it                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Semantic HTML, one heading hierarchy | Review; the suites locate elements by role and heading                                                                  |
| Alt text on every image              | Review, and the cover `alt` as a schema field (`coverImageAlt`)                                                         |
| Consistent focus ring                | One `:focus-visible` rule in `base.css` (3px, 5px offset), asserted in `tests/theme-state/focus-ring.spec.ts`           |
| Text contrast ≥ 4.5:1                | The contrast harness (`tests/support/contrast.ts`) composites and measures rest, hover, press, and focus in both themes |
| Non-text contrast ≥ 3:1              | The A7 assertions in `tests/unit/tokens-contrast.test.ts`                                                               |
| `prefers-reduced-motion`             | A guard in `global.css` that neutralizes transitions and animations; `tests/theme-state/motion-reduced.spec.ts`         |
| `prefers-contrast: more`             | Token blocks in both themes; `tests/theme-state/prefers-contrast.spec.ts`                                               |
| `forced-colors`                      | Non-chromatic signals in `portfolio/18-interaction-states.css`; `forced-colors.spec.ts`                                 |
| Keyboard navigation                  | E2E tests reach focus with `Tab`, never a click: `:focus-visible` only matches that way                                 |

## Technical SEO

The whole `<head>` lives in `src/layouts/BaseLayout.astro`: `canonical`, Open Graph (type, URL,
title, description, image, image type, alt, and `site_name`), and the Twitter tags. `site` and
`base` come from `astro.config.mjs`, which serves GitHub Pages under `/DreamFolio` and Vercel from
`/`.

Build asset URLs with `withBase` / `withBaseAsset` from `src/lib/site.ts`. A hand-written absolute
path breaks under `/DreamFolio`.

### Sitemap and `robots.txt`

`@astrojs/sitemap` generates `sitemap-index.xml` on every build. `robots.txt` is **not a static
file**: `src/pages/robots.txt.ts` emits it at build time and builds the sitemap URL with `withBase`
so it respects `base`. That avoids the double slash an older version of this guide shipped.

```ts
// src/pages/robots.txt.ts
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL(withBase("sitemap-index.xml"), site);
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl.toString()}\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
```

## Checklist for a new page

- [ ] The accessibility table above still holds.
- [ ] `canonical` and Open Graph are correct on the new page.
- [ ] The page appears in `sitemap-index.xml`.
