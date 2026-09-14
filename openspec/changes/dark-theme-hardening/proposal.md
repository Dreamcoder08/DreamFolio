# Proposal: Dark ("OLED") Theme Hardening

## Intent

DreamFolio's dark theme is visually shipped and its **static** contrast passes in both modes. What is missing is not conformance — it is *state* and *architecture*. This change hardens the dark theme's interaction-state layer and its token taxonomy, and adds the verification harness that makes both durable.

Four findings justify the work, none of which is a WCAG violation claim:

1. **State coverage is genuinely absent.** `grep -n ":active"` across `src/` and `public/` returns **zero matches**. Every interactive element (`.theme-toggle`, `.menu-toggle`, `.solid-link`, `.quiet-link`, `.circle-link`, `.project-links a`, `.desktop-nav a`, `.nav-contact`, `.mobile-nav a`, `.site-footer a`, `.module-row`, `.contact-social a`) has rest/hover/focus only. On touch, `:hover` is sticky and there is no press feedback at all.
2. **The token architecture lacks a state dimension that a recognised system treats as first-class.** Radix Colors documents a 12-step scale where step 4 is *hovered* UI background and step 5 is *active/selected*, and where steps 6–8 separate subtle container borders from interactive borders and focus rings ([S4](research.md#r7--token-taxonomy-s4-verbatim)). DreamFolio's 14-token palette collapses hover and pressed backgrounds entirely, and collapses every border role into one `--color-border` / `--color-border-hover` pair.
3. **`forced-colors` erases the OLED edge strategy.** In forced-colors mode `box-shadow` is forced to `none` and `border-color` / `outline-color` are replaced by system colours ([S5](research.md#r6--forced-colors-mode-s5)). The `inset 0 1px 0 rgba(255,255,255,0.04)` highlight and `--color-border-strong` both disappear, leaving colour-only hover feedback that forced colours strips. There are zero `forced-colors` blocks in the repo today.
4. **The W3C's own testing principle demands per-state verification.** SC 1.4.11's test procedure ends with "**Test those contrast indicators in each state**" ([S1](research.md#r1--what-actually-must-reach-31-under-wcag-22-1411-s1)). The repo has no state-reading test at all, so no state claim is machine-checkable today.

### Framing correction — what this change explicitly does NOT claim

The original audit framed several findings as WCAG failures. `research.md` retracts that framing, and this proposal adopts the corrected version. The following are **not** conformance failures and must not be described as such anywhere downstream:

| Earlier framing | Correct status |
| --- | --- |
| `.card` border 1.44:1, `--color-border-strong` 2.27:1 "fail non-text contrast" | **Not a violation.** SC 1.4.11's *Boundaries* section exempts a container boundary when visible content already identifies the component |
| `--color-border-hover` 2.89:1 "misses 3:1 for a state indicator" | **Not a violation.** Hover treatments are explicitly *supplemental* and need not reach 3:1 |
| `opacity` hover "fails contrast" | **Not a failure.** `.btn-primary:hover` stays above AA (6.24:1 dark / 4.99:1 light). It is the behaviour the SC's hover clause warns against, with a thin light-mode margin |
| Focus rings "compete/fail" | **They pass.** The real defects are consolidation and a geometry mutation (`border-radius: 4px` on `:focus-visible`) |
| §2.4.13 Focus Appearance obligations | **AAA**, not an obligation for this project |

Also excluded from this change's evidence base, per `research.md`:

- **Apple HIG is not cited.** S7 was unreachable (JavaScript-rendered) and `source_check` returned `unclear (0.30)`. There is no verbatim Apple excerpt in this research.
- **No luminance-step figure is cited.** The earlier "+5 to +10 L\* per level" number was recalled, not sourced, and is retracted. The elevation discussion below is explicitly a perceptual judgement.

## Supersession Declaration

This change supersedes **exactly one requirement**: `dual-theme-design-system/specs/design-tokens/spec.md` → **"Dark Theme Values Preserved"** (lines 33–40). Its normative text and its scenario are both factually false:

| Spec asserts | Reality |
| --- | --- |
| dark `--color-accent` is `#dda783` | `#ff7a18` (`global.css:20`, shipped in `72d98f2`) |
| dark `--color-surface` is `#080909` | `#000000` (`global.css:11`) |
| measured contrast ≥ 9.5:1 | `#ff7a18` on `#000000` = **8.05:1** |
| "these values MUST NOT be re-derived" | Both were re-derived, deliberately |

Because all three literals *and* the ratio are false, the whole requirement is superseded, not patched.

Adjacent requirements are handled differently, explicitly:

| Requirement | Handling |
| --- | --- |
| `design-tokens` → **"Dark Theme Values Preserved"** | **Superseded** (whole requirement, as above) |
| `design-tokens` → **"Token Categories and Semantic Pairs"** | **Extended, not superseded.** Not false about what exists, but `on_surface` and `on_focus` never shipped (`on_focus` cannot exist without a `--color-focus` token), `on_error` shipped under the name `on-danger`, and both danger tokens have zero consumers. Model as a **new requirement in this change** (state/border-by-interactivity token categories), leaving the old requirement intact |
| `design-tokens` → **"WCAG 2.1 AA Contrast Guardrails"** | **Extended, not superseded. It is NOT false.** Every static pairing in both modes was recomputed and passes. It is silent about *state* contrast and non-text contrast, which this change adds as a new requirement |
| `design-tokens` → "Single Token Source of Truth", "Surface Layering Policy", "Light Theme Contract", "Unified Token Consumption on All Pages" | **Untouched.** Not false; unaffected by this change |
| `theme-toggle` → **"Theme-Color Meta Sync"** | **Satisfied — MUST NOT be touched.** `theme-init.js:35–38` rewrites `content` pre-paint and `Navbar.astro:80–86` rewrites it on every toggle; the static `#000000` in `BaseLayout.astro:102` is the inert pre-JS default and matches the dark default |

There is no `openspec/specs/` or `openspec/archive/` directory in this repo, so supersession is declared as a **reference between change specs**, matching the pattern the four prior changes already use.

## Confirmed Product Decisions

These are confirmed in `preproposal.md` and are not reopened here.

| # | Decision | Rationale and visible delta |
| --- | --- | --- |
| 1 | **Keep the pure `#000000` canvas** | Material's own component documentation states that a baseline dark theme background is "dark grey instead of black, **which increases visibility for shadows and also reduces eye strain for light text**" ([S3](research.md#r3--pure-black-vs-dark-grey-s3)). That trade-off is **accepted deliberately**: the OLED canvas is this project's chosen identity, and the two stated costs are already mitigated in-repo by the layered upper surfaces (`#0d0d10` / `#17171c`) and the `--color-border-strong` + inset-highlight edge strategy, which exist precisely because shadows vanish on pure black. **No visible change.** |
| 2 | **Add `:active` press feedback** | Zero pressed states exist repo-wide. This is classified as **state hardening, not visual redesign**: it adds a state that has never existed rather than changing an existing appearance, it is dark-scoped by default, and it produces **no at-rest visual delta**. Pressed is an active/operable state (not the disabled exemption), but press feedback is quality, not conformance — the SC does not require a pressed indicator. |
| 3 | **Remove the universal `*, *::before, *::after` transition and replace it with explicit tokenized transitions** | **Own work unit, sequenced LAST, and only AFTER the verification harness exists.** This ordering constraint is **mandatory** (see [Delivery Order](#delivery-order-constraint)). The rule is load-bearing by accident: it currently transitions `background-color`/`border-color`/`color` on every element, including non-interactive ones and everything inside `color-mix()` surfaces, and it is not named in any reduced-motion opt-out — it is neutralised only by `portfolio.css`'s unrelated `* { transition: none !important }` guard. Removing it without a baseline makes regressions invisible; the harness turns that risk into a failing test. |
| 4 | **Keep the current elevation ΔL\* steps (3.71 / 4.23)** | There is **no normative threshold for elevation**, and no source documents a target step figure, so this is a documented perceptual trade-off rather than a defect. In ratio terms the steps are 1.08:1 (canvas→cards) and 1.09:1 (cards→overlays); canvas→elevated is 1.18:1. Honest framing: **elevation in dark mode is carried almost entirely by borders and the 4% inset highlight, not by luminance** — which is why the border/state work in this change matters more than the step sizes. **No visible change.** |

## Scope

### In Scope

Sliced into four work units so each lands inside the 400-line review budget.

**Unit 1 — Token layer, dead artifacts, docs, preference-gated guards** (`global.css`, `portfolio.css`, docs)

- Add the missing token categories for both modes: `--color-focus` / `--color-on-focus`, `--color-text-tertiary`, `--color-success` / `--color-warning` / `--color-info`, and the state dimension (hovered and pressed background steps, plus border tokens separated by interactivity, per the Radix step model in R7).
- Replace the ~17 radius literals, the ~5 duration literals and the untokenised shadow decisions with tokens; `--motion-ease` is the only easing token today and lives outside `global.css`.
- Delete the confirmed dead artifacts: `--color-surface-glass` (zero consumers), `.gradient-text` (zero consumers, still carrying a hardcoded `#0055aa` blue from the deleted cyan palette), `.text-muted`, `.btn-secondary`.
- Correct the two false claims in `.claude/CLAUDE.md`: the "no glassmorphism" line (contradicted by `portfolio.css:74–80`'s `backdrop-filter: blur(18px)` header) and the `systems.ts` file listing (deleted in `db4ddd0`). **`README.md` is accurate and must not be rewritten** — its dark-token description and its `prefers-contrast: more` statement are both literally true.
- Add the **light-mode `prefers-contrast: more` counterpart** (today both blocks are scoped to `[data-theme="dark"]`) and relocate or duplicate the **reduced-motion guard into `global.css`** so it no longer depends on `Navbar.astro` incidentally importing `portfolio.css`.
- Replace the live `opacity`-based hover with state-preserving hover values (Material's model applies a translucent overlay *behind* content rather than attenuating the foreground, so label contrast is preserved or improved — R5).

**Unit 2 — State hardening** (`global.css`, `portfolio.css`, dark-scoped)

- `:active` states for all 12–14 interactive selectors.
- Hover contrast repairs on the *live* sites only: `a:hover { opacity: 0.8 }` is **dead code in every page type** (`portfolio.css:26–28` declares the unlayered `a:hover { opacity: 1 }`, and unlayered author rules beat `@layer base`); the only live `opacity`-hover degradation is `.btn-primary:hover`, which clears AA and is fixed as quality, not as a failure.
- Address the systemic pattern rather than the two `opacity` rules: `.quiet-link:hover` and `.project-links a:hover` swap `--color-text` (17.9:1 on black) for `--color-accent` (8.05:1), a −9.9 swing on the site's primary hover.
- Focus-ring **consolidation** (one width/offset, preserve the correct ink variant on accent-filled `.about-section`/`.contact-section`, where the accent ring on an accent background would be 1:1) and resolution of the `:focus-visible { border-radius: 4px }` geometry mutation, which rounds plain links and buttons only on focus. Both ring colours meet 3:1 where used — this is maintainability and geometry, not contrast.
- `@media (forced-colors: active)` adding **targeted non-colour state signals** so a hovered row is distinguishable from a resting row when `box-shadow` and author `border-color` are removed. Per MDN, this must be small tweaks, **not a parallel forced-colors theme**.

**Unit 3 — Verification harness** (`tests/unit/`, `tests/`, page objects)

- `tests/unit/tokens.test.ts`: `@theme` / `[data-theme="light"]` key parity, dead-token detection, and contrast contracts for raw literals via a small relative-luminance + alpha-composite helper. Zero new dependencies (`node:fs` + a targeted regex per token key). Honest limitation: a regex test can only read *declared literals*, so `color-mix()`-produced values must be asserted as "token X composes from token Y with fraction Z", not as a contrast number.
- An e2e state/contrast spec (Playwright chromium, with a page object under the existing POM layout) that reads computed styles for rest/hover/focus/active. `page.emulateMedia({ reducedMotion: "reduce" })` makes those reads instantaneous instead of racing a 180–300 ms transition; `page.emulateMedia({ forcedColors: "active" })` covers the forced-colors signals. Honest limitation: `getComputedStyle` returns the element's own colour *with alpha*, never the composited result, so the assertion verifies "tokens resolve and the composed math passes", not "pixels look right".
- **No screenshot diffing.** There is currently no `toHaveScreenshot` baseline anywhere in `tests/`, and introducing one would add cross-platform flakiness to a 20-spec deterministic suite.

**Unit 4 — Universal transition removal** (`global.css`, dark-scoped; sequenced last)

- Remove `*, *::before, *::after { transition: … }` and replace it with explicit, tokenized per-selector transitions for the elements that actually need one (theme-toggle cross-fade, links, buttons, cards, nav rows).
- Carries its own RED-first transition contract assertion inside this unit, so the harness from unit 3 need not land a deliberately red spec: the assertion is written and observed failing against the un-removed universal rule, then made green by the same PR.
- If the replacement cannot be completed within budget, this unit is **reported as deferred**, not half-done — the universal rule must never be removed without its explicit replacements.

### Out of Scope

- **Not a visual redesign.** The light theme's **default** appearance MUST NOT change.
- **Not re-litigating the accent colour.** `#ff7a18` shipped in `72d98f2`; the superseded spec value is recorded above as history, not reopened.
- **No new runtime dependency.** Static output must be preserved; verification uses `node:test` and the already-installed Playwright only.
- **Any repair that would require changing light mode's default appearance** — including a strict non-text-contrast rule for `--color-border-hover` (dark 2.89:1 on canvas, 3.06:1 on cards; **light 1.52:1**). The non-text rule adopted by this change is **dark-scoped** and light-mode debt is recorded as accepted below.
- **User-preference-gated blocks MAY cover both modes.** `prefers-contrast`, `forced-colors` and `prefers-reduced-motion` blocks only take effect when the user asks for them, so they **cannot change the default appearance** and this is **not** a violation of the non-goal. This distinction is explicit because the light-mode `prefers-contrast` counterpart and the light border repair look alike and are not.
- Also out of scope by precedent: orphaned React-era components, the `docs/` tree rewrite (owned by `project-hardening`), and layout/responsive work (owned by `responsive-color-hardening`).
- `forced-colors` support is **best practice, not a WCAG requirement** — no success criterion mentions it.

### Delivery Order Constraint

```text
Unit 1 (tokens/artifacts/docs) ──▶ Unit 2 (state hardening) ──▶ Unit 3 (harness) ──▶ Unit 4 (transition removal)
                                                                  ▲                        │
                                                                  └── MANDATORY HARD GATE ──┘
                                       Unit 4 MUST NOT start until Unit 3's harness exists and is green.
```

Units 1–3 may be reordered only if their own dependencies hold (the harness in unit 3 asserts the token and state end-states of units 1–2). **Unit 4's position is fixed by confirmed decision 3 and is not negotiable in design, tasks, or apply.**

## Capabilities

### New Capabilities

- `theme-state-hardening`: dark-scoped interaction-state coverage — `:active` press states, state-preserving hover values, hovered/pressed background and interactivity-separated border tokens, focus-ring consolidation, `forced-colors` non-colour state signals, and the state-reading verification harness.

### Modified Capabilities

- `design-tokens` (from `dual-theme-design-system`): **extends** "Token Categories and Semantic Pairs" with the new state and border-by-interactivity categories, **extends** "WCAG 2.1 AA Contrast Guardrails" to cover state and non-text contrast, and **supersedes exactly one requirement**, "Dark Theme Values Preserved" (see [Supersession Declaration](#supersession-declaration)).

## Approach

Token-layer hardening plus state hardening plus a verification harness, with the light-mode scoping discipline from `explore.md`'s Approach 3 applied to anything that would alter light mode's **default** appearance. Concretely: dark-scoped value changes; user-preference-gated blocks allowed in both modes; light-mode findings in the border and `.tag` areas recorded as known and accepted rather than silently fixed or silently dropped.

## Known Accepted Debt

Documented here so it is not re-litigated, and so a reviewer can see the boundary of this change:

| Item | Value | Why accepted |
| --- | --- | --- |
| Light `--color-border-hover` | 1.52:1 | Repairing it would change light mode's default appearance, violating the non-goal |
| Light `.tag` label | 4.81:1 (0.31 margin) | Passes AA; light-mode default appearance is frozen |
| Light `.btn-primary:hover` label | 4.99:1 (0.49 margin) | Passes AA; the hover *mechanism* is fixed in unit 1, the light value is not |
| Dark `.about-section h2 span { opacity: 0.66 }` | 4.24:1 | Safe only because it renders at large-text scale (3:1 floor); noted as a thin margin, 0.76 below the body-text floor |
| `--color-danger` / `--color-on-danger` | zero consumers | The only shipped `on_*` pair is dead code; whether to wire or delete it is a follow-up decision, not part of hardening |
| `openspec/changes/project-hardening/.gentle-ai-instance` | not gitignored | Native SDD runtime artifact; owned outside this change |

## Affected Areas

| Area | Impact | Description |
| ------ | -------- | ------------- |
| `src/styles/global.css` (336 lines) | Modified | New token categories and both-mode values, dead-artifact deletion, light `prefers-contrast` counterpart, relocated reduced-motion guard, explicit transitions replacing the universal rule |
| `src/styles/portfolio.css` (1546 lines) | Modified | Literal→token replacement, state tokens, `:active` states, focus-ring consolidation, forced-colors signals |
| `src/components/ui/Navbar.astro` | Unchanged (coupling documented) | Imports `portfolio.css`, which is why `portfolio.css` loads on all four page types; removing that import would silently drop site-wide reduced-motion support |
| `.claude/CLAUDE.md` | Modified | Correct the "no glassmorphism" and `systems.ts` claims |
| `tests/unit/tokens.test.ts` | New | Token parity, dead-token and literal-contrast contract |
| `tests/e2e/**` + page object | New | Per-state computed-style and contrast reads |
| `src/layouts/BaseLayout.astro`, `public/theme-init.js` | Unchanged (coupling documented) | Theme colour literals (`#000000`, `#f3eadc`) duplicated in three non-token files; left in place with the unit test's parity assertion as the guard |

## Risks

| Risk | Likelihood | Mitigation |
| ------ | ------------ | ------------ |
| **No screenshot baseline exists anywhere in `tests/`**, so visual regressions from token or state edits are **not machine-detectable** | High (structural) | The unit 3 harness is the substitute for the missing baseline; unit 4 is gated behind it. A human visual pass is still required on the deployed preview before merge |
| **Cascade-layer asymmetry**: `portfolio.css` is entirely unlayered while `global.css` uses `@layer base` / `@layer utilities`; unlayered author rules win **before specificity is even considered** | High | Every edit must state which layer it lands in; any equal-property collision between the two files resolves to `portfolio.css` regardless of import order. `global.css`'s OLED and `prefers-contrast` blocks are outside any layer and behave the same way |
| Removing the universal transition changes the feel of untracked hovers | Med | Unit 4 is last and gated on the harness; each interactive selector gets an explicit replacement before the rule is deleted |
| `:active` states are new user-visible behaviour, in tension with "not a redesign" | Low | Classified explicitly as state hardening; dark-scoped by default; no at-rest delta |
| `:focus-visible { border-radius: 4px }` removal changes the focus ring's shape on plain links — a delta visible in **light mode too** | Med | Design must resolve this against the non-goal: express the fix so light mode's focused appearance is preserved, or escalate as a human consent gate before apply |
| `color-mix()` surfaces cannot be resolved by a regex-based unit test | Med | Assert composition relationships, not computed contrast numbers, for those pairings; e2e reads the composited chain for the cases that matter |
| `--color-border-strong` (2.27:1) is the card's primary identifying signal in dark mode, since card vs canvas differ by only 1.08:1 | Low (interpretation) | Explicitly scoped dark-only as a *legibility quality* item, **not** as a conformance repair; the SC's Boundaries section exempts container boundaries |
| No browser/rendering tool was available in the audit sessions, so every figure is hand-computed | Med (environmental) | The e2e harness is the durable substitute; apply must re-derive final numbers after the token change and confirm hover/focus/forced-colors visually before merge |

## Rollback Plan

All work is confined to `src/styles/*.css`, `.claude/CLAUDE.md`, and new test files — no schema, data, dependency or build-config change. Each work unit is an independent, revertable commit slice, so rollback is scoped to the failing unit rather than the whole change:

- Unit 1: revert the token blocks, artifact deletions and docs edits; no rendered output changes at rest.
- Unit 2: revert the added state blocks; no markup change exists to unwind.
- Unit 3: remove the new test files; the suite returns to 15 unit / 20 e2e green.
- Unit 4: restore the single universal rule (and remove its replacements) — the only unit whose absence would leave a deliberate defect, which is why it is gated last.

## Dependencies

None external. No new npm packages. Verification uses `node:test` (`pnpm run test:unit`) and the already-installed Playwright (`pnpm run test:e2e`).

## Success Criteria

- [ ] `pnpm run verify` stays green; 10 static pages; no new dependency in `package.json`; static output preserved
- [ ] Zero `:active` gaps remain across the 12–14 interactive selectors, dark-scoped
- [ ] Hovered and pressed states no longer attenuate label contrast on the live sites; the `opacity`-hover pattern is gone from the live code path
- [ ] Hovered/pressed background tokens and interactivity-separated border tokens exist in both modes, with key parity held at 14/14 plus the new keys
- [ ] A `@media (forced-colors: active)` block provides a non-colour state signal where state feedback would otherwise vanish
- [ ] `tests/unit/tokens.test.ts` asserts mode key parity, no dead tokens, and literal contrast contracts, and fails if `#dda783` or an unpaired token is reintroduced
- [ ] The e2e spec reads rest/hover/focus/active computed styles deterministically under `reducedMotion: "reduce"` and `forcedColors: "active"`
- [ ] The universal `*, *::before, *::after` transition is removed **only after** the harness exists, with explicit tokenized replacements per interactive selector
- [ ] `.claude/CLAUDE.md`'s glassmorphism and `systems.ts` claims are corrected; `README.md` is left unmodified
- [ ] Light mode's default appearance is unchanged (verifiable by a human visual pass); no light-mode value is altered outside user-preference-gated blocks
- [ ] The supersession of "Dark Theme Values Preserved" is reflected in specs, and "WCAG 2.1 AA Contrast Guardrails" and `theme-toggle`'s "Theme-Color Meta Sync" are untouched
- [ ] Pure-black canvas and the ΔL\* 3.71 / 4.23 steps are documented as deliberate, sourced trade-offs, not as omissions

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | **~700–1000** across four units (unit 1 ~200–280, unit 2 ~180–260, unit 3 ~200–260, unit 4 ~120–200) |
| 400-line budget risk | **High** for a single PR; Low per unit |
| Chained PRs recommended | **Yes** |
| Suggested split | 4 work units, one PR each, in the fixed order above |
| Delivery strategy | `auto-chain` (session preflight) |
| Chain strategy | **Stacked PRs to main**, recommended: each unit is independently verifiable and lands on main in order. Final chain-strategy selection is deferred to PR creation per session preflight |
| Decision needed before apply | **Yes — one item:** the focus-ring `border-radius` geometry fix, if it cannot be expressed without altering light mode's focused appearance. Otherwise No |

Work units, with the verification and rollback boundary each PR owns:

| Unit | PR | Goal | Focused test command | Runtime harness | Rollback boundary |
| ------ | ---- | ------ | ---------------------- | ----------------- | ------------------- |
| 1 | PR 1 | Token categories, literal→token, dead artifacts, docs, preference-gated guards | `pnpm run test:unit` | `pnpm run build`; `prefers-contrast` / reduced-motion media emulation | Revert token blocks + docs edits |
| 2 | PR 2 | `:active`, state-preserving hover, focus-ring consolidation, forced-colors signals | `pnpm run test:e2e` | Playwright state reads under `reducedMotion: reduce` and `forcedColors: active` | Revert added state blocks |
| 3 | PR 3 | Token-contract unit spec + per-state e2e spec + page object | `pnpm run test:unit` + `pnpm run test:e2e` | Self | Remove new test files only |
| 4 | PR 4 | Remove the universal transition; explicit tokenized replacements | `pnpm run test:e2e` | Harness from PR 3 as the baseline | Restore the single universal rule |

Each PR's diff must contain only its own work unit. Any diff pollution (for example, unit 1's token churn appearing in PR 2) is treated as a base bug and retargeted or rebased before review.
