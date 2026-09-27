# Feature: AURELIA 21 Professional Redesign

## Objective

Restructure the single-file AURELIA 21 page into a multi-file, no-build project with a tokenized design system, modular JS, automated Playwright/axe tests, and agency-level responsive/a11y execution — without changing copy, tone, or visual identity. Publish to GitHub Pages.

## Why

User request: "mejora el system desing, testin responsive desing y mas buenas practicas para desarrollo web profesional y mejor diseño ui & ux como los mejores del mund", then "continua e implementa todo de forma autonoma siguiendo la filosofia de gentleman y mas para publicar los cambios".

## Scope / Authorized

- Repo: /home/dreamcoder08/Documents/PROYECTOS/aurelia21 (branch: feat/professional-redesign off main).
- Full implementation of the approved spec + plan, autonomous, through push to origin main (publish authorized explicitly).
- NO: copy changes, art-direction change, build tooling (Vite/Tailwind), dark mode, CI (phase 2), visual-diff tooling.

## Constraints

- Artifacts in English; replies in Spanish. Conventional Commits; NO AI attribution / Co-Authored-By.
- No raw hex outside tokens.css; no repeated font-family outside tokens.css.
- index.html ≤ 70KB; Tests over HTTP only (ES modules break on file://).
- axe: zero serious/critical in locked AND unlocked states.

## Source of truth

- Spec: docs/superpowers/specs/2026-09-21-aurelia21-professional-design.md (a858573)
- Plan: docs/superpowers/plans/2026-09-21-aurelia21-professional-redesign.md

## Execution method

Subagent-driven: fresh writer subagent per task (carries the exact task text from the plan) + fresh reviewer before the next task. Final whole-branch review, then ff-merge to main and push.

## Checklist

- [x] T1 Playwright harness + smoke test — commit 96b871d, review clean
- [x] T2 Extract base64 JPEGs to files — commit 19f4fc5, review clean (HTML 543KB→37.4KB)
- [x] T3 CSS split + token system — commit ceec4da, review clean
- [ ] T4 Pin behavior + modularize JS
- [ ] T5 noscript / no-JS fallback
- [ ] T6 Social meta + external favicon
- [ ] T7 Responsive hardening
- [ ] T8 Accessibility pass (axe + contrast)
- [ ] T9 README, full suite, merge main, push, verify Pages
- [ ] Final: whole-branch review, Engram save, session summary

## Progress

- [x] Spec approved and committed (a858573)
- [x] Plan written, self-reviewed, committed
- Next: T1 launch

## Rationale

- Subagent-driven over native: plan is detailed enough for zero-context executors; keeps orchestrator context thin; fresh reviewer per task matches Gentleman quality bar ("filosofía de gentleman").
