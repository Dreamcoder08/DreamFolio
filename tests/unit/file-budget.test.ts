import { test } from "node:test";
import assert from "node:assert/strict";
import { checkBudget, findRule } from "../../scripts/lib/file-budget.mjs";

const RULES = [
  { match: { prefix: "src/", ext: [".ts", ".astro"] }, max: 200 },
  { match: { prefix: "src/", ext: [".css"] }, max: 250 },
  { match: { prefix: "scripts/", ext: [".mjs"] }, max: 150 },
];

function config(allowlist: { path: string; ceiling: number }[] = []) {
  return { rules: RULES, allowlist };
}

test("findRule: first matching rule wins by prefix and extension", () => {
  assert.deepEqual(findRule("src/lib/site.ts", RULES), RULES[0]);
  assert.deepEqual(findRule("src/styles/global.css", RULES), RULES[1]);
  assert.equal(findRule("public/logo.svg", RULES), undefined);
});

test("a file over its rule's max, with no allowlist entry, is a violation", () => {
  const files = [{ path: "src/lib/big.ts", lines: 250 }];
  const { violations } = checkBudget(files, config());
  assert.equal(violations.length, 1);
  assert.deepEqual(violations[0], {
    path: "src/lib/big.ts",
    lines: 250,
    max: 200,
  });
});

test("allowlisted within its ceiling is not a violation", () => {
  const files = [{ path: "src/lib/big.ts", lines: 220 }];
  const { violations } = checkBudget(
    files,
    config([{ path: "src/lib/big.ts", ceiling: 250 }]),
  );
  assert.deepEqual(violations, []);
});

test("allowlisted but over its own ceiling is still a violation", () => {
  const files = [{ path: "src/lib/big.ts", lines: 260 }];
  const { violations } = checkBudget(
    files,
    config([{ path: "src/lib/big.ts", ceiling: 250 }]),
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ceiling, 250);
});

test("stale: allowlisted file is now within its rule's budget", () => {
  const files = [{ path: "src/lib/big.ts", lines: 150 }];
  const { staleAllowlist, violations } = checkBudget(
    files,
    config([{ path: "src/lib/big.ts", ceiling: 250 }]),
  );
  assert.deepEqual(violations, []);
  assert.equal(staleAllowlist.length, 1);
  assert.match(staleAllowlist[0].reason, /within its rule budget/);
});

test("stale: allowlisted file no longer exists", () => {
  const { staleAllowlist } = checkBudget(
    [],
    config([{ path: "src/lib/gone.ts", ceiling: 250 }]),
  );
  assert.equal(staleAllowlist.length, 1);
  assert.match(staleAllowlist[0].reason, /no longer exists/);
});

test("stale: ceiling sits above the current line count (ratchet must lower it)", () => {
  const files = [{ path: "src/lib/big.ts", lines: 240 }];
  const { staleAllowlist, violations } = checkBudget(
    files,
    config([{ path: "src/lib/big.ts", ceiling: 250 }]),
  );
  assert.deepEqual(violations, []);
  assert.equal(staleAllowlist.length, 1);
  assert.match(staleAllowlist[0].reason, /ceiling \(250\) is above/);
});

test("a file matching no rule is ignored entirely", () => {
  const files = [{ path: "pnpm-lock.yaml", lines: 99999 }];
  const { violations, staleAllowlist } = checkBudget(files, config());
  assert.deepEqual(violations, []);
  assert.deepEqual(staleAllowlist, []);
});
