# Theme State Hardening Specification

## Purpose

Dark-scoped interaction-state coverage for DreamFolio's two themes: pressed (`:active`) states that do not exist anywhere today, hover values that preserve label contrast instead of attenuating it, a state dimension in the token layer consumed by the state rules, one consolidated focus indicator that keeps the correct ink variant on accent-filled sections, non-colour state signals under `forced-colors: active`, the per-state verification harness that makes these claims machine-checkable, and the harness-gated substitution of the universal transition rule.

This capability hardens *state* and *architecture*. It is not a contrast-conformance repair: the container-border, hover-border, `opacity`-hover and focus-ring findings this change touches are quality and consistency items, and the Light-mode and dark-mode figures involved are documented as accepted rather than as WCAG violations.

## Requirements

### Requirement: Dark-Scoped Press State Coverage

Every interactive element in the dark theme MUST define an `:active` (pressed) state, so that no interactive selector relies on hover alone for press feedback. At minimum this covers `.theme-toggle`, `.menu-toggle`, `.solid-link`, `.quiet-link`, `.circle-link`, `.project-links a`, `.desktop-nav a`, `.nav-contact`, `.mobile-nav a`, `.site-footer a`, `.module-row`, and `.contact-social a`. Press rules MUST be dark-scoped, and MUST NOT change any element's at-rest appearance in either mode.

#### Scenario: Pressed feedback exists for every interactive element

- GIVEN the dark theme after this change is applied
- WHEN the interactive selector set is enumerated and each element is pressed
- THEN every element in the set has an `:active` rule that changes its appearance while pressed

#### Scenario: No at-rest visual delta

- GIVEN an element carrying a newly added `:active` rule
- WHEN it is rendered at rest, in dark mode and in light mode
- THEN its rest appearance is identical to its pre-change rest appearance

#### Scenario: Press feedback without hover (touch)

- GIVEN a touch device, where no hover state is available
- WHEN the user presses an interactive element
- THEN a pressed state is visible for the duration of the press

### Requirement: State-Preserving Hover

A hover treatment MUST NOT attenuate the contrast of a label against its own surface: the label's contrast ratio in the hovered state MUST be greater than or equal to its at-rest ratio, and MUST stay at or above 4.5:1 for body text and 3:1 for large text. The mechanism is NOT specified — changing the surface, border, or an overlay behind the content, and changing the label colour, are all acceptable, provided the property holds. A rule that reaches its hover effect by reducing the element's `opacity` MUST NOT remain on any live hover path.

#### Scenario: Hovered label contrast does not drop

- GIVEN an interactive element with a visible text label in dark mode
- WHEN it is hovered and its computed label colour and surface are read
- THEN the composed label-to-surface ratio is greater than or equal to the at-rest ratio, and clears the applicable AA floor

#### Scenario: Surface-changing hover keeps a usable ratio

- GIVEN a hovered element whose treatment changes its surface rather than its label
- WHEN the composed ratio is computed against the changed surface
- THEN the ratio still clears the applicable AA floor and does not fall below the at-rest ratio

#### Scenario: Attenuation mechanism detected (edge case)

- GIVEN a hover rule that produces its effect by reducing the element's own `opacity`
- WHEN the live hover path is reviewed
- THEN the rule is rejected as state-attenuating

### Requirement: State-Driven Interaction Tokens in Use

Rest, hover, focus, and active rules in the dark theme MUST resolve their background and border values from the state tokens declared in the token source — the hovered and pressed background steps and the interactivity-separated border tokens — rather than from literals or from an alpha-reduced copy of the element's own colour.
(The categories themselves are declared in both modes, with parity and consumers, by the `design-tokens` delta; this requirement is about the state rules consuming them.)

#### Scenario: State rules consume state tokens

- GIVEN a hover or active rule added or changed by this change
- WHEN the rule's declarations are read
- THEN each background and border value is a state token reference, not a literal

#### Scenario: Decorative and interactive borders stay separable in use

- GIVEN a decorative container and an interactive component rendered in the same view
- WHEN their borders are compared across rest, hover, and active
- THEN the interactive component's border moves between states while the decorative container's does not

### Requirement: Focus Indicator Consolidation and Ink Variant Preservation

The dark theme MUST present one consistent focus-ring width and offset across the interactive selector set, MUST keep the ink-coloured ring variant on links inside the accent-filled `.about-section` and `.contact-section` (where an accent ring on an accent background has no contrast), and MUST resolve the `:focus-visible { border-radius: 4px }` geometry mutation, which rounds plain links and buttons only while they are focused. The resolution MUST NOT alter light mode's focused appearance. If the mutation cannot be resolved without altering light mode's focused appearance, the change MUST stop at the pre-apply consent gate before that edit is applied, and that edit MUST NOT ship without explicit human consent.
(Consent gate: this is the single pre-apply decision the proposal flags.)

#### Scenario: Consistent ring geometry across element types

- GIVEN the dark theme after this change is applied
- WHEN focus rings are measured across the interactive selector set
- THEN ring width and offset are the same for every element

#### Scenario: Ink variant preserved on accent-filled sections

- GIVEN a link inside an accent-filled `.about-section` or `.contact-section`
- WHEN the link receives focus
- THEN the ring resolves to the ink variant, and its ratio against the accent background is at or above 3:1

#### Scenario: Focused element keeps its at-rest shape

- GIVEN a plain focusable link or button, in either mode
- WHEN its computed `border-radius` is read while focused
- THEN it matches the at-rest value

#### Scenario: Geometry fix cannot preserve light focused appearance (consent gate)

- GIVEN a resolution of the `border-radius` mutation that would change light mode's focused appearance
- WHEN the change reaches pre-apply
- THEN implementation pauses, the gate is put to the human, and the edit is not applied without consent

