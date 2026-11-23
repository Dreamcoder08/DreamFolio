# Repo Fallback Covers for DreamFolio
Branch: `feat/repo-fallback-covers` (in `dreamcoder08/dreamfolio`)
Status: in_progress

## Specs

- **S1**: "en mi portfolio web , este cada repo mio que tengo con su imagen de su archivo readme del repo" — Every repository listed in `dreamcoder08/dreamfolio` (`src/data/github-repos.json`) has a cover image; repositories that already have a usable README image keep that README image as primary source.
- **S2**: "todos mis repos jajaja todo" + "Solo en el portfolio (assets estáticos)" — Cover all repositories in `dreamcoder08/dreamfolio` without mutating external repositories; all new cover assets live statically inside `dreamcoder08/dreamfolio/public/images/repos/custom/` and survive `pnpm run sync:repos` via a declarative fallback map (`src/data/repo-cover-fallbacks.json`).
- **S3**: "de los que faltan o no tienen puedes usar ego-browser para los que se ejecutan en la web" — Repositories without a README image that run in the browser (`aurelia21`, `somnyx-web`, `pseint-web-interface`, and `chira-os` if web-runnable) get real screenshots captured via `ego-browser` and encoded to WebP (`960px` wide) under `public/images/repos/custom/`.
- **S4**: "y mas cosas para el resto" + "Híbrido: terminal + diagrama/card" — Repositories without a README image and without a web UI (`somnyx-tui`, `pactyra`, `dreamcoder-omp`, `cominorsa-crm`, `bcrp-data-sdk`, and `chira-os` if non-web) get hybrid static WebP covers: terminal/TUI visuals for CLI/TUI repos and technical architecture/diagram cards matching `dreamfolio` design tokens for SDK/backend/spec repos.

## Tasks

- [x] **T1** (S1, S2) — Add fallback cover support to `scripts/lib/repo-covers.mjs` + `src/data/repo-cover-fallbacks.json` with RED/GREEN unit tests | route: inline | commit: `13b3ca0`
- [x] **T2** (S3) — Capture real web screenshots with `ego-browser` for web repos missing README covers and encode to `public/images/repos/custom/*.webp` | route: inline | commit: pending (with T4 assets)
- [x] **T3** (S4) — Create hybrid terminal and diagram/card WebP covers for non-web repos missing README covers in `public/images/repos/custom/*.webp` | route: inline | commit: pending (with T4 assets)
- [ ] **T4** (S1-S4) — Wire `src/data/repo-cover-fallbacks.json` + `src/data/github-repos.json`, verify all repos have covers, and run unit, build/size, and E2E checks | route: inline | commit: pending

## Log

- **L1** (user): "umm se me ocurrio que en mi portfolio web , este cada repo mio que tengo con su imagen de su archivo readme del repo entiendes ?? de los que faltan o no tienen puedes usar ego-browser para los que se ejecutan en la web y mas cosas para el resto"
- **L2** (user decisions): Scope = "todos mis repos jajaja todo" (on `dreamcoder08/dreamfolio`); Storage = "Solo en el portfolio (assets estáticos)"; Non-web repos = "Híbrido: terminal + diagrama/card".
