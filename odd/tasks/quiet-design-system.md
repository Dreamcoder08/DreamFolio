# Quiet design system

Objective: make DreamFolio read cleaner, more elegant, minimal and modern by subtraction — accent as detail, one type scale, calmer surfaces.
Branch: `feat/quiet-design-system` · Delivery: `single-pr` · Runner: `pnpm verify`, `pnpm test:unit`, `pnpm test:e2e`.

## Specs

The user delegated the design decisions ("te autorizo todo tu decide and continue"); S1–S6 are the assistant's chosen direction, i.e. assumptions the user can overrule.

- S1 Accent discipline. The accent colour appears only on small elements (eyebrows, links, primary call to action, icons, focus). No large accent fills: the about section, the contact panel, project covers and the portrait backdrop become neutral surfaces.
- S2 Portrait. The profile card sits straight, without the arch backdrop or the "+" badge.
- S3 Type scale. Small text sizes come from named tokens; hard-coded near-duplicate sizes snap to that scale. Display headings get slightly looser tracking.
- S4 Contracts. Both themes keep the existing contrast, focus and state contracts; a test changes only where it pins a declaration this feature intentionally changes.
- S5 Links counter. `/links` shows the real number of links (it says "07" while eight exist).
- S6 Budget. No new JavaScript; the file-size budget holds.

## Tasks

- [x] T1 (S1, S2, S4) neutral surfaces and straight portrait — inline
- [x] T2 (S3) type scale tokens — inline
- [x] T3 (S5) links counter — inline
- [ ] T4 (S4, S6) full verification, PR, deploy — inline

## Log

- L1 2026-11-09 user: "que opinas de mejorar mi system desing mas clean , elegante , minimalista , moderno ??" then "perfect te autorizo todo tu decide and continue".
- L2 Baseline measured: ~15 near-duplicate small font sizes, 111 distinct spacing values, full-bleed accent slabs (about, contact, project covers), tilted portrait with arch. Spacing tokenisation is out of scope for this feature (high churn, low visible gain).
- L3 T1–T3 done. Removed the now-dead `--color-on-focus` token (the ink focus ring only existed for accent-filled sections) and retargeted its tests to the neutral fills. Evidence: 216 unit, 156 e2e, `pnpm verify` green; before/after screenshots reviewed in both themes, desktop and mobile.
