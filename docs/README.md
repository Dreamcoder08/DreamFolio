# DreamFolio Documentation

DreamFolio is a public portfolio built as a static-first Astro site with a small number of React islands for real interaction.

## Current architecture

```txt
Astro static shell
├── Static sections: VisualLab, CollaborationSection, SystemUnit, CraftProtocol, TrinitySection, TechnicalDepth
├── Hydrated islands: Navbar, EnhancedHero, EvidenceEngine, TechnicalIntake
├── Typed content: src/content.config.ts + src/data/projects.json
└── Presentation helpers: src/lib/site.ts, project-presentation.ts, project-case-studies.ts
```

## Quality rules

- Prefer `.astro` for content and layout sections.
- Use React only when state, clipboard, menu behavior, or inspection UI needs the browser.
- Keep public copy direct and evidence-first.
- Run `pnpm run build` and `pnpm run check` before shipping.

## Key docs

- [Architecture overview](./architecture/README.md)
- [Islands architecture](./architecture/islands-architecture.md)
- [Component catalog](./components/README.md)
- [Technical intake](./components/technical-intake.md)
- [Getting started](./guides/getting-started.md)
