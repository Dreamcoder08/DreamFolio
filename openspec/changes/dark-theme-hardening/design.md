# Design: Dark ("OLED") Theme Hardening

## Technical Approach

Keep the shipped dark identity (`#000000` canvas, `#ff7a18` accent) and add the two dimensions the palette is missing: **interaction state** (hovered / pressed background steps, border-by-interactivity, focus pair) and **contract verification**. The change is implemented as a single unlayered state layer in `portfolio.css` plus a state/border token block in `global.css`, all four work units in the fixed order `tokens → state → harness → transition removal`, with one blocking human consent gate (the `:focus-visible` geometry mutation).

The design's central law, which every state rule must satisfy and the harness asserts:

> **No interaction state may lower a live label's contrast below its own at-rest value, in either mode.**

That law is what makes the `opacity`-hover pattern removable rather than merely detectable, and it is stricter than WCAG requires (§1.4.11 treats hover treatments as supplemental, R1/S1).

**Framing discipline (binding).** Nothing below claims a WCAG violation for container borders (`--color-border` 1.44:1, `--color-border-strong` 2.27:1), for `--color-border-hover` (2.89:1 canvas), for the `opacity` hover pattern, or for the focus rings. No luminance step per elevation level is stated as a target. Apple HIG is not cited. `forced-colors` is labelled best practice, not a requirement. WCAG 2.2 §2.4.13 is AAA and not an obligation for this project.

**Figure discipline (binding).** Every ratio below names the selector or the token pair whose declarations produce it, and the surface it was composited against. Where a ratio involves `opacity`, the colour and the opacity come from the **same** matched declaration after source-order resolution, with `currentColor` resolved through the actual parent (`.project-card--civic` → `--color-text`; `.about-section` / `.contact-section` → `--color-on-accent`); a colour taken from one selector is never combined with an opacity taken from another. **No luminance-step (ΔL\*) figure appears anywhere in this document** — not for elevation, not for the state steps; the only step claims are the measured *inequalities* assertion A8 checks and the measured *ratios* in §1. Every figure's provenance is tabulated in §9.1, together with the corrections applied to the previous revision of this document.

---

## Decisions at a glance

