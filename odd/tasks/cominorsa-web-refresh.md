# Feature: COMINORSA web refresh (DreamFolio)

Branch: `feat/cominorsa-web-refresh` · Repo: `dreamcoder08/dreamfolio` · Media source: the live client site https://cominorsa.com (read-only).

## Specs

- S1: "me encanta lo que hiciste con civitech ahora haslo con cominorsa web" — the `cominorsa-web` portfolio project gets the same treatment as CivicTech Peru: current clean screenshots (cover + gallery), a short preview loop for the carousel card, a full walkthrough video for the detail page, and content checked against the live site.
- S2: Published media contain no agent overlay ("Agent · …") and no visible cursor; record with headless Playwright, never ego-browser.
- S3: Capturing is read-only against a real client's production site: never submit forms, never open WhatsApp/mail/phone links, and block third-party analytics requests so the visit does not pollute the client's metrics.
- S4: Every published claim about the site comes from the live site.
- S5: Repository guardrails hold: file-size budget, strict CSP, Prettier, unit + Playwright E2E green.

## Tasks

- [x] T1 | S1, S2, S3 | worker | commit: 95f413a (media) — Map https://cominorsa.com, record clean desktop screenshots, one mobile screenshot and a walkthrough video; encode MP4 + WebM preview into `public/`.
- [x] T2 | S1, S4, S5 | inline | commit: 95f413a, a6fc564 — Wire cover, gallery, preview and showcase video in `src/data/projects.json`; update summary, stack and a case study from the live site; tests for any changed visible text.
- [ ] T3 | S1-S5 | inline | commit: pending — Verify (unit, E2E, ego-browser), PR, merge, confirm deploy and live page.

## Log

- L1 (2026-11-26): "me encanta lo que hiciste con civitech ahora haslo con cominorsa web"
- L2 (2026-11-26): Client repo `Dreamcoder08/cominorsa-web` is private and its working tree is on an unrelated feature branch with uncommitted work, so it is not touched; the site is live at https://cominorsa.com (200, www redirects to apex) and is used as the capture source. Current cover dates from 2026-11-09.
- L3 (2026-11-26): Worker captured from production with analytics blocked (only `static.cloudflareinsights.com` was requested); no forms submitted, no outbound links opened. The crf-24 MP4 was 8.6 MB because of the topographic backgrounds; re-encoded at 1280x720 crf 28 (4.6 MB) after checking text legibility. The phone screenshot exposed that the media stage cropped portrait images to 16:10; fixed by letterboxing portrait images, and the lightbox now zooms the selected thumbnail instead of a stale `currentSrc`.
