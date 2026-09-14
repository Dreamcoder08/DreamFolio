# Astro vs Next.js for DreamFolio

DreamFolio is a portfolio and proof surface, not an authenticated application. Astro is the right
default, and the current tree confirms it: the whole site is static HTML, with two small vanilla
scripts and no client framework.

| Concern | Astro fit | Next.js fit | Decision |
| --------- | ----------- | ------------- | ---------- |
| Static content | Excellent | Good | Astro |
| SEO / metadata | Excellent | Excellent | Tie |
| Client JavaScript | Opt-in per component, and this repo opts out entirely | Framework runtime by default | Astro |
| Auth or database work | Manual | Strong | Not needed — there is no backend |
| Portfolio complexity | Low | Usually too much | Astro |

## Why Astro wins here

- Every section is static proof or copy, and none of them needs browser state.
- The site ships no framework runtime, so the only JavaScript is the pre-paint theme bootstrap and
  the nav script.
- The repository demonstrates frontend restraint: less JavaScript, more HTML.

## When Next.js would make sense

Use Next.js if DreamFolio becomes an authenticated dashboard, a CMS-backed product, or a
server-action-heavy application. Until then Astro is the cleaner architecture — and the question is
not hypothetical here, because this repository already made that move once, in the other direction.