| # | Decision | Choice | Why (one line) |
| --- | --- | --- | --- |
| D1 | State fill mechanism | **Opaque per-mode state steps**, not a translucent state-layer scrim | One token → one ratio: no surface-dependent drift, exactly assertable by the e2e harness (R5's model is adopted as the *principle* — never attenuate the foreground — not as the literal overlay) |
| D2 | Preserving hover | **Label promotion + fill moving away from the label's luminance + border/decoration for max-brightness labels** | On a pure-black canvas nothing is brighter than `--color-text`, so a label swap there can only attenuate |
| D3 | Borders | 4 role tokens: decorative (`--color-border`, `--color-border-strong`) vs interactive (`--color-border-interactive`, `--color-border-interactive-hover`) + `--color-focus`/`--color-on-focus` | Radix's step 6/7/8 split (R7/S4); `--color-border-hover` is removed because its single name hid two roles and was used at rest in 2 places |
| D4 | Focus-ring geometry (`border-radius: 4px`) | **Cannot be resolved without changing light mode's focused appearance → routes to the pre-apply consent gate** | Proven below against the actual selector set (§3) |
| D5 | Literal → token | 8 radius, 6 motion, 5 shadow tokens; **no value changes** — relocation only | Keeps unit 1 free of any at-rest delta |
| D6 | `var(--color-*)` in `className` | **Included**, owned by unit 1 (~10 lines) | One of the four sites is a *live attenuating hover* this change already owns; Tailwind 4 already generates the semantic utility |
| D7 | `--color-success/-warning/-info` | **Not added** (deviation from the proposal) | They would be three more consumerless keys, which the `design-tokens` delta forbids |
| D8 | Reduced-motion guard | The universal part **moves** to `global.css` (unlayered); `portfolio.css` keeps only its component exceptions | Removes the "loses reduced-motion support if the Navbar import is ever dropped" failure mode; makes the harness's determinism lever structural |
| D9 | `forced-colors` | Targeted non-colour signals only (outline style/pattern, `text-decoration`), 6 selectors | MDN: small tweaks, never a parallel theme (R6/S5) |

All ratios in this document are hand-computed with the WCAG 2.x relative-luminance formula and sRGB byte-space alpha compositing, on the literals in the tree, and each is attributed to the declarations that produce it (§9.1). Where a figure differs from `explore.md`/`research.md` it is intermediate rounding of ≤ 0.02 (e.g. `--color-text` on `--color-surface-active` reads 12.80 here and 12.81 there); a larger gap is a defect, not rounding. The apply phase must re-derive the final numbers after the token change.

---

## 1. The state and border token contract

### 1.1 The scale

Radix's roles are used for the *separation* (steps 4/5, 6/7/8, 10), not its values. DreamFolio's 3 rest surfaces become the anchor: every new dark state step sits **above `--color-surface-elevated`**, so it is visible on the canvas, on cards, and on overlays — the mistake the current accent-tint hover makes is that it nearly vanishes: that tint (`.module-row:hover { background: color-mix(in srgb, var(--portfolio-yellow) 6%, transparent) }`, `portfolio.css:952-956`) measures **1.05:1** against `--color-surface` and **1.06:1** against `--color-surface-alt`. No judgment is passed on conformance there; the point is that a colour-only hover signal at that distance is not perceivable.

| Radix role | Token | Dark | Light | Consumer role |
| --- | --- | --- | --- | --- |
| 1 canvas | `--color-surface` | `#000000` | `#f3eadc` | unchanged |
| 3 element bg | `--color-surface-alt` | `#0d0d10` | `#fff7ea` | unchanged |
| 3+ overlay | `--color-surface-elevated` | `#17171c` | `#fffdf6` | unchanged |
| **4 hovered** | `--color-surface-hover` | `#1e1e24` | `#fbf6ec` | `.module-row:hover`, toggle hover |
| **5 pressed/selected** | `--color-surface-active` | `#26262e` | `#fffdf8` | `:active` rows + toggles |
| 9 solid | `--color-accent` | `#ff7a18` | `#8a4e26` | unchanged |
| **10 hovered solid** | `--color-accent-hover` | `#ff8f42` | `#7a4522` | `.btn-primary:hover`, `.solid-link:hover` |
| **10+ pressed solid** | `--color-accent-active` | `#ffa25e` | `#6b3c1c` | `.btn-primary:active`, `.solid-link:active` |
| 6 subtle container border | `--color-border` | `rgba(255,255,255,0.16)` | `rgba(0,0,0,0.10)` | unchanged value, role documented |
| 6+ container edge | `--color-border-strong` | `rgba(255,255,255,0.28)` | `rgba(0,0,0,0.22)` | unchanged value; `.card:hover` (was `--color-border-hover`) |
| **7 interactive border** | `--color-border-interactive` | `rgba(255,255,255,0.34)` → `0.40` in unit 2 | `rgba(0,0,0,0.18)` | `.nav-contact`, `.circle-link` rest; dark toggles |
| **8 interactive border, hover/press** | `--color-border-interactive-hover` | `rgba(255,255,255,0.56)` | `rgba(0,0,0,0.30)` | every interactive hover/active border |
| **7 (focus role)** | `--color-focus` | `#ff7a18` | `#8a4e26` | the consolidated ring |
| **on-focus** | `--color-on-focus` | `#0a0a0a` | `#fff7ea` | ring on accent-filled sections |
| 11 tertiary text | `--color-text-tertiary` | `#7f7f7a` | `#746555` | **light `prefers-contrast: more` only** (§5.1): the de-attenuated ink for the two real `opacity: 0.65` civic-card text selectors; **no at-rest consumer in either mode** |

Contrast floors this set must clear in **dark** (dark-scoped, and self-imposed quality — the SC's *Boundaries* exemption means most of these were never required):

| Pairing | Floor | Value | Ratio |
| --- | --- | --- | --- |
| `--color-focus` on `--color-surface` | ≥ 3:1 (in scope; S1's focus clause) | `#ff7a18` | **8.05:1** |
| `--color-on-focus` on `--color-accent` | ≥ 3:1 | `#0a0a0a` | **7.59:1** |
| `--color-border-interactive` vs each surface | ≥ 3:1 | `rgba(255,255,255,0.40)` | **3.66** canvas / **3.80** card / **3.82** elevated |
| `--color-border-interactive-hover` vs each surface | ≥ rest step | `rgba(255,255,255,0.56)` | **6.48 / 6.45 / 6.28** |
| `--color-text` on `--color-surface-hover` | ≥ 4.5:1 | `#ededeb` on `#1e1e24` | **14.15:1** |
| `--color-text` on `--color-surface-active` | ≥ 4.5:1 | `#ededeb` on `#26262e` | **12.80:1** |
| `--color-on-accent` on `--color-accent-hover` | ≥ 4.5:1 | `#0a0a0a` on `#ff8f42` | **8.73:1** |
| `--color-on-accent` on `--color-accent-active` | ≥ 4.5:1 | `#0a0a0a` on `#ffa25e` | **9.98:1** |
| `--color-text-tertiary` on canvas / card | ≥ 4.5:1 | `#7f7f7a` | **5.22 / 4.82** |

Light (each figure names the surface it is measured against): `--color-focus` (`#8a4e26`) **5.51:1** on `--color-surface` `#f3eadc`; `--color-on-focus` (`#fff7ea`) **6.17:1** on `--color-accent` `#8a4e26`; `--color-accent-hover` + `--color-on-accent` **7.31:1**; `--color-accent-active` + `--color-on-accent` **8.63:1**; `--color-text-tertiary` (`#746555`) **4.72:1** on `--color-surface` `#f3eadc` and **5.52:1** on `--color-surface-elevated` `#fffdf6`; `--color-text` on `--color-surface-hover` / `--color-surface-active` **17.27:1 / 18.30:1**. The light **border** ratios stay at their shipped levels (e.g. `--color-border-interactive` composites to 1.52:1 on the canvas) and are recorded as accepted light debt, exactly as the `theme-state-hardening` spec allows — the required 3:1 set is dark-scoped.

**Step sizes are described, not targeted — and no step size is stated.** This document records **no ΔL\* number** for the new state steps or for the existing elevation levels. The only step commitments are the ones the harness verifies: assertion A8 (per mode `L(--color-surface-hover) ≠ L(--color-surface)` and `L(--color-surface-active) ≠ L(--color-surface-hover)`; in dark, both state steps above `L(--color-surface-elevated)`) and assertion A7's contrast floors (`--color-text` on each state step, §1.1). The state layer's *visibility* is argued in ratio terms instead: the tint it replaces (`.module-row:hover { background: color-mix(in srgb, var(--portfolio-yellow) 6%, transparent) }`, `portfolio.css:952-956`) measures **1.05:1** against `--color-surface` and **1.06:1** against `--color-surface-alt` — a colour-only hover signal that is barely there. Stating that is a visibility observation, not a conformance claim, and no threshold is claimed for it or for any step size.

### 1.2 Why opaque steps rather than Material's translucent state layer

| Option | Verdict |
| --- | --- |
| **A. Translucent state layer** `rgba(255,255,255,0.06)` over the element (Material's literal model, R5/S6) | **Rejected as the primary mechanism.** A scrim composites against whatever is beneath, so one token yields a different ratio per surface — the exact drift `--color-border-hover` already demonstrates (2.89 canvas / 3.06 card / 1.52 light). It also makes the values unresolvable to the regex-based unit test, which would force the harness to trust an assumed surface. |
| **B. Opaque per-mode steps (chosen)** | One token, one ratio, no compositing assumption; the e2e reads a final colour from `getComputedStyle` and the unit test reads a literal. Cost: one extra step per role, and a step must be paired with a label promotion to stay monotone on dark surfaces. |
| C. `opacity` on a pseudo-element / `box-shadow` scrim | Rejected: adds machinery for no gain, does not survive `forced-colors` (`box-shadow` → `none`). |

Material's operative insight survives in D2: feedback is expressed by moving the **surface**, never by attenuating the **foreground**.

### 1.3 The state-preservation table (dark; light in parentheses)

Rest ratios are on the element's own surface. `≥` means the state is compliant by *equality* — the signal is border/decoration/motion, not colour.

| Selector | Rest | Hover | Press (`:active`) | Signal carrying the state |
| --- | --- | --- | --- | --- |
| `.desktop-nav a` | 10.52 (5.60) | **17.91** (15.60) | **17.91** + underline | label promotion |
| `.theme-toggle`, `.menu-toggle` | 10.52 (5.60) | **14.15** (17.27) | **12.80** (18.30) | fill step + label promotion |
| `.nav-contact` | 17.91 (15.60) | **17.91 ≥** | **17.91 ≥** | interactive border + translate |
| `.solid-link` | 7.59 (6.17) | **8.73** (7.31) | **9.98** (8.63) | `--color-accent-hover` / `-active` |
| `.btn-primary` | 7.59 (6.17) | **8.73** (7.31) | **9.98** (8.63) | `--color-accent-hover` / `-active` |
| `.quiet-link`, `.project-links a` | 17.91 (15.60) | **17.91 ≥** | **17.91 ≥** | underline + icon move |
| `.circle-link` | 16.55 (17.49) | **16.55 ≥** | **16.55 ≥** | interactive border + scale |
| `.module-row` | 10.52 (5.60) | **14.15** (17.27) | **12.80** (18.30) | fill step + label promotion |
| `.mobile-nav a` | 16.55 (17.49) | *(none today)* | **16.55 ≥** | border colour + translate |
| `.site-footer > a` | 10.52 (5.60) | *(none today)* | **17.91 ≥** | label promotion + underline |
| `.contact-social a` | 7.59 (6.17) | *(none today)* | **7.59 ≥** | underline + translate |
| `.contact-section .solid-link` | 17.91 (15.60) | **17.91 ≥** | **17.91 ≥** | border + translate (its fill is already near-white; nothing lighter exists) |
| `.card` (container) | 16.55 (17.49) | **16.55 ≥** (hover-only delta `--color-border-strong`) | n/a | container border step |

Every rest figure in that table is produced by a named pair in the tree, and **no row mixes a colour from one selector with an opacity from another** — nothing in this table is an `opacity`-attenuated pairing at all: `.desktop-nav a` (`portfolio.css:105-110`), `.theme-toggle` / `.menu-toggle` (`:131-144`), `.module-row` (`:940-951`) and `.site-footer > a` (`:1080-1087`) rest on `--color-text-secondary` (`#b7b8b3` dark / `#6b5947` light); `.nav-contact` (`:112-121`), `.quiet-link` (`:190-197`), `.project-links a` (`:669-678`), `.mobile-nav a` (`:159-167`), `.circle-link` (`:774-786`), `.projects-entry-link` (`:1149-1151`) and `.wordmark` (`:78-89`) rest on `--color-text`; `.solid-link` (`:171-184`) and `.contact-social a` (`:1065-1072`, inheriting `currentColor` from `.contact-section` `:988-995`) rest on `--color-on-accent` over `--color-accent`; `.contact-section .solid-link` (`:1047-1051`) rests on `--color-surface` over `--color-text`. The `opacity`-attenuated text cases that *do* exist are enumerated and measured separately in §9.1 — none of them is a state, and none of them is a failure.

Two structural consequences worth stating, because they look like omissions and are not:

- **Dark:** nothing is brighter than `--color-text` (`#ededeb`) against `#000000`, so no colour swap can improve a label that already uses it. Those hovers therefore signal through border, underline, and motion. This is why `.quiet-link:hover`/`.project-links a:hover` stop swapping `--color-text` (17.91) for `--color-accent` (8.05) — the −9.9 swing `explore.md` §1 identified.
- **Light:** the top rest surfaces are already as bright as they can get — `--color-text` `#17120d` measures **18.28:1** on `--color-surface-elevated` `#fffdf6` and **17.49:1** on `--color-surface-alt` `#fff7ea` — so there is no room to raise a label further; the light state fills are defined on the **canvas** ramp and are applied only to canvas-level elements (rows, toggles). Card-level hovers in light mode use the border/decoration signals. Plus one asymmetry on purpose: light `--color-border-interactive` keeps the shipped value so that no light at-rest pixel moves.

**A latent hazard this design dissolves.** Today `.quiet-link:hover { color: var(--portfolio-yellow) }` (`portfolio.css:198-201`) and `.about-copy .quiet-link { color: currentColor }` (`portfolio.css:860-864`) have equal specificity, so the later rule wins and accent-on-accent (1:1 on the accent-filled `.about-section`) is avoided *only by source order*. Because the new state rules declare **no colour at all** for these selectors, the hazard disappears rather than being preserved by luck. No existing rule is reordered by this change.

### 1.4 `.btn-primary` — the requested before/after

| Mode | At rest | Hover **before** (`.btn-primary:hover { opacity: 0.9 }`) | Hover **after** (`--color-accent-hover`) |
| --- | --- | --- | --- |
| Dark | 7.59:1 (`--color-on-accent` `#0a0a0a` on `--color-accent` `#ff7a18`) | **6.24:1** (−1.35) | **8.73:1** (+1.14) |
| Light | 6.17:1 (`--color-on-accent` `#fff7ea` on `--color-accent` `#8a4e26`) | **4.99:1** (−1.18) | **7.31:1** (+1.14) |

Producing declarations, so that the colour and the opacity are attributable to one selector each: **rest** — `.btn-primary { background: var(--color-accent); color: var(--color-on-accent) }` (`global.css:277-289`, `@layer utilities`). **Hover before** — that same rule plus `.btn-primary:hover { opacity: 0.9 }` (`global.css:290-292`), which composites *both* the fill and the label toward whatever is beneath; the figures above are measured against the page canvas (`--color-surface`, `#000000` dark / `#f3eadc` light). **Hover after** — `.btn-primary:hover { background: var(--color-accent-hover) }` on the same selector, with `--color-on-accent` as the ink and no `opacity` anywhere in the pair.

`opacity` on the element is exactly what makes the *before* ratio surface-dependent: the identical declaration reads **6.28:1** when the button sits on `--color-surface-alt` `#0d0d10` rather than on the canvas. That is D1's argument stated as a measured consequence instead of an assumption — and it is why the *after* mechanism is a fill step, whose ratio is a property of the token alone. Light mode's hover value changes (permitted: the spec freezes light mode's *at-rest* appearance and explicitly allows state-mechanism fixes to change hovered appearance); light mode's at-rest 6.17:1 is untouched.

---

## 2. Cascade layers — where every declaration lands

Three facts decide this, all verified in the tree:

1. `portfolio.css` is **entirely unlayered**; `global.css` uses `@layer base` / `@layer utilities`, and its token blocks, `prefers-contrast` blocks and OLED block are **unlayered**. Unlayered author rules beat layered ones *before* specificity is evaluated.
2. `@theme` output is emitted inside Tailwind's first layer (`theme`), which is why the unlayered `[data-theme="light"]` block successfully overrides it today — that is the empirical proof, not a spec reading.
3. Unlayered-vs-unlayered and same-layer ties are resolved by **source order**.

| Declaration | File / layer | Why it must land there |
| --- | --- | --- |
| `@theme` dark tokens | `global.css`, `@theme` (`theme` layer) | single token source; utilities are generated from it |
| `[data-theme="light"]` values | `global.css`, **unlayered** (unchanged position) | must keep beating the layered `@theme`; moving it into a layer would be a gratuitous risk |
| Light `prefers-contrast: more` counterpart | `global.css`, unlayered `@media`, **after** the token blocks and after `[data-theme="light"]` | same specificity as the light token block, so source order is what makes it win |
| Relocated universal reduced-motion guard | `global.css`, unlayered `@media`, after the token blocks | must beat the layered `@layer base` universal transition it neutralises |
| New global utilities (`.card:hover`, `.btn-primary:hover/:active`) | `global.css`, `@layer utilities` (in place) | utilities already wins over `base`; keeping it there avoids a layer move |
| All state rules (`:hover`, `:active`) for portfolio components | `portfolio.css`, **unlayered**, appended as one "Interaction states" section at end of file | must beat layered declarations and must win the ties against component rules deterministically |
| `forced-colors` block | `portfolio.css`, unlayered | targets portfolio selectors and must beat `@layer utilities` declarations for `.card`/`.btn-primary` |
| `--motion-*` tokens | `global.css` `@theme`; **deleted** from `portfolio.css:6-8` | a duplicate in the unlayered `:root` would silently win over the token source |
| Radius / shadow / duration relocations | in place, both files | values identical → no rendering delta, no layer move |
| Dark value raise `--color-border-interactive` 0.34→0.40 + the dark-scoped toggle boundary | `portfolio.css` unlayered / `global.css` unlayered dark scope, **unit 2** | dark-scoped value changes are the change's purpose, and they must not ride in unit 1 with the zero-delta renames. `--color-border-interactive-hover` has no unit-1 consumer to preserve, so it is declared at its final value in unit 1 and simply *wired* in unit 2 |

Consequence for review: **the rename and the value raise are deliberately split across units.** Unit 1 renames with values that reproduce today's rendering exactly; unit 2 raises the dark values. If they were merged, unit 1 could no longer claim "no at-rest delta".

---

## 3. Focus ring: consolidation, ink variant, and the one consent gate

**Consolidation (no gate, and zero visual delta).** Today the ring is declared twice — `global.css:110-114` inside `@layer base` at `2px solid` / `2px`, and `portfolio.css:28-32` (`a:focus-visible, button:focus-visible`) at `3px solid` / `5px`, unlayered, which therefore wins for **every** `a` and `button` on every page. The site has no other focusable element — a grep for `tabindex`, `<input`, `<select` and `<textarea` across `src/**/*.astro` returns nothing, and the only two `<button>` elements (`Navbar.astro:31,41`) are the theme and menu toggles, covered by the `button:focus-visible` half of `portfolio.css:29` — so the *effective* ring today is `3px` / `5px` sitewide, on every page type (all four import `portfolio.css` through `Navbar.astro`). Consolidation therefore preserves the effective geometry exactly:

- `:focus-visible` (global.css, `@layer base`) becomes the single declaration: `outline: 3px solid var(--color-focus); outline-offset: 5px`, with the `border-radius: 4px` line being the only gated item (§3.1).
- `portfolio.css:28-32` is **deleted** — it is now redundant, and deleting it also resolves the silent `outline`-shorthand override of the base `outline-offset` that `explore.md` §5 records.
- `.about-section a:focus-visible, .contact-section a:focus-visible { outline-color: var(--color-on-focus) }` (`portfolio.css:33-36`) is **kept** (unlayered, so it still beats the base rule's colour) — it is correct: accent-on-accent would be 1:1, and its replacement measures 7.59:1 (dark) / 6.17:1 (light), both produced by the same pair `--color-on-focus` on `--color-accent`.

Result: one width, one offset, one colour source for the whole interactive set, with **no focused-appearance change in either mode** — which also isolates the consent gate to the geometry mutation alone. Not claimed: WCAG 2.2 §2.4.13 (AAA). The binding criteria are 2.4.7 and 1.4.11's focus clause, both of which the ring already satisfies.

### 3.1 The `border-radius: 4px` mutation — verdict: **cannot be resolved without altering light mode's focused appearance**

The mutation side-effects exactly the focusable elements that declare **no** `border-radius` of their own, because `.btn-primary`/`.tag`/`.card` are protected by the later `utilities` layer and `.solid-link`/`.nav-contact`/`.circle-link`/`.theme-toggle`/`.menu-toggle`/`.mobile-nav a` declare their own. The inheriting set is:

`.desktop-nav a`, `.quiet-link`, `.project-links a`, `.contact-social a`, `.site-footer > a`, `.mobile-nav a`, `.about-copy a:not(.quiet-link)`, `.projects-entry-link`, `.wordmark`, `.skip-link`.

In Chromium the outline follows the element's corner radii, so today every one of these gets a 4px-rounded ring **only while focused** — a shape change on focus, present in light mode too. Three candidate resolutions:

| Option | Effect on light mode's *focused* appearance | Verdict |
| --- | --- | --- |
| **A. Delete the declaration** | Changes on all ten selectors (ring corners become square) | Full resolution; **requires consent** |
| **B. Compensate**: delete the base rule, declare `border-radius: 4px` at rest on the selectors where it is invisible at rest (no background/border: `.desktop-nav a`, `.project-links a`, `.contact-social a`, `.site-footer > a`, `.about-copy a:not(.quiet-link)`, `.projects-entry-link`, `.wordmark`) | Preserved for those seven; still changes for `.mobile-nav a` (bottom border), `.about-copy .quiet-link` (bottom border) and `.skip-link` (accent background) — and giving *them* an at-rest radius would instead change light mode's **at-rest** appearance | **Not a resolution** — a light delta survives either way |
| **C. Scope to light only**: `[data-theme="light"] :focus-visible { border-radius: 4px }` | Preserved exactly | **Not a resolution** — the mutation survives in light, so the spec's "in either mode" scenario can never pass; it would ship a self-contradiction |
| D. Keep it and drop the requirement | — | Out of this change's authority: the spec cannot be amended from design |

**Verdict: option A is the only full resolution, and it necessarily alters light mode's focused appearance → the requirement routes to the pre-apply consent gate, exactly as the `theme-state-hardening` spec's fourth scenario prescribes.**

Gate mechanics (must be honoured by tasks/apply/verify):

- **Question to the human:** "Removing `border-radius: 4px` from `:focus-visible` removes a focus-only shape change on ten plain focusable selectors, but it also squares the focus-ring corners on those selectors in **light** mode (today they are 4px-rounded while focused). Consent to the light-mode focused-appearance delta, or keep the mutation and record it as accepted debt?"
- **Recommendation:** consent. The delta is focus-only (never at rest), affects outline corner geometry rather than any colour or size, and is the price of the change's own "focused element keeps its at-rest shape" scenario.
- **If declined:** the edit is **not applied**; the mutation is recorded as accepted debt with a pointer to this gate, and the e2e assertion is dark-scoped with the gate reference in its comment. No half-resolution ships.
- **Evidence for the gate:** the ten-selector list above plus the layer reasoning (`utilities` and the unlayered component rules protect the other elements) — both verifiable in the tree before the edit.

---

## 4. Literal → token mapping

Verified inventory (the proposal's "~17 radius / ~5 duration" is approximate; these are the counted values):

### 4.1 Radii — 16 declarations, 8 distinct values → 8 tokens

| Token | Value | Declarations replaced |
| --- | --- | --- |
| `--radius-sharp` | `2px` | `.solid-link` (portfolio) |
| `--radius-thumb` | `3px` | `::-webkit-scrollbar-thumb` (global) |
| `--radius-control` | `0.5rem` | `.btn-primary` (global) — `.btn-secondary` is deleted |
| `--radius-panel` | `1rem` | `.card` (global); also consumed by `rounded-panel` if the anti-pattern migration keeps `rounded-2xl`'s size |
| `--radius-pill` | `999px` | `.tag` (global), `.nav-contact` (portfolio) — one role declared twice in two files |
| `--radius-circle` | `50%` | `.theme-toggle`, `.menu-toggle`, `.portrait-orbit`, `.circle-link`, `.principle-icon`, `.module-icon`, `.hero-portrait::after` (7 declarations) |
| `--radius-arch` | `48% 48% 8px 8px` | `.hero-portrait::before` |
| `--radius-focus` | `4px` | `:focus-visible` (global) — **exists only to render the gated decision explicit**; if the gate consents to removal, so does this token |

Declared in `@theme` so Tailwind also generates `rounded-*` utilities (`rounded-panel`, `rounded-pill`, `rounded-circle` …). The namespace is additive: the default theme is untouched, so `rounded-2xl` in `projects/[id].astro:90` keeps resolving.

### 4.2 Motion — 6 tokens, 7 distinct literal values replaced

| Token | Value | Replaces |
| --- | --- | --- |
| `--motion-fast` | `180ms` | the only existing motion token — **moves** from `portfolio.css:6-8` to `global.css` `@theme` |
| `--motion-image` | `350ms` | `350ms` ×3 (`.project-image img`, `.compact-image img` transform + filter) |
| `--motion-reveal` | `640ms` | existing reveal/animation duration (moves with the others) |
| `--motion-ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | existing (moves) |
| `--motion-stagger` | `80ms` | `80ms` at **2 declarations** (`portfolio.css:1167` `transition-delay`, `:1190` `animation-delay`) → `var(--motion-stagger)`; the `160ms` step (`:1171`) → `calc(var(--motion-stagger) * 2)` = 160ms |
| `--motion-hero-step` | `90ms` | the `170ms` (`:1193`) and `260ms` (`:1196`) hero delays → `calc(var(--motion-stagger) + var(--motion-hero-step))` = 170ms and `calc(var(--motion-stagger) + var(--motion-hero-step) * 2)` = 260ms |

The `calc()` forms reproduce the current delays exactly (80 / 160 / 170 / 260 ms), so the hero entrance timing does not change. Note the correct shape of the third one: only `--motion-hero-step` is doubled — `calc((var(--motion-stagger) + var(--motion-hero-step)) * 2)` would read 340 ms and is **not** the form used. `global.css`'s `0.3s` / `0.2s` literals are normalised onto `--motion-fast`; that is a **timing-only** delta (200/300 → 180 ms on the elements that keep a transition after unit 4), it applies in both modes, and it is what the "one motion system" decision requires. `--portfolio-yellow*` / `--portfolio-cream` stay as aliases in `portfolio.css:2-5` (they reference tokens, not literals; consolidating them is a separate, larger diff).

### 4.3 Shadows — 5 tokens

| Token | Value (moved verbatim) | Where |
| --- | --- | --- |
| `--shadow-edge` | `inset 0 1px 0 rgba(255,255,255,0.04)` | `global.css` OLED block |
| `--shadow-profile` | `0 34px 80px #0003` | `portfolio.css` `.profile-card` |
| `--shadow-profile-dark` | `0 34px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)` | `global.css` dark `.profile-card` |
| `--shadow-image` | `0 24px 48px #0006` | `portfolio.css` `.project-image img` |
| `--shadow-inset-ring` | `inset 0 0 0 1px #fff2` | `portfolio.css` `.profile-portrait::after` — the untokenised white overlay no light-mode review has ever looked at; tokenised, **not** re-valued |

4-digit hex forms are preserved so the relocation is byte-identical. `--shadow-*` is Tailwind's namespace, so `shadow-edge` etc. also become available as utilities.

### 4.4 Layer and unit for each

Every relocation lands **in place, with an identical value**, unlayered in `portfolio.css` / layered where it already lives in `global.css`, and all of it in **unit 1** — that is what keeps unit 1's claim "no at-rest delta in either mode" true.

---

## 5. Preference-gated blocks

### 5.1 Light `prefers-contrast: more` counterpart

```css
@media (prefers-contrast: more) {
  [data-theme="light"] {
    --color-text-secondary: #4a3d30;        /* 8.80:1 on --color-surface #f3eadc, was 5.60:1 */
    --color-text-tertiary: #5c4a39;         /* 7.06:1 on --color-surface; 8.27:1 on --color-surface-elevated */
    --color-border: rgba(0, 0, 0, 0.32);
    --color-border-strong: rgba(0, 0, 0, 0.42);
    --color-border-interactive: rgba(0, 0, 0, 0.34);
    --color-border-interactive-hover: rgba(0, 0, 0, 0.50);
  }
  /* `opacity` is the one mechanism that cannot deliver "more contrast": the real
     attenuated body-text cases go opaque under the preference. */
  [data-theme="light"] .project-card--civic .project-number,
  [data-theme="light"] .project-card--civic > p {
    color: var(--color-text-tertiary);      /* 5.77:1 attenuated -> 8.27:1 opaque */
    opacity: 1;
  }
}
```

**Scoping guarantee (why this cannot touch light mode's at-rest appearance):** every declaration lives inside `@media (prefers-contrast: more)` and is scoped to `[data-theme="light"]`; with the default user preference the block is inert, and the dark path is unreachable. This is the same mechanism the shipped dark block relies on. Because the block is unlayered and has identical specificity to the `[data-theme="light"]` token block, it **must stay after** that block in `global.css` — the ordering is load-bearing, and unit 1 must keep it adjacent to the existing dark counterpart.

**What this block consumes, and the real deltas.** `--color-text-secondary` *is* read at rest, so the block's effect on it is a real delta and must be stated as one: raising `#6b5947` to `#4a3d30` takes the light canvas ratio from **5.60:1 to 8.80:1**. `--color-text-tertiary` is read **only** inside this media query — it has no at-rest consumer in either mode — so its base light value `#746555` (**4.72:1** on `--color-surface`, **5.52:1** on `--color-surface-elevated`) never renders by default and never displaces a value that does. The gate value `#5c4a39` takes the two real `opacity: 0.65` civic-card text selectors (`.project-card--civic .project-number` / `> p`, `portfolio.css:752-756`) from **5.77:1 to 8.27:1** on `--color-surface-elevated` `#fffdf6`, and measures 7.06:1 for the same literal on the canvas.

Light **default** rendering is therefore untouched for a precise reason rather than by a "bit-identical" claim: every new light value is either read only inside a `prefers-contrast` gate (the two tertiary values and the four border values) or is not applied at rest at all, and every value the block *does* override is declared above **with its real delta**. The light base value `#746555` is **not** equal to any at-rest light colour it could have replaced — it is 4.72:1 where `--color-text-secondary` `#6b5947` is 5.60:1 on the same surface, and 5.52:1 where that token is 6.28:1 on `--color-surface-alt`. That inequality is exactly why the earlier revision's `[data-theme="light"] .tags span { color: var(--color-text-tertiary) }` line was wrong twice over: inside the gate it would have *lowered* the plain chip from 5.60:1 to 4.72:1, and its comment claimed a raise from "2.60:1" — a figure that no selector in the tree produces. That declaration is deleted, and the chip's dark counterpart is deleted with it (§9, §9.1).

### 5.2 Reduced-motion guard relocation

`portfolio.css:1520-1545` currently owns the universal part (`html { scroll-behavior: auto }`, `* { scroll-behavior: auto; animation: none !important; transition: none !important }`) **and** its component exceptions (`.motion-ready [data-reveal]`, the **8** transform selectors — 4 image/row transforms plus 4 icon transforms, `portfolio.css:1535-1544`).

- **Moves to `global.css`**, unlayered, after the token blocks: `html { scroll-behavior: auto !important }` and the universal `scroll-behavior/animation/transition: none !important`. It must stay outside every `@layer` so it keeps beating the `@layer base` universal transition.
- **Stays in `portfolio.css`**: the `[data-reveal]` reset and the transform neutralisations — those are portfolio-owned component exceptions, not the universal guard.

No duplication: the block is *split by ownership*. Anything that neutralises a portfolio-only motion effect stays with the portfolio rules; anything universal becomes page-independent. This is the structural fix for the failure mode the proposal records (dropping `Navbar.astro`'s import would silently remove reduced-motion support), and it is what the harness's determinism lever rests on. The new `:active` transforms **must be added to the neutralised list** (otherwise reduced-motion users get press motion), and because every `:active` state also carries a fill, border, or underline signal, press feedback survives `transform: none`.

Unit 2 must also note: the e2e spec asserts `getComputedStyle(el).transitionDuration === "0s"` under `reducedMotion: "reduce"`. That single assertion turns "the harness depends on an incidental import" into a machine-checked invariant.

### 5.3 `forced-colors` — targeted non-colour signals (best practice, not a requirement)

What vanishes when `box-shadow` → `none` and author `color` / `background-color` / `border-color` / `outline-color` are replaced: the OLED inset highlight, `--color-border-strong`, every colour-only hover, and every tint. One block, six selectors, no palette, no typography, no layout:

| State that would vanish | Non-colour signal | Why this signal survives |
| --- | --- | --- |
| `.module-row:hover` (tint + label colour) | `outline: 1px solid CanvasText; outline-offset: -1px` | only `outline-color` is forced; width/style/offset are author-controlled |
| `.card:hover`, `.nav-contact:hover`, `.circle-link:hover`, toggle hover (border colour only) | `outline: 1px solid CanvasText; outline-offset: 2px` | as above |
| `.quiet-link:hover`, `.project-links a:hover`, `.desktop-nav a:hover`, `.site-footer a:hover` (label colour) | `text-decoration: underline; text-underline-offset: 4px` | `text-decoration-color` is forced, but the line itself is not suppressed |
| every `:active` above | `outline: 2px dashed CanvasText` | **pattern** (solid vs dashed) distinguishes pressed from hovered without colour |
| focus ring | **no tweak** | `outline-color` is forced to a system colour by design; the ring already survives |
| OLED card edges / `--color-border-strong` | **no tweak, deliberately** | the UA's own forcing *is* the intended platform behaviour; adding author borders would be the parallel-theme anti-pattern R6/S5 warns against |

`forced-color-adjust` is **not** used anywhere, and the block defines no custom properties. That is the mechanical way the spec's "no parallel forced-colors theme" scenario stays satisfiable, and the e2e harness asserts it by reading the signals (`outline-style` `solid` at rest→hover, `dashed` at press) under `forcedColors: "active"`.

---

## 6. `var(--color-*)` in `className` — assessed, and **included**

Sites (all in two files): `404.astro:19,23`; `projects/[id].astro:60,68,74,90,117,126,127,144` — including `hover:text-[var(--color-accent)]` (line 60), `bg-[var(--color-surface-elevated)]` and `border-[var(--color-border)]` (line 90).

**Decision: include, owned by unit 1, ~10 changed lines, well inside the 400-line budget.**

Rationale, in order of weight:

1. The hover at `projects/[id].astro:60` is a **live attenuating hover** this change already owns: `hover:text-[var(--color-accent)]` swaps `--color-text-secondary` for `--color-accent`, i.e. 10.52 → 8.05 on `--color-surface` (dark) and 5.60 → 5.51 on `--color-surface` (light). The state law already requires rewriting it; migrating the syntax in the same edit is not scope expansion, it is the same line.
2. Tailwind 4's `@theme` already generates the semantic utilities from these very tokens (`text-accent`, `text-text-secondary`, `bg-surface-elevated`, `border-border`, `rounded-panel`), so the arbitrary-value form is redundant indirection over a layer the project already pays for.
3. It removes a fourth, ad-hoc consumption style from the "unified token consumption" story: today the site consumes tokens as `.class` rules, as Tailwind utilities, and as `var()` inside arbitrary utilities.

Mapping: `text-[var(--color-accent)]` → `text-accent`; `text-[var(--color-text-secondary)]` → `text-text-secondary`; `bg-[var(--color-surface-elevated)]` → `bg-surface-elevated`; `border-[var(--color-border)]` → `border-border`; `hover:text-[var(--color-accent)]` → `hover:underline underline-offset-4` (the state law's signal, no colour swap); `rounded-2xl` → `rounded-panel` (same 1rem, now token-sourced); `transition-colors` is dropped because its 150 ms default is exactly the second motion system this change consolidates — the `a` transition from unit 4 covers it, and leaving it would break unit 4's "every interactive selector declares a tokenised transition" contract.

Explicitly **not** done here: a repo-wide sweep for arbitrary-value utilities outside these two files (there are none for colours; a `no-arbitrary-color-utility` guard belongs in a hygiene change, not this one).

---

## 7. Verification architecture

### 7.1 `tests/unit/tokens.test.ts` (unit 3; assertions opened RED in units 1–2)

Runs under the existing `pnpm run test:unit` (`node --test --experimental-strip-types`), **zero new dependencies**: `node:fs` + `node:test` + `node:assert/strict`, mirroring `tests/unit/analytics.test.ts`. Shared colour math lives in `tests/support/contrast.ts` (pure functions, imported by both the unit and the e2e specs; not matched by either runner's test glob).

What it reads: `src/styles/global.css` (the `@theme` block and the `[data-theme="light"]` block that declares `--color-*` — **not** the second `[data-theme="light"]` block that only sets `color-scheme`, which a naive regex would pick up) and `src/styles/portfolio.css` (for dangling references and literal regressions). No CSS engine, so only declared literals and declared compositions are visible.

| # | Assertion | Spec requirement it proves |
| --- | --- | --- |
| A1 | Dark key set ≡ light key set, and contains the 21 expected keys | "Mode Key Parity for Every Declared Token" |
| A2 | Both modes declare ≥ 1 hovered step, ≥ 1 pressed step, a container border, an interactive border, and the focus pair | "State and Border-by-Interactivity Token Categories" |
| A3 | Every declared `--color-*` key has a `var(--color-…)` reference under `src/`/`public/`, **or** is named in `DEAD_TOKEN_EXCEPTIONS = ["--color-danger", "--color-on-danger"]` | "No Consumerless Tokens" |
| A4 | `DEAD_TOKEN_EXCEPTIONS` has exactly those two entries | the list "MUST NOT grow without a recorded follow-up decision" — growing it requires editing the test, which forces the decision into review |
| A5 | Every `var(--color-*)` used in `src/**` resolves to a declared key | guards the `--color-border-hover` rename (a dangling ref would silently render `border-color: currentColor`) |
| A6 | `#dda783`, `#080909`, `#0055aa` and the string `9.5:1` appear in neither stylesheet, `README.md`, nor `.claude/CLAUDE.md` | "Dark Theme Canonical Values Recorded" + the dead `.gradient-text` removal |
| A7 | Contrast contracts for the §1.1 table, computed from the literals with the shared helper | "State and Non-Text Contrast Coverage" + the extended AA guardrails |
| A8 | Per mode, `L(--color-surface-hover) ≠ L(--color-surface)` and `L(--color-surface-active) ≠ L(--color-surface-hover)`; in dark, both are above `L(--color-surface-elevated)` | makes "the state step is visible on every rest surface" checkable rather than asserted |
| A9 | `--color-focus` ≡ `--color-accent` and `--color-on-focus` ≡ `--color-on-accent` per mode | documents the deliberate alias-by-value so a future accent change cannot silently desync the ring |
| A10 | No `border-radius` declaration in either stylesheet lacks `var(--radius-`; no `transition`/`transition-delay`/`animation-delay` duration lacks `var(--motion-` | the literal→token requirement, kept from regressing |
| A11 | No `color-mix()` in either stylesheet composes a raw literal (only `var(--color-*)`) | composition hygiene |

**The `color-mix()` limitation, handled honestly.** A regex test cannot resolve `color-mix()`. So pairings produced by it are asserted as **composition relationships, not contrast numbers**: a table of `{ file, selector, property, expected composition }` for the declarations this change touches (`.profile-project`, `.project-story blockquote`, `.hero-portrait::after`, `.principle-icon`, `.module-label`, `.site-header`, `::selection`) asserts that the *tokens and the fraction* are unchanged — a token-value change passes, a composition change fails. Every contrast assertion (A7) is restricted to **literal-valued tokens**, which is also why D1 chose opaque literals for the state steps: they are the tokens the harness most needs to be exact about.

### 7.2 The e2e state harness (unit 3; opened RED in unit 2)

**Placement** — same shape as the four existing areas:

```text
tests/theme-state/theme-state-page.ts    ThemeStatePage extends BasePage
tests/theme-state/theme-state.spec.ts    the state reads
tests/support/contrast.ts                shared parse / composite / ratio helpers
```

`ThemeStatePage` exposes: `goto(path)`, `pinTheme("dark" | "light")`, `readState(selector, state)`, and `resolveBackground(selector)`. It follows the existing POM contract (`BasePage` provides `goto`, `currentTheme`, `hasHorizontalOverflow`).

**Determinism and correctness levers (all four are mandatory, three are easy to miss):**

1. `page.emulateMedia({ reducedMotion: "reduce" })` **before** navigation — the relocated guard sets `transition: none !important`, so each read is instantaneous instead of racing a 180–300 ms transition. The spec also asserts the lever is live (`transitionDuration === "0s"`), which protects the harness from its own dependency.
2. **The theme is pinned explicitly** with `page.addInitScript(() => localStorage.setItem("dreamfolio-theme", theme))` **and** asserted (`documentElement.dataset.theme === theme`) before any read. Without this, `theme-init.js` falls back to `prefers-color-scheme`, whose Playwright default is **light** — a test that silently reads the wrong mode is worse than no test.
3. `page.emulateMedia({ forcedColors: "active" })` for the forced-colors reads.
4. Keyboard focus (`page.keyboard.press("Tab")` / `locator.focus()`) rather than clicking, so `:focus-visible` matches — a click would give `:focus` without the ring and the assertion would read empty values.

**How the test composites alpha itself.** `getComputedStyle` returns the element's own colour *with alpha* (and `color-mix()` results serialise as `color(srgb r g b / a)`), never the composited result. So `tests/support/contrast.ts` implements, and each assertion uses:

```text
resolveBackground(el):  walk parentElement chain, compositing each
                        backgroundColor over the next opaque ancestor
                        (fg*a + bg*(1-a) in sRGB byte space), stop at the root
composite(fg, bg):      same formula for a border/label colour over the
                        resolved background
ratio(a, b):            WCAG 2.x relative luminance, (L1+.05)/(L2+.05)
```

Assertions per selector in the interactive set, for both modes:

- **rest** → ratio ≥ AA floor;
- **hover** (`locator.hover()`) → ratio ≥ the rest ratio (the state law);
- **active** (`hover()` then `page.mouse.down()`, read, `mouse.up()`) → ratio ≥ the rest ratio, and a computed difference from rest exists (the state is real);
- **focus** → `outline-width === "3px"` and `outline-offset === "5px"` for every selector in the set (the consolidation), `outline-color` ≡ `--color-on-focus` inside `.about-section`/`.contact-section` with ratio ≥ 3:1, and (if the gate consents) `border-radius` while focused ≡ `border-radius` at rest;
- **forced-colors** → `outline-style` is `solid` for hovered and `dashed` for pressed rows/cards, and `text-decoration-line` is `underline` for hovered text links;
- **no screenshot baseline**: the spec contains no `toHaveScreenshot` call, and unit 3's completion work adds the assertion that the tree has none.

Honest limitation, stated in the spec's header comment: these assertions verify that **tokens resolve and the composed math passes**, not that rendered pixels look right — hence the required human visual pass on the deployed preview.

### 7.3 Unit 4's own RED-first transition contract

Unit 4 adds `tests/unit/transition-contract.test.ts` (same runner, no new dependency) rather than putting a deliberately red spec in the harness: it asserts (a) no `*`/`*::before`/`*::after` transition rule remains in either stylesheet, (b) every selector in the interactive set declares a transition containing `var(--motion-`, (c) no bare time literal remains in any transition. Written and observed failing against the un-removed universal rule, green in the same unit.

Explicit replacements (each tokenised, `--motion-fast` unless noted): `a` (colour, background, border); `.theme-toggle`/`.menu-toggle`, `.nav-contact`, `.circle-link`, `.mobile-nav a`, `.site-footer > a`, `.contact-social a`, `.quiet-link`, `.project-links a`, `.desktop-nav a` (colour, border, transform); `.solid-link`, `.btn-primary`, `.skip-link` (background, border, colour, transform); `.card` (border); `.module-row` (background, colour, transform); image transforms (`.project-image img`, `.compact-image img`) at `--motion-image`; `[data-reveal]` unchanged at `--motion-reveal`.

### 7.4 TDD ordering across a chained change (resolved)

Writing the whole harness in unit 3 would make its assertions arrive **green**, with no RED observation for units 1–2's behaviour — satisfying neither `strict_tdd: true` nor the purpose of the unit-4 gate. So:

- **Unit 1** opens `tokens.test.ts` with the token-layer assertions (A1–A2, A6, A9, A10): RED against the current tree (keys, parity, literals), green once unit 1 lands.
- **Unit 2** extends it with the state assertions (A7–A8, A11) and opens `theme-state.spec.ts` (state reads RED: no `:active` rules, no state tokens).
- **Unit 3 completes** the harness: `tests/support/contrast.ts`, the full POM, the forced-colors reads, the determinism assertion, A3–A5 and the exception list, the screenshot-absence assertion, and mode parity across all 21 keys. Its genuinely new assertions are RED on arrival (there are zero `forced-colors` blocks in the repo).
- **Unit 4's position stays fixed**: it may not start until unit 3's harness exists and is green.

---

## 8. Work-unit mapping, budget, rollout

| Unit | Contents (this design) | Estimated changed lines |
| --- | --- | --- |
| 1 — tokens/artifacts/docs | 21-key token block both modes; `--color-border-hover` rename with rendering-identical values; focus pair; radii/motion/shadow tokens; dead artifacts deleted (`.gradient-text`, `.text-muted`, `.btn-secondary`, `--color-surface-glass`); `.btn-primary:hover` opacity → `--color-accent-hover`; light `prefers-contrast` counterpart; reduced-motion guard relocation; `.claude/CLAUDE.md` corrections; the two-page `className` migration; `tokens.test.ts` opened RED | ~140–180 |
| 2 — state hardening | 13 `:active` rules; focus-ring consolidation (single 3px/5px declaration, portfolio duplicate deleted) plus the gated geometry edit; the hover-rule fixes; dark value raise (`--color-border-interactive` 0.34→0.40, dark toggle boundary); `forced-colors` block; reduced-motion list extension; `theme-state.spec.ts` opened RED | ~105–145 |
| 3 — harness | `tests/support/contrast.ts`, full `ThemeStatePage`, forced-colors + determinism + screenshot-absence assertions, A3–A5, exception list, parity completeness | ~260–330 |
| 4 — transition removal (last, gated) | universal rule deleted; per-selector tokenised transitions; `transition-contract.test.ts` | ~120–180 |

Every unit is independently revertable: unit 1 reverts to a tree with no new tokens and no rendering change; unit 2 reverts to the token layer with no state behaviour; unit 3 removes two test files; unit 4 restores the single universal rule. Rollback is per unit, never whole-change. `pnpm run verify` (build/typecheck/format/secret-scan) and `pnpm run test:e2e` (which rebuilds) stay the outer gates; static output, zero client-side JS, and no new dependency are preserved.

**Apply order and gates:** consent gate for §3.1 **before** unit 2's focus edit; unit 2 may not merge after unit 3's harness in the chain; unit 4 may not start until unit 3 is green.

---

## 9. Deviations from the proposal (explicit, for tasks/verify)

| Deviation | Why |
| --- | --- |
| `--color-success`, `--color-warning`, `--color-info` are **not added** | They have zero consumers today; declaring them would create three more consumerless keys, directly contradicting the `design-tokens` delta's "No Consumerless Tokens". Their correct landing point is the change that ships a surface that needs them (and then the exception list stays at the two danger keys). |
| `--color-on-surface` is **not added** | `--color-text` already is the on-surface foreground in both modes; a second key would be consumerless by construction. |
| `--color-danger` / `--color-on-danger` are **kept and exception-listed**, not wired or deleted | The delta prescribes exactly this; whether to wire or delete them is a follow-up decision. |
| Literal counts corrected | 16 `border-radius` declarations / 8 distinct values (not ~17); 7 distinct duration literals across 16 sites (not ~5); 5 shadow decisions. |
| **No `.tags span` repair is made** — this replaces the previous revision's `4.32:1 dark / 2.60:1 light` chip finding, which was **unreproducible** and is withdrawn in full | The withdrawn figure combined the *colour* of one selector with the *opacity* of another. The real values, both **passing AA** for 10.88 px (0.68 rem) text, measured separately per selector: **plain `.tags span`** (`portfolio.css:663-668`, `color: var(--color-text-secondary)`, and **no `opacity` in the rule at all**) = `#b7b8b3` on `--color-surface-alt` `#0d0d10` **9.72:1** dark / on `--color-surface` `#000000` **10.52:1** dark; `#6b5947` on `--color-surface-alt` `#fff7ea` **6.28:1** light / on `--color-surface` `#f3eadc` **5.60:1** light (worst case 5.60:1). **`.project-card--civic .tags span`** (`:761-765`, `color: currentColor` **and** `opacity: 0.62`; `currentColor` resolves through `.project-card--civic { color: var(--color-text) }`, `:738-745`) = `#ededeb` @62 % on `#0d0d10` **6.73:1** dark; `#17120d` @62 % on `--color-surface-elevated` `#fffdf6` **5.20:1** light. **Neither is a failure, so neither is repaired**, and the debt list gains nothing from them (the light `.tag` at 4.81:1 remains the only chip-adjacent debt the proposal records). |
| `--color-text-tertiary`'s justification is re-based on real measurements | Its only consumer is the light `prefers-contrast: more` de-attenuation (§5.1), where it replaces `opacity` — the one mechanism that cannot deliver "more contrast" — on the **real** attenuated body-text cases: `.about-copy p` (`opacity: 0.8`, `portfolio.css:839-843`) **5.76:1 dark / 4.61:1 light**; `.about-section h2 span` (`opacity: 0.66`, `:815-818`) **4.24:1 dark / 3.69:1 light** (large text via `clamp(3.2rem, 6vw, 6.4rem)`, so the 3:1 floor applies and passes); `.project-card--civic .project-number` / `> p` (`opacity: 0.65`, `:752-756`) **7.33:1 dark / 5.77:1 light**. All four pairings pass, so the token repairs none of them; it makes the tier expressible without `opacity`. The dark value `#7f7f7a` is kept **for mode key parity** (A1) and is likewise unread at rest. |
| `.card:hover` moves to `--color-border-strong` | Role correction, not a contrast claim; it is the one hover-only delta in unit 1 (dark 0.34 → 0.28, light 0.18 → 0.22). |
| Unit 3's specs are opened RED in units 1–2 | `strict_tdd: true` (§7.4). Unit 4's position is unchanged. |
| `--color-text-tertiary` is declared but has no **at-rest** consumer | It is consumed inside the light `prefers-contrast: more` block only. A3's consumer check is satisfied by that `var()` reference, and the token exists because the text scale needs a complete third tier; recorded here so the reviewer sees it is deliberate, not an oversight |

### 9.1 Figure provenance and corrections applied to this revision

Every ratio in this design is attributed below to the declarations that produce it, with the surface named. A row marked **corrected** could not be reproduced from a named selector in the previous revision and has been replaced by a measurement that can; a row marked **added** was not measured before; **withdrawn** means no selector produces the figure at all.

| Figure | Producing declarations (colour and opacity from the *same* selector) | Surface composited against | Status |
| --- | --- | --- | --- |
| **9.72 / 10.52 dark, 6.28 / 5.60 light** — plain chip | `.tags span { color: var(--color-text-secondary) }`, no `opacity` in the rule (`portfolio.css:663-668`) | `--color-surface-alt` (9.72 / 6.28) and `--color-surface` (10.52 / 5.60) | **corrected** — replaces the withdrawn `4.32 / 2.60` |
| **6.73 dark / 5.20 light** — civic chip | `.project-card--civic .tags span { color: currentColor; opacity: 0.62 }` (`:761-765`), `currentColor` → `.project-card--civic { color: var(--color-text) }` (`:738-745`) | `--color-surface-alt` dark, `--color-surface-elevated` light | **added** |
| **`4.32:1 dark / 2.60:1 light`** — chip | *none* — it is `--color-text-secondary` at 62 %, a colour from one rule and an opacity from another | — | **withdrawn** |
| `"the light base value`#746555`is consumed only here, so light default rendering is bit-identical"` | `#746555` is not equal to `#6b5947` (4.72:1 vs 5.60:1 on `--color-surface`; 5.52:1 vs 6.28:1 on `--color-surface-alt`) | — | **withdrawn** and restated in §5.1 as a real delta plus a real reason |
| **6.24:1 / 4.99:1** — `.btn-primary:hover` **before** | `.btn-primary { background: var(--color-accent); color: var(--color-on-accent) }` (`global.css:277-289`) + `.btn-primary:hover { opacity: 0.9 }` (`:290-292`), same selector | `--color-surface` (`#000000` / `#f3eadc`); it reads 6.28:1 on `--color-surface-alt` | **corrected** from 6.21:1, and the delta from −1.38 to −1.35 |
| **8.73:1 / 7.31:1** — `.btn-primary:hover` **after** | `.btn-primary:hover { background: var(--color-accent-hover) }` with `--color-on-accent` ink | the hover fill itself | unchanged |
| **8.05:1 / 5.51:1** — `--color-focus` | `--color-focus` ≡ `--color-accent` per mode (A9) | `--color-surface` | light **corrected** from 5.50 to 5.51 |
| **7.59:1 / 6.17:1** — `--color-on-focus` | `--color-on-focus` ≡ `--color-on-accent` per mode | `--color-accent` | unchanged |
| **4.82:1** — `--color-text-tertiary` light | the token value itself (no selector involved) | `--color-surface` — where the real value is **4.72:1** | **corrected** (the 4.82 was the *dark* tertiary on `--color-surface-alt`, copied across modes) |
| **5.22 / 4.82** — `--color-text-tertiary` dark | the token value itself | `--color-surface` / `--color-surface-alt` | unchanged |
| **5.76:1 / 4.61:1** — `.about-copy p` | `.about-copy p { color: currentColor; opacity: 0.8 }` (`:839-843`), `currentColor` → `.about-section { color: var(--color-on-accent); background: var(--color-accent) }` (`:794-799`) | `--color-accent` (the section fill) | **added** |
| **4.24:1 / 3.69:1** — `.about-section h2 span` | `.about-section h2 span { color: currentColor; opacity: 0.66 }` (`:815-818`) | `--color-accent` | **added** (agrees with the proposal's 4.24:1 dark debt entry) |
| **7.33:1 / 5.77:1** — `.project-card--civic .project-number` / `> p` | `color: currentColor; opacity: 0.65` (`:752-756`), `currentColor` → `var(--color-text)` | the civic card fill | **added** |
| **3.66 / 3.80 / 3.82** — `--color-border-interactive` at `0.40` | the token's alpha over each surface (the shipped `0.34` reads 2.89:1 on the canvas) | `--color-surface` / `-alt` / `-elevated` | unchanged; the `0.34 → 0.40` raise is the one dark at-rest delta here and carries **no** conformance claim |
| **6.48 / 6.45 / 6.28** — `--color-border-interactive-hover` at `0.56` | as above | as above | elevated **corrected** from 6.27 |
| **12.80:1 dark** — `--color-text` on `--color-surface-active` | the two token values | `--color-surface-active` | **corrected** from 12.81 |
| **1.44 / 2.27 / 2.89 / 1.52** — the border tokens | `--color-border` `0.16`, `--color-border-strong` `0.28`, `--color-border-hover` `0.34` (dark), `0.18`–`0.22` light | `--color-surface` (and `--color-surface-alt` for the 3.06 card case) | measured; no conformance claim — the Boundaries exemption covers the container roles and hover treatments are supplemental |
| **1.05:1 / 1.06:1** — the current hover tint | `.module-row:hover { background: color-mix(in srgb, var(--portfolio-yellow) 6%, transparent) }` (`:952-956`) | `--color-surface` / `--color-surface-alt` | **corrected** — replaces the withdrawn `ΔL\* ≈ 1.9` |
| **step sizes (new state steps and existing elevation levels)** | *no step figure is claimed by this document*; the elevation ΔL\* figures belong to the proposal and are not restated here | — | **removed** (A8 carries the ordering as measured inequalities) |
| **170 ms / 260 ms** hero delays | `calc(var(--motion-stagger) + var(--motion-hero-step))` and `calc(var(--motion-stagger) + var(--motion-hero-step) * 2)` | — | **corrected** — the second form doubles only `--motion-hero-step` |
| **`80ms` ×3 sites** | `portfolio.css:1167` + `:1190` | — | **corrected** to ×2 (the "16 sites / 7 literals" totals in §9 hold with ×2) |
| **16 radius declarations / 8 distinct values** | counted in `global.css` (6) + `portfolio.css` (10) | — | re-verified, unchanged |
| **`7` reduced-motion transform selectors**; **`portfolio.css:1520-1543`** | read off `portfolio.css:1535-1544` and the enclosing `@media` block | — | **corrected** to 8 selectors and to `:1520-1545` |

---

## 10. Risks this design introduces

| Risk | Mitigation |
| --- | --- |
| The `--color-border-hover` rename leaves a dangling `var()` in a file the sweep misses, rendering `currentColor` borders | Atomic rename in unit 1 (every consumer enumerated: `portfolio.css:117` `.desktop-nav .nav-contact`, `:784` `.circle-link`, `global.css:214` the dark `prefers-contrast` override, `:262` `.card:hover`, and `:309` inside the deleted `.btn-secondary`) + assertion A5 |
| Three state keys are declared in unit 1 and consumed in unit 2, so unit 1's diff alone shows consumerless keys | Documented in the design and in unit 1's PR description; A3–A4 land in unit 3, and the chain merges in order, so the final tree satisfies "No Consumerless Tokens" |
| Dark interactive borders brighten at rest (toggles `--color-border` `0.16` → `--color-border-interactive` `0.40`; `.desktop-nav .nav-contact` and `.circle-link` `0.34` → `0.40`) | Measured, so the reviewer can see the whole delta: toggles 1.44:1 → **3.66:1** on `--color-surface`; nav pill and circle link 2.89:1 → **3.66:1** (on `--color-surface-alt`, 3.06:1 → 3.80:1). Both old values are recorded as the **shipped appearances the raise replaces**, with no conformance claim attached: the container-border roles are Boundary-exempt, the interactive border carries visible-text controls so 3:1 is not required, and the dark ≥3:1 floor in §1.1 is self-imposed. Enumerated as the only intended at-rest dark deltas, kept out of unit 1, and listed in the PR description; no light at-rest value moves. |
| The universal transition's removal (unit 4) exposes hovers that only looked smooth because of it | Unit 4 is last, gated on the harness, and ships explicit tokenised transitions plus its own RED-first contract test |
| Hand-computed ratios drift from a browser's after the token change | Assertion A7 pins them; the e2e reads the composited chain; apply must re-derive and re-confirm visually before merge |
| The e2e verdict depends on the reduced-motion guard living in `global.css` | The relocation is structural (D8) and the harness asserts the guard is effective |

## 11. Open questions

- [ ] The §3.1 consent gate outcome (consent → remove the declaration and `--radius-focus`; refusal → accepted debt + dark-scoped e2e assertion).
- [ ] Whether the two dead danger tokens are wired or deleted (recorded as a follow-up decision, not this change).
- [ ] Whether `.site-header`'s glass should be dark-opaque (the proposal and explore both flag it; this design changes nothing about it and documents the coupling).
