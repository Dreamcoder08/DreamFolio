import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkBudget,
  countLines,
  findRule,
  updateAllowlist,
} from "../../scripts/lib/file-budget.mjs";

const RULES = [
  { match: { prefix: "src/", ext: [".ts", ".astro"] }, max: 200 },
  { match: { prefix: "src/", ext: [".css"] }, max: 250 },
  { match: { prefix: "scripts/", ext: [".mjs"] }, max: 150 },
];
const cfg = (allowlist: { path: string; ceiling: number }[] = []) => ({
  rules: RULES,
  allowlist,
});

test("findRule: first matching rule wins by prefix and extension", () => {
  assert.deepEqual(findRule("src/lib/site.ts", RULES), RULES[0]);
  assert.deepEqual(findRule("src/styles/global.css", RULES), RULES[1]);
  assert.equal(findRule("public/logo.svg", RULES), undefined);
});

test("countLines: empty is 0, trailing newline isn't extra, no trailing newline still counts", () => {
  assert.equal(countLines(""), 0);
  assert.equal(countLines("a\nb\nc\n"), 3);
  assert.equal(countLines("a\nb\nc"), 3);
});

test("a file over its rule's max, with no allowlist entry, is a violation", () => {
  const files = [{ path: "src/lib/big.ts", lines: 250 }];
  const { violations } = checkBudget(files, cfg());
  assert.deepEqual(violations, [
    { path: "src/lib/big.ts", lines: 250, max: 200 },
  ]);
});

test("allowlisted within its ceiling is not a violation", () => {
  const files = [{ path: "src/lib/big.ts", lines: 220 }];
  const { violations } = checkBudget(
    files,
    cfg([{ path: "src/lib/big.ts", ceiling: 250 }]),
  );
  assert.deepEqual(violations, []);
});

test("allowlisted but over its own ceiling is still a violation", () => {
  const files = [{ path: "src/lib/big.ts", lines: 260 }];
  const { violations } = checkBudget(
    files,
    cfg([{ path: "src/lib/big.ts", ceiling: 250 }]),
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ceiling, 250);
});

test("stale reasons: within budget, missing, ceiling above current, no matching rule", () => {
  const files = [
    { path: "src/lib/a.ts", lines: 150 }, // now within budget
    { path: "src/lib/c.ts", lines: 240 }, // ceiling (250) sits above it
  ];
  const allowlist = [
    { path: "src/lib/a.ts", ceiling: 250 },
    { path: "src/lib/b.ts", ceiling: 250 }, // no longer exists
    { path: "src/lib/c.ts", ceiling: 250 },
    { path: "public/logo.svg", ceiling: 999 }, // matches no rule
  ];
  const { staleAllowlist } = checkBudget(files, cfg(allowlist));
  const reasons = Object.fromEntries(
    staleAllowlist.map((s) => [s.path, s.reason]),
  );
  assert.match(reasons["src/lib/a.ts"], /within its rule budget/);
  assert.match(reasons["src/lib/b.ts"], /no longer exists/);
  assert.match(reasons["src/lib/c.ts"], /ceiling \(250\) is above/);
  assert.match(reasons["public/logo.svg"], /matches no budget rule/);
});

test("a file matching no rule is ignored entirely", () => {
  const files = [{ path: "pnpm-lock.yaml", lines: 99999 }];
  const { violations, staleAllowlist } = checkBudget(files, cfg());
  assert.deepEqual(violations, []);
  assert.deepEqual(staleAllowlist, []);
});

test("updateAllowlist: lowers ceilings to current counts, never raises them", () => {
  const files = [
    { path: "src/lib/shrunk.ts", lines: 240 }, // ceiling should drop to 240
    { path: "src/lib/grown.ts", lines: 400 }, // ceiling (300) must not follow it up
  ];
  const allowlist = [
    { path: "src/lib/shrunk.ts", ceiling: 300 },
    { path: "src/lib/grown.ts", ceiling: 300 },
  ];
  const next = updateAllowlist(files, cfg(allowlist));
  assert.deepEqual(next, [
    { path: "src/lib/shrunk.ts", ceiling: 240 },
    { path: "src/lib/grown.ts", ceiling: 300 },
  ]);
});

test("updateAllowlist: drops missing, within-budget, and no-rule entries; never adds one", () => {
  const files = [
    { path: "src/lib/within.ts", lines: 150 },
    { path: "public/logo.svg", lines: 999 },
    { path: "src/lib/new-offender.ts", lines: 500 }, // not on the allowlist
  ];
  const allowlist = [
    { path: "src/lib/gone.ts", ceiling: 300 },
    { path: "src/lib/within.ts", ceiling: 300 },
    { path: "public/logo.svg", ceiling: 999 },
  ];
  const next = updateAllowlist(files, cfg(allowlist));
  assert.deepEqual(next, []);
});
