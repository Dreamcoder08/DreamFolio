# Architecture Overview

DreamFolio is a static-first Astro portfolio with selective React hydration. The architecture is intentionally small because the product is public proof, not a SaaS dashboard.

## Core decisions

| Decision | Rationale |
|----------|-----------|
| Astro static output | Portfolio content should ship as HTML first. |
| React islands only for real interaction | Avoids hydrating static marketing sections. |
| Typed content collection | Keeps project data validated at build time. |
| CSS-first motion/hover for static sections | Visual polish without unnecessary JavaScript. |
| No public backend | Contact uses a local `mailto:` draft; no public secrets or database client. |

## Runtime composition

```txt
BaseLayout.astro
└── index.astro
    ├── Navbar.tsx                 client:load
    ├── EnhancedHero.tsx           client:idle
    ├── CraftProtocol.astro        static
    ├── EvidenceEngine.tsx         client:visible
    ├── TrinitySection.astro       static
    ├── SystemUnit.astro           static native details
    ├── VisualLab.astro            static
    ├── TechnicalDepth.astro       static
    ├── CollaborationSection.astro static
    └── TechnicalIntake.tsx        client:visible
```

## Public/private boundary

DreamFolio is public. Arkelythex internals are not. The portfolio may explain systems, architecture principles, and public proof, but it must not expose private fiscal rules, credentials, agent prompts, or proprietary workflows.

## Verification

Before shipping:

```bash
pnpm run build
pnpm run check
git diff --check
```
