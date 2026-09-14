# Architecture Overview

DreamFolio is a static Astro portfolio: every page is pre-rendered at build time and shipped as
HTML. The architecture is deliberately small because the product is public proof, not an application.

## Core decisions

| Decision | Rationale |
| ---------- | ----------- |
| `output: 'static'` | Portfolio content ships as HTML first; there is no server to run. |
| No client framework | The repository has no `.tsx` file and no hydration directive. Nothing needs one. |
| Typed content collection | `src/content.config.ts` validates `src/data/projects.json` at build time. |
| Tailwind 4, CSS-first | Tokens live in the `@theme` block of `global.css`; there is no `tailwind.config.mjs`. |
| JavaScript as an exception | Two vanilla scripts: the pre-paint theme bootstrap, and the nav menu/toggle. |
| No public backend | The contact path opens a local `mailto:` draft; no public secrets and no database client. |

## Runtime composition

```txt
BaseLayout.astro                    head, CSP, theme bootstrap, analytics tag
└── index.astro
    ├── Navbar.astro                static · mobile menu and theme toggle via one inline script
    ├── ProfileCard.astro           static
    └── Icon.astro                  static · inline SVG from src/lib/icons.ts

projects/index.astro · projects/[id].astro · 404.astro      static pages
pages/robots.txt.ts                                         endpoint, emitted at build time
```

No page uses a `client:*` directive, so nothing is client-rendered after the HTML arrives.

## Public/private boundary

DreamFolio is public. Arkelythex internals are not. The portfolio may explain systems, architecture
principles, and public proof, but it must not expose private fiscal rules, credentials, agent
prompts, or proprietary workflows.

## Verification

```bash
pnpm run verify        # astro build + tsc --noEmit
pnpm run test:e2e      # Playwright, chromium
pnpm run format:check
git diff --check
```
