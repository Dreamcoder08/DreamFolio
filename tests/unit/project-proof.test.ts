import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProof,
  decisionTitle,
  isDecisionRecord,
  isTestFile,
  latestCi,
  type RawWorkflowRun,
} from "../../src/lib/project-proof.ts";

const run = (extra: Partial<RawWorkflowRun> = {}): RawWorkflowRun => ({
  name: "CI",
  status: "completed",
  conclusion: "success",
  head_branch: "main",
  html_url: "https://github.com/acme/app/actions/runs/1",
  created_at: "2026-10-01T10:00:00Z",
  ...extra,
});

test("counts test files across languages and skips fixtures", () => {
  const kept = [
    "src/a.test.ts",
    "web/b.spec.tsx",
    "internal/parser/csv_test.go",
    "tests/test_cli.py",
    "tests/e2e/home.spec.ts",
    "tests/shell/install.bats",
    "crates/core/tests/sync.rs",
  ];
  const dropped = [
    "src/a.ts",
    "test.csv",
    "tests/fixtures/sample.ts",
    "pkg/testdata/case.go",
    "node_modules/x/a.test.js",
    "docs/testing.md",
  ];
  for (const path of kept) assert.equal(isTestFile(path), true, path);
  for (const path of dropped) assert.equal(isTestFile(path), false, path);
});

test("finds ADR files in adr/ or decisions/ directories, not their index", () => {
  assert.equal(isDecisionRecord("docs/adr/0001-project-structure.md"), true);
  assert.equal(
    isDecisionRecord("docs/DECISIONS/ADR-0003-modular-monolith.md"),
    true,
  );
  assert.equal(isDecisionRecord("docs/DECISIONS/README.md"), false);
  assert.equal(isDecisionRecord("docs/adr/diagram.png"), false);
  assert.equal(isDecisionRecord("docs/architecture.md"), false);
});

test("turns ADR filenames into readable titles", () => {
  assert.equal(
    decisionTitle("docs/DECISIONS/ADR-0005-no-microservices-cosplay.md"),
    "ADR 0005 — No microservices cosplay",
  );
  assert.equal(
    decisionTitle("docs/adr/0002-toolchain-selection.md"),
    "ADR 0002 — Toolchain selection",
  );
  assert.equal(decisionTitle("docs/adr/why-astro.md"), "Why astro");
});

test("latest CI prefers the CI workflow on the default branch", () => {
  const ci = latestCi(
    [
      run({ name: "Deploy", created_at: "2026-10-05T00:00:00Z" }),
      run({ head_branch: "feat/x", conclusion: "failure" }),
      run({
        conclusion: "failure",
        created_at: "2026-10-03T00:00:00Z",
        html_url: "https://github.com/acme/app/actions/runs/3",
      }),
      run({ created_at: "2026-10-02T00:00:00Z" }),
    ],
    "main",
  );
  assert.deepEqual(ci, {
    status: "failing",
    workflow: "CI",
    url: "https://github.com/acme/app/actions/runs/3",
    date: "2026-10-03",
  });
});

test("latest CI ignores cancelled, skipped and in-progress runs", () => {
  const ci = latestCi(
    [
      run({ conclusion: "cancelled", created_at: "2026-10-04T00:00:00Z" }),
      run({ conclusion: "skipped", created_at: "2026-10-03T00:00:00Z" }),
      run({ status: "in_progress", conclusion: null }),
      run({ created_at: "2026-09-30T00:00:00Z" }),
    ],
    "main",
  );
  assert.equal(ci?.status, "passing");
  assert.equal(ci?.date, "2026-09-30");
});

test("latest CI falls back to any workflow, then to null", () => {
  assert.equal(latestCi([run({ name: "Build" })], "main")?.workflow, "Build");
  assert.equal(latestCi([], "main"), null);
});

test("buildProof links every decision to its file on GitHub", () => {
  const proof = buildProof({
    repo: "acme/app",
    branch: "main",
    tree: [
      "docs/adr/0001-structure.md",
      "docs/adr/README.md",
      "src/a.test.ts",
      "src/a.ts",
    ],
    runs: [run()],
  });
  assert.deepEqual(proof, {
    repo: "acme/app",
    repoUrl: "https://github.com/acme/app",
    testFiles: 1,
    ci: {
      status: "passing",
      workflow: "CI",
      url: "https://github.com/acme/app/actions/runs/1",
      date: "2026-10-01",
    },
    decisions: [
      {
        title: "ADR 0001 — Structure",
        url: "https://github.com/acme/app/blob/main/docs/adr/0001-structure.md",
      },
    ],
  });
});
