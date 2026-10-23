import { test } from "node:test";
import assert from "node:assert/strict";
import { at, blocks, declarations } from "./support/css-parsing.ts";
import { readTree } from "./support/fs-tree.ts";
import { GLOBAL, PORTFOLIO, SHEETS } from "./support/stylesheets.ts";
import { KEYS, dark, light } from "./support/theme-tokens.ts";

/**
 * Token contract, declaration half: key parity and provenance across both
 * modes, the focus alias, bare-literal and dead-artifact guards, and the
 * consumer/dangling-reference checks. The parsed token maps live in
 * `./support/theme-tokens.ts`.
 */

const CATEGORIES: Record<string, string> = {
  "hovered background step": "--color-surface-hover",
  "pressed background step": "--color-surface-active",
  "decorative container border": "--color-border",
  "interactive component border": "--color-border-interactive",
  "focus ring": "--color-focus",
  "focus ink": "--color-on-focus",
};

test("A1: dark and light declare the same 21 --color-* keys", () => {
  for (const [mode, declared] of [
    ["dark", dark],
    ["light", light],
  ] as const) {
    for (const key of KEYS) {
      assert.ok(declared.has(key), `${mode} block is missing ${key}`);
    }
  }
  assert.deepEqual([...dark.keys()].sort(), [...light.keys()].sort());
  assert.deepEqual([...dark.keys()].sort(), [...KEYS].sort());
});

test("A2: both modes declare every state and border category", () => {
  for (const [mode, declared] of [
    ["dark", dark],
    ["light", light],
  ] as const) {
    for (const [category, key] of Object.entries(CATEGORIES)) {
      assert.ok(declared.has(key), `${mode} declares no ${category} (${key})`);
    }
    assert.notEqual(
      declared.get("--color-border"),
      declared.get("--color-border-interactive"),
      `${mode} collapses the container and interactive borders onto one value`,
    );
  }
});

test("A6: superseded literals and the withdrawn ratio are gone", () => {
  const files: Record<string, string> = {
    "src/styles/global.css": GLOBAL,
    "src/styles/portfolio.css": PORTFOLIO,
    "README.md": at("README.md"),
    ".claude/CLAUDE.md": at(".claude/CLAUDE.md"),
  };
  for (const [file, text] of Object.entries(files)) {
    for (const literal of ["#dda783", "#080909", "#0055aa", "9.5:1"]) {
      assert.ok(!text.includes(literal), `${file} restates ${literal}`);
    }
  }
});

test("A6: the confirmed-dead artifacts are not declared", () => {
  for (const [file, css] of SHEETS) {
    for (const artifact of [
      "--color-surface-glass",
      ".gradient-text",
      ".text-muted",
      ".btn-secondary",
    ]) {
      assert.ok(!css.includes(artifact), `${file} still declares ${artifact}`);
    }
  }
});

test("A9: the focus pair aliases the accent pair in both modes", () => {
  for (const [mode, declared] of [
    ["dark", dark],
    ["light", light],
  ] as const) {
    assert.equal(
      declared.get("--color-focus"),
      declared.get("--color-accent"),
      `${mode} --color-focus must equal --color-accent`,
    );
    assert.equal(
      declared.get("--color-on-focus"),
      declared.get("--color-on-accent"),
      `${mode} --color-on-focus must equal --color-on-accent`,
    );
  }
});

test("A10: no radius or motion value is a bare literal", () => {
  const radii = new Set(["border-radius"]);
  const motion = new Set(["transition", "transition-delay", "animation-delay"]);
  const bareTime = /\d+(?:\.\d+)?m?s\b/;
  for (const [file, css] of SHEETS) {
    for (const { property, value } of declarations(css, radii)) {
      assert.ok(
        value.includes("var(--radius-"),
        `${file}: ${property}: ${value} must use a --radius-* token`,
      );
    }
    for (const { property, value } of declarations(css, motion)) {
      const normalised = value.toLowerCase().replace("!important", "").trim();
      if (normalised === "none") continue;
      assert.ok(
        normalised.includes("var(--motion-"),
        `${file}: ${property}: ${value} must use a --motion-* token`,
      );
      assert.ok(
        !bareTime.test(normalised),
        `${file}: ${property}: ${value} still holds a bare duration`,
      );
    }
  }
});

/**
 * The two danger keys are declared, deliberately unread, and exception-listed.
 * Whether to wire or delete them is a follow-up decision outside this change;
 * A4 pins the list so it cannot grow without editing this file, which forces
 * the decision into review.
 */
const DEAD_TOKEN_EXCEPTIONS = ["--color-danger", "--color-on-danger"];

test("A1: parity is read from the token-declaring light block, not the color-scheme one", () => {
  const lightBlocks = blocks(GLOBAL, /\[data-theme="light"\]\s*\{/g);
  const canvasDeclarations = lightBlocks.filter((block) =>
    block.includes("--color-surface:"),
  );
  assert.equal(
    canvasDeclarations.length,
    1,
    'exactly one [data-theme="light"] block may declare --color-surface: the ' +
      "token block. The `color-scheme` block and the light `prefers-contrast` " +
      "counterpart declare neither the canvas nor the base tertiary value, so " +
      "A1 can never silently read one of them for parity",
  );
  assert.match(
    canvasDeclarations[0],
    /--color-text-tertiary:\s*#746555;/,
    "the parity map's tertiary value must be the shipped base light value, not " +
      "the `prefers-contrast: more` gate value #5c4a39",
  );
  assert.equal(
    light.size,
    KEYS.length,
    `the light token block must declare all ${KEYS.length} keys`,
  );
});

test("A3: every declared --color-* key has a consumer, or is a recorded dead-token exception", () => {
  const source = `${readTree("src")}\n${readTree("public")}`;
  const consumerless = [...new Set([...dark.keys(), ...light.keys()])].filter(
    (key) =>
      !source.includes(`var(${key})`) && !DEAD_TOKEN_EXCEPTIONS.includes(key),
  );
  assert.deepEqual(
    consumerless,
    [],
    "every declared --color-* key needs a var(--color-…) reference under src/ or " +
      "public/ unless it is exception-listed: a key nobody reads is a key nobody " +
      "can see break",
  );
});

test("A4: the dead-token exception list holds exactly the two danger keys", () => {
  assert.deepEqual(
    DEAD_TOKEN_EXCEPTIONS,
    ["--color-danger", "--color-on-danger"],
    "the exception list may not grow without a recorded follow-up decision, and " +
      "growing it means editing this assertion",
  );
});

test("A5: every var(--color-*) used under src/ resolves to a declared key", () => {
  const source = readTree("src");
  const declared = new Set([...dark.keys(), ...light.keys()]);
  const dangling = [
    ...new Set(
      [...source.matchAll(/var\((--color-[\w-]+)/g)].map((match) => match[1]),
    ),
  ].filter((key) => !declared.has(key));
  assert.deepEqual(
    dangling,
    [],
    "a dangling reference renders `currentColor` silently — this is the guard for " +
      "the --color-border-hover rename",
  );
});
