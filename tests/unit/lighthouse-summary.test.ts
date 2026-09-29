import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Coverage for scripts/lighthouse-summary.mjs, the step that prints the
 * median Lighthouse numbers in CI. It runs the real script in a child
 * process against fake `*.report.json` files, so exit codes, stdout and the
 * GITHUB_STEP_SUMMARY append are all observed as CI would see them.
 */

const SCRIPT = join(
  import.meta.dirname,
  "../../scripts/lighthouse-summary.mjs",
);

interface FakeRun {
  performance: number;
  fcp: number;
  cls: number;
}

function reportFor({ performance, fcp, cls }: FakeRun): string {
  return JSON.stringify({
    categories: {
      performance: { score: performance },
      accessibility: { score: 1 },
      "best-practices": { score: 1 },
      seo: { score: 1 },
    },
    audits: {
      "first-contentful-paint": { numericValue: fcp },
      "largest-contentful-paint": { numericValue: 2000 },
      "speed-index": { numericValue: 1500 },
      "total-blocking-time": { numericValue: 0 },
      "cumulative-layout-shift": { numericValue: cls },
    },
  });
}

function writeReports(dir: string, runs: FakeRun[]): void {
  runs.forEach((run, i) => {
    writeFileSync(join(dir, `run-${i}.report.json`), reportFor(run));
  });
}

function runSummary(dir: string, env: Record<string, string> = {}) {
  const { GITHUB_STEP_SUMMARY: _ignored, ...base } = process.env;
  return spawnSync(process.execPath, [SCRIPT, dir], {
    env: { ...base, ...env },
    encoding: "utf8",
  });
}

function valueOf(stdout: string, metric: string): string | undefined {
  const row = stdout
    .split("\n")
    .find((line) => line.startsWith(`| ${metric} |`));
  return row?.split("|")[2]?.trim();
}

describe("lighthouse-summary", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "lh-summary-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("an odd number of runs reports the middle value", () => {
    writeReports(dir, [
      { performance: 0.99, fcp: 3000, cls: 0.1 },
      { performance: 0.9, fcp: 1000, cls: 0.001 },
      { performance: 0.95, fcp: 1400, cls: 0.002 },
    ]);
    const result = runSummary(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /median of 3 runs/);
    assert.equal(valueOf(result.stdout, "performance"), "95");
    assert.equal(valueOf(result.stdout, "first-contentful-paint (ms)"), "1400");
    assert.equal(valueOf(result.stdout, "cumulative-layout-shift"), "0.002");
    assert.equal(valueOf(result.stdout, "accessibility"), "100");
  });

  test("an even number of runs reports the mean of the two middle values", () => {
    writeReports(dir, [
      { performance: 0.8, fcp: 5000, cls: 0.3 },
      { performance: 0.92, fcp: 1000, cls: 0.002 },
      { performance: 0.96, fcp: 1400, cls: 0.004 },
      { performance: 1, fcp: 900, cls: 0 },
    ]);
    const result = runSummary(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /median of 4 runs/);
    // Sorted 80/92/96/100 -> (92 + 96) / 2 = 94, not 92 or 96.
    assert.equal(valueOf(result.stdout, "performance"), "94");
    // Sorted 900/1000/1400/5000 -> (1000 + 1400) / 2 = 1200.
    assert.equal(valueOf(result.stdout, "first-contentful-paint (ms)"), "1200");
    // Sorted 0/0.002/0.004/0.3 -> 0.003.
    assert.equal(valueOf(result.stdout, "cumulative-layout-shift"), "0.003");
  });

  test("a missing reports folder exits 1 and names the folder", () => {
    const missing = join(dir, "does-not-exist");
    const result = runSummary(missing);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /No reports folder/);
    assert.ok(result.stderr.includes(missing), result.stderr);
    assert.equal(result.stdout, "");
  });

  test("a folder without *.report.json files exits 1", () => {
    writeFileSync(join(dir, "manifest.json"), "[]");
    writeFileSync(join(dir, "run-0.report.html"), "<html></html>");
    const result = runSummary(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /No \*\.report\.json reports/);
    assert.equal(result.stdout, "");
  });

  test("the table is appended to GITHUB_STEP_SUMMARY when it is set", () => {
    // The summary file lives outside the reports folder, as on a runner.
    const summaryDir = mkdtempSync(join(tmpdir(), "lh-step-summary-"));
    const summary = join(summaryDir, "summary.md");
    try {
      writeFileSync(summary, "existing line\n");
      writeReports(dir, [{ performance: 0.97, fcp: 1100, cls: 0.001 }]);

      const result = runSummary(dir, { GITHUB_STEP_SUMMARY: summary });
      assert.equal(result.status, 0, result.stderr);
      const written = readFileSync(summary, "utf8");
      // Appended after the existing content, and identical to what was printed.
      assert.equal(written, `existing line\n${result.stdout}`);
      assert.match(written, /\| performance \| 97 \|/);
    } finally {
      rmSync(summaryDir, { recursive: true, force: true });
    }
  });
});
