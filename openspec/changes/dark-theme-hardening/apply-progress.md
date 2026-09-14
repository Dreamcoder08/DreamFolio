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

1. **Human visual pass — performed 2026-09-13.** Resolved; see the human-pass
   section below for the instrument, the outcome and its true resolution. No screenshot
   baseline exists anywhere in `tests/`, so no visual regression is machine-detectable.
2. **The theme-toggle cross-fade is lost** for non-interactive elements
   (`bee791d`; six of six sampled elements snap). Accepted, not fixed — recovering
   it without a universal rule needs a temporary class during the switch, i.e. new
   client-side JS, which is out of scope.
3. **The `.module-row` reveal stagger — restored 2026-09-13.** Resolved; see the debt
   elimination section below. `nth-child(2)` and `nth-child(3)` read `0.08s` and `0.16s`
   again on the fade, and the interaction properties stay immediate.
4. **`.module-row`'s declared `translateX(5px)` — deleted 2026-09-13.** Resolved; see
   the debt elimination section below. It was unsanctioned by the design and unreachable
   in the enhanced path, so removing it is the fix rather than a loss.
5. **`::-webkit-scrollbar-thumb:hover`** could not be measured — Chromium exposes
   no dependable locator for the pseudo-element.
6. `sdd-sync` ran and **refused** (`sync-report.md`, `status: blocked`) while the
   verification verdict is `fail`; `sdd-archive` has not run and cannot until the
   strict-TDD policy question is settled.

## Gates on the final tree

*(Superseded 2026-09-13 by the post-verification remediation section below, which
re-ran every gate on the remediated tree: `test:unit` 41/41 and `test:e2e` 86/86.)*

`pnpm run test:unit` 35/35 · `pnpm run test:e2e` 74/74 · `pnpm run build` 12 pages ·
`pnpm run verify` · `pnpm run format:check` · zero new dependencies ·
`git diff --stat -- package.json pnpm-lock.yaml` empty.

## TDD Cycle Evidence

Required by the verify contract, which flagged its absence as one of the reasons the
change failed verification. Recorded honestly: **three of the five cycles had a
genuine RED observation; two could not**, because the apply executor stalled and the
code landed before the assertions could be written.

| Cycle | Assertions | RED observation | GREEN | Notes |
| --- | --- | --- | --- | --- |
| Unit 1 — token layer | A1, A2, A6, A9, A10 | **Yes.** `tests/unit/tokens.test.ts` was created first and observed failing against the un-migrated tree; the failing assertion names and output were recorded at the time. | 21/21 unit | Genuine RED-first. |
| Unit 2 — state hardening | A7, A8, A11 plus the e2e state matrix | **No.** The executor stalled, so the CSS landed before the assertions. Three of them surfaced as genuine failures only later: `--color-on-focus` had no consumer (A3), and `.desktop-nav .nav-contact:hover` and `.circle-link:hover` dropped from 17.49:1 at rest to 6.17:1 in light mode. Both were repaired in `891df09`. Every other state assertion arrived GREEN by construction and is declared as a regression guard rather than manufactured into a failure. | 31/31 unit, 57/57 e2e after the repairs | **This is the gap the verify contract cites.** It is a real limitation, not a formality. |
| Unit 4 — transition contract | Clauses (a), (b), (c), plus the reduced-motion guard-liveness assertion | **Yes.** Observed 2 pass / 2 fail against the un-removed universal rule, with the failing output recorded verbatim; then 3 of 4 after the replacements landed; then 4 of 4 only after the removal. Clauses (c) and the guard assertion were GREEN-by-construction. | 35/35 unit | Genuine RED-first, and the 2 -> 3 -> 4 progression is itself the evidence that the removal was walked last. |
| Motion repair | `tests/theme-state/motion.spec.ts` (17 tests) | **Sensitivity evidence, not RED-first.** `strict_tdd` was not activated for that run. The two defect shapes were temporarily restored and the spec observed failing on exactly the defect class, then the CSS was restored and re-measured. | 74/74 e2e | Recorded as sensitivity evidence rather than claimed as a RED-first cycle. |
| Review correction | The `R3-INPUT-SCOPE` evidence-scope statement in the verify report | **No.** A documentation correction, not a behavioural cycle. | — | Bounded to 3 diff lines against a 134-line budget, then accepted by the provider's targeted validator. |

