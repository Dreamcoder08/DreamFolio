# README covers

Objective: every project shows itself with the image from its own README, refreshed without hand edits.
Branch: `feat/readme-covers` · Delivery: `single-pr` · Runner: `pnpm test:unit`, `pnpm test:e2e`, `pnpm verify`.

## Specs

- S1 User: "en la seccion proyectos se supone que deben salir todos mis proyectos y mostrarse de forma autonoma con las imagenes de sus archivos readme actualizados".
- S2 (assumption, user said "tu decide") The sync reads each curated repo's README and takes its first real image, skipping badges. The image is downloaded and re-encoded at sync time; the site never hotlinks (CSP is `img-src 'self'`).
- S3 (assumption) `/projects/` shows that image on every repo card that has one. The home carousel stays curated and uses the README image only when a project has no cover of its own.
- S4 (assumption) The deploy workflow also runs daily, so an updated README reaches the site without a push here.
- S5 Any failure keeps the committed snapshot and never blocks a deploy (the existing sync contract).

## Tasks

- [x] T1 (S2) README image picker, pure, unit-tested — inline
- [x] T2 (S2, S5) sync downloads and re-encodes covers — inline
- [x] T3 (S3) repo grid and carousel render covers — inline
- [x] T4 (S4) daily schedule on the deploy workflow — inline · Risk: item 5 (CI)

## Log

- L1 2026-11-09 user: "hey bro en la seccion proyectos se supone que deben salir todos mis proyectos y mostrarse de forma autonoma con las imagenes de sus archivos readme actualizados" then "tu decide , te autorizo todo , has lo que sea necesario".
- L2 Verified before building: no README reading existed; `/projects/` synced text only, on push; the home carousel is 9 hand-written entries, 5 without a cover.
- L3 T1–T4 done. First real sync: 23 of 30 repos kept, 6 with a README cover (the other 17 READMEs have no raster image on a GitHub host). Evidence: 225 unit, 157 e2e, `pnpm verify` green; grid reviewed in a screenshot.
