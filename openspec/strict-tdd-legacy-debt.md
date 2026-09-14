# Decision Required: Strict TDD, Applied Retroactively

Status: **OPEN.** A governance question about this project's SDD policy — not a defect in any change.
It is the keystone blocker: the other one is already resolved, and this is why.

## There are two blockers, not one

This document originally presented the policy gap as the only thing standing between the parked
changes and their archive. The sync evaluation says otherwise, and naming both matters because the
second one is *derivable from the artifacts* rather than a question anyone has to answer.

| # | Blocker | State |
| --- | --- | --- |
| A | The strict-TDD gap, applied to work that ran before the policy existed | **open — the decision below** |
| B | An active `design-tokens` collision between two parked changes | **resolved by the artifacts; the order is derivable** |

`openspec/changes/dark-theme-hardening/sync-report.md` records the native sync state as `blocked`
with *"unresolved failing verification and an active `design-tokens` collision"*, and asks to
*"define the ordering for the active `design-tokens` collision"*. Blocker A is that unresolved
verification. Blocker B is the collision, and what follows is what it is.

## The evidence

Measured, not inferred:

| Fact | Value | Source |
| --- | --- | --- |
| The project's policy | `strict_tdd: true` | `openspec/config.yaml`, and `testing.strict_tdd` |
| The mode the changes actually ran in | *"Standard (Strict TDD not active for this project…)"* | `apply-progress.md` of `dual-theme-design-system`, `responsive-color-hardening` and `project-hardening` |
| The dark theme's verification | `fail` — **14/14 requirements and 39/39 scenarios satisfied**, two Strict TDD **process** blockers | `openspec/changes/dark-theme-hardening/verify-report.md` |
| The verifier's own reasoning | *"The maintainer accepted this as explicit debt, but strict-TDD verification requires it to remain a CRITICAL incompleteness finding."* | same report |
| Canonical specs | `openspec/specs/` is **empty** — no change has ever synced | the tree |

The policy was enabled **after** these changes were applied, and the verification contract treats the
resulting gap as a blocker that a maintainer's acceptance does not lift. Archive readiness requires
`blockers: 0`. The blocker is history: no edit can produce a RED-before-GREEN observation that was
never taken, and manufacturing one is not an option this project takes.

## Why it is bigger than two changes

Five changes sit in `openspec/changes/`, and the measured state is not the one this document first
sketched. What is true, counted from the tree:

| Change | Tasks | `verify-report.md` | `sync-report.md` |
| --- | --- | --- | --- |
| `dark-theme-hardening` | 42/42 | yes — `fail`, 2 blockers | yes — `blocked` |
| `dual-theme-design-system` | 25/26 | no | no |
| `project-hardening` | 27/27 | no | no |
| `responsive-color-hardening` | 16/16 | no | no |
| `scroll-motion-polish` | 19/19 | no | no |

Four have every implementation task done; **one** has ever been verified. So the honest statement is
not "two changes are finished". It is that one change reached verification and stopped there, and four
more are waiting behind a door that the same policy question holds shut. None can reach a canonical
sync while its verification verdict is `fail`, so `openspec/specs/` stays empty and the project's spec
library exists only as change-deltas — which means the next change cannot read the current contract
from the canonical tree.

## Blocker B: the `design-tokens` collision, and why the order is not a coin flip

Both `dark-theme-hardening` and `dual-theme-design-system` declare the same canonical domain,
`design-tokens`. That is the collision. It is *not* an unresolved disagreement, and treating it as one
would be the mistake:

- `dark-theme-hardening` declares a **supersession of exactly one requirement** — `Dark Theme Values
  Preserved` in `dual-theme-design-system/specs/design-tokens/spec.md` — in the form the contract
  expects: a `## REMOVED Requirements` entry carrying both a `(Reason: …)` and a `(Migration: …)`.