**Honest summary.** Strict TDD was substantively followed where the tooling allowed
it — units 1 and 4 — and could not be followed for unit 2, whose executor stalled
mid-flight. That limitation is recorded here rather than smoothed over. It is one of
the stated reasons the verification returned `fail`, and correcting the record does
not correct the practice: the durable answer is the harness in unit 3, which now
makes the unit-2 assertions fail on their own.

## Post-verification remediation (2026-09-13)

### Why this exists

The first verification of the amended contract returned `fail` and named two
implementation contradictions, which the maintainer resolved by amending the spec
(`6a9266c`, `92baacd`). The **second** independent verification
(`evidence_revision: sha256:d4242883937d004da60ca5ed94a751ee6984fd60193a6012885afea4837f8ce8`)
returned `fail` again — 12/14 requirements, 34/39 scenarios — but for a different and
narrower reason: the amendment's own bound was violated by the code.

`.contact-section .solid-link` declared `border-color: currentColor` in both its
`:hover` and its `:active` rule. The amended scenario requires that the exempted
element, whose at-rest label sits at the palette ceiling, still take its **border**
from a state token. On this element `currentColor` resolves to `--color-surface` —
the label's own value — so no state token stood behind the border at all. And no
test asserted that bound, which is why a green suite coexisted with the violation.

### The measurement that decided the fix

The obvious repair — consume the interactivity-separated border token — is wrong
here, and measuring is what shows it. The element inverts (fill `--color-text`, ink
`--color-surface`), and those border tokens are authored against surfaces, not
against an inverted fill. Alpha-composited against the element's own fill:

| border value | dark | light |
| --- | --- | --- |
| `currentColor` (= `var(--color-surface)`) | 17.91:1 | 15.60:1 |
| `--color-border-interactive-hover` | **1.09:1** | **1.04:1** |
| `--color-border-interactive` | **1.07:1** | **1.03:1** |
| **`--color-surface-active`** (chosen) | **12.80:1** | **18.30:1** |

So the amended wording is satisfiable only by borrowing a *fill-step* state token
(`--color-surface-active`), never by the border tokens: against an inverted ceiling
fill those collapse to roughly 1.1:1, i.e. an invisible border. The two rejected
alternatives were adding a dedicated inverted-border token to the contract and
amending the requirement a third time. The chosen fix keeps the non-text floor with
a wide margin (the floor is 3:1) and needs no new token and no new amendment.

### What changed

- `src/styles/portfolio.css` — `.contact-section .solid-link:hover` and
  `.contact-section .solid-link:active`: `border-color: currentColor` →
  `border-color: var(--color-surface-active)`. Two declarations, nothing else. The
  `:active` rule's `outline: 2px solid currentColor` is deliberately untouched: the
  outline sits outside the element over the page surface, it is neither a background
  nor a border value, and re-tokenising it would remove the light-mode press ring.
  The fill, the ink and the transform are unchanged, so the change is border-only.
- `tests/unit/state-border-contract.test.ts` (new, 6 assertions) — a static contract
  over `portfolio.css`: each state's **winning** `border-color` must be a
  `var(--color-*)` reference and must not be `currentColor`; the named token must be
  declared in `global.css` (an undeclared reference fails silently at computed-value
  time, which is worse than the `currentColor` it replaced); and the winning block
  must be the last same-selector block, so a shadowed block cannot resurrect the old
  value. It resolves which declaration wins by modelling the only cascade rule that
  applies here — same specificity, same unlayered origin, last in source order — and
  says so, including what that simplification cannot see.
