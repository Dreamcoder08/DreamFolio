# Testing and Verification

[Back to the index](./README.md)

## Test layout

| Suite                | Where                     | Command                                     |
| -------------------- | ------------------------- | ------------------------------------------- |
| Unit and contracts   | `tests/unit/*.test.ts`    | `pnpm test:unit` (`node --test`)            |
| E2E                  | `tests/<route>/*.spec.ts` | `pnpm test:e2e` (builds with `SITE_BASE=/`) |
| Typecheck            | —                         | `pnpm check` (`astro sync && tsc --noEmit`) |
| Build + check + size | —                         | `pnpm verify`                               |

E2E follows one `{page}-page.ts` page object plus `{page}.spec.ts` specs per route. Shared helpers
live in `support/` folders, whose file names carry neither `.test.` nor `.spec.`, so no runner
collects them. The unit contracts guard design rules (token contrast and composition, state
borders, transitions, the file budget, `safe-run.sh`), not just functions.

A contract that can pass with the rule removed proves nothing.
`tests/unit/contract-mutation-proof.test.ts` mutates guarded CSS in a temporary tree and asserts
the contracts fail.

## Behavior-preserving refactors

A split or extraction must prove it changed nothing. Pick the evidence that fits and record it in
the PR:

| Refactor          | Evidence                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| CSS split or move | Compiled CSS byte-identical: hash `dist/` CSS before and after (for example `sha256sum dist/_astro/*.css`) |
| Test split        | `pnpm exec playwright test --list` identical per project; unit test names and assertion counts unchanged   |
| Logic extraction  | Output pinned with hashes computed from the pre-split code (`tests/unit/convergence-field-pin.test.ts`)    |
| Any guard or test | Mutation check: break the guarded behavior, watch the test fail, restore, rerun green                      |

When byte identity is impossible (for example, a partial boundary that closes and reopens the same
`@media` guard), prove semantic equivalence instead and say so. Never claim byte identity you did
not measure.

## Heavy checks on the dev laptop

Headless Chromium rendering WebGL in software is CPU-hungry, and parallel runs have shut the dev
laptop down. Run every heavy local command through the thermal guard, one at a time:

```bash
scripts/safe-run.sh pnpm build
scripts/safe-run.sh pnpm test:e2e
```

`safe-run.sh` runs the command in a resource-capped systemd scope (3 GB memory, 2 cores) and
freezes it above 80 °C, thawing below 70 °C. `SAFE_MAX_FREEZE` (180 s) stops a stuck-hot sensor
from freezing a run forever. Where no user systemd manager exists (CI, SSH), it falls back to
plain `nice`. All limits can be overridden through `SAFE_*` variables.

Playwright uses one worker locally (`PW_WORKERS` overrides it); CI keeps the default. Do not run
two heavy commands in parallel. For a pure refactor, rely on CI for the full E2E run.

## Manual checks

For anything a spec does not cover yet: run `pnpm dev`, watch the browser console for errors and
CSP violations, and check the layout at phone, tablet, and desktop widths in both themes.
