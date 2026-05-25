# Islands Architecture

DreamFolio follows Astro's islands model: render static HTML by default and hydrate only the components that need browser state.

## Current islands

| Island | Directive | Reason |
|--------|-----------|--------|
| `Navbar` | `client:load` | Navigation and mobile menu must work immediately. |
| `EnhancedHero` | `client:idle` | Interactive signal selector can hydrate after first render. |
| `EvidenceEngine` | `client:visible` | Inspection UI is below the fold and interactive. |
| `TechnicalIntake` | `client:visible` | Clipboard, validation, domain selection, and mailto draft. |

## Static sections

These are `.astro` because they do not require client state:

- `CraftProtocol`
- `TrinitySection`
- `SystemUnit`
- `VisualLab`
- `TechnicalDepth`
- `CollaborationSection`

## Rule

If a section only presents content, it stays static. If it needs state, browser APIs, or a controlled interaction, it may become an island and should use the latest safe hydration directive.

## Anti-patterns avoided

- Hydrating cards only for hover animation.
- Shipping a form library for a `mailto:` flow.
- Using ARIA tab roles without full keyboard tab behavior.
- Keeping docs that describe deleted code.