- `tests/theme-state/state-evidence.spec.ts` (new, 12 tests) — the evidence the
  previous report recorded as missing: computed border provenance in both themes
  (the border must differ from the computed `color`, which is what `currentColor`
  would produce, and must hold ≥3:1 against the element's own fill);
  `prefers-contrast: more` actually changing the preference-gated declarations in
  both themes, with the media feature asserted live; and a held touch press in a
  `hasTouch` coarse-pointer context.

### RED → GREEN, observed

Both new assertion sets were observed failing against the pre-fix CSS and passing
after it.

**RED, unit contract**
(`node --test --experimental-strip-types tests/unit/state-border-contract.test.ts`,
pre-fix CSS): 6 tests, **4 pass / 2 fail**. Both failures name the real lines —
`src/styles/portfolio.css:1595` and `:1644` declare `border-color: currentColor`, so
`currentColor` resolves to `--color-surface`, the label's own value and no state
token.

**RED, e2e**
(`SITE_BASE=/ pnpm run build && npx playwright test tests/theme-state/state-evidence.spec.ts`,
pre-fix CSS): **6 failed / 6 passed**. The four border-provenance tests (hover and
press, both themes) and the two `.contact-section .solid-link` touch tests fail, the
latter because the touch-held border measured `rgb(0, 0, 0)` in dark and
`rgb(243, 234, 220)` in light — the computed `color`, i.e. the old `currentColor` —
against a rest border of `rgb(237, 237, 235)` / `rgb(23, 18, 13)`.

**GREEN, on the remediated tree**: unit contract 6/6; focused e2e 12/12; full
`pnpm run test:unit` **41/41**; full `pnpm run test:e2e` **86/86**;
`pnpm run verify` exit 0; `pnpm run format:check` exit 0.

**Honest provenance of the RED observations.** The assertions were authored by a
bounded writer that stalled before it reported, so the RED runs above were taken by
reverting the two declarations to their pre-fix value **with the assertions already
in place**, then restoring them. That proves the assertions are fail-capable against
the pre-fix CSS — which is the property a verification needs — and it is *not* a
claim that the assertions were written before the CSS within the same authoring pass.
It is the same technique, and the same label, as the round-4 motion repair above:
sensitivity evidence, not RED-first lineage. Unlike unit 2, the failure is captured
verbatim rather than asserted in prose.

**Byte stability.** The first GREEN run predates two later edits to the same files:
`prettier --write` on both new files (the writer stalled before formatting), and the
replacement of one dynamically assembled regex in the unit contract with a
split-based check, which removed the only quality finding the static analyzer raised
(a ReDoS smell a scanner cannot distinguish from a real one). The unit contract was
re-observed RED and GREEN on its final bytes, and the full e2e run was taken on the
final bytes of every e2e-relevant file. `--color-surface-active` is a state token
declared in both modes and already consumed by the press rules; no token was added,
renamed, or revalued by this remediation.

### What the new evidence does and does not prove

- The touch tests run in Chromium's **emulated** coarse-pointer context, not on a
  physical device, and the spec says so in its own header. Chromium applies a sticky
  `:hover` on touch start, so press and hover cannot be fully separated under a
  finger; the spec measures that path explicitly and reports what it observes instead
  of claiming hover-independence.
- `prefers-contrast: more` is emulated, and the emulation is asserted live before any
  read. This closes the gap the previous report recorded as "no current browser test
  emulates `more`".
- The at-rest visual comparison in light mode remains **human**. No screenshot
  baseline exists in `tests/` and this change deliberately introduces none, so no
  test here claims it.
- The strict-TDD deviation for unit 2 is unchanged by any of this: it is documented
  and now explicitly accepted as debt, not repaired.

### Human visual pass (2026-09-13)

This is the one piece of evidence requirement 14 needs that no machine here can
produce, so it is recorded with its instrument rather than summarized.

**Instrument.** A local static build of this working tree (`SITE_BASE=/ pnpm run
build`, served from `dist/` on port 4409) compared against production, which still
serves `main` — PR #29 is open and unmerged. Routes: `/`, `/projects/`, a project
detail page and the 404 route.

**Checklist given to the reviewer.**

1. Light mode at rest on the four routes — nothing at rest may differ from `main`.
2. Dark mode at rest — only two intended deltas (`:root` toggle borders 1.44:1 →
   3.66:1 and the `.desktop-nav .nav-contact` / `.circle-link` pill 2.89:1 →
   3.66:1). Any other at-rest change is a finding.
3. Hover and held press on the thirteen interactive selectors, both themes: press
   feedback exists and no label reads worse than at rest.
4. The remediation's own visible delta on `.contact-section .solid-link` (border
   `#26262e` dark / `#fffdf8` light where it was pure ink) — confirm it still reads
   as a border.
