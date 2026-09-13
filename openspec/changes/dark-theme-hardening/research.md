# Research: Dark ("OLED") Theme Hardening

Status: **research_complete: true** for the selected class, with per-claim validation recorded below.
**proposal_ready: partially** — see "Unvalidated" and "One consequence that changes the change".

Read `explore.md` first. This document answers the interpretation questions `explore.md` left open. It does not restate the code audit.

---

## 0. Admission record — read this before trusting anything below

**Selected class:** open-web (full lane). **Delegation was blocked and the lane was run by the orchestrator instead.**

The `sdd-research` child reported, after re-checking child-local availability:

> Grants observed (exact): `documentation=[]; open-web=[]`

None of the four jointly-required tools (`web_search`, `source_check`, `fetch_content`, `get_search_content`) existed in the child session, although all four are active and reachable in the parent session. This is a **runtime capability-injection gap, not a policy denial**: no source restriction was expressed by the user or by `openspec/config.yaml`.

Consequences, recorded rather than hidden:

- The lane was executed by the orchestrator (parent), which holds all four tools. This is a deliberate deviation from phase delegation, forced by the block. The evidence below is genuine retrieval, not recalled knowledge.
- Every claim carries a tool call, URL, publisher, and retrieval timestamp, so it can be re-verified independently of who ran it.
- The `sdd-research` child also recorded a divergence: it was constrained to a single write (`research.md`) and therefore did **not** persist `preproposal.md`. That artifact is still outstanding and must exist before `sdd-proposal` launches.

**Retrieval window:** 2026-09-12T20:05Z – 2026-09-12T20:11Z (UTC).

### Tool calls actually executed

| # | Tool | Target |
| --- | --- | --- |
| 1 | `web_search` | WCAG 2.2 focus criteria; Material 3 state layers; forced-colors best practice (3 queries) |
| 2 | `fetch_content` | W3C 1.4.11 Understanding; m3.material.io roles; Apple HIG dark mode (3 URLs) |
| 3 | `fetch_content` | material-components-android `Dark.md`; Radix Colors scale (2 URLs) |
| 4 | `get_search_content` | W3C 1.4.11, `findText` ×6 phrases (12 excerpts) |
| 5 | `get_search_content` | `Dark.md` ×6 phrases; Radix ×5 phrases |
| 6 | `source_check` | Material pure-black claim; Apple system-backgrounds claim (both returned `unclear`) |
| 7 | `fetch_content` | MDN `@media (forced-colors)` |
| 8 | `web_search` | Material/Apple dark-theme positions; token taxonomy (3 queries) |

### Source ledger

| ID | Publisher | Title | URL | Retrieved | Retrieval fidelity |
| --- | --- | --- | --- | --- | --- |
| S1 | W3C / WAI | Understanding SC 1.4.11: Non-text Contrast | <https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html> | 2026-09-12T20:07Z | **Full text retrieved**, excerpts via `findText` |
| S2 | W3C | WCAG 2.2 + Understanding 2.4.13 Focus Appearance | <https://www.w3.org/TR/WCAG22/> · <https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html> | 2026-09-12T20:05Z | **Summary-level** (search synthesis); the AAA level is independently corroborated verbatim inside S1 |
| S3 | Google / material-components-android | `docs/theming/Dark.md` @ master | <https://github.com/material-components/material-components-android/blob/master/docs/theming/Dark.md> | 2026-09-12T20:09Z | **Full text retrieved**, excerpts via `findText` |
| S4 | Radix UI | Colors — Understanding the scale | <https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale> | 2026-09-12T20:09Z | **Full text retrieved**, excerpts via `findText` |
| S5 | MDN | `@media (forced-colors)` | <https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors> | 2026-09-12T20:11Z | **Full text retrieved** (page last modified 2026-04-20) |
| S6 | Google / material-components-android | `dimens.xml` (state-layer alphas) | <https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/resources/res/values/dimens.xml> | not retrieved directly | **Summary-level only** — cited by a search synthesis; not independently verified |
| S7 | Apple | HIG — Dark Mode | <https://developer.apple.com/design/human-interface-guidelines/dark-mode> | attempt 2026-09-12T20:08Z | **NOT RETRIEVABLE** — page is JavaScript-rendered; `source_check` returned `unclear` |

