# Legacy strict-TDD disposition

This change was applied under **Standard** ("no strict TDD; no browser tool available", per this change's own apply record) — before `strict_tdd` was enabled on **2026-09-12**, the date
`openspec/config.yaml` was created carrying that key.

That config now scopes the policy **prospectively**: a change applied before that date is judged under
the mode it actually ran, which this change declares for itself above. Its pre-policy RED-first gap is
recorded as **not repaired**, and this note exists so that a reader cannot mistake *unrepaired* for
*repaired*. What would have closed it was a RED-before-GREEN observation taken before the code for the
affected assertions. No edit can produce an observation that was never taken, and this project does not
manufacture failures.

The decision, its options and their costs: [`openspec/strict-tdd-legacy-debt.md`](../../strict-tdd-legacy-debt.md).
