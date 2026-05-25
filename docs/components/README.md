# Component Catalog

DreamFolio uses Astro sections by default and React islands only for real browser behavior.

## Static Astro sections

| Component | File | Purpose |
|-----------|------|---------|
| `CraftProtocol` | `src/components/sections/CraftProtocol.astro` | First proof layer after the hero. |
| `TrinitySection` | `src/components/sections/TrinitySection.astro` | Operating principles. |
| `SystemUnit` | `src/components/sections/SystemUnit.astro` | Static system catalog cards with native `<details>`. |
| `VisualLab` | `src/components/sections/VisualLab.astro` | Visual system proof without JS. |
| `TechnicalDepth` | `src/components/sections/TechnicalDepth.astro` | Architecture layers. |
| `CollaborationSection` | `src/components/sections/CollaborationSection.astro` | Public proof and CTA. |

## Hydrated React islands

| Component | File | Directive | Reason |
|-----------|------|-----------|--------|
| `Navbar` | `src/components/ui/Navbar.tsx` | `client:load` | Mobile menu and smooth navigation. |
| `EnhancedHero` | `src/components/sections/EnhancedHero.tsx` | `client:idle` | Interactive signal selector. |
| `EvidenceEngine` | `src/components/interactive/EvidenceEngine.tsx` | `client:visible` | Interactive evidence/preset inspection. |
| `TechnicalIntake` | `src/components/sections/TechnicalIntake.tsx` | `client:visible` | Clipboard, validation, target-domain selection, and mailto draft. |

## Design rule

If a component only renders content, build it as `.astro`. If it needs state or browser APIs, make it a small island and load it as late as possible.
