# Feature: UI/UX simplification and the GitHub repo index

## Objective

Make the portfolio say less and work better: one clear path to contact, no
repeated sections or links, no decorative fiction, and every public repo of
Dreamcoder and ARKELYTHEX reachable from `/projects/`.

## Why

User request (2026-10-19): "mejorar el diseño frontend, la experiencia UI & UX,
eliminando redundancia, la ficción y mejores prácticas", followed by "agrega
todos mis proyectos de mis repos de GitHub y de mi organización".
"Ficción" was read both ways: as _fricción_ (friction in navigation and CTAs)
and as the sci-fi/fictional props (the MU-TH-UR "Alien" terminal, HUD readouts,
"08" badges, fake archive captions).

## Audit findings (before)

- "Perú" stated about five times; GitHub linked twice in About alone.
- Contact offered five overlapping paths (two buttons, a channel list, a
  terminal composer, the floating button / dock).
- "Arquitectura" and "Cómo trabajo" were two near-identical three-card sections.
- Services rows opened `mailto:`, a dead end on phones without a mail app.
- On phones the hamburger menu duplicated the bottom dock; the ⌘K trigger was a
  third navigation surface.
- Fictional props: MU-TH-UR terminal, HUD % scroll rail, "08" signature and
  orbit, "OPERANDO DESDE PERÚ" sticker, "ARCHIVO DEL PROTOTIPO" captions, hero
  ticker.

## Checklist

- [x] T1 Remove `ArchitectureSection`, `MuTerminal` (+ its lib, CSS and tests),
      the HUD scroll rail, hero kicker/ticker/sticker/orbit, about watermark,
      card meta and image captions. Section order: Hero, Proyectos, Servicios,
      Cómo trabajo, Sobre mí, Contacto.
- [x] T2 Plain Spanish eyebrows ("Proyectos", "Servicios", …) instead of coded
      labels.
- [x] T3 Hero CTA is WhatsApp; services rows open WhatsApp with the service
      pre-filled; contact = WhatsApp + email, then one quiet row (vCard, GitHub,
      X, Instagram).
- [x] T4 Phones: no hamburger and no ⌘K trigger; the dock (Proyectos,
      Servicios, Sobre mí, Contacto + WhatsApp) is the navigation. Nothing is
      lit over the hero.
- [x] T5 Dead CSS removed with a comment-aware pruner; contracts (radius and
      motion tokens, transition set, size budgets) kept green.
- [x] T6 GitHub index: `scripts/sync-github-repos.mjs` fetches both owners at
      deploy time, `src/lib/github-repos.ts` curates (no forks, archived,
      private, undescribed or excluded repos), `RepoGrid.astro` renders it on
      `/projects/#github`, grouped ARKELYTHEX then Personal. Any failure keeps
      the committed snapshot. Repos with a case study link to it.
- [x] T7 Tests: unit (`github-repos.test.ts`), e2e (`tests/projects/repos.spec.ts`)
      and every spec that referenced removed UI updated.

## Curation (exclusions to revisit in `src/data/github-repos.config.json`)

Excluded by rule: forks (`gentle-ai`), archived (`Dream_Arch_Wiki`,
`ecommerce-relojes`), no description (`cominorsa-web`, `dreamcoder-omp`).
Excluded by list: `Dreamcoder08/dreamcoder08` (profile README),
`Dreamcoder08/DreamFolio` (this site), `arkelythex/.github`, `arkelythex/admin`.
A repo reappears on its own once it gets a description or is unarchived.

## Verification evidence

- `pnpm check`, `pnpm test:unit` (192 passing), `pnpm build`, `pnpm check:size`.
- Playwright locally: all specs pass except `HOME-CONVERGENCE-003`, which fails
  only in the sandbox because an external request is blocked by its proxy.
- Home page height: mobile 8407px → 6490px, desktop 7054px → 5503px.
