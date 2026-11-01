# Project proof: evidence generated, never hand-written

## Context

A portfolio claim a visitor cannot check is marketing. The case studies in
`src/lib/project-case-studies.ts` explain intent; they cannot prove that code
exists, that it is tested, or that its architecture was decided on purpose.

## Decision

Every project with a `githubUrl` gets a proof entry generated from the GitHub
REST API by `pnpm run sync:proof` (`scripts/sync-project-proof.mjs`) into the
committed snapshot `src/data/project-proof.json`, stamped with `checkedAt`.

| Evidence              | Source                                                                          | Link target          |
| --------------------- | ------------------------------------------------------------------------------- | -------------------- |
| Repository            | `GET /repos/{repo}` (follows renames)                                           | repository           |
| Integration           | latest settled run on the default branch, preferring a workflow named `CI`       | that workflow run    |
| Automated tests       | test files in the tree, by naming convention (`*.test.ts`, `*_test.go`, `tests/`) | repository           |
| Architecture decisions | Markdown files in `adr/` or `decisions/` directories, index excluded            | each ADR file        |
| Demo                  | `liveUrl` in `src/data/projects.json`, set by hand                               | the deployment       |

The rules are pure functions in `src/lib/project-proof.ts`, shared by the
script and `tests/unit/project-proof.test.ts`. The detail page renders them
through `src/components/ui/ProjectProof.astro`.

## Rules

- **Every item has a URL.** Nothing unlinked is presented as evidence.
- **Absence is stated, not hidden.** "Sin demo pública" and "Sin ejecuciones de
  CI" are rendered as text; a project never links to something else instead.
- **A failing CI shows as failing.** The portfolio reports the repository's
  state; fixing the repository is how the page turns green.
- **A failed sync keeps the snapshot** and exits 0, like `sync:repos`: a GitHub
  outage must never block a deploy. The date tells the visitor how fresh it is.
- **Featured means public.** `tests/unit/project-proof-coverage.test.ts` fails
  when a featured project has no `githubUrl` or no proof entry, and when a
  proof link points outside its own repository.

## Known limits

- Test files are counted, not test cases, and inline Rust `#[test]` modules
  are not counted: a Rust crate can show 0 test files while CI runs its tests.
- A green CI says the workflow passed, not what it covers.
- A tree too large for one API response is rejected (`truncated`), which keeps
  the previous snapshot rather than publishing a partial count.

## Refreshing

```bash
GITHUB_TOKEN=$(gh auth token) pnpm run sync:proof   # token optional, raises the rate limit
```

The deploy workflow runs the same command before every build.