### Requirement: Forced-Colors Non-Colour State Signals

Under `@media (forced-colors: active)` the dark theme MUST provide a non-colour state signal for each interaction state whose feedback would otherwise vanish when the user agent removes author `box-shadow` and author `border-color`. The signals MUST be implemented as targeted tweaks, and MUST NOT take the form of a parallel forced-colors theme. This requirement is **best practice, not a WCAG requirement** — no success criterion mentions `forced-colors` — and MUST NOT be described as a conformance obligation.

#### Scenario: Hovered state remains distinguishable

- GIVEN forced colors are active
- WHEN a row or card that signals hover only through background or border colour is hovered
- THEN a non-colour signal distinguishes the hovered element from its resting neighbours

#### Scenario: Pressed state remains distinguishable

- GIVEN forced colors are active
- WHEN an interactive element is pressed
- THEN a non-colour signal distinguishes the pressed state

#### Scenario: No parallel forced-colors theme

- GIVEN the forced-colors block added by this change
- WHEN its declarations are reviewed
- THEN they are limited to state signals on the elements that need them, and no separate palette, theme, typography, or layout is defined inside it

### Requirement: Per-State Computed-Style Verification

A browser-based verification spec MUST read computed styles for each interaction state — rest, hover, focus, active — and MUST be deterministic. Determinism MUST come from the existing reduced-motion guard via `page.emulateMedia({ reducedMotion: "reduce" })`, so that state reads are not racing a transition, and forced-colors coverage MUST use `page.emulateMedia({ forcedColors: "active" })`. Assertions MUST cover token resolution and the composed contrast math. Screenshot diffing MUST NOT be introduced, and no new dependency MAY be added.
(Justification: this is the W3C's own test procedure for SC 1.4.11 — "Test those contrast indicators in each state" — not an invented method. `getComputedStyle` returns a colour with alpha rather than the composited result, so the assertion verifies that tokens resolve and the composed math passes, not that rendered pixels look right.)

#### Scenario: Each state is read deterministically

- GIVEN the verification spec runs with `reducedMotion: "reduce"` emulated
- WHEN it reads computed styles for rest, hover, focus, and active
- THEN every read completes without waiting on a transition, and returns the same values on repeat runs

#### Scenario: Focus ring is read after keyboard focus

- GIVEN the verification spec
- WHEN focus is moved with the keyboard and the focused element's outline properties are read
- THEN `outline-width` and `outline-color` resolve to the consolidated ring for that element

#### Scenario: Forced-colors signals are verified

- GIVEN `forcedColors: "active"` is emulated
- WHEN the state signals are read
- THEN the non-colour signal is present in the hovered and pressed states

#### Scenario: No screenshot baseline introduced

- GIVEN the test tree after this change is applied
- WHEN it is searched for screenshot assertions
- THEN no screenshot-diffing assertion was added

### Requirement: Harness-Gated Universal Transition Removal

The universal `*, *::before, *::after` transition rule MUST NOT be removed until the per-state computed-style harness exists and is green. The removal MUST be accompanied by explicit, tokenized, per-selector transitions for every interactive selector that needs one, and MUST carry a RED-first transition contract assertion that is written and observed failing against the un-removed rule, then made green by the same unit. If the replacements cannot be completed within that unit's budget, the removal MUST be reported as deferred and the universal rule MUST NOT be left removed without its replacements.

#### Scenario: Gate respected

- GIVEN the universal transition rule is still present
- WHEN its removal is attempted
- THEN the per-state computed-style harness already exists and is green

#### Scenario: Replacement is complete at removal time

- GIVEN the universal transition rule has been removed
- WHEN every interactive selector's transitions are inspected
- THEN each one declares an explicit tokenized transition, and no selector is left with none

#### Scenario: RED-first contract assertion

- GIVEN the transition contract assertion is written before the rule is removed
- WHEN it runs against the un-removed universal rule
- THEN it fails, and it passes only once the rule is gone and the replacements are in place

#### Scenario: Incomplete replacement (edge case)

- GIVEN replacements that cannot be completed within the unit's budget
- WHEN the unit is reported
- THEN the universal rule is restored and the removal is reported as deferred, not shipped half-done

### Requirement: Light-Mode Default Appearance Preservation

No literal or token value changed by this change MAY alter light mode's at-rest appearance. Two exceptions apply and MUST be treated as in-scope rather than as violations of this requirement: user-preference-gated blocks (`prefers-contrast`, `forced-colors`, `prefers-reduced-motion`) MAY cover both modes, because they cannot change the default appearance; and the state *mechanism* fixes (hover treatments, press states that are dark-scoped) MAY change a hovered or pressed appearance in either mode. Known light-mode findings — `--color-border-hover` at 1.52:1, the `.tag` label at 4.81:1, and the `.btn-primary:hover` label at 4.99:1 — MUST be recorded as known and accepted rather than repaired; the light *values* are not in scope, only the mechanism.

#### Scenario: Light mode at rest is unchanged

- GIVEN light mode before and after this change
- WHEN any element is rendered at rest
- THEN its computed appearance is unchanged

#### Scenario: Preference-gated block applies in light mode

- GIVEN the user requests increased contrast in light mode
- WHEN `prefers-contrast: more` matches
- THEN the light-mode counterpart block applies, and that application is not treated as a change to the default appearance

#### Scenario: Accepted light-mode debt is recorded, not repaired

- GIVEN light `--color-border-hover`, the light `.tag` label, or the light `.btn-primary:hover` label
- WHEN the change is reviewed
- THEN each is documented as known and accepted, and none of their light values was altered by this change
