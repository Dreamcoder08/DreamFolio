# DreamFolio

> Elite public portfolio for fiscal AI systems architecture — inspectable systems, static-first frontend execution, and the Dreamcoder08 design philosophy.

A curated portfolio by Dreamcoder08 showcasing production-grade frontend architecture, accessibility-first design systems, and the engineering behind the ARKELYTHEX fiscal intelligence ecosystem.

---

## Overview

DreamFolio is the proof surface for frontend craft, architecture, accessibility, and product narrative. It demonstrates how complex fiscal-operational systems can be presented with clarity, warmth, and technical depth.

### Key Capabilities

- **Static-First Architecture** — Astro renders static HTML by default; React hydrates only where the browser must own state or behavior
- **Accessibility-First Design** — Lighthouse scores: Accessibility 100, Best Practices 100, SEO 100, Agentic Browsing 100
- **Evidence-Focused Narrative** — Interactive evidence engine, technical intake system, and signal selector for live system demonstrations
- **Cocoa Brand Identity** — Warm, premium design system built on Cocoa #B97A45, Cream #EFE4D7, and Lúcuma #D8A64A

---

## Architecture

DreamFolio is intentionally simple: Astro renders the portfolio as static HTML, and React is used only where the UI needs real client-side behavior.

```
src/
├── components/
│   ├── sections/          # Landing and project sections
│   │   ├── *.astro        # Static sections, preferred by default
│   │   └── *.tsx          # Hydrated islands only when interaction is real
│   └── ui/                # Small reusable React primitives
├── content.config.ts      # Typed project collection schema
├── data/                  # Public system data
├── layouts/               # Base document layout and SEO
├── lib/                   # Presentation/site helpers
├── pages/                 # Astro routes
└── styles/                # Global Tailwind/Cocoa theme
```

## Hydration policy

Static by default. Hydrate only when the browser must own state or behavior.

Current hydrated islands:

- `Navbar` — mobile menu and smooth section navigation.
- `EnhancedHero` — interactive signal selector.
- `EvidenceEngine` — interactive evidence/preset inspection.
- `TechnicalIntake` — clipboard, local validation, target-domain selection, and `mailto:` draft generation.

Static sections include `VisualLab`, `CollaborationSection`, `SystemUnit`, `CraftProtocol`, `TrinitySection`, and `TechnicalDepth`.

---

## Quickstart

```bash
pnpm install
pnpm dev
```

Preview production build:

```bash
pnpm run build
pnpm run preview
```

## Quality gates

```bash
pnpm install
pnpm run verify
git diff --check
```

## Tech Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Framework | Astro 5 | Static-first SSG with island hydration |
| Interactive Islands | React 19 | Client-side behavior where needed |
| Styling | Tailwind CSS 4 | Utility-first with Cocoa theme tokens |
| Animation | Motion | Minimal, purposeful motion |
| Language | TypeScript strict mode | Type safety across the stack |
| Package Manager | pnpm | Fast, disk-efficient dependency management |

---

## Project Status

**Status:** Active
**Version:** 1.0

---

## Relationship to Dreamcoder08

Portfolio by [Dreamcoder08](https://github.com/Dreamcoder08) — part of the [ARKELYTHEX ecosystem](https://github.com/arkelythex).

---

## SDD

Documentation is maintained in the [SDD Maestro](../arkelythex/sdd/ecosystem-readme-sdd/00-README.md). Edit the SDD first, then propagate.
