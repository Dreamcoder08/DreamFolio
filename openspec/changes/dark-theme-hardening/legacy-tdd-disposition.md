# Legacy strict-TDD disposition

This change is the **boundary case**, and it is worth stating precisely rather than folding into the
blanket rule. It was recorded on **2026-09-12**, the same day `openspec/config.yaml` was created carrying
`strict_tdd: true` — so "applied before the policy" is true of it only in the sense that its application
ran alongside the policy's arrival, not months earlier.

Its strict-TDD record is genuinely mixed, and its own apply record says so:

- **Unit 1 has RED-first lineage.** The unit's tests opened with the assertions and went green afterwards
  ("RED/GREEN: `tests/unit/tokens.test.ts` opened with A1, A2, A6, A9, A10; 21 unit tests green at the end").
- **Unit 2 does not.** *"The RED observations for unit 2 were not taken before the code"* — the unit's
  record states it plainly, and the maintainer accepted the gap as explicit debt rather than repairing
  history.

The verification contract judged that gap as a CRITICAL process finding and returned `verdict: fail`
while recording **14/14 requirements and 39/39 scenarios satisfied**. That is the whole tension: the
implementation is complete and the history is incomplete.

Under the prospective scope recorded in `openspec/config.yaml`, this change is judged under the mode it
actually ran, and its pre-policy gap is recorded as **not repaired** — the unit 2 RED-first observation
still does not exist, and no later edit creates it. What would have closed it was that observation,
taken before the code. What would reduce the same class of risk going forward is different work:
proving on every run that the affected assertions are fail-capable (see option 3 in the document below),
which converts "we once saw this fail" into a property the suite keeps.
