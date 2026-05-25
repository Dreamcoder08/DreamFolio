# Astro vs Next.js for DreamFolio

DreamFolio is a portfolio and proof surface, not an authenticated application. Astro is the right default.

| Concern | Astro fit | Next.js fit | Decision |
|---------|-----------|-------------|----------|
| Static content | Excellent | Good | Astro |
| SEO/metadata | Excellent | Excellent | Tie |
| Hydration control | Excellent | More app-oriented | Astro |
| Auth/database app | Manual | Strong | Not needed |
| Portfolio complexity | Low | Often too high | Astro |

## Why Astro wins here

- Most sections are static proof/copy.
- React is still available for the few interactive islands.
- The repo demonstrates frontend restraint: less JS, more HTML.

## When Next.js would make sense

Use Next.js if DreamFolio becomes an authenticated dashboard, CMS-backed product, or server-action-heavy app. Until then, Astro is the cleaner architecture.
