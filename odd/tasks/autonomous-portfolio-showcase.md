# Feature: Autonomous Portfolio Showcase (DreamFolio)

Branch: `feat/autonomous-portfolio-showcase`
Repo: `dreamcoder08/dreamfolio`

## Specs

- S1: "en la seccion Proyectos quiero que se muestre cada proyecto de forma autonoma" — `#projects` auto-advances through visible cards on a timer with per-card progress indicator, pauses on hover/focus/touch/offscreen/reduced-motion, and resets cleanly on filter change.
- S2: "en la seccion Proyectos quiero que se muestre cada proyecto de forma autonoma" — active project card plays a muted inline video preview (`previewVideo`) when available (with lazy load and single-active-video discipline) or subtle CSS motion when no video is present.
- S3: "ademas al hacer click en cada proyecto debe haber espacio para su imagen y su video correspondiente" — clicking any project card (curated or synced GitHub repo) opens an in-portfolio view with dedicated spaces for both its image (with fullscreen zoom lightbox) and its video (`showcaseVideo` / `previewVideo` player, or graceful placeholder state when video is not yet recorded), plus View Transitions.
- S4: "aunque tambien seria genial que el propio porfolio web todo se presente de forma autonoma mientras deslizas y mas como lo hacen los mejores del mundo , creativos o que han ganado premios" — continuous scroll choreography (`data-active-scene`), reactive WebGL `ConvergenceField` mood per section, live chapter progress HUD in navbar, and optional global Auto-Tour ("Modo Reel") accessible from navbar and `⌘K` that cancels immediately on any manual user input.
- S5: Respect all CI guardrails: `scripts/file-size-budget.json` (<=200 lines `.ts`/`.astro`, <=250 `.css`, <=300 `tests/*.ts`, <=200 `odd/*.md`), strict CSP (no inline `style=""`, `media-src 'self'`), `prefers-reduced-motion`, and all unit + Playwright E2E tests green.

## Tasks

- [x] T1 | S1, S2, S3, S5 | inline | commit: b6fa916 — Schema (`previewVideo`, `showcaseVideo`, `videoPoster`, `videoCaption`, `galleryImages`), `home-projects.ts` propagation, CSP `media-src 'self'`, unit tests.
- [x] T2 | S1, S5 | inline | commit: 0603419 — Autonomous carousel autoplay engine (`project-autoplay.ts`), CSS progress bar, hover/focus/offscreen/reduced-motion pause, unit tests.
- [x] T3 | S2, S5 | inline | commit: 0603419 — Living project cards (`ProjectCardMedia.astro`, `project-media-preview.ts`), single-active lazy video preview + CSS motion fallback, unit tests.
- [x] T4 | S3, S5 | inline | commit: e5ca5ef — Dual Image + Video stage (`ProjectMediaStage.astro`, `project-media-stage.ts`) on `/projects/[id]/` with split/video/image switcher, `<dialog>` image lightbox, universal View Transitions, unit tests.
- [x] T5 | S3, S5 | inline | commit: 9e25c26 — Unified click experience for synced GitHub projects (`ProjectQuickModal.astro`, `project-quick-modal.ts`) showing dedicated Image + Video stage before outbound links, unit tests.
- [x] T6 | S4, S5 | inline | commit: 19c5031 — Global scroll choreography (`scroll-director.ts`), reactive scene states, navbar chapter HUD, scroll progress meter, unit tests.
- [x] T7 | S4, S5 | inline | commit: 22ba217 — Global autonomous presentation mode (`auto-tour.ts`) triggered via navbar button and `⌘K` CommandConsole with instant manual-input abort, unit tests.
- [x] T8 | S3, S5 | inline | commit: 5deb060 — `/projects/` RepoGrid cards open `ProjectQuickModal` (image + video) before GitHub, and the quick modal gains an "Ampliar" fullscreen image zoom (verifier gap: S3 PARTIAL).

## Log

- L1 (2026-11-24): "hey bro crea taks detalladas lluvias de ideas para mejorar mi portfolio web , en la seccion Proyectos quiero que se muestre cada proyecto de forma autonoma aunque tambien seria genial que el propio porfolio web todo se presente de forma autonoma mientras deslizas y mas como lo hacen los mejores del mundo , creativos o que han ganado premios... ademas al hacer click en cada proyecto debe haber espacio para su imagen y su video correspondiente"
- L2 (2026-11-24): "perfecto confirmo autorizo e implementa todo de forma autonoma + filosofia de gentleman si es necesario crea skills si algo se hace mas 2 de veces igual scripts si algo de hace mas de 2 veces"
- L3 (2026-11-24): "avanza debes ver que cada repo este con su imagen actualizada ve paso a paso" — synced 23/23 repo covers (294081c).
- L4 (2026-11-24): "te autorizo todo y avanza todo de forma autonoma + filosofia de gentleman" — pushed branch, opened PR #138.
- L5 (2026-11-24): "avanza" — CI format:check failed; fixed with Prettier + file-budget extractions (0b1e636), touchstart toggle fix (e0ddb52). PR #138 checks + lighthouse green.
- L6 (2026-11-25): "continue" — verifier gap from earlier run: `/projects/` RepoGrid still links straight to GitHub and quick modal lacks image zoom; opened T8.
