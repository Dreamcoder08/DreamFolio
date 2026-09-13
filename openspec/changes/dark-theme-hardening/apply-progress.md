# Apply Progress: Dark ("OLED") Theme Hardening

Recorded after the fact. `sdd-apply` stalled twice on this change (once after
writing a full unit with no completion envelope, once writing nothing at all), so
no apply agent ever produced this artifact. It is reconstructed from the committed
tree, the task evidence blocks, the commit messages and the independent
verification runs — every figure below was measured, and the measurements are
cited to the commit or the verification round that produced them.

## Delivery model, as it actually happened

The plan called for four stacked PRs, one per work unit (`delivery_strategy:
auto-chain`, `chain_strategy: stacked-to-main`). What happened instead: the work
landed as commits on a single branch, `feat/dark-theme-hardening`, behind **one**
PR (#29). The four units are still separate commits in the required order, so the
review can be sliced by commit; the PR boundary is not per-unit.

Reason: `sdd-apply` stalled 2 for 2, so implementation moved to the orchestrator
and then to a bounded writer, and neither path re-created the per-unit PR chain.

## Unit 1 — token layer, dead artifacts, docs

**Commit `0339aa8`.** 6 files, 332 insertions, 106 deletions.

- RED/GREEN: `tests/unit/tokens.test.ts` opened with A1, A2, A6, A9, A10; 21 unit
  tests green at the end of the unit (15 pre-existing plus 6 new).
- Independent verification (chromium, 3 page types × 2 modes × 12 tokens = 72
  reads): **0 differences** against the pre-change value table.
- All 8 radius, 6 motion and 5 shadow tokens have a live consumer. `--radius-focus`
  existed only to make the later gate explicit.
- The light `prefers-contrast: more` block is inert at the default preference.
- The reduced-motion guard reaches all four page types from `global.css`.
- **Stated honestly at the time**: six `--color-*` keys were deliberately
  consumerless until unit 2 supplied their users, which the `design-tokens` "No
  Consumerless Tokens" requirement forbids until then; and task 1.2's
  "rendering-identical values" wording did not hold for `.card:hover`, which moved
  to `--color-border-strong` as a role correction (dark 0.34 -> 0.28, light
  0.18 -> 0.22).

## Unit 2 — state hardening

**Commits `f342e76` (204 changed lines) and `d18ee1e` (task 2.4).**

- Consent gate 2.3: answered by the human at the pre-apply gate as **consented**,
  so the `:focus-visible { border-radius: 4px }` mutation was removed and
  `--radius-focus` deleted with it.
- All 13 `:active` selectors measured with a real computed delta from rest, both
  modes; no press lowers its label ratio below rest.
- Dark `--color-border-interactive` 0.4, `-hover` 0.56, light 0.18 / 0.3, with the
  dark toggles wired at rest (1.44:1 -> 3.66:1).
- The `forced-colors` block reaches every state group it declares.
- The focus ring is `3px solid` at a `5px` offset on every keyboard-focusable
  element, with focused `border-radius` equal to at-rest radius in all 18 cases,
  and `--radius-focus` absent from `src/` and from the shipped CSS.

### Strict-TDD evidence and its honest limits

The RED observations for unit 2 were **not** taken before the code, because the
apply agents stalled. Three of the unit's assertions surfaced as genuine failures
only when the harness landed in unit 3 — `--color-on-focus` had no consumer, and
two hovers dropped below their own rest contrast. Those are recorded below. The
remaining state assertions arrived GREEN by construction and are regression
guards, which the tasks' honest-RED rule requires to be declared rather than
manufactured into failures.

## Unit 3 — verification harness

**Commit `0613f0b`, with the repairs in `891df09`.**

- `tests/support/contrast.ts`, `tests/theme-state/theme-state-page.ts`,
  `tests/theme-state/theme-state.spec.ts` (~40 KB), plus A3–A8 and A11 in
  `tests/unit/tokens.test.ts`. Unit tests 21 -> 31; e2e 20 -> 57.
- **It failed on its first run, correctly, three times**: `--color-on-focus` had
  no consumer (the focus-ring consolidation left the ink variant on the alias it
  replaced); and `.desktop-nav .nav-contact:hover` and `.circle-link:hover`
  dropped their labels from 17.49:1 at rest to 6.17:1 in light mode. Both repairs
  are in `891df09`.

## Unit 4 — universal transition removal

**Commit `bee791d`.** RED-first, and the order is evidenced: the contract was
observed failing 2 of 4 against the un-removed rule, the explicit per-selector
replacements went in second (contract 3 of 4), and only then was the rule deleted.
Unit tests 31 -> 35.

## Post-unit motion repair

**Commit `05cef35`.** A verification run that deliberately omitted the
`reducedMotion: reduce` lever found three more defects that no gate could see,
all now fixed and measured: `.module-row`'s transition declaration was dead under
`.motion-ready [data-reveal]`'s specificity; the underline signals snapped; and the
gap itself became `tests/theme-state/motion.spec.ts` (17 tests). e2e 57 -> 74.

## Verification rounds

Six independent browser verification rounds ran in total, none of which was the
author attesting to his own work: five manual rounds during units 1 and 2, one
motion round after unit 4. They found **17 defects that `test:unit` (35/35),
`test:e2e` (74/74), `pnpm run build` and `format:check` could not see** — 14 in the
manual rounds, 3 in the motion round. The harness then found 3 more on its own
first run, for **20 in total**.

The recurring class is reasoning about a token instead of the selector that wins
the cascade. It appeared in the design phase (a chip contrast figure that no
selector produces, withdrawn before it shaped code) and in the CSS work three
times, including a contrast regression introduced while "fixing" a hover that was
never broken.

## Known gaps carried forward

These are open. Their absence from the verify report would be a defect in the
report.

1. **No human visual pass has been done**, and there is no screenshot baseline
   anywhere in `tests/`, so no visual regression is machine-detectable.
2. **The theme-toggle cross-fade is lost** for non-interactive elements
   (`bee791d`; six of six sampled elements snap). Accepted, not fixed — recovering
   it without a universal rule needs a temporary class during the switch, i.e. new
   client-side JS, which is out of scope.
3. **The `.module-row` reveal stagger is lost** for `nth-child(2)` and
   `nth-child(3)` (`05cef35`; they read `0s` where they read `0.08s`/`0.16s`).
   Open decision.
4. **`.module-row`'s declared `translateX(5px)` still never applies**, because
   `.motion-ready [data-reveal].is-visible` wins the transform cascade.
   Pre-existing, outside unit 4.
5. **`::-webkit-scrollbar-thumb:hover`** could not be measured — Chromium exposes
   no dependable locator for the pseudo-element.
6. `sdd-sync` and `sdd-archive` have not run.

## Gates on the final tree

`pnpm run test:unit` 35/35 · `pnpm run test:e2e` 74/74 · `pnpm run build` 12 pages ·
`pnpm run verify` · `pnpm run format:check` · zero new dependencies ·
`git diff --stat -- package.json pnpm-lock.yaml` empty.
