import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { walk } from "./support/fs-tree.ts";

/**
 * Mutation proof for the two static contracts.
 *
 * Both contracts were once shown to be fail-capable by reverting the fix in a working
 * tree and watching them fail. That was a real observation, but it lives in a session
 * report rather than in the suite — and a contract whose failure has only ever been
 * asserted in prose is one refactor away from being vacuous.
 *
 * This file makes the property permanent, and it asserts *both* halves of it:
 *
 *   - the same checker passes against an untouched copy of the stylesheets (without
 *     this control, a suite that failed unconditionally would "prove" fail-capability),
 *   - and it fails against a copy carrying the exact defect it exists to catch, with
 *     output that names that defect (a failure for an unrelated reason is not proof).
 *
 * The checker files are copied into the throwaway tree rather than imported because a
 * test file is not a module: importing one registers its tests a second time. Copying
 * is also what keeps this honest — the code under proof is byte-identical to the code
 * CI runs, and the only thing that differs is the stylesheet it reads.
 *
 * **What this does not cover.** The computed-style guards in `tests/theme-state/` need
 * a browser and a live stylesheet, so the same trick does not reach them; their
 * fail-capability stays recorded as sensitivity evidence in the change's apply record.
 * Saying so here is the point: a partial proof that pretends to be complete is worse
 * than none.
 */

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Every stylesheet under src/styles/, discovered at test time. Both
 *  contracts read their sheets through css-imports.ts, which follows each
 *  entry point's `@import` chain (global.css and portfolio.css are ordered
 *  lists of partials), so the temp tree has to carry the whole directory.
 *  Walking it means this list can never drift from the real split the way a
 *  hardcoded filename list would. transition-contract reads them indirectly,
 *  through the shared support module, which loads every sheet at
 *  module-evaluation time regardless of which export a checker imports. */
function stylesheets(): readonly string[] {
  return walk("src/styles").filter((path) => path.endsWith(".css"));
}

/** Same-repo modules a checker imports beyond the stylesheets and itself.
 *  transition-contract.test.ts reads GLOBAL/PORTFOLIO from the shared support
 *  module instead of re-reading files itself; state-border-provenance.test.ts
 *  reads its scanner and both sheets' `@import` chains through
 *  state-border.ts, which in turn imports css-imports.ts and css-parsing.ts.
 *  Copying all of these for every checker is harmless and needs no
 *  per-guard field. */
const SUPPORT_FILES = [
  "tests/unit/support/stylesheets.ts",
  "tests/unit/support/css-parsing.ts",
  "tests/unit/support/css-imports.ts",
  "tests/unit/support/state-border.ts",
] as const;

/** `node --experimental-strip-types` needs the package type in the temp tree too. */
const PACKAGE_JSON = `${JSON.stringify({ type: "module", private: true }, null, 2)}\n`;

interface Guard {
  /** The property under proof, in one line. */
  readonly name: string;
  /** Repo-relative path of the checker that holds the property. */
  readonly checker: string;
  /** The stylesheet the defect is injected into. */
  readonly sheet: string;
  /** Reintroduces the exact defect the contract exists to catch. */
  readonly inject: (css: string) => string;
  /** Text the injection must produce, so a no-op mutation fails loudly here. */
  readonly marker: string;
  /** A phrase the failing checker must print, so the *right* assertion failed. */
  readonly expected: RegExp;
}

const GUARDS: readonly Guard[] = [
  {
    name: "the border contract rejects currentColor on the ceiling-exempt element",
    checker: "tests/unit/state-border-provenance.test.ts",
    // The winning (last-in-source-order) hover/press declarations for
    // `.contact-section .solid-link` live in the "Interaction states"
    // partial, not in the entry-point file, which is now only `@import`s.
    sheet: "src/styles/portfolio/18-interaction-states.css",
    inject: (css) => {
      const clean = "border-color: var(--color-surface-active);";
      assert.ok(
        css.includes(clean),
        "the clean declaration this mutation replaces is gone — the guard needs updating",
      );
      return css.split(clean).join("border-color: currentColor;");
    },
    marker: "border-color: currentColor;",
    expected: /currentColor/,
  },
  {
    name: "the transition contract rejects a reintroduced universal transition",
    checker: "tests/unit/transition-contract.test.ts",
    // global.css is now only `@import`s; inject into the partial that holds
    // the reduced-motion guard, so the proof also covers the import chain.
    sheet: "src/styles/global/04-reduced-motion.css",
    inject: (css) =>
      `${css}\n*, *::before, *::after { transition: opacity var(--motion-fast); }\n`,
    marker: "*::before",
    expected: /universal/i,
  },
];

/**
 * A throwaway tree holding the two stylesheets plus one checker, laid out so the
 * checker's own `new URL("../../" + path, import.meta.url)` resolves inside it.
 */
function buildTree(
  checker: string,
  inject?: (css: string) => string,
  sheet?: string,
): string {
  const tree = mkdtempSync(join(tmpdir(), "contract-mutation-"));
  writeFileSync(join(tree, "package.json"), PACKAGE_JSON);

  for (const rel of stylesheets()) {
    const target = join(tree, rel);
    mkdirSync(dirname(target), { recursive: true });
    const original = readFileSync(join(ROOT, rel), "utf8");
    writeFileSync(
      target,
      inject !== undefined && rel === sheet ? inject(original) : original,
    );
  }

  for (const rel of SUPPORT_FILES) {
    const target = join(tree, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(join(ROOT, rel)));
  }

  const checkerFile = join(tree, checker);
  mkdirSync(dirname(checkerFile), { recursive: true });
  writeFileSync(checkerFile, readFileSync(join(ROOT, checker)));
  return tree;
}

function runChecker(
  tree: string,
  checker: string,
): { status: number | null; output: string } {
  // The child must not inherit this run's test context: `node --test` notices it is
  // inside another test run and skips the file entirely, which would make every
  // mutation "pass" and this whole file vacuous. That is not a guard being bypassed —
  // the child is an independent tree running a different checker, not a recursion —
  // and the baseline assertion below is what keeps that claim honest.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("NODE_TEST")),
  );
  const result = spawnSync(
    process.execPath,
    ["--test", "--experimental-strip-types", join(tree, checker)],
    { encoding: "utf8", env },
  );
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

for (const guard of GUARDS) {
  test(guard.name, () => {
    const cleanTree = buildTree(guard.checker);
    const mutatedTree = buildTree(guard.checker, guard.inject, guard.sheet);
    try {
      const baseline = runChecker(cleanTree, guard.checker);
      assert.equal(
        baseline.status,
        0,
        `the contract failed against an untouched copy, so this proof says nothing about ` +
          `the mutation:\n${baseline.output}`,
      );

      const mutated = runChecker(mutatedTree, guard.checker);
      assert.notEqual(
        mutated.status,
        0,
        `the contract passed with the defect present — it does not catch ` +
          `\`${guard.marker}\`:\n${mutated.output}`,
      );
      assert.match(
        mutated.output,
        guard.expected,
        `the contract failed, but not for the defect under proof:\n${mutated.output}`,
      );
    } finally {
      rmSync(cleanTree, { recursive: true, force: true });
      rmSync(mutatedTree, { recursive: true, force: true });
    }
  });
}