5. The accepted losses, so they cannot surprise later: the theme-toggle cross-fade,
   the `.module-row` stagger, the unmeasurable scrollbar pseudo-element.

**Outcome.** The maintainer reported the appearance as correct.

**Resolution of this evidence, stated plainly.** It is a *general* confirmation, not
an itemized attestation per element and per checker-step. It is a human judgement
with no screenshot baseline anywhere in `tests/`, and this change deliberately
introduces none, so no test can reproduce it and no machine assertion is claimed to
replace it. It is anchored to
`sha256:d888a53d89b3bddbf35ca8baa4a9ae720fa7e4bd50369f759082c1574e9e4f1b`
(`src/styles/portfolio.css`), the bytes the served build was made from; any later
edit to that file invalidates this pass for that file.

## Debt elimination, second slice (2026-09-13)

### The recorded trade-off was false

The unit-4 comment at `portfolio.css` documented the lost `.module-row` stagger as an
unavoidable consequence: restoring it "would mean delaying the interaction properties
with it, which is the defect being fixed here, or writing a per-property delay list with
a bare `0`, which the unit contract's 'no bare time literal' clause exists to keep out of
these declarations".

The second horn was misread. Both contracts ban the **literal**, not the **value**:
`tests/unit/tokens.test.ts` A10 matches `/\d+(?:\.\d+)?m?s\b/` and
`tests/unit/transition-contract.test.ts` clause (c) matches
`/\b\d*\.?\d+(?:ms|s)\b/` — and `0s` matches both. A token for zero is legal
vocabulary; a bare zero is not. The choice was never between delaying the press and
breaking the contract; it was between having a zero token and not having one.

### What changed

- `global.css` — `--motion-none: 0s` joins the motion tokens.
- `portfolio.css` — the stagger is restored at `(0,4,0)`, above the merged
  `.motion-ready [data-reveal].module-row` declaration at `(0,3,0)`, as a per-property
  delay list whose last slot is `opacity`, the only reveal property in that list:
  `var(--motion-none), var(--motion-none), var(--motion-none), var(--motion-stagger)`.
  The row's fade staggers again (0.08s / 0.16s) while hover and press stay immediate —
  **stricter than the pre-change behaviour**, which delayed every property including the
  interaction ones.
- `portfolio.css` — the `.module-row` halves of the two `.principles article` stagger
  rules are deleted. They are `(0,3,0)` — two classes and a pseudo-class, the same as the
  merged selector — so they lost on **source order**, being earlier in the file, and were
  shadowed dead selectors. `.principles article` keeps its own rules, unchanged.
