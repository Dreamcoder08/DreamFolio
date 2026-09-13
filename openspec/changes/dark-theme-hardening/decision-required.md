# Decision Required: Two Spec Requirements Conflict

Status: **OPEN — maintainer decision required.** Both items block a passing
`sdd-verify`, and neither can be resolved by editing the implementation, because in
each case the fix that satisfies one requirement violates another requirement in the
same spec.

`verify-report.md` records both as *implementation* contradictions
("Theme State — Dark-Scoped Press State Coverage" and "Theme State — State-Driven
Interaction Tokens in Use", both `UNSATISFIED`). Re-reading them against the
measurements below, the more accurate diagnosis is that **the requirements are
over-constrained**, not that the CSS is wrong. That distinction matters: complying
as written would ship a regression, and amending the spec to match the code without a
recorded decision would be spec-washing.

This document exists so the choice is made deliberately and on the record.

---

## Conflict 1 — press rules are not dark-scoped

**Requirement.** `theme-state-hardening`: press rules **MUST be dark-scoped**.

**Reality.** The 13 press rules in `src/styles/portfolio.css` and
`.btn-primary:active` in `src/styles/global.css` are unscoped. They resolve
per theme through the tokens they use, but the selectors carry no theme attribute,
and the e2e matrix deliberately proves they change light-mode pressed appearance too.

**The tension.** The requirement's intent is plainly *do not alter light mode*. But
light mode's **at-rest** appearance is untouched — the change only adds a pressed
state, and only while the pointer or finger is down. Scoping the rules to
`[data-theme="dark"]` would satisfy the letter of the requirement and **remove press
feedback from light mode entirely** — leaving light-mode users with no press
confirmation on a touch device, which is the very gap this change exists to close.

### Options

| # | Option | Consequence |
| --- | --- | --- |
| 1a | **Scope to `[data-theme="dark"]`** | Requirement satisfied literally. Light mode loses all press feedback — no fill, border, underline or motion on any of the 13 selectors. |
| 1b | **Amend the requirement** to "press rules MUST NOT alter at-rest appearance in either mode", and record that a pressed state is additive by nature | Light mode keeps press feedback; at-rest preservation is asserted by the existing harness and by the at-rest regression checks in the verification rounds. **Recommended**, but it is a spec change and needs the decision on the record. |

---

## Conflict 2 — state rules must resolve from state tokens

**Requirement.** `theme-state-hardening`: changed state background and border
declarations **MUST** resolve from state tokens; "the requirement permits token-name
choice, not non-state values".

**Reality.** `verify-report.md` names `background: transparent`,
`border-color: currentColor` and `background: var(--color-text)` at
`src/styles/portfolio.css:1598-1649`.

**These non-state values are there on purpose.** They are what makes hover and press
*not* fall below the at-rest ratio — a requirement this change also carries, and the
one the harness was built to enforce after it caught the `.solid-link` regression
(`891df09`). The elements in question rest at the **palette ceiling**, and no state
token reaches it:

| Element | At rest | Nearest state-token fill | Result |
| --- | --- | --- | --- |
| `.desktop-nav .nav-contact`, `.circle-link` | **17.91:1** (`--color-text` on `--color-surface`) | `--color-surface-hover` `#1e1e24` under `--color-text` | **14.15:1** — below rest |
| `.contact-section .solid-link` | **17.91:1** (`--color-surface` on `--color-text`) | `--color-surface-active` `#26262e` under `--color-text` | **12.80:1** — below rest |

Nothing outranks `--color-text` against the canvas, so for these elements **every
state-token-backed fill lowers the label ratio**. `design.md` already recorded this
structural limit and prescribed the remedy these selectors implement: signal through
border, underline or motion instead of a colour swap.

**So the literal fix is not a fix.** Replacing `background: transparent` with
`--color-surface-hover` would satisfy the token requirement and reintroduce exactly
the contrast defect the harness was built to catch.

### Options

| # | Option | Consequence |
| --- | --- | --- |
| 2a | **Make every changed state declaration use a state token** | Requirement satisfied literally. Three max-brightness hovers drop to 14.15:1 / 12.80:1 where they rest at 17.91:1 — the `.solid-link` defect class returns, and the harness assertions that currently pass would start failing. |
| 2b | **Amend the requirement** to "state rules that carry a fill MUST resolve it from a state token; elements at the palette ceiling MUST signal non-chromatically and MAY declare the at-rest colour and `transparent`" | Matches what the design already prescribes and what the measurements support. **Recommended**, but it is a spec change and needs the decision on the record. |
| 2c | **Split the difference**: allow `background: var(--color-text)` (a token, though not a *state* token, and ratio-neutral at 17.91:1) where the element inverts, and keep `transparent` only where the at-rest fill is already transparent | Partially satisfies the requirement's wording without the contrast regression. Smaller spec change, but leaves `currentColor` and `transparent` still non-token. |

---

## What is not in conflict, and is already done

- The third `sdd-verify` finding — `apply-progress.md` missing its
  `TDD Cycle Evidence` table — was a genuine documentation gap with no tension
  attached. It is fixed in `5be7f5f`, with the cycles that had no RED observation
  declared as such rather than smoothed over.

## What no decision here can fix

These need evidence no machine can produce, and they remain open regardless of how
the two conflicts above are resolved:

- **No human before/after visual pass**, and no screenshot baseline anywhere in
  `tests/`, so no visual regression is machine-detectable.
- **No touch-context run.** Mouse-held `:active` is tested; real touch press without
  hover is not.

## Effect on the change

`verify-report.md` records `verdict: fail`, `requirements: 11/14`,
`scenarios: 34/39`. Resolving conflicts 1 and 2 either way makes the change eligible
for a fresh independent verification; `sdd-sync` and `sdd-archive` stay blocked until
that verification passes, and the merge is blocked with it.
