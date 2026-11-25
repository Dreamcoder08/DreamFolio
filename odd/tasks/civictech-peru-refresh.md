# Feature: CivicTech Peru refresh (DreamFolio)

Branch: `feat/civictech-peru-refresh` · Repo: `dreamcoder08/dreamfolio` · Media source: `arkelythex/estado` (read-only, run locally).

## Specs

- S1: "actualiza el Digital Public Peru" — the portfolio project backed by `arkelythex/estado` shows the current product, not the March 2026 mockup (`public/images/projects/digital-public-peru-desktop.png`).
- S2: Media answer "Regrabar limpio (recomendado)": "Levanto el stack de estado, saco capturas y video nuevos sin el cartel del agente y los publico en el portafolio." Published screenshots and video contain no agent overlay ("Agent · …") and no visible browser cursor.
- S3: Name answer "Renombrar a CivicTech Peru": "La dirección pasa a /projects/civictech-peru/ y la vieja deja de funcionar. También hay que actualizar los tests que usan la dirección vieja."
- S4: Every published claim about the product comes from the `estado` README or the running app.
- S5: Repository guardrails hold: file-size budget, strict CSP, Prettier, unit + Playwright E2E green.

## Tasks

- [x] T1 | S2 | inline | commit: 6e7a20a (media) — Run the `estado` stack locally with demo data; capture clean portal + moderation screenshots and a clean walkthrough video with headless Playwright.
- [x] T2 | S1, S3, S4, S5 | inline | commit: 6e7a20a, 5ed060e — Rename to CivicTech Peru, wire cover, gallery, preview and showcase video, update summary, stack and case study, update tests for the new URL.
- [ ] T3 | S1-S5 | inline | commit: pending — Verify (unit, E2E, ego-browser), PR, merge, confirm deploy and live page.

## Log

- L1 (2026-11-25): "actualiza el Digital Public Peru"
- L2 (2026-11-25): Found that all upstream `estado` media (both README screenshots and `docs/media/civictech-demo.mp4`) show the ego-browser "Agent · …" overlay and cursor. User chose "Regrabar limpio (recomendado)" and "Renombrar a CivicTech Peru".
