# Feature: Close the remaining quality gaps (target: verifiably 10/10)

## Objective

Close every known gap left after phases 1–3 and the refactor series, and only claim "10/10" against evidence recorded here.

## Why

User request (2026-09-28): create an ODD plan so everything is 10/10 and proceed autonomously, with senior engineering practices and the Gentleman philosophy. The parent's honest audit rated the state ~8/10.

## Scope (authorized: implement, push, PRs, merge)

Gaps found by audit: Lighthouse not re-measured after phases 2–3; three dependabot PRs unreviewed (#48 docs, #49 astro, #50 dev deps); `global.css` (302) and `docs/guides/best-practices.md` (275) still over budget; issues #61, #75, #77, #80 open; page-transition not seen complete on the user's GPU; dev laptop idles at ~80 °C (hardware).

## Constraints

- Laptop safety: heavy commands only via `scripts/safe-run.sh`, one at a time, wait < 72 °C; no local browser for pure refactors (CI supplies E2E). No `git stash`. Verify `git stash list` shows the user's stash after every writer.
- One PR per cohesive unit; approved reviews merge, advisories go to issues (no review→fix→review loops).
- Compiled CSS must stay byte-identical for style refactors.
- Artifacts English; Conventional Commits; no AI attribution.

## Checklist

- [ ] T1 Re-measure Lighthouse (mobile) on the live site; compare with the phase-1 baseline (95); fix regressions — route: parent, single run under safe-run when cool
- [ ] T2 Triage dependabot #49/#50/#48: CI + changelog read, merge what is safe — route: parent
- [ ] T3 Split `global.css` into ordered partials (byte-identical compiled CSS) — route: delegated writer
- [ ] T4 Split `docs/guides/best-practices.md` into focused guides with an index — route: delegated writer
- [ ] T5 Close #80 (teardown unit tests), #75 (console/terminal follow-ups), #77 (describe titles + probe type), #61 (safe-run liveness) — route: delegated writers, one PR each
- [ ] T6 Page transition on real GPU — needs the user's foreground Chrome; record as user-verifiable, provide a 1-minute checklist — route: parent
- [ ] T7 Final audit against this list; update README/docs; record what is verified vs not — route: parent

## Acceptance criteria

- Allowlist empty (`node scripts/check-file-size.mjs`), no open issues except explicitly deferred ones with a reason.
- Lighthouse mobile: performance ≥ 95, accessibility/best-practices/SEO 100 on the live site (or a documented cause).
- CI green on main; deploy succeeded; live probes clean.

## Progress

- Branch `docs/quality-10-of-10` from `origin/main` 374b5bf.

## Verification evidence

(filled per task)