- The reason is factual, and the check holds today. That requirement asserts accent `#dda783` on
  surface `#080909` at ≥ 9.5:1. The tree says `--color-accent: #ff7a18` and `--color-surface:
  #000000`, and both obsolete literals survive **only** inside the assertion that forbids them
  (`tests/unit/tokens.test.ts`, A6). The requirement is not out of favour; it is false.
- The migration note fixes the order in as many words: the superseded requirement *"MUST NOT be
  carried forward into a canonical design-tokens spec"*.

**The derived order is `dual-theme-design-system` first, then `dark-theme-hardening`.** The first is
where the requirement lives; the second is what removes it. Reversed, the stale requirement lands in
the canonical tree and nothing is left to remove it.

So blocker B adds no decision — it adds a **prerequisite**: a canonical tree has to exist before a
removal can apply to it, so `design-tokens` can only be populated in that order.

## One prerequisite that no policy decision gates

`dual-theme-design-system` carries one unchecked task, `6.3`: a **manual** check that the theme toggle
switches, persists across reload and shows no flash of the wrong theme. It was never performed because
no browser was available. The change is merged and the site is deployed, so that check can be done
against the live site right now — and it is worth doing regardless of what is decided below, because it
is the only item in the parked set that is blocked by nothing at all.

## The options, and what each one costs

| # | Option | Consequence |
| --- | --- | --- |
| 1 | **Leave the policy as it is.** | The honest end state. The two changes stay unarchived, `openspec/specs/` stays empty, and their specs live on as deltas. Nothing is hidden and nothing is lowered. The cost is that the SDD lifecycle never closes for pre-policy work. |
| 2 | **Scope the policy prospectively.** Record the enablement date in `openspec/config.yaml` and state that changes applied before it are judged under the mode they actually ran. | The archive becomes reachable for the pre-policy changes. This is a *policy* decision — which rule governs which era — not a relaxation of the rule for future work. Its cost should be stated plainly: the historical findings stop blocking, and a reader a year from now cannot tell whether the debt was repaired or forgiven. If this option is chosen, the config change should say the pre-policy gap was **not** repaired, and name what would have closed it. |
| 3 | **Rebuild the missing evidence forward.** Add a fault-injection harness that proves fail-capability of the affected assertions on every run. | Worth doing on its own merit — it converts "we once saw this fail" into "the suite proves it can fail, forever". But it closes the *practice* gap, not the *historical* one, and the verification contract says so explicitly. It cannot unblock the archive by itself. |
| 4 | **Close the changes without an archive.** Record the verdict, the disposition and the reason inside each change, and treat them as finished-but-unarchived. | No policy change, no bar moved, the tree stays honest. The cost is that the canonical spec library never forms. |

**Recommendation: option 2, with option 3 as the follow-up that keeps the practice honest.** The
argument for it: a rule enabled after the fact is being applied to work that could not have followed
it. The argument against, which is why this is a decision and not a fix: it is still a rule relaxed
for older work, and the difference between *forgiven* and *repaired* disappears from the record unless
the config says so in as many words.

**Option 1 is the defensible default** if an empty canonical spec library is an acceptable cost.
**Option 4** is the choice that records reality without touching the policy at all.

## What each option requires next

| Option | Next action |
| --- | --- |
| 1 | Nothing. Both changes simply stop here, with their records as they are. |
| 2 | A change to `openspec/config.yaml` recording the enablement date and the prospective scope, plus a line in each change's record saying the gap was not repaired. `sdd-verify` then becomes attemptable, and any `design-tokens` sync must follow the derived order above. |
| 3 | A follow-up change for the fault-injection harness — a real work unit, independent of this decision. |
| 4 | A dated disposition note in each change; no config change. |

## What this document is not

It is not an argument for lowering a bar. Nothing here proposes relaxing `strict_tdd` for work that
can still follow it, and nothing proposes editing a record to make a verdict look better. Every option
above leaves the historical findings visible; the only question is what they are allowed to block.
