# Repo Archify Diagrams for DreamFolio & Local Repos

Branch: `feat/repo-archify-diagrams` (in `dreamcoder08/dreamfolio`, branched from `main`)
Status: in_progress

## Specs

- **S1**: "cada repo debe tener archify , implementa a los que no tienen" — Every repository in `dreamcoder08/dreamfolio/src/data/github-repos.json` (23 repos) gets a validated standalone Archify HTML architecture diagram (`archify finalize architecture ... --quality showcase`), reusing the 5 existing diagrams (`drenyra-ai`, `drenyra-engram`, `drenyra-console`, `estado`, `drenyra-skills`).
- **S2**: "Ambos: en dreamfolio y en cada repo local" — Store each newly generated diagram in the local repository at `docs/diagrams/<repo>.architecture.{json,html}` (following `arkelythex/drenyra-ai/odd/tasks/archify-diagram-convention.md`) AND copy the standalone `.html` into `dreamcoder08/dreamfolio/public/archify/<owner>-<repo>.html`.
- **S3**: "Los 23 repos curados de dreamfolio (los que falten)" — Wire `src/data/repo-archify.json` + `src/lib/repo-archify.ts` into `src/components/ui/RepoGrid.astro` so every repo card with an Archify diagram exposes an accessible `"Arquitectura"` link to `/archify/<owner>-<repo>.html` (with unit and E2E tests).
- **S4**: "Cerrar el PR de covers primero, Archify en rama aparte" — PR #130 (`feat/repo-fallback-covers`) opened cleanly first; Archify work lands on `feat/repo-archify-diagrams`.

## Inventory (23 curated repos)

- **Existing (5)**: `arkelythex/drenyra-ai`, `arkelythex/drenyra-engram`, `arkelythex/drenyra-console`, `arkelythex/estado`, `arkelythex/drenyra-skills`
- **Local missing — Batch 1 (4)**: `Dreamcoder08/dreamcoder-dsh`, `Dreamcoder08/Dreamcoder-Workbench`, `Dreamcoder08/CleanSweep`, `Dreamcoder08/dreamcoder-omp`
- **Local missing — Batch 2 (5)**: `Dreamcoder08/sipges`, `Dreamcoder08/chira-os`, `arkelythex/senzar`, `arkelythex/drenyra-guardian-angel`, `arkelythex/elect-validate`
- **Local missing — Batch 3 (5)**: `Dreamcoder08/somnyx-web`, `Dreamcoder08/somnyx-tui`, `Dreamcoder08/aurelia21`, `Dreamcoder08/pactyra`, `Dreamcoder08/pseint-web-interface`
- **Remote-only missing — Batch 4 (4)**: `arkelythex/drenyra-shell`, `Dreamcoder08/cominorsa-crm-rs`, `Dreamcoder08/cominorsa-crm`, `Dreamcoder08/bcrp-data-sdk`

## Tasks

- [ ] **T1** (S1, S3) — Add Archify map + `RepoGrid.astro` `"Arquitectura"` link + copy 5 existing diagrams into `dreamfolio/public/archify/` with unit & E2E tests | route: inline | commit: pending
- [ ] **T2** (S1, S2) — Author & finalize Archify diagrams for Batch 1 (4 local repos) and wire into `dreamfolio` | route: worker | commit: pending
- [ ] **T3** (S1, S2) — Author & finalize Archify diagrams for Batch 2 (5 local repos) and wire into `dreamfolio` | route: worker | commit: pending
- [ ] **T4** (S1, S2) — Author & finalize Archify diagrams for Batch 3 (5 local repos) and wire into `dreamfolio` | route: worker | commit: pending
- [ ] **T5** (S1-S3) — Author & finalize Archify diagrams for Batch 4 (4 remote-only repos), verify 23/23 in `dreamfolio`, run full CI gate, and open PR | route: inline | commit: pending

## Log

- **L1** (user): "hey bro tambien se me ocurrio que cada repo debe tener archify , implementa a los que no tienen"
- **L2** (user decisions): Storage = "Ambos: en dreamfolio y en cada repo local"; Scope = "Los 23 repos curados de dreamfolio (los que falten)"; Order = "Cerrar el PR de covers primero, Archify en rama aparte" (PR #130 opened).