---

## R1 — What actually must reach 3:1 under WCAG 2.2 §1.4.11 (S1)

### The normative text

> The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s): **User Interface Components** — Visual information required to identify user interface components and states, except for inactive components or where the appearance of the component is determined by the user agent and not modified by the author; **Graphical Objects** — Parts of graphics required to understand the content, except when a particular presentation of graphics is essential to the information being conveyed.

### Boundaries — a container's border is usually OUT of scope

> **Boundaries.** This success criterion does not require that controls have a visual boundary indicating the hit area. If a control has visible content (such as text or a sufficiently contrasting icon), which helps users identify the presence of the control, then a border or other indication of the overall boundary of the hit area is not required, as is therefore not subject to non-text contrast requirements.

> Having a visual boundary indicating the hit area is only required when there is no other visual way to identify the presence of the control – and in those cases, the boundary must have sufficient non-text contrast in order to pass this success criterion.

**This is the single most consequential excerpt for this change.** It means:

- `--color-border` at 1.44:1 on the `.card` panels of `projects/[id].astro` is **not a WCAG 1.4.11 violation**. A card is a container; its content identifies it.
- `--color-border-strong` at 2.27:1 — the token introduced specifically so OLED card edges stay legible — is **also not a violation**.
- `.btn-secondary`, `.nav-contact` and `.circle-link` all carry visible text, so their borders are **not required** to reach 3:1.

The correct framing for the change is therefore **quality and legibility, not conformance debt**. Do not let the proposal claim it is repairing a WCAG failure — it is not, and a spec built on that claim would be false.

### Hover states are explicitly supplemental

> However, there are a number of HTML components (such as buttons, checkboxes, radio buttons, and selects) which do not by default display any additional visual effects when the user moves a pointer control over them. The pointer itself, via its location, is the indicator of whether the user is hovering on a component. Therefore, additional author-supplied visual treatments for hover are not "required to identify" the hover state. **Those treatments can be considered supplemental and do not themselves need to contrast 3:1 against the background.**

So the `--color-border-hover` finding (2.89:1 on canvas / 3.06:1 on cards) is **not a violation either** — it is documented, and explicitly so.

But the same section constrains hover differently, and this part *is* binding:

> The key consideration for any hover effect is that it does not cause a component itself to lose sufficient contrast against adjacent colors, or cause the visual indicators for other states, such as focus or selection, to lose sufficient contrast.

This is the clause that gives the opacity-hover pattern its real weight: `.btn-primary:hover { opacity: 0.9 }` drops the label from 7.59:1 to 6.24:1 (dark) and from 6.17:1 to 4.99:1 (light). Both remain above AA, so **it is still not a failure** — but it is the exact behaviour the clause warns against, and light mode's 4.99:1 leaves 0.49 of margin on a button label.

### Focus indicators ARE in scope

> Even when a control does not need to have a visual boundary indicating its hit area, it will still need to have a sufficiently contrasting focus indication.

> In combination with 2.4.7 Focus Visible, the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused.

DreamFolio's focus rings use `--color-accent` (8.05:1 dark) plus the ink variant on accent-filled sections. **Both pass.** The focus-ring work in this change is consolidation and the `border-radius` geometry defect, not a contrast repair.

### Inactive components are exempt

> User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements.

Relevant because the change will introduce `:active` (pressed) states. `:active` is an *active*, operable state — not the disabled exemption. But see R6: pressed is still not a *required* indicator under the SC text ("required to identify"), so press feedback is quality, not conformance.

### Test methodology the W3C itself prescribes

> Identify each user-interface component (link, button, form control) on the page and: Identify the visual (non-text) indicators of the component that are required to identify that a control exists, and indicate the current state. In the default (on page load) state, test the contrast ratio against the adjacent colors. **Test those contrast indicators in each state.**

That last sentence is the justification for the e2e state-reading harness proposed in `explore.md` — it is the W3C's own testing principle, not an invention.

**Claim-to-source:** R1-a…R1-g → S1.

---

## R2 — Focus requirements and their level (S2, corroborated by S1)

