# Decision Required: Strict TDD, Applied Retroactively

Status: **OPEN.** A governance question about this project's SDD policy — not a defect in any change.
It is the only thing standing between two finished changes and their archive.

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

Five changes sit in `openspec/changes/`. Two are finished and verified except for this one
(`dark-theme-hardening`, `project-hardening`). None can reach a canonical sync while its verification
verdict is `fail`, so `openspec/specs/` stays empty and the project's spec library exists only as
change-deltas — which means the next change cannot read the current contract from the canonical tree.

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
| 2 | A change to `openspec/config.yaml` recording the enablement date and the prospective scope, plus a line in each change's record saying the gap was not repaired. Then `sdd-verify` and `sdd-archive` can be attempted again. |
| 3 | A follow-up change for the fault-injection harness — a real work unit, independent of this decision. |
| 4 | A dated disposition note in each change; no config change. |

## What this document is not

It is not an argument for lowering a bar. Nothing here proposes relaxing `strict_tdd` for work that
can still follow it, and nothing proposes editing a record to make a verdict look better. Every option
above leaves the historical findings visible; the only question is what they are allowed to block.
