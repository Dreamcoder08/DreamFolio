# Library Helpers

DreamFolio keeps shared logic small and presentation-oriented. There is no active analytics client or database client in the public portfolio.

## Active helpers

| File | Purpose |
|------|---------|
| `src/lib/site.ts` | Base path and absolute URL helpers for GitHub Pages/Vercel compatibility. |
| `src/lib/project-presentation.ts` | Project tone, cover classes, labels, and slug generation. |
| `src/lib/project-case-studies.ts` | Curated case-study copy for selected projects. |
| `src/lib/utils.ts` | Small class-name utility helpers. |

## Rule

Do not add service abstractions unless they are used by production code. Public portfolio architecture should stay inspectable and boring where possible.
