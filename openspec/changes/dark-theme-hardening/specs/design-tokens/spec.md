# Delta for Design Tokens

Base spec: `openspec/changes/dual-theme-design-system/specs/design-tokens/spec.md`. This repository has no `openspec/specs/` tree, so this delta declares its supersession and its extensions as a reference between change specs, matching the pattern the four prior changes already use.

Scope of this delta: it supersedes exactly one requirement ("Dark Theme Values Preserved"), extends two others without rewriting their intent ("Token Categories and Semantic Pairs", "WCAG 2.1 AA Contrast Guardrails"), and leaves the remaining requirements untouched. `theme-toggle`'s "Theme-Color Meta Sync" is satisfied and MUST NOT be touched.

## ADDED Requirements

### Requirement: Dark Theme Canonical Values Recorded

The dark theme's canonical literals MUST be recorded as the shipped values — accent `#ff7a18`, surface `#000000`, accent-on-surface ratio 8.05:1 — and MUST be asserted as such by verification. The superseded values (`#dda783` accent, `#080909` surface, and the "≥ 9.5:1" claim) MUST NOT be reintroduced into the token source, the documentation, or any test expectation.
(Replaces the removed "Dark Theme Values Preserved". Both values were re-derived deliberately: the accent shipped in `72d98f2`, and the pure-black canvas is the accepted OLED identity recorded as confirmed product decision 1. The accent colour itself is NOT reopened by this change.)

#### Scenario: Canonical values are asserted, not re-derived

- GIVEN the token source after this change is applied
- WHEN the dark `--color-accent` and `--color-surface` literals are read
- THEN they are `#ff7a18` and `#000000`, and the computed accent-on-surface ratio is 8.05:1

#### Scenario: Superseded literal reintroduced (edge case)

- GIVEN a future edit reintroduces `#dda783` or `#080909` as a dark token value, or restates the ≥ 9.5:1 claim
- WHEN the token verification runs
- THEN it fails and names the offending token or claim

### Requirement: State and Border-by-Interactivity Token Categories

