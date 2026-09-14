# Explore: Dark ("OLED") Theme Hardening

## Context

Follow-up to `dual-theme-design-system` (shipped), `responsive-color-hardening` (shipped), `scroll-motion-polish` (shipped) and `project-hardening` (404 e2e spec phase complete). The user's reported bug — a washed-out "pale orange" dark accent — is **already fixed and shipped** (`--color-accent` `#e6b795` → `#ff7a18`, commit `72d98f2`) and is explicitly *not* in scope here. It is context, not a work item.

This change exists to harden the dark theme's *state* and *system* layers: what the tokens do under hover/focus/active, what happens in forced-colors and reduced-motion, where the two CSS files disagree, and which artifacts are dead. An audit hypothesis list (12 items, supplied by the orchestrator) is verified below: **7 confirmed, 3 confirmed-with-correction, 1 refuted in half, 1 refuted outright**. Two additional findings not on the list are recorded, plus one hypothesis the orchestrator did not raise that turned out to be false when checked.

## Current State (verified against live code)

Static analysis only. **No browser/rendering tool and no shell are available in this session** (toolset is read/grep/write), so every contrast figure below is hand-computed with the WCAG 2.x relative-luminance formula, and no claim about rendered pixels is made. CodeGraph was not used: `.codegraph/` does not exist in this checkout and no shell is available to initialize or query it; this is a CSS/DOM text audit where a symbol index carries no information. The working tree is the source of truth below (no git history was consulted).

### Files and sizes (for review-size forecasting)

| File | Lines | Why it matters here |
| --- | --- | --- |
| `src/styles/portfolio.css` | **1546** | Second token source (`--portfolio-yellow*`, `--motion-*`), all radii/shadow/duration literals, the only `prefers-reduced-motion` block, glass header |
| `src/pages/index.astro` | 526 | ~20 `data-reveal` targets, all landing-page markup |
| `src/styles/global.css` | **336** | `@theme` + light overrides, base typography, utilities, `prefers-contrast: more` (dark only), OLED card-edge block |
| `src/layouts/BaseLayout.astro` | 202 | `theme-color` meta, theme-init script tag, reveal JS (all pages) |
| `src/pages/projects/[id].astro` | 175 | The only `.card` / `.tag` / `.section-label` / `.stat-number` consumer |
| `README.md` | 152 | Token description |
| `src/components/ui/Navbar.astro` | 139 | **Imports `portfolio.css`** — this is why `portfolio.css` loads on every page; toggle JS + duplicated theme colours |
| `.claude/CLAUDE.md` | 137 | "no glassmorphism" claim, `systems.ts` claim |
| `src/pages/projects/index.astro` | 63 | Imports `portfolio.css` directly |
| `public/theme-init.js` | 40 | Pre-paint theme + `theme-color` sync |
| `src/pages/404.astro` | 33 | `.btn-primary` consumer |

Test suite today: `tests/unit/*.test.ts` = 15 green (node:test, imports TS lib modules only — `analytics`, `astro-mode`); `tests/` e2e = 20 green (Playwright chromium, Page Object Model: `base-page.ts`, `home/`, `404/`, `projects/`, `project-detail/`).

### Cascade and layering facts (these decide several verdicts below)

1. `global.css` puts its base rules inside `@layer base` (and utilities in `@layer utilities`). `portfolio.css` is **entirely unlayered**. In CSS Cascade 5, *unlayered author rules beat layered author rules* — the layer step runs **before** specificity. So any equal-`property` collision between the two files resolves to `portfolio.css`, regardless of import order and regardless of specificity.
2. `portfolio.css` is imported by `Navbar.astro:4`, and `Navbar.astro` is imported by all four page types (`index.astro`, `404.astro`, `projects/index.astro`, `projects/[id].astro`). **`portfolio.css` is therefore loaded on every page**, even though only `index.astro` and `projects/index.astro` import it directly. This single fact refutes half of hypothesis 12 and neutralises half of hypothesis 1.
3. `global.css`'s OLED block (lines ~193–207) and both `prefers-contrast: more` blocks (lines 178, 209) are **outside any `@layer`**, so they beat every layered rule in `global.css` too.

### Token inventory and parity (hypothesis 8's "parity" question)

`@theme` (dark, the default) defines **14** colour tokens; `[data-theme="light"]` overrides **exactly the same 14 keys**. Verified key-by-key: `surface, surface-alt, surface-elevated, surface-glass, text, text-secondary, accent, accent-muted, on-accent, border, border-hover, border-strong, danger, on-danger`. **Parity holds exactly: 14/14, zero asymmetry.** The orchestrator's measurement is confirmed.

