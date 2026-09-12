import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Token contract. Reads the `@theme` block and the `--color-*`-declaring
 * `[data-theme="light"]` block — never the second light block that only sets
 * `color-scheme`, which a naive regex would pick up.
 */

const at = (rel: string) =>
  readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function body(css: string, open: number): string {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && (depth -= 1) === 0)
      return css.slice(open + 1, i);
  }
  throw new Error("unbalanced block");
}

function blocks(css: string, header: RegExp): string[] {
  const out: string[] = [];
  for (const match of css.matchAll(header)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    assert.equal(css[open], "{");
    out.push(body(css, open));
  }
  return out;
}

function tokens(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, key, value] of css.matchAll(
    /(--color-[\w-]+)\s*:\s*([^;]+);/g,
  )) {
    map.set(key, value.trim());
  }
  return map;
}

function declarations(css: string, names: Set<string>) {
  const out: { property: string; value: string }[] = [];
  for (const chunk of css.split(/[;{}]/)) {
    const match = /^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(chunk);
    if (match && names.has(match[1])) {
      out.push({ property: match[1], value: match[2].replace(/\s+/g, " ") });
    }
  }
  return out;
}

const GLOBAL = strip(at("src/styles/global.css"));
const PORTFOLIO = strip(at("src/styles/portfolio.css"));
const SHEETS = [
  ["src/styles/global.css", GLOBAL],
  ["src/styles/portfolio.css", PORTFOLIO],
] as const;

const dark = tokens(blocks(GLOBAL, /@theme\s*\{/g)[0]);
const light = tokens(
  blocks(GLOBAL, /\[data-theme="light"\]\s*\{/g).find((b) =>
    b.includes("--color-"),
  ) ?? "",
);

const KEYS =
  `--color-surface --color-surface-alt --color-surface-elevated --color-surface-hover
--color-surface-active --color-text --color-text-secondary --color-text-tertiary
--color-accent --color-accent-muted --color-accent-hover --color-accent-active
--color-on-accent --color-border --color-border-strong --color-border-interactive
--color-border-interactive-hover --color-focus --color-on-focus
--color-danger --color-on-danger`.split(/\s+/);

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
