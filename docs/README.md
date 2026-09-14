# DreamFolio Documentation

DreamFolio is a public portfolio built as a **fully static Astro site**: no client framework, no
hydration directive anywhere, and no runtime data fetching. The browser receives HTML, CSS, and the
two small vanilla scripts named below — nothing else.

## Current architecture

```txt
Astro static shell  (output: 'static', zero islands)
├── BaseLayout.astro            head, CSP, theme bootstrap, analytics tag
├── Pages                       index · 404 · projects/index · projects/[id] · robots.txt
├── Components (3, all .astro)  Icon · Navbar · ProfileCard
├── Typed content               src/content.config.ts over src/data/projects.json
├── Presentation helpers        src/lib/{site,icons,project-presentation,project-case-studies}.ts
├── Build helpers               src/lib/{analytics,astro-mode}.ts
└── Styles                      src/styles/global.css (Tailwind 4 @theme tokens) · portfolio.css
```

There is no `src/components/sections/` directory, and no `.tsx` file.

## Quality rules

- Build every component as `.astro`. Nothing in this repository needs a client framework.
- JavaScript stays exceptional and small. Two scripts exist: `public/theme-init.js`, which applies
  the stored theme before the first paint, and one inline script in `Navbar.astro` that drives the
  mobile menu and the theme toggle. Both are vanilla; neither is a hydrated component.
- Keep public copy direct and evidence-first.
- Before shipping: `pnpm run verify`, `pnpm run test:e2e`, `pnpm run format:check`.

## Key docs

- [Architecture overview](./architecture/README.md)
- [Islands architecture](./architecture/islands-architecture.md)
- [Astro vs Next.js](./architecture/stack-comparison.md)
- [Component catalog](./components/README.md)
- [Library helpers](./lib/README.md)
- [Getting started](./guides/getting-started.md)
