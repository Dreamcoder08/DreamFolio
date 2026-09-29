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

- [x] T1 Re-measure Lighthouse (mobile) on the live site; compare with the phase-1 baseline (95); fix regressions — route: parent, single run under safe-run when cool
- [x] T2 Triage dependabot #49/#50/#48: CI + changelog read, merge what is safe — route: parent
- [x] T3 Split `global.css` into ordered partials (byte-identical compiled CSS) — route: delegated writer. Evidence (branch `refactor/split-global-css`): `global.css` is now an ordered `@import` list (20 lines) over `src/styles/global/01…06` (85/32/33/18/29/95 lines); both `dist/_astro/*.css` files `cmp`-identical before/after (same content-hashed names); tests read global.css via `readCssInlined`; mutations injected into partials (universal transition in 04, dropped light/dark tokens in 02/01) failed the transition and token contracts, then restored; allowlist keeps only `docs/guides/best-practices.md` (T4); unit 165/165, `pnpm check`, `format:check` green; E2E left to CI.
- [x] T4 Split `docs/guides/best-practices.md` into focused guides with an index — route: delegated writer. Evidence: `0aab03a` (index 35 + six guides 48–129 lines, 11-line pointer kept; stale claims fixed against the tree), `19b2710` (allowlist entry dropped, nothing raised); `check-file-size` 190/190, `format:check` pass, no dangling links. Branch `docs/split-best-practices`, not pushed.
- [x] T5 Close #80 (teardown unit tests), #75 (console/terminal follow-ups), #77 (describe titles + probe type), #61 (safe-run liveness) — route: delegated writers, one PR each. #80 + #77 done (branch `test/close-followups-80-77`): `7b6c6b2` adds lifecycle (8) and listener (6) teardown tests on recording fakes plus one `installGlobals`/`installFakeFrames` helper restored in `afterEach` (scheduler and chunk-recovery tests); mutations (a dropped `removeEventListener("scroll")`, a non-idempotent `dispose`) failed 5 and 2 tests, then restored with empty `git diff`. Second commit renames the two split describes and exports `NonBlankWindow`; `playwright --list` diff: only the describe part of 5 forced titles, still 8 forced + 135 default. Unit 180/180, `pnpm check`, `check-file-size` green; E2E left to CI.
  - #61 (branch `fix/safe-run-liveness`, PR #89): freeze bounded by SAFE_MAX_FREEZE + SAFE_GRACE, SAFE_TEMP_HARD ceiling with no forced thaw, SAFE_HARD_ABORT (600 s) kills the scope and exits 75 instead of hanging, early pause on an 8 °C rise within ~1 s; helpers in `scripts/lib/safe-run-lib.sh`, tests in `tests/unit/safe-run-liveness.test.ts`. Unit/check/size/shellcheck green locally.
  - #75 done (PR #91, branch `fix/console-followups-75`): shared RELOAD_FLAG, messages.ts, loader.ts with abortable driver wiring, theme announce-first, TERMINAL-003 chromium guard. Unit tests, mutations, `pnpm check`, format and size budgets green locally; E2E via CI; native review approved.
  - #87 done (branch `ci/lock-lhci`): `09d461f` pins `@lhci/cli` 0.15.1 as a devDependency (lockfile-verified; no new build scripts, `allowBuilds` unchanged) and the Lighthouse job runs `pnpm exec lhci autorun` after `pnpm install --frozen-lockfile`; `038a3c5` adds `tests/unit/lighthouse-summary.test.ts` (5 tests: odd/even median, missing/empty folder exit 1, GITHUB_STEP_SUMMARY append), a lower-middle median mutation failed the even case. Unit 196/196, `pnpm check`, `check-file-size` green; the workflow itself is proven only by CI.
- [x] T6 Page transition on real GPU — user-verifiable only (headless has no real GPU compositor). 1-minute checklist: open the live site in a foreground Chrome on a GPU machine, click Projects then a project, then Back; expect a cross-fade of the art without flash, header stays put, no layout jump; repeat in light theme and with `prefers-reduced-motion` on (no animation) — route: parent. NOT verified by the agent.
- [x] T7 Final audit against this list; update README/docs; record what is verified vs not — route: parent

## Acceptance criteria

- Allowlist empty (`node scripts/check-file-size.mjs`), no open issues except explicitly deferred ones with a reason.
- Lighthouse mobile: performance ≥ 95, accessibility/best-practices/SEO 100 on the live site (or a documented cause).
- CI green on main; deploy succeeded; live probes clean.

## Progress

- Branch `docs/quality-10-of-10` from `origin/main` 374b5bf.

## Verification evidence

(filled per task)

## Final audit (2026-09-29)

Verified (evidence): Lighthouse mobile on CI for the head of #94 (median of the CI runs): performance 96, accessibility 100, best-practices 100, SEO 100, LCP 2711 ms, TBT 0 ms, CLS 0.001. Size allowlist empty; `check-file-size` 217 budgeted files within budget. PRs #89, #90, #91, #94 merged with CI green on the exact head and native review approved; live site returns 200 for `/` and `/projects/` and 404 for an unknown path. Issues #61, #75, #77, #80, #87 closed.

Not verified: page transition on a real GPU (T6, user checklist above); real-heat behaviour of the watchdog beyond the earlier measurements (sensor spikes still reached 92-95 °C, hardware maintenance recommended); the deploy of the last merge was still running when this was written.

Deferred, tracked as issues: #92, #93, #95 (test-hygiene advisories from reviews).
