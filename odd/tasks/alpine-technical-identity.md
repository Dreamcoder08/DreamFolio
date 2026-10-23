# Alpine Technical Identity — DreamFolio

## Outcome and authorization
The owner authorized an end-to-end redesign of DreamFolio and /links/ based on the supplied alpine techwear / architectural reference image, explicitly removing the previously shown profile portrait. Preserve navigation, accessibility, project content, contact actions, repository privacy and production stability.

## ODD method
Organic Driven Development per Gentleman-Programming/gentle-ai: authorize → explore → resolve uncertainty → test first → implement → proportional checks → review → merge only on green evidence. This is substantial work; this document retains scope, progress and evidence.

## Explored evidence
- src/components/sections/HeroSection.astro and src/components/ui/ProfileCard.astro render the homepage portrait.
- src/pages/links.astro duplicates the portrait; its local CSS duplicates portrait styling.
- Global tokens live in src/styles/global/01-theme-tokens.css and 02-theme-modes.css; homepage and link hub share them.
- Hero, section headings, navbar, mobile dock and link rows use existing shared tokens.
- MASCLI must remain absent from all public cards and content.
- ODD source: https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md
- Reference principles: https://developer.apple.com/design/human-interface-guidelines/design-principles and https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion

## Scope and constraints
- Do not publish the reference photo. Use it as aesthetic direction only.
- Replace home and links portrait modules with useful text-only technical identity plates.
- Shift global dark/light palette toward graphite/glacier/snow with restrained signal orange and ice-blue metadata.
- Preserve token names, semantic markup, links, CSP, SEO, theme toggle, WhatsApp, keyboard use.
- Avoid installing Gentle AI on production. Adopt workflow principles, not new runtime dependencies.

## Verification
1. RED tests: no portrait elements on home or links; new technical identity content.
2. GREEN: components, token palette, navigation, mobile adaptations.
3. Format, typecheck, unit, E2E, Lighthouse, production build.
4. Review diff/privacy; merge only on green. Verify deployment when possible.

## Status
- [x] Authorized and explored
- [ ] RED test
- [ ] Implementation
- [ ] Quality checks
- [ ] Merge and delivery

## Risks
Global token changes may trigger strict contrast/pinned-color tests. Correct real regressions; adapt test assumptions only when visual requirements intentionally change. CI cannot replace human visual review.