The token source MUST declare, in both modes, at least one hovered UI background step, one pressed/selected UI background step, and border tokens separated by interactivity — a decorative container border distinct from an interactive component border — in addition to the existing surface/text/accent/border/focus categories. Token names are a design decision; the categories are not.
(Extends "Token Categories and Semantic Pairs". That requirement's existing text and intent are unchanged and MUST NOT be rewritten; this requirement adds the state dimension and the interactivity split. Category separation follows the Radix step model recorded in research R7, which also treats the interactive border steps as the focus-ring steps.)

#### Scenario: New categories present in both modes

- GIVEN the token source after this change is applied
- WHEN the dark block and the light block are read
- THEN each mode declares a hovered background step, a pressed/selected background step, a decorative container border, and an interactive component border

#### Scenario: Border role is separable by interactivity

- GIVEN a decorative container and an interactive component
- WHEN each resolves its border token
- THEN they resolve different tokens, so changing one does not move the other

### Requirement: State and Non-Text Contrast Coverage

The dark theme MUST provide at least 3:1 contrast for the non-text indicators required to identify an interactive component or its current state, verified per state (rest, hover, focus, active). The following MUST stay explicitly outside that required set: decorative container boundaries (SC 1.4.11 *Boundaries* exempts a container whose visible content already identifies the component), supplemental hover treatments (SC 1.4.11 *Hover states* treats author-supplied hover treatments as supplemental), and any indicator that already reaches the 4.5:1 body-text or 3:1 large-text thresholds. Existing dark values — `--color-border` at 1.44:1, `--color-border-strong` at 2.27:1, and `--color-border-hover` at 2.89:1 on the canvas — MUST be documented as legibility-quality items and MUST NOT be characterised as WCAG violations or as conformance repairs.
(Extends, and does NOT supersede, "WCAG 2.1 AA Contrast Guardrails": that requirement is not false and every static pairing in both modes passes it. This requirement adds state and non-text coverage only. Its required set is dark-scoped; the light-mode non-text figures are accepted debt, recorded by "Light-Mode Default Appearance Preservation" in the `theme-state-hardening` capability.)

#### Scenario: Required state indicator reaches 3:1

- GIVEN a dark-mode interactive component whose only remaining state indicator is its border
- WHEN the non-text contrast ratio is computed against the adjacent surface in each state
- THEN it is at or above 3:1

#### Scenario: Supplemental hover treatment is not judged against 3:1

- GIVEN a hover treatment that supplements an indicator which already identifies the component
- WHEN its ratio is computed
- THEN the treatment is evaluated as supplemental, and its sub-3:1 value is not reported as a failure

#### Scenario: Existing border tokens are not reported as violations

- GIVEN `--color-border`, `--color-border-strong`, or `--color-border-hover` in dark mode
- WHEN the change's documentation or review output describes them
- THEN they are described as legibility quality, and no WCAG violation is claimed for them

#### Scenario: Focus rings are recognised as passing

- GIVEN the existing focus ring colours and the ink variant used on accent-filled sections
- WHEN their contrast is evaluated
- THEN both are recognised as passing, and no focus-ring contrast failure is claimed

### Requirement: Mode Key Parity for Every Declared Token

The `@theme` dark block and the `[data-theme="light"]` block MUST declare the same token keys, and MUST hold that parity after the new state and border-by-interactivity categories are added. No colour token key MAY be declared in one mode only.

#### Scenario: Parity holds after the new categories land

- GIVEN the token source after this change is applied
- WHEN the key sets of the dark block and the light block are compared
- THEN the sets are equal, including every new state and border token

#### Scenario: Unpaired token added (edge case)

- GIVEN a colour token declared in one mode and not in the other
- WHEN the parity verification runs
- THEN it fails and names the unpaired key

### Requirement: No Consumerless Tokens

Every colour token declared in the token source MUST have at least one consumer under `src/` or `public/`, and the dead-token verification MUST fail when a token is declared without a consumer. The confirmed-dead artifacts this change deletes (`--color-surface-glass`, `.gradient-text`, `.text-muted`, `.btn-secondary`) MUST NOT remain declared. The tokens the proposal records as accepted debt (`--color-danger`, `--color-on-danger`, both with zero consumers) MUST be enrolled in an explicit exception list that the verification reads, and that list MUST NOT grow without a recorded follow-up decision.

#### Scenario: Declared token has a consumer

- GIVEN the token source after this change is applied
- WHEN each declared colour token is searched for across `src/` and `public/`
- THEN every token resolves to at least one consumer, or is named in the exception list

#### Scenario: New dead token detected (edge case)

- GIVEN a token declared with no consumer that is not named in the exception list
- WHEN the dead-token verification runs
- THEN it fails and names the token

#### Scenario: Confirmed-dead artifacts are deleted

- GIVEN `--color-surface-glass`, `.gradient-text`, `.text-muted`, or `.btn-secondary` before this change
- WHEN the change is applied
- THEN none of them remains declared in either stylesheet

## REMOVED Requirements

### Requirement: Dark Theme Values Preserved

(Reason: The requirement's normative text and its scenario are false on all four points. Dark `--color-accent` is `#ff7a18`, not `#dda783`; dark `--color-surface` is `#000000`, not `#080909`; the measured accent-on-surface ratio is 8.05:1, not "≥ 9.5:1"; and both values were re-derived deliberately, so "MUST NOT be re-derived" no longer describes the system. Because every literal and the ratio are false, the whole requirement is superseded rather than patched.)
(Migration: The corrected values are recorded by the ADDED "Dark Theme Canonical Values Recorded" requirement, and verification fails if `#dda783` or `#080909` is reintroduced. No consumer, data, build, or dependency migration is required. This repository has no `openspec/specs/` tree, so this removal takes effect as a reference between change specs: "Dark Theme Values Preserved" in `openspec/changes/dual-theme-design-system/specs/design-tokens/spec.md` is superseded by this change and MUST NOT be carried forward into a canonical design-tokens spec.)
