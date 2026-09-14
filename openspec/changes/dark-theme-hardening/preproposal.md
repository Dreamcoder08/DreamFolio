# Pre-Proposal State: Dark ("OLED") Theme Hardening

Orchestrator-owned artifact. Persisted **before** the grouped pre-proposal prompt, per the mandatory Research and Pre-Proposal Gate. `sdd-proposal` MUST NOT be invoked until every pending product decision below is `confirmed`.

## Gate status

| Condition | State |
| --- | --- |
| Selected research | **`done`** — open-web full lane executed; see `research.md` |
| Evidence references valid | **yes** — every claim carries tool call, URL, publisher, retrieval time, verbatim excerpt |
| Artifact store ready | **yes** — `openspec`, `openspec/config.yaml` present, `openspec/changes/dark-theme-hardening/` exists |
| Product decisions | **confirmed** — see Confirmed product decisions |
| Proposal readiness | **ready** — `sdd-proposal` may launch |

## Confirmed decisions (already made — do not reopen)

| Decision | Value | Source |
| --- | --- | --- |
| SDD execution mode | `auto` | Session preflight |
| Artifact store | `openspec` | Session preflight |
| Delivery strategy | `auto-chain` | Session preflight |
| Review budget | `400` changed lines per PR | Session preflight |
| Non-text-contrast rule scope | **Dark-scoped**; light-mode debt recorded as accepted | User decision, this session |
| Change shape | New change, superseding the false requirement in `dual-theme-design-system` | User decision, this session |
| Accent colour | `#ff7a18` — **shipped in `72d98f2`, out of scope** | Context, not a work item |

## Corrected framing (research-driven — the proposal must adopt this)

`research.md` removed the conformance justification from the findings that carried the most weight in the original audit:

- A container's border (`.card` 1.44:1, `--color-border-strong` 2.27:1) is **not** a §1.4.11 violation — the SC's Boundaries section exempts it when the content identifies the control.
- Hover treatments are **explicitly supplemental** and need not reach 3:1, so `--color-border-hover` (2.89:1) is **not** a violation.
- The `opacity` hover pattern is **not a failure**; it is the behaviour the SC's hover clause warns against, with a thin light-mode margin (4.99:1 on a button label).
- Focus rings **pass**; the defects there are consolidation and a geometry mutation, not contrast.
- WCAG 2.2 §2.4.13 Focus Appearance is **AAA**, not an obligation.
- Apple HIG is **unvalidated** and must not be cited. No luminance-step figure may be cited.

**Therefore the change is: state-coverage and token-architecture hardening, not a contrast-conformance repair.** Its strongest surviving justification is:

1. **State coverage is genuinely absent** — zero `:active` repo-wide, colour-only state signals, no hover/pressed *background* steps.
2. **The token architecture lacks a state dimension that a recognised system treats as first-class** (Radix steps 4/5 for hover/pressed, 6/7/8 for borders by interactivity).
3. **`forced-colors` erases the OLED edge strategy** — `box-shadow` is forced to `none`, so the `inset` highlight and `--color-border-strong` both vanish, leaving colour-only state feedback that forced colours strips.
4. **The W3C's own testing principle — "test those contrast indicators in each state"** — justifies the state-reading verification harness.

## Product decisions (CONFIRMED — do not reopen)

1. **Dark canvas colour — CONFIRMED: keep pure `#000000`.** The Material trade-off (shadow visibility, eye strain for light text) is accepted and MUST be documented in the proposal as a deliberate, justified choice, citing S3. Rationale: the pure-black canvas is the OLED identity the project chose deliberately; the eye-strain and shadow costs are already mitigated by the layered upper surfaces and the `border-strong` + inset-highlight edge strategy. No visible change.
2. **Press (`:active`) feedback — CONFIRMED: add it.** Today there are zero pressed states repo-wide. The proposal MUST state explicitly that press feedback is classified as *state hardening*, not as visual redesign, so it is not mistaken for scope creep. It is dark-scoped by default and produces no at-rest visual delta.
3. **The universal `*, *::before, *::after` transition — CONFIRMED: remove it, replace with explicit tokenized transitions, in its own work unit, and only AFTER the verification harness exists.** Decided by the orchestrator on delegated authority. Rationale: the correct end state is removal (it currently applies to every element including non-interactive ones and couples the whole site's feel to one rule), **but** it is load-bearing by accident in the same way the reduced-motion guard is. Removing it without a baseline makes regressions invisible. Sequencing the harness first turns invisible regression risk into a failing test. The proposal MUST carry this ordering constraint explicitly.
4. **Elevation steps — CONFIRMED: keep the current ΔL* steps (3.71 / 4.23) and document the trade-off.** No normative threshold exists; it is a perceptual judgement, not a violation. No visible change. The proposal MUST record it as documented-and-accepted rather than as an unexamined omission.

## Scope exclusions recorded

- Not a visual redesign; the light theme's **default** appearance must not change.
- Not re-litigating the accent colour (`72d98f2`).
- No new runtime dependency; static output preserved.
- Orphaned React-era components, the `docs/` tree rewrite, and layout/responsive work are owned by other changes.
- User-preference-gated blocks (`prefers-contrast`, `forced-colors`, `prefers-reduced-motion`) MAY cover both modes; they cannot change the default appearance. This is not a violation of the non-goal.

## Known accepted debt (documented, not fixed here)

- Light mode: `--color-border-hover` 1.52:1, `.tag` 4.81:1 (0.31 margin), `.btn-primary:hover` label 4.99:1 (0.49 margin).
- `--color-danger` / `--color-on-danger` have zero consumers in both modes — the only shipped `on_*` pair is dead code.
- The native SDD runtime writes `openspec/changes/project-hardening/.gentle-ai-instance`, which is not gitignored.

## Outstanding

None. All four product decisions are `confirmed` and the gate conditions are met, so `sdd-proposal` may launch.

## Handoff to `sdd-proposal`

The proposer receives this confirmed handoff and MUST NOT interview the user or infer consent. It MUST NOT cite Apple HIG, any luminance-step figure, or claim a WCAG violation for container borders, hover treatments, focus rings, or the `opacity` hover pattern — `research.md` establishes that none of those are violations.