| SC | Name | Level |
| --- | --- | --- |
| 2.4.11 | Focus Not Obscured (Minimum) | **AA** |
| 2.4.12 | Focus Not Obscured (Enhanced) | **AAA** |
| 2.4.13 | Focus Appearance | **AAA** |

The reported detail for 2.4.13 — a 2 CSS-pixel perimeter-equivalent area and a 3:1 contrast between focused and unfocused states — is **summary-level (S2)**, not a verbatim retrieval.

Independently corroborated verbatim inside S1:

> New in WCAG 2.2: There is a AAA criterion in WCAG 2.2 that addresses this aspect, Focus Appearance.

**Consequence:** 2.4.13 is AAA and therefore **not** a conformance obligation for this project. The design must not present the focus-ring unification as meeting 2.4.13. It is a consistency and correctness fix under 2.4.7 / 1.4.11 (S1's focus clause), which are the binding ones.

**Claim-to-source:** R2-a → S2 (summary); R2-b → S1 (verbatim corroboration of AAA).

---

## R3 — Pure black vs dark grey (S3)

Material's own component documentation states the position and its reasons:

> The baseline Material `Dark` theme background and surface colors are **dark grey instead of black, which increases visibility for shadows and also reduces eye strain for light text.**

Two stated reasons, both relevant here: shadows (which this repo has already had to work around) and eye strain for light text.

Material has since moved past that mechanism:

> **Note:** Surface with elevation overlays has been replaced in Material components with the tonal surface color system.

### Apple: NOT VALIDATED — and an earlier claim of mine is retracted

`https://developer.apple.com/design/human-interface-guidelines/dark-mode` is JavaScript-rendered and could not be retrieved. A directed `source_check` on the Apple claim returned **`status: unclear (confidence 0.30)`** — the retrieved passages contained no clear support or contradiction.

**Retraction:** an earlier statement in this session asserted that Apple HIG "prefers adaptive semantic backgrounds … pure black mainly for immersive media" as a sourced position. **That was not supportable.** No verbatim Apple excerpt was obtained in any retrieval, so the honest record is: **Apple's position is unverified in this research.** It must not be cited as evidence in the proposal or design.

Material's dark-grey position stands on its own (S3) and is sufficient to justify treating pure black as a deliberate, documented trade-off rather than the default best practice.

**Claim-to-source:** R3-a, R3-b → S3 (verbatim). R3-c (Apple) → **unvalidated, S7 unreachable**.

---

## R4 — Elevation in dark themes (S3)

> Shadows are less effective in an app using a dark theme, because they will have less contrast with the dark background colors and will appear to be less visible. In order to compensate for this, **Material surfaces become lighter and more colorful at higher elevations, when they are closer to the implied light source.** This is accomplished via elevation overlays, which are semi-transparent (`colorPrimary`) overlays that are conceptually placed on top of the surface color. The semi-transparent alpha percentage is calculated using an equation based on elevation, which results in higher alpha percentages at higher elevations, and therefore lighter surfaces.

So **elevation-via-lightening is the recognised, documented technique** — the same technique DreamFolio already uses via `surface → surface-alt → surface-elevated`. The approach is right; only the magnitude is in question.

**Retraction of a number:** the earlier audit cited "Material targets roughly +5 to +10 L*per level". **No retrieved source documents any specific luminance-step figure.** That number was recalled, not sourced. It must not appear in the design as evidence. `explore.md` already and correctly frames the ΔL* steps (3.71 / 4.23) as a perceptual judgment with no normative threshold — that framing stands, and the open question is whether the steps read as distinct, which is a design judgement, not a standards question.

One more relevant sentence from the same document, which argues for keeping the elevation conversation separate from the border conversation:

> you should consider accessibility contrast ratios for text and iconography, when deeply nesting elevated Material components and views that support elevation overlays.

**Claim-to-source:** R4-a, R4-b → S3 (verbatim). R4-c (`+5..+10 L*`) → **retracted, unvalidated**.

---

## R5 — Interaction state conventions (S6 partial, S4 verbatim)

Material's state-layer model expresses interaction feedback as a translucent overlay applied *over* the component, using the relevant on-colour, rather than by attenuating the component's own colour. Reported alphas: **hover 8%, focus 12%, pressed 12%, dragged 16%.**

These come from `dimens.xml` via a search synthesis (S6). The canonical specification page (`m3.material.io/styles/color/roles`) is JavaScript-rendered and was not retrievable. The values are **corroborated across several implementation sources but are summary-level evidence** — the design may rely on the *model* confidently, and should treat the exact percentages as "approximately 8–16%".

The model is the operative finding, and it directly indicts the current pattern: DreamFolio expresses hover/press by **attenuating the foreground** (`opacity` on the element), which mathematically reduces the contrast of the text against its surface. Material's model adds an overlay *behind* the content, so label contrast is preserved or improved. That is the defensible replacement for the `opacity` anti-pattern.

**Claim-to-source:** R5-a → S6 (summary, implementation-sourced). R5-b (model) → S6 + S4 corroboration.

---

## R6 — Forced-colors mode (S5)

This is **not a WCAG requirement.** `forced-colors` appears in no success criterion; it is a platform feature. Its inclusion in this change is best practice, and the proposal must label it as such.

MDN documents exactly which properties the UA overrides (S5):

> In forced colors mode, the values of the following properties are treated as if they have no author-level values specified. […] `color`, `background-color`, `text-decoration-color`, `text-emphasis-color`, **`border-color`**, **`outline-color`**, `column-rule-color`, `-webkit-tap-highlight-color`, SVG `fill`, SVG `stroke`

and the special cases:

> `box-shadow` is forced to `none` · `text-shadow` is forced to `none` · `background-image` is forced to `none` for values that are not url-based · `color-scheme` is forced to `light dark` · `scrollbar-color` is forced to `auto`

**This fully neutralises DreamFolio's OLED edge strategy.** The `inset 0 1px 0 rgba(255,255,255,0.04)` highlight is `box-shadow` → forced to `none`. `--color-border-strong` is `border-color` → replaced by a system colour. So the compensation the site relies on to make cards legible on pure black **disappears**, and what remains for hover/active feedback is colour-only, which is exactly what forced colors strips.

Also relevant, and a real constraint on the design:

> In general, web authors should **not** be using the `forced-colors` media feature to create a separate design for users with this feature enabled. Instead, its intended usage is to make small tweaks to improve usability or legibility when the default application of forced colors does not work well for a given portion of a page.

So the remedy must be **targeted tweaks** (add a non-colour state signal where state would otherwise vanish), not a parallel forced-colors theme.

> User agents choose system colors based on native element semantics, *not* on added ARIA roles. As an example, adding `role="button"` to a `div` will **not** cause an element's color to be forced to `ButtonText`

**Claim-to-source:** R6-a…R6-d → S5 (verbatim).

---

## R7 — Token taxonomy (S4 verbatim)

Radix Colors documents a 12-step scale where **each step owns a use case**:

| Step | Documented use case |
| --- | --- |
| 1 | App background |
| 2 | Subtle background |
| 3 | UI element background |
| 4 | **Hovered** UI element background |
| 5 | **Active / Selected** UI element background |
| 6 | Subtle borders and separators |
| 7 | UI element border and focus rings |
| 8 | Hovered UI element border |
| 9 | Solid backgrounds |
| 10 | Hovered solid backgrounds |
| 11 | Low-contrast text |
| 12 | High-contrast text |

> Steps `6`–`8` are designed for borders. *Step `6` is designed for subtle borders on components which are not interactive. For example sidebars, headers, cards, alerts, and separators.* Step `7` is designed for subtle borders on interactive components. * Step `8` is designed for stronger borders on interactive components and focus rings.

> - Step `3` is for normal states. *Step `4` is for hover states.* Step `5` is for pressed or selected states.

Two independent conclusions follow, and they line up with R1:

1. **A recognised system separates borders on non-interactive containers (step 6) from borders on interactive components (7/8), and treats the interactive-border steps as the focus-ring steps.** This is the same distinction WCAG draws between a decorative container boundary and a boundary required to identify a control. DreamFolio collapses all of it into one `--color-border` / `--color-border-hover` pair.
2. **Hover and pressed are first-class, separately-named steps**, not an opacity effect. DreamFolio has no hover or pressed step for backgrounds.

`source_check` on the taxonomy claim also surfaced Radix's own framing of the layer distinction (primitive / semantic / component), which is consistent with treating the current flat 14-token palette as a semantic layer that is missing its state dimension.

**Claim-to-source:** R7-a → S4 (verbatim table + quotes).

---

## One consequence that changes the change

The research **removes the conformance justification** from the two findings that were carrying the most weight in the audit:

| Earlier framing | Research verdict |
| --- | --- |
| `--color-border` 1.44:1 and `--color-border-strong` 2.27:1 "fail" | **Not violations.** S1's Boundaries section exempts them because the content identifies the control |
| `--color-border-hover` 2.89:1 "misses 3:1 for a state indicator" | **Not a violation.** S1's Hover states section says supplemental hover treatments need not reach 3:1 |
| `opacity` hover "fails" | **Not a failure** (`.btn-primary` stays AA). It is the behaviour S1's hover clause warns against, with thin light-mode margin |
| Focus rings are wrong | **They pass.** The real defects are consolidation and the `border-radius` geometry mutation |

What survives, strengthened rather than weakened:

- **State coverage is genuinely absent** — zero `:active`, colour-only state signals, no hover/pressed *background* steps anywhere (R7), and the whole compensation removed under forced colors (R6).
- **The token architecture lacks the state dimension that a recognised system treats as first-class** (R7 + R5).
- **`forced-colors` will erase the OLED edge strategy** (R6) — a concrete, demonstrable defect with no WCAG framing needed.
- **The W3C's own testing principle — "test those contrast indicators in each state"** (R1) — justifies the state-reading harness.

So `explore.md`'s Approach 2 remains the right shape, with its justification re-grounded: **this is a state-coverage and token-architecture change, not a contrast-conformance repair.**

---

## Unvalidated / not collected

| Item | Status |
| --- | --- |
| Apple HIG's position on pure black vs system backgrounds | **Unverified.** S7 unreachable (JS-rendered); `source_check` returned `unclear (0.30)` |
| Material's specific luminance step per elevation level | **Unverified.** No retrieved source states a figure |
| Material state-layer exact alphas (8/12/12/16%) | **Summary-level.** S6 not directly retrieved; model is reliable, exact values are approximate |
| WCAG 2.4.13's 2 CSS-px area detail | **Summary-level.** Only the AAA level is verbatim-corroborated (via S1) |
| Any Material 3 (m3.material.io) primary text | **Not retrieved.** Page is JavaScript-rendered; Material evidence here is the Material Components repo (S3), which is official but Material 2-era in its elevation mechanism |
| Whether the ΔL* elevation steps read as distinct to a human | **Not a research question.** Perceptual; no normative threshold exists |

`source_check` was used twice as directed and returned `unclear` both times. That is recorded as a genuine negative result, not smoothed over: for Apple and for the luminance figure, **the evidence does not exist in what was retrievable.**

---

## Capability block record (for the runtime defect)

| Field | Value |
| --- | --- |
| Phase | `sdd-research` |
| Class | open-web (full lane) |
| Tools required | `web_search`, `source_check`, `fetch_content`, `get_search_content` |
| Child-reported grants | `documentation=[]; open-web=[]` |
| Parent-reported grants | `documentation=["fetch_content"]; open-web=[all four]` |
| Verdict | Capability injection did not reach the child; the parent lane was fully functional |
| Impact | Delegation blocked for this phase only. Lane executed by the orchestrator |
| Not a cause of | Any source restriction, user policy, or missing network access |

The injected `web-design-guidelines` skill likewise depends on a fetch tool and could not execute in the child session.

---

## Claims summary

- **research_complete: true** — the selected class was executed to completion with the required evidence format.
- **proposal_ready: partially** — every question R1–R7 is answered with usable evidence, but the proposal must be written against the *corrected* framing above, and must not cite Apple or any luminance-step figure.
- **Outstanding before `sdd-proposal`:** `preproposal.md` was not persisted by the blocked child and must exist before the pre-proposal gate can pass.
