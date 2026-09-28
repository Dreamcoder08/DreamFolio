import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  blocks,
  colorMixes,
  escapeSelector,
  normalise,
  splitTopLevel,
} from "./support/css-parsing.ts";
import { ROOT, walk } from "./support/fs-tree.ts";
import { GLOBAL, PORTFOLIO, SHEETS } from "./support/stylesheets.ts";

/**
 * Token contract, composition half: every color-mix() composes only token
 * references (A11), the compositions this change touches are pinned (3.7),
 * and no screenshot-diffing assertion exists under tests/ (3.6).
 */

test("A11: no color-mix() composes a raw literal — only token references", () => {
  const tokenStep = /^var\(--[\w-]+\)(\s+\d+(?:\.\d+)?%)?$/i;
  const keyword = /^(transparent|currentcolor)$/i;
  const percentage = /^\d+(?:\.\d+)?%$/;
  for (const [file, css] of SHEETS) {
    const mixes = colorMixes(css);
    assert.ok(
      mixes.length > 0,
      `${file} declares no color-mix() at all, which would make this assertion vacuous`,
    );
    for (const mix of mixes) {
      const [space, ...steps] = splitTopLevel(mix);
      assert.match(
        space,
        /^in\s+[\w-]+$/i,
        `${file}: color-mix(${mix}) declares no interpolation space`,
      );
      for (const step of steps) {
        assert.ok(
          tokenStep.test(step) || keyword.test(step) || percentage.test(step),
          `${file}: color-mix(${mix}) composes the raw literal "${step}" — every ` +
            `colour must be a var(--token) reference, so a token *value* change ` +
            `cannot hide a composition that stopped tracking the palette`,
        );
      }
    }
  }
});

interface Composition {
  readonly file: string;
  readonly selector: string;
  readonly property: string;
  readonly declaration: string;
}

/**
 * Design §7.1's honesty rule: a regex cannot resolve `color-mix()`, so these
 * declarations are asserted as *compositions*, not as contrast numbers. Swapping
 * a token's value passes; swapping which token, or the fraction, fails. Every A7
 * floor stays restricted to literal-valued tokens.
 */
const COMPOSITIONS: readonly Composition[] = [
  {
    file: "src/styles/portfolio.css",
    selector: ".profile-project",
    property: "background",
    declaration:
      "background: color-mix(in srgb, var(--portfolio-yellow) 7%, var(--color-surface-alt))",
  },
  {
    file: "src/styles/portfolio.css",
    selector: ".project-story blockquote",
    property: "background",
    declaration:
      "background: color-mix(in srgb, var(--portfolio-yellow) 7%, var(--color-surface))",
  },
  {
    file: "src/styles/portfolio.css",
    selector: ".hero-portrait::after",
    property: "border",
    declaration:
      "border: 1px solid color-mix(in srgb, var(--portfolio-yellow-ink) 35%, transparent)",
  },
  {
    file: "src/styles/portfolio.css",
    selector: ".principle-icon",
    property: "border",
    declaration:
      "border: 1px solid color-mix(in srgb, var(--portfolio-yellow) 40%, var(--color-border))",
  },
  {
    file: "src/styles/portfolio.css",
    selector: ".module-label",
    property: "border",
    declaration:
      "border: 1px solid color-mix(in srgb, var(--portfolio-yellow) 40%, var(--color-border))",
  },
  {
    file: "src/styles/portfolio.css",
    selector: ".site-header",
    property: "background",
    declaration:
      "background: color-mix(in srgb, var(--color-surface) 89%, transparent)",
  },
  {
    file: "src/styles/global.css",
    selector: "::selection",
    property: "background",
    declaration:
      "background: color-mix(in srgb, var(--color-accent) 32%, transparent)",
  },
];

test("3.7: the color-mix() compositions this change touches are unchanged", () => {
  for (const entry of COMPOSITIONS) {
    const css = entry.file.endsWith("global.css") ? GLOBAL : PORTFOLIO;
    const bodies = blocks(
      css,
      new RegExp(`${escapeSelector(entry.selector)}\\s*\\{`, "g"),
    );
    assert.ok(
      bodies.length > 0,
      `${entry.file} declares no ${entry.selector} rule`,
    );
    const declaration = bodies
      .flatMap((body) => body.split(";"))
      .map((chunk) => chunk.trim())
      .find(
        (chunk) =>
          chunk.startsWith(entry.property) && chunk.includes("color-mix("),
      );
    assert.ok(
      declaration !== undefined,
      `${entry.file}: ${entry.selector} has no color-mix() on ${entry.property}`,
    );
    assert.equal(
      normalise(declaration),
      normalise(entry.declaration),
      `${entry.file}: ${entry.selector}'s ${entry.property} composition changed`,
    );
  }
});

const SCREENSHOT_CALL = ["toHave", "Screenshot"].join("");

test("3.6: no screenshot-diffing assertion exists anywhere under tests/", () => {
  const offenders = walk("tests").filter((path) =>
    readFileSync(join(ROOT, path), "utf8").includes(SCREENSHOT_CALL),
  );
  assert.deepEqual(
    offenders,
    [],
    `no ${SCREENSHOT_CALL} call may be introduced: there is no baseline, and a ` +
      `new one is cross-platform flaky. The assertion is built from parts so ` +
      `this guard does not match itself.`,
  );
});
