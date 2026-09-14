# Library Helpers

`src/lib/` holds small presentation-oriented helpers plus two build-time resolvers. There is no
database client here, and the analytics module is disabled unless it is configured.

| File | Purpose |
| ------ | --------- |
| `site.ts` | `siteConfig`, `basePath`, and the path helpers `withBase`, `withBaseAsset`, `mailto` and `toAbsoluteSiteUrl` — what lets GitHub Pages (`/DreamFolio`) and Vercel (`/`) be served from one tree. |
| `icons.ts` | The icon set (`icons`) and its `IconName` union, consumed by `Icon.astro`. |
| `project-presentation.ts` | `getProjectSlug` — the slug rule shared by links and routes. |
| `project-case-studies.ts` | Curated long-form case-study copy and the highlight ranking, via `getProjectCaseStudy` and `getProjectHighlightRank`. |
| `analytics.ts` | `resolveAnalytics`, which turns `PUBLIC_UMAMI_SRC` / `PUBLIC_UMAMI_WEBSITE_ID` into one configuration consumed by both the page's script tag and the Content-Security-Policy. With those variables unset, analytics is off. |
| `astro-mode.ts` | `resolveMode`, which derives the Astro mode from the CLI arguments, because `NODE_ENV` cannot be trusted for it. |

## Rule

Do not add service abstractions unless production code uses them. The public portfolio should stay
inspectable and boring where possible.
