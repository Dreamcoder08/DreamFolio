# Feature: SIPGES showcase (DreamFolio)

Branch: `feat/sipges-showcase` · Repo: `dreamcoder08/dreamfolio` · Media source: a scratch clone of `Dreamcoder08/sipges` branch `design/vanguard` (committed state only), run locally with fictional data.

## Specs

- S1: "me encanta una ves que termines continuas con el Proyecto SIPGES" — SIPGES gets the same treatment as CivicTech Peru and COMINORSA: it becomes a curated project with its own page, clean screenshots (cover + gallery), a preview loop for the carousel card, a full walkthrough video and a case study.
- S2: Data answer "Datos ficticios en local (recomendado)": "Clono el repo público aparte, lo levanto con su base embebida y cargo un proyecto inventado claramente rotulado como demo. Nada real sale de la máquina, pero los datos son inventados por mí." No real client, project, community, company or person data appears in any published media; the running instance must not load the repo's real data files.
- S3: Client answer "No nombrar (recomendado)": "Lo describo como plataforma de alerta temprana de riesgo socioambiental para proyectos mineros en Perú, sin cliente, sin Sechura y sin nombres de entidades."
- S4: Version answer "El rediseño design/vanguard": "Uso la rama publicada del rediseño, sin tus 4 cambios sin commitear. Puede verse a medio terminar." The user's checkout at `~/Documents/PROYECTOS/sipges` is never modified.
- S5: Hydrocarbons answer "Dejarla fuera (recomendado)": `sipges-hidrocarburos` is not mentioned.
- S6: Media contain no agent overlay ("Agent · …"), no cursor, no login screen or credentials.
- S7: Repository guardrails hold: file-size budget, strict CSP, Prettier, unit + Playwright E2E green.

## Tasks

- [x] T1 | S2, S4, S6 | worker | commit: 47e18d8 (media) — Scratch clone of `design/vanguard`, run with embedded PGlite and throwaway secrets, load a fictional demo project, record screenshots and a walkthrough video into `public/`.
- [x] T2 | S1, S3, S5, S7 | inline | commit: 47e18d8 — Add the curated `sipges` project (media, summary, stack, case study, domain label, proof entry); tests for visible text.
- [ ] T3 | S1-S7 | inline | commit: pending — Verify, PR, merge, confirm deploy and live page.

## Log

- L1 (2026-11-26): "me encanta una ves que termines continuas con el Proyecto SIPGES"
- L3 (2026-11-26): Correction to the S4 premise: `design/vanguard` is not pushed to GitHub; it exists only in the user's checkout, committed up to `c9123028`. T1 clones that committed state from the local path into a scratch directory, which reads the repository without modifying it and excludes the uncommitted changes.
- L2 (2026-11-26): Exploration found SIPGES handles real client data (a mining project, Ley 29733 constraint in its own docs) and has no synthetic demo. User answers: "Datos ficticios en local (recomendado)", "No nombrar (recomendado)", "El rediseño design/vanguard", "Dejarla fuera (recomendado)".
- L4 (2026-11-26): T1 worker moved the clone's `data/` out of the tree unopened (startup reads `data/project_coordinates.json` for the real tenant), confirmed an empty database via the API, then seeded "Proyecto Demo · Quebrada Alta" (59 fictional records) through the API; the scratch directory with the quarantined data and throwaway secrets was deleted afterwards. T2 was done inline because the writer could not start twice ("Writer repository preparation was unavailable", then "Writer bootstrap requires the original safe project root"). The synced proof adds 36 ADR titles to the page, so the privacy unit test scans the proof entry too.