- `portfolio.css` — `.module-row:hover`'s `transform: translateX(5px)` is deleted. It is
  absent from the design (`design.md`'s hover row for `.module-row` reads "fill step +
  label promotion"), it never applies in the enhanced path because
  `.motion-ready [data-reveal].is-visible` owns `transform`, and its only observable
  effect was an inconsistency: a hover nudge for readers *without* JavaScript and none
  for everyone else.
- `tests/theme-state/motion.spec.ts` — the harness now reads `transition-delay`, not only
  `transition-duration`. **That blindness was the root cause**: a staggered row and a
  non-staggered row report identical property and duration lists, so no existing
  assertion could have caught this regression. The new assertion covers
  `nth-child(1..3)`, so a delay on an interaction slot fails as loudly as a missing
  fade delay.
- `tests/theme-state/state-evidence.spec.ts` — the raw-touch test was retitled. It
  claimed the CDP path "delivers a touch press but no pressed state" while the body
  deliberately asserts only that the press arrives as a real touch pointer event and
  records the held delta as a run annotation. The title now says what the body proves,
  which closes the review's second advisory finding without weakening an assertion.

### RED → GREEN, observed

**RED** (`SITE_BASE=/ pnpm run build && npx playwright test tests/theme-state/motion.spec.ts -g "nth-child stagger"`, pre-fix CSS): 1 failed, and the new read printed the whole diagnosis —
`transition-property=[background-color, color, transform, opacity] durations=[180, 180, 180, 640]ms delays=[0, 0, 0, 0]ms`
against an expected `[0, 0, 0, 80]`.

**GREEN**, on the final bytes: the focused test passes; `pnpm run test:unit` 41/41;
`pnpm run test:e2e` **87/87** (86 + the new stagger assertion); `pnpm run verify` and
`pnpm run format:check` clean.

This cycle is RED-first in the ordinary sense — the assertion was written and observed
failing before any production declaration changed — so unlike unit 2 and the border
remediation it needs no sensitivity-evidence label.

### Fail-capability of the alignment assertion, measured

The stagger assertion checks the *pairing* between a property and its delay rather than
a bare delay array, because `transition-delay` aligns with `transition-property` by
index: a positional assertion passes if both lists are reordered in step and the delay
lands on an interaction property.

That failure mode was injected to prove the assertion catches it: the merged
declaration's property list was reordered (`opacity` third, `transform` fourth) with the
delay list left untouched. The measured result is exactly what a positional check would
have missed:

- on `nth-child(1)`, where every expected delay is `0`, the delay array is still
  `[0, 0, 0, 0]` — indistinguishable from correct;
- the alignment-aware assertion failed anyway, naming the mispaired entries (`transform`
  where `opacity` was expected, and vice versa) and printing
  `transition-property=[background-color, color, opacity, transform]`.

The injection was then reverted and the file restored byte-identically (`prettier
--write` reports it unchanged).

### Three review findings, fixed in place

The native review of this slice (`review-3bf3ef636e5e023a`, approved, authority burned)
returned three advisory findings, all of them on this slice's own diff. All three are
addressed rather than deferred:

- `R3-specificity-comment-miscites-value` — **a factual error this slice introduced**.
  The comment claimed the shadowed stagger halves were `(0,2,0)` against a `(0,3,0)`
  declaration. They are `(0,3,0)` — two classes and a pseudo-class — the same as the
  merged selector, so they lose on *source order*, not on specificity. The comment now
  says that, and says why the replacement is `(0,4,0)`: it wins outright and keeps
  winning if the declaration is ever moved.
- `R3-module-row-stagger-scope-narrowed` — the restored selector requires
  `[data-reveal]`, which the rule it replaces did not. That narrowing is deliberate and
  is now documented: the stagger is only meaningful where the reveal runs, and the
  attribute supplies the fourth specificity unit that makes the rule order-independent.
- `R3-stagger-delay-property-alignment` — see the section above.

They are recorded here rather than in the review store because the review is
provider-owned and read-only from this side; the fix is the evidence.

**Gates on the final bytes of this slice**: `pnpm run test:unit` 41/41,
`pnpm run test:e2e` **87/87**, `pnpm run verify` clean, `pnpm run format:check` clean.