But parity of *keys* is not parity of *values* or of *use*:

- **3 of the 14 are consumer-dead in both modes**: `--color-surface-glass` (2 definitions, zero consumers — the prior change's `apply-progress.md` claims it was applied to a `#ffffff04` hover tint, but no such consumer exists in the tree now), `--color-danger`, `--color-on-danger` (2 definitions each, zero consumers anywhere in `src/`). Live colour roles: **11**.
- Non-colour tokens (`--font-*`, `--space-*`, `--text-*`) are mode-independent and not part of this count.
- **No** `--color-focus`, `--color-on-focus`, `--color-on-surface`, `--color-success`, `--color-warning`, `--color-info`, `--color-text-tertiary` exists. Focus is expressed as `--color-accent` directly, which is why no "on-focus" pair can exist today.

## Verification of the 12 supplied hypotheses

| # | Claim | Verdict |
| --- | --- | --- |
| 1 | Hover via `opacity` degrades contrast | **Confirmed numerically; the link half is dead code** |
| 2 | `--color-border-hover` misses 3:1, surface-dependent | **Confirmed (2.89:1, not 2.91), plus a light-mode value twice as bad** |
| 3 | Elevation steps too subtle | **Confirmed exactly (ΔL\* 3.71 / 4.23)** |
| 4 | Zero `:active` states | **Confirmed** (zero matches repo-wide) |
| 5 | Three competing focus rings | **Partly confirmed, needs reframing** (2 widths + 1 legitimate inverse variant + a radius mutation) |
| 6 | Two motion systems + universal transition | **Confirmed**, and sharper than stated |
| 7 | No radius/shadow/duration/easing tokens | **Confirmed**, inventory below |
| 8 | Missing semantic roles | **Confirmed**, and extended: two shipped roles are dead, and one is misnamed vs its own spec |
| 9 | No `forced-colors` support | **Confirmed**, plus no `prefers-reduced-transparency` |
| 10 | Dead `--color-surface-glass`, dead `.gradient-text` with `#0055aa` | **Confirmed both** |
| 11 | Docs contradict code (glassmorphism; `systems.ts`) | **Half confirmed: `.claude/CLAUDE.md` yes, `README.md` no** |
| 12 | `prefers-contrast` dark-only; reduced-motion guard only in 2-of-4-page CSS | **First half confirmed; second half refuted (all-pages coverage, but by accident)** |

### 1. Hover via `opacity` — confirmed, but one of the two sites is dead

Both selectors exist exactly as stated. `global.css` `@layer base`: `a:hover { opacity: 0.8 }` and `@layer utilities`: `.btn-primary:hover { opacity: 0.9 }`.

Measured (hand-computed, sRGB alpha compositing):

| State | Dark | Light |
| --- | --- | --- |
| `a` at rest: accent `#ff7a18` on `#000000` | **8.05:1** | 5.51:1 (`#8a4e26` on `#f3eadc`) |
| `a:hover` at 0.8 → 5.31:1 | **5.31:1** (−2.74) | — |
| `.btn-primary` label `#0a0a0a` on `#ff7a18` | **7.59:1** | 6.17:1 |
| `.btn-primary:hover` at 0.9 over the canvas | **6.24:1** (−1.35) | 4.99:1 (−1.18) |

So the orchestrator's 5.32 and 6.23 reproduce as **5.31** and **6.24**.

**The correction that matters:** `a:hover { opacity: 0.8 }` is **dead in every page type**. `portfolio.css:26–28` declares the unlayered `a:hover { opacity: 1 }`, and unlayered beats `@layer base` (fact 1 above). `portfolio.css` is on every page (fact 2). The only live opacity-hover degradation is `.btn-primary:hover`, which is used on `404.astro:26` and `projects/[id].astro:156,165` — and it still clears AA (6.24:1 dark / 4.99:1 light), so this is an anti-pattern and a thin margin, **not a current WCAG failure**.

The pattern is nonetheless systemic, which is the finding worth keeping: **hover states on this site systematically reduce contrast.** `.quiet-link:hover` and `.project-links a:hover` swap `--color-text` (**17.9:1** on black) for `--color-accent` (**8.05:1**) — a −9.9 swing on the site's primary link hover. Fixing only the two `opacity` rules would leave the pattern in place.

### 2. `--color-border-hover` and the 3:1 UI threshold — confirmed, surface-dependent, worse in light

`--color-border-hover` is `rgba(255,255,255,0.34)` in dark, `rgba(0,0,0,0.18)` in light.

| Compositing surface | Ratio |
| --- | --- |
| dark, over `--color-surface` `#000000` | **2.89:1** (orchestrator said 2.91 — the delta is rounding, the conclusion holds) |
| dark, over `--color-surface-alt` `#0d0d10` (cards) | **3.06:1** |
| dark, over `--color-surface-elevated` `#17171c` | 3.10:1 |
| light, over `--color-surface` `#f3eadc` | **1.52:1** |

Surface dependence is real and is enough to flip the result: the *same token* passes on a card and fails on the canvas. Live consumers: `.desktop-nav .nav-contact` border (sits on the glass header ≈ canvas → **2.89:1**), `.circle-link` border (sits on `--color-surface-alt` in the two compact cards → 3.06:1), `.btn-secondary:hover` (**dead class**, see below), `.card:hover` (card surface → 3.06:1), and the `prefers-contrast: more` override that reassigns `.tags span`, `.module-row`, `.principles article`, `.compact-image` borders to this token.

**Sharpening for the proposal:** a strict WCAG 2.2 §1.4.11 "3:1 for a state indicator" rule fails in **both** themes (light is at 1.52:1), and repairing light mode would violate the stated non-goal "the light theme's appearance must not change". Two other dark-only non-text-contrast numbers belong in the same conversation, and the hypothesis list missed them:

- `--color-border` `rgba(255,255,255,0.16)` on the black canvas = **1.44:1** — this is the border of the `.card` panels used six times on `projects/[id].astro`, which are **not** covered by the dark OLED card-edge override (that override names only `.project-card`, `.compact-image`, `.tags span`). Project-detail panels are the weakest boundary on the site.
- `--color-border-strong` `rgba(255,255,255,0.28)` = **2.27:1** on canvas / **2.44:1** on cards. This is the token that *exists* to make OLED card edges legible (design doc: "drop shadows vanish on pure black") — and it is still under 3:1. Since card backgrounds differ from the canvas by only 1.08:1 (§3), the border is the card's primary identifying signal in dark mode. Whether a decorative card container needs 3:1 under §1.4.11 is an interpretation call; the proposal should state which side it takes rather than leave it implicit.

### 3. Elevation steps — confirmed exactly

`ΔL*` (CIE L\*, from relative luminance): canvas `#000000` L\* = 0.00 → cards `#0d0d10` L\* = 3.71 → overlays `#17171c` L\* = 7.94. So **canvas→cards 3.71** and **cards→overlays 4.23**, reproducing the audit's numbers to two decimals. In contrast-ratio terms the steps are 1.08:1 and 1.09:1 respectively (canvas→elevated = 1.18:1).

There is **no normative WCAG threshold for elevation** — this must not be presented as a standards violation. It is a perceptual judgment: a ΔL\* below roughly 5 is commonly treated as a subtle rather than a clearly distinct step. The honest framing is "elevation in dark mode is carried almost entirely by borders and a 4% inset highlight, not by luminance", which is consistent with the existing OLED comment in `global.css` and with the border finding in §2.

### 4. Zero `:active` / pressed states — confirmed

`grep -n ":active"` across `src/` and `public/`: **zero matches**. Every interactive element — `.theme-toggle`, `.menu-toggle`, `.solid-link`, `.quiet-link`, `.circle-link`, `.project-links a`, `.desktop-nav a`, `.nav-contact`, `.mobile-nav a`, `.site-footer a`, `.module-row`, `.contact-social a` — has rest/hover/focus only. On touch, `:hover` is sticky and there is no press feedback at all. This is the single largest *coverage* gap in the dark theme and it is purely additive CSS (no markup change, no JS, no light-mode appearance change if scoped/consistent).

### 5. Focus rings — reframed

Actual inventory:

| Definition | Where | Value |
| --- | --- | --- |
| `:focus-visible` | `global.css` `@layer base`, ~L112 | `outline: 2px solid var(--color-accent)`; `offset: 2px`; **`border-radius: 4px`** |
| `a:focus-visible, button:focus-visible` | `portfolio.css`, unlayered, L29 | `outline: 3px solid var(--portfolio-yellow)`; `offset: 5px` |
| `.about-section a:focus-visible, .contact-section a:focus-visible` | `portfolio.css`, unlayered, L33 | `outline-color: var(--portfolio-yellow-ink)` |

So it is not three competing rings so much as **one ring in two sizes depending on element type**, plus one colour variant that is *correct and must be preserved*: on the accent-filled `.about-section`/`.contact-section`, the ring must be the ink colour (`#0a0a0a` on `#ff7a18` = 7.59:1 dark, `#fff7ea` on `#8a4e26` = 6.17:1 light), because the accent ring on an accent background would be 1:1. Both ring colours do meet 3:1 where they are used, so this is a consistency/maintainability defect, not a contrast failure.

The genuine defect the audit did not name: **`:focus-visible { border-radius: 4px }` mutates element geometry on focus.** For `.btn-primary`/`.tag`/`.card` the utilities layer wins; for `.nav-contact`/`.circle-link`/`.theme-toggle` the unlayered `portfolio.css` wins; but for every *plain* focusable link and button (`portfolio.css:29` sets `outline` but no `border-radius`) the base rule applies, so focusing them adds a 4px corner radius that is absent at rest — a visible shape change on focus, and the reason ring corner rounding is inconsistent between element types. Also note `portfolio.css:29` is a single `outline` shorthand that silently overrides the base `outline-offset`.

### 6. Two motion systems — confirmed, and sharper than stated

- `portfolio.css:6–8` defines `--motion-fast: 180ms`, `--motion-reveal: 640ms`, `--motion-ease: cubic-bezier(0.16, 1, 0.3, 1)`. `global.css` defines **no** `--motion-*` token at all.
- `global.css` hardcodes durations: the universal `*, *::before, *::after { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.2s ease }` in `@layer base`, plus `a { transition: opacity 0.2s ease }`, `.card { … 0.3s ease, … 0.2s ease }`, `.btn-primary { transition: opacity 0.2s }`, `.btn-secondary { transition: border-color 0.2s }`.
- `portfolio.css` is **not internally pure either**: `transition: transform 350ms var(--motion-ease)` appears twice (L580, L726) — an easing token with a literal duration. Stagger/delay literals `80ms`, `160ms`, `170ms`, `260ms` exist only in `portfolio.css`.
- The universal transition is real and it is the broadest behavioural risk: it transitions `background-color`/`border-color`/`color` on *every* element including ones inside `color-mix()` surfaces, and it is the reason a hover tint can appear to "fade" anywhere on the site. It is not in the `prefers-reduced-motion` opt-out list *by name* — it is only neutralised because `portfolio.css`'s guard uses `* { transition: none !important }` (see §12).

### 7. No radius/shadow/duration/easing tokens — confirmed

No `--radius*`, `--shadow*`, `--duration*`, or `--ease*` exists. `--motion-ease` is the only easing token and lives in `portfolio.css`, not `global.css`.

Radius literals, full inventory: `global.css` — `4px` (focus ring), `3px` (scrollbar thumb), `1rem` (`.card`), `999px` (`.tag`), `0.5rem` ×2 (buttons); `portfolio.css` — `999px` (`.nav-contact`), `2px` (`.solid-link`), `48% 48% 8px 8px` (`.hero-portrait::before`), `50%` ×7 (`.theme-toggle`, `.menu-toggle`, `.portrait-orbit`, `.profile-card` children, `.principle-icon`, `.circle-link`, `.module-icon`). **17 declarations, 8 distinct values, one pair that is semantically the same role (`999px` pill) declared twice in different files.**

Shadow literals, full inventory: `global.css` — `inset 0 1px 0 rgba(255,255,255,0.04)` (dark OLED edges), `0 34px 80px rgba(0,0,0,0.75) + inset 0 1px 0 rgba(255,255,255,0.05)` (`.profile-card`, dark-only); `portfolio.css` — `0 34px 80px #0003` (`.profile-card`, overridden in dark), `inset 0 0 0 1px #fff2` (`.profile-portrait::after`), `0 24px 48px #0006` (`.project-image img`). Three files-worth of shadow decisions with no token, and the light-mode `#fff2` inset ring is a leftover from the pre-theme palette (harmless today, but it is an untokenised white overlay that no light-mode review has ever looked at).

### 8. Missing semantic roles — confirmed and extended

Missing: `--color-success`, `--color-warning`, `--color-info`, `--color-text-tertiary`, `--color-on-surface`, `--color-focus`/`--color-on-focus`. The spec requirement in `dual-theme-design-system/specs/design-tokens/spec.md:17` ("Token Categories and Semantic Pairs") names `on_surface`, `on_accent`, `on_error`, `on_focus`; shipped are `--color-on-accent` and `--color-on-danger` only — and the spec's `on_error` was implemented under the name `on-danger`, so even the shipped pair does not match the requirement's vocabulary. `--color-danger`/`--color-on-danger` have **zero consumers**, so the one semantic pair that did ship is dead.

The absence of `--color-text-tertiary` is currently worked around with opacity (`.project-card--civic .project-number, > p { opacity: 0.65 }`, `.tags span { opacity: 0.62 }`, `.about-copy p { opacity: 0.8 }`, `.about-section h2 span { opacity: 0.66 }`) — which is exactly the degradation mechanism the audit flagged in §1, applied to static text instead of hover.

Those static cases were checked and are **not** AA failures, but one margin is thin enough to name: `.about-section h2 span { opacity: 0.66 }` over `--color-accent` computes to **4.24:1** (dark). The span renders inside `h2 { font-size: clamp(3.2rem, 6vw, 6.4rem) }`, so it qualifies as large text (3:1) — but it sits 0.76 below the body-text floor, i.e. it is only safe because of the size. `.about-copy p { opacity: 0.8 }` = 5.74:1; the civic card's `.tags span { opacity: 0.62 }` = 6.72:1 dark / 5.75:1 light; `.tag` (`--color-accent-muted` background) = 7.50:1 dark / **4.81:1 light** (0.31 of margin).

### 9. `forced-colors` — confirmed

Zero matches for `forced-colors`, `forced-color-adjust`, or `prefers-reduced-transparency` across `src/` and `public/`. `[data-theme="dark"] { color-scheme: dark }` **is** present, which is the correct prerequisite and means the OS-level dark/light pairing is not broken; what is missing is the forced-colors layer on top of it.

Concrete consequence, stated carefully (no rendering available to confirm visually): in forced-colors mode the UA forces `color`, `background-color`, `border-color`, `outline-color`, `fill`, `stroke`. The site's *text* remains legible (forced contrast is high) and the focus ring survives (outline-color is forced to a system colour). What silently disappears is every **non-colour-free state signal**: `.module-row:hover { background: color-mix(...) }`, `.tags span`/`.principles article` borders, `.card:hover { border-color: … }`, `.nav-contact:hover` fill swap, `.solid-link:hover { background: transparent }`. Those states have no border/outline/text-decoration fallback, so in forced-colors mode a hovered row and a resting row are identical. Combined with §4 (no `:active` at all), all state feedback on the site is colour-only. A `@media (forced-colors: active)` block adding a non-colour signal is the standard remedy and is verifiable in Playwright (`page.emulateMedia({ forcedColors: "active" })`).

### 10. Dead artifacts — confirmed, both

- `--color-surface-glass`: defined at `global.css:14` (dark) and `:56` (light), **zero consumers** anywhere in `src/` or `public/`. (The prior change's `apply-progress.md:76` records applying it to a `#ffffff04` tint; no such consumer survives in the tree.)
- `.gradient-text`: defined at `global.css:233`, **zero consumers** in any `.astro` file, and still carries `linear-gradient(135deg, var(--color-accent), #0055aa)` — a hardcoded blue from the deleted cyan palette, i.e. a literal that would render a blue-violet fade into the light theme if the class were ever used.

Additional dead code found while checking, same class: **`.btn-secondary`** (defined `global.css:295,308`, zero consumers), **`.text-muted`** (`global.css:240`, zero consumers), `--color-danger`/`--color-on-danger` (§8). Also `@custom-variant dark (...)` is declared at `global.css:2` and **no `dark:` utility is used anywhere in `src/`** — it is preserved for Tailwind-4 correctness (and its spec requirement) but currently exercises nothing.

### 11. Docs contradict code — half confirmed

**Confirmed:** `.claude/CLAUDE.md:44` states "Dual theme (dark default, light opt-in), **no glassmorphism**", while `portfolio.css:74–80` styles `.site-header` with `background: color-mix(in srgb, var(--color-surface) 89%, transparent); backdrop-filter: blur(18px)`. That is glassmorphism, by any reasonable reading. The docs are wrong, not the CSS. Related: `backdrop-filter` is not gated by any `prefers-reduced-transparency` query (there is none — §9) and in dark mode the effect is nearly invisible (89% opaque black over black is black), so the header is effectively opaque everywhere on OLED while costing a compositing layer.

**Confirmed:** `.claude/CLAUDE.md:36` lists `src/data/ # projects.json, systems.ts`. `src/data/` contains only `projects.json`; `systems.ts` was deleted in `db4ddd0` and is referenced nowhere.

**Refuted:** `README.md` does **not** carry a "no glassmorphism" claim. `README.md:36` describes the dark tokens accurately (pure-black surface, `#0d0d10`/`#17171c` layers, accent `#ff7a18`, light overrides `#f3eadc`/`#8a4e26`, and "El modo oscuro respeta `prefers-contrast: more`" — which is literally true given §12). The README's only drift in this area is that it does not mention the missing `:active`/forced-colors coverage, which is an omission, not a contradiction. **The orchestrator's claim that both README and CLAUDE.md are wrong is incorrect for README**; only `.claude/CLAUDE.md` needs correcting, and the new change should say so to avoid rewriting a correct file.

### 12. `prefers-contrast` and `prefers-reduced-motion` placement — first half confirmed, second half refuted

**Confirmed:** both `@media (prefers-contrast: more)` blocks (`global.css:178`, `:209`) are scoped to `[data-theme="dark"]`. There is no light-mode equivalent, and no `prefers-contrast: less`/`custom` handling at all. Because a `prefers-contrast` block only takes effect when the *user* asks for it, adding a light-mode counterpart would **not** change the light theme's default appearance — it is compatible with the non-goal, unlike the border-token repair in §2. That distinction should be made explicitly in the proposal, because those two items look alike and are not.

**Refuted:** the hypothesis that the reduced-motion guard "only 2 of 4 pages import". `portfolio.css` is imported by `Navbar.astro:4`, and all four page types render `Navbar`; Astro hoists component CSS imports to the page bundle. So `@media (prefers-reduced-motion: reduce)` (`portfolio.css:1520`) — with its `* { animation: none !important; transition: none !important }` — currently reaches **all four page types**. The structural point behind the hypothesis survives, though: the guard lives in the *layout* file and only covers the page because of an incidental component import. `global.css`'s own `html { scroll-behavior: smooth }` and its universal transition have **no guard of their own**; they are neutralised only by that unrelated file. If a future change drops the `portfolio.css` import from `Navbar.astro`, dark mode loses reduced-motion support site-wide with no test to catch it. Relocating (or duplicating) the guard into `global.css` is a zero-visual-delta hardening item.

## Additional findings not on the hypothesis list

1. **`.site-header`'s glass has no dark-mode rationale and one dark-mode cost.** In dark mode `color-mix(surface 89%, transparent)` over a pure-black canvas is indistinguishable from opaque black, so the blur is decorative-only there while forcing a backdrop-compositing layer on a fixed header; in light mode it visibly tints. Any hardening that wants a real "OLED" story should decide whether the header is opaque in dark and glass in light, or document why it stays. This interacts with §11 (docs) — currently the docs and the CSS disagree about whether glassmorphism exists at all.
2. **Theme colours are duplicated in three files outside the token layer.** `#000000`/`#f3eadc` appear as literals in `BaseLayout.astro:102` (`<meta name="theme-color" content="#000000">`), `public/theme-init.js:13–14`, and `Navbar.astro:85`. All three are consistent today and the sync works (see the refuted hypothesis below), but a token change in `global.css` cannot reach them. This is the only place where the dark canvas literal escapes CSS, and it belongs in the hardening scope as a documented constraint rather than a surprise during apply.
3. **`prefers-reduced-motion` is honoured in JS as well as CSS** (`BaseLayout.astro:150–160` skips `IntersectionObserver` setup entirely and never adds `motion-ready`), which is correct and should be preserved — any new state/animation work must not bypass it.

## A hypothesis the audit did not raise — checked and refuted

**`theme-color` is not stale in light mode.** I expected to find that `<meta name="theme-color" content="#000000">` stays black after switching to light. It does not: `public/theme-init.js:35–38` rewrites `content` to the light value before paint, and `Navbar.astro:80–86` rewrites it again on every toggle. The static `#000000` in `BaseLayout.astro` is only the inert pre-JS default, and it matches the dark default, so it is correct. The `dual-theme-design-system` `theme-toggle` spec's "Theme-Color Meta Sync" requirement is **satisfied** — it must not be superseded.

## Supersession target — precise

**File:** `openspec/changes/dual-theme-design-system/specs/design-tokens/spec.md`, requirement **"Dark Theme Values Preserved"** (lines 33–40).

It is now factually false in its normative text *and* in its scenario:

| Spec asserts | Reality |
| --- | --- |
| dark `--color-accent` is `#dda783` | `#ff7a18` (`global.css:20`) |
| dark `--color-surface` is `#080909` | `#000000` (`global.css:11`) |
| measured contrast ≥ 9.5:1 | `#ff7a18` on `#000000` = **8.05:1** |
| "these values MUST NOT be re-derived" | both were re-derived, deliberately |

All three literals plus the ratio are false, so the new change can declare supersession of that whole requirement (not just a value), citing commit `72d98f2` for the accent and the pure-black OLED move for the surface.

Two adjacent requirements should be handled differently and the proposal should say so explicitly:

- **"Token Categories and Semantic Pairs"** (line 17) — not false about what exists, but `on_surface` and `on_focus` never shipped (and `on_focus` cannot exist without a `--color-focus` token), `on_error` shipped as `on-danger`, and both danger tokens are dead. This is a **partial supersession / extension**, best modelled as a new requirement in the new change rather than a rewrite of the old one.
- **"WCAG 2.1 AA Contrast Guardrails"** (line 50) — **not false**. Every static pairing in both modes was recomputed and passes (§ values above). It is silent about *state* contrast (hover/focus/active) and about non-text/UI contrast, which is exactly what §1/§2/§5 deliver. Extend it; do not supersede it.
- **`theme-toggle` spec "Theme-Color Meta Sync"** — satisfied; do not touch.

There is no `openspec/specs/` or `openspec/archive/` directory in this repo, so supersession must be declared as a reference between change specs (the pattern the other four changes already use).

## Test feasibility — honest assessment

Short answer: **a token-contract unit test is straightforward and genuinely valuable; an e2e computed-style contrast test is realistic and deterministic but approximate; screenshot diffing should not be attempted.**

**Unit (`pnpm run test:unit`, node:test with `--experimental-strip-types`, 15 green today).** Feasible with zero new dependencies: read `src/styles/global.css` with `node:fs`, extract the `@theme` block and the `[data-theme="light"]` block with a targeted regex per token key, and assert (a) key parity between modes, (b) no dead tokens (each declared token appears in at least one `src/**` consumer), (c) contrast ratios for the raw literals via a ~30-line relative-luminance + alpha-composite helper. This is *new capability* — the two existing unit files test pure TS functions, never a stylesheet — but it is the kind of capability `strict_tdd: true` wants: it turns each §1/§2/§8 claim into a RED→GREEN assertion and it fails loudly if someone re-introduces `#dda783` or an unpaired token. **Honest limitation:** a regex-based test can only read *declared literals*. Values produced by `color-mix()` (`--color-accent-muted`'s consumers, `.module-row:hover`, `.principles` borders) cannot be resolved without a CSS engine, so those pairings must be asserted as "token X is composed from token Y with fraction Z" rather than as a contrast number.

**E2E (Playwright chromium, 20 green today).** `getComputedStyle` readback is realistic and deterministic for this codebase because the CSS is static and the values in question do not depend on fonts. `page.emulateMedia({ reducedMotion: "reduce" })` is a genuinely useful lever *specific to this repo*: the existing reduced-motion guard sets `transition: none !important` on everything, so hover/focus reads become instantaneous instead of racing a 180–300ms transition. Focus rings are readable by pressing Tab and reading `outline-width`/`outline-color`; forced-colors is readable via `page.emulateMedia({ forcedColors: "active" })`. **Honest limitations:** (a) `getComputedStyle` returns the element's own colour *with alpha*, never the composited result, so the test must composite against the resolved ancestor background itself — the assertion verifies "tokens resolve and the composed math passes", not "pixels look right"; (b) `hover`/`:active` verification for `.btn-primary:hover` is a real browser-state test but it pins one Chromium version's behaviour; (c) there is currently **no** `toHaveScreenshot` baseline anywhere in `tests/`, and introducing one would add cross-platform flakiness to a project whose whole selling point is a 20-spec deterministic suite. Recommend against screenshot diffing.

## Approaches

1. **Token-layer-only hardening** — add the missing tokens (`--radius-*`, `--shadow-*`, `--motion-*`, `--color-focus`/`--color-on-focus`, `--color-text-tertiary`), define them for both modes, replace the ~17 radius and ~5 duration literals in the two CSS files with tokens, delete the dead artifacts (`.gradient-text`, `.text-muted`, `.btn-secondary`, `--color-surface-glass`) and correct `.claude/CLAUDE.md`. Effort: Medium. Low visual risk. Leaves every *state* gap (§1, §4, §5, §9) open, which is what the user is actually asking to be hardened.
2. **Token layer + state hardening + verification harness (recommended)** — approach 1, plus: explicit hover colours replacing `opacity` on the live `.btn-primary:hover` (and unify the accent-swap hover pattern), `:active` states for the 12–14 interactive selectors, focus-ring unification (one width/offset, no `border-radius` mutation, preserved ink variant on accent sections), `@media (forced-colors: active)` non-colour state signals, relocation/duplication of the reduced-motion guard into `global.css`, a light-mode `prefers-contrast: more` counterpart, and the new unit + e2e verification specs. Effort: Medium-High, and it will exceed the 400-line review budget as a single unit.
3. **Approach 2 minus light mode entirely** — same, but every new rule scoped to `[data-theme="dark"]` (except `prefers-contrast`/`forced-colors`/reduced-motion guards, which are user-preference-gated and therefore safe). Effort: Medium-High. Strictly obeys the "light theme must not change" non-goal, at the cost of leaving the light-mode 1.52:1 border, the 4.81:1 `.tag` margin and the 4.99:1 light hover documented-but-untouched.

## Recommendation

Approach 2 for the *system* work, with Approach 3's scoping discipline for anything that would alter light mode's **default** appearance. Concretely, that means: dark-scoped value changes; user-preference-gated blocks (`prefers-contrast`, `forced-colors`, `prefers-reduced-motion`) may cover both modes because they cannot change the default look; and the light-mode findings in §2/§8 are recorded as known-and-accepted rather than silently fixed or silently dropped.

Slice into three work units so each lands under the 400-line review budget:

1. **Tokens + dead artifacts + docs** — new token categories and both-mode values in `global.css`, literal→token replacement in `portfolio.css`, delete the four dead artifacts, correct the two wrong claims in `.claude/CLAUDE.md` (glassmorphism, `systems.ts`) and add the light-mode `prefers-contrast: more` counterpart + relocated reduced-motion guard. Small and reviewable on its own; no visible change except the `prefers-contrast` case.
2. **State hardening** — `:active` for all interactive selectors, hover contrast fixes, focus-ring unification, `forced-colors` block. The only unit with real visual delta, and it is dark-scoped.
3. **Verification harness** — `tests/unit/tokens.test.ts` (parity, dead-token, contrast contract) plus an e2e state/contrast spec with a page object, using the reduced-motion context trick. Written RED-first to satisfy `strict_tdd`.

## Non-goals (recorded, not to be re-litigated)

- **Not a visual redesign.** The light theme's default appearance must not change.
- **Not re-litigating the accent colour.** `#ff7a18` shipped in `72d98f2`; the superseded spec value is documented above as history, not reopened.
- **No new runtime dependency.** Static output must be preserved; the verification work uses `node:test` and the already-installed Playwright only.
- Also out of scope by precedent from the prior two changes: the orphaned React-era components, the `docs/` tree rewrite (owned by `project-hardening`), and any layout/responsive change (owned by `responsive-color-hardening`).

## Risks and open questions

- **No browser in this session.** Every contrast number here is hand-computed; the *relative ordering* and the arithmetic are reliable, but the apply phase should re-derive the final numbers after the tokens change and confirm hover/focus/forced-colors behaviour visually before merge. The e2e spec in unit 3 is the durable substitute for the missing browser, not a formality.
- **`--color-border-hover` vs the 3:1 rule is an interpretation call that spans both themes** (dark 2.89:1 canvas / 3.06:1 cards; light 1.52:1). If the proposal adopts a strict non-text-contrast requirement, it must either scope it to dark interactive component boundaries or accept that it cannot be met in light mode without violating the non-goal. **This is the one decision I would put to the human before design**, because it determines whether the change is dark-scoped or whole-theme.
- **`border-radius: 4px` on `:focus-visible`** may be load-bearing for something I could not see without rendering (it rounds the ring on plain links). Removing it changes the focus ring's shape on those elements — cosmetic, but it is a visible delta in the light theme too, so it needs an explicit yes/no rather than a silent cleanup.
- **The universal `*, *::before, *::after` transition** cannot be removed without re-verifying the theme-toggle cross-fade and every hover where `portfolio.css` does not already declare its own `transition`. Replacing it with explicit per-selector transitions is correct but touches many selectors; if it is deferred, say so in the proposal rather than leaving it half-done.
- **Colour literals outside CSS** (`theme-init.js`, `Navbar.astro`, `BaseLayout.astro`) cannot be tokenised without either inlining them at build time or accepting duplication. Recommend: leave them, document the coupling in the design, and add the unit test's parity assertion as the guard.
- **`:active` states are new user-visible behaviour**, so "not a visual redesign" is in tension with adding press feedback. My reading: press feedback is state hardening, not redesign, and it is dark-scoped by default — but the proposal should state that reading explicitly so it is not mistaken for scope creep.

## Ready for Proposal

Yes — with one decision requested before design: whether the non-text-contrast / border requirement is **dark-scoped** (light mode's 1.52:1 border and 4.81:1 `.tag` margin stay documented-but-unchanged) or **whole-theme** (which requires reinterpreting the "light theme must not change" non-goal as "must not change in its default state"). Everything else above is decision-free and ready to be specified.
