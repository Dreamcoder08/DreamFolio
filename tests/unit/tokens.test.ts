import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  composite,
  formatRatio,
  ratio,
  relativeLuminance,
} from "../support/contrast.ts";

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

/* ============================================================
       Unit-3 completions: A1 provenance, A3-A5, A7-A8, A11, the
       color-mix() composition table, and the screenshot-absence guard.
       ============================================================ */

const MODES = ["dark", "light"] as const;
const DECLARED: Record<(typeof MODES)[number], Map<string, string>> = {
  dark,
  light,
};

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const TEXT_EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".txt",
]);

function walk(relative: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(join(ROOT, relative), {
    withFileTypes: true,
  })) {
    const next = `${relative}/${entry.name}`;
    if (entry.isDirectory()) found.push(...walk(next));
    else found.push(next);
  }
  return found;
}

/** Every text file under `relative`, concatenated: a consumer may live in any of them. */
function readTree(relative: string): string {
  return walk(relative)
    .filter((path) => TEXT_EXTENSIONS.has(extname(path)))
    .map((path) => readFileSync(join(ROOT, path), "utf8"))
    .join("\n");
}

function token(declared: Map<string, string>, key: string): string {
  const value = declared.get(key);
  if (value === undefined) {
    throw new Error(`${key} is not declared in this mode`);
  }
  return value;
}

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

interface ContrastFloor {
  readonly mode: (typeof MODES)[number];
  readonly foreground: string;
  readonly background: string;
  readonly floor: number;
  readonly role: string;
}

/**
 * Design §1.1's floors, all computed from the declared literals. The dark border
 * set is the change's self-imposed floor and carries no conformance claim; the
 * light border ratios stay at their shipped levels and are recorded as accepted
 * debt, so no light border floor appears here.
 */
const FLOORS: readonly ContrastFloor[] = [
  {
    mode: "dark",
    foreground: "--color-text",
    background: "--color-surface-hover",
    floor: 4.5,
    role: "label on the hovered state step",
  },
  {
    mode: "dark",
    foreground: "--color-text",
    background: "--color-surface-active",
    floor: 4.5,
    role: "label on the pressed state step",
  },
  {
    mode: "dark",
    foreground: "--color-on-accent",
    background: "--color-accent-hover",
    floor: 4.5,
    role: "ink on the hovered accent fill",
  },
  {
    mode: "dark",
    foreground: "--color-on-accent",
    background: "--color-accent-active",
    floor: 4.5,
    role: "ink on the pressed accent fill",
  },
  {
    mode: "dark",
    foreground: "--color-text-tertiary",
    background: "--color-surface",
    floor: 4.5,
    role: "tertiary ink on the canvas",
  },
  {
    mode: "dark",
    foreground: "--color-text-tertiary",
    background: "--color-surface-alt",
    floor: 4.5,
    role: "tertiary ink on the card",
  },
  {
    mode: "dark",
    foreground: "--color-focus",
    background: "--color-surface",
    floor: 3,
    role: "focus ring vs the canvas (1.4.11 focus clause)",
  },
  {
    mode: "dark",
    foreground: "--color-on-focus",
    background: "--color-accent",
    floor: 3,
    role: "ink focus ring on an accent fill",
  },
  {
    mode: "dark",
    foreground: "--color-border-interactive",
    background: "--color-surface",
    floor: 3,
    role: "interactive border on the canvas",
  },
  {
    mode: "dark",
    foreground: "--color-border-interactive",
    background: "--color-surface-alt",
    floor: 3,
    role: "interactive border on the card",
  },
  {
    mode: "dark",
    foreground: "--color-border-interactive",
    background: "--color-surface-elevated",
    floor: 3,
    role: "interactive border on the overlay",
  },
  {
    mode: "light",
    foreground: "--color-text",
    background: "--color-surface-hover",
    floor: 4.5,
    role: "label on the hovered state step",
  },
  {
    mode: "light",
    foreground: "--color-text",
    background: "--color-surface-active",
    floor: 4.5,
    role: "label on the pressed state step",
  },
  {
    mode: "light",
    foreground: "--color-on-accent",
    background: "--color-accent-hover",
    floor: 4.5,
    role: "ink on the hovered accent fill",
  },
  {
    mode: "light",
    foreground: "--color-on-accent",
    background: "--color-accent-active",
    floor: 4.5,
    role: "ink on the pressed accent fill",
  },
  {
    mode: "light",
    foreground: "--color-text-tertiary",
    background: "--color-surface",
    floor: 4.5,
    role: "tertiary ink on the canvas",
  },
  {
    mode: "light",
    foreground: "--color-text-tertiary",
    background: "--color-surface-elevated",
    floor: 4.5,
    role: "tertiary ink on the overlay",
  },
  {
    mode: "light",
    foreground: "--color-focus",
    background: "--color-surface",
    floor: 3,
    role: "focus ring vs the canvas (1.4.11 focus clause)",
  },
  {
    mode: "light",
    foreground: "--color-on-focus",
    background: "--color-accent",
    floor: 3,
    role: "ink focus ring on an accent fill",
  },
];

test("A7: the state and border contrast floors hold on the declared literals", () => {
  for (const floor of FLOORS) {
    const declared = DECLARED[floor.mode];
    const foreground = token(declared, floor.foreground);
    const background = token(declared, floor.background);
    const measured = ratio(composite(foreground, background), background);
    assert.ok(
      measured >= floor.floor,
      `${floor.mode}: ${floor.foreground} ${foreground} on ${floor.background} ` +
        `${background} (${floor.role}) measures ${formatRatio(measured)}:1, ` +
        `below the ${floor.floor}:1 floor`,
    );
  }
});

test("A7: the hovered interactive border is a step above the resting one in dark", () => {
  for (const surface of [
    "--color-surface",
    "--color-surface-alt",
    "--color-surface-elevated",
  ]) {
    const background = token(dark, surface);
    const rest = ratio(
      composite(token(dark, "--color-border-interactive"), background),
      background,
    );
    const hover = ratio(
      composite(token(dark, "--color-border-interactive-hover"), background),
      background,
    );
    assert.ok(
      hover >= rest,
      `dark: --color-border-interactive-hover on ${surface} (${background}) ` +
        `measures ${formatRatio(hover)}:1 against ` +
        `--color-border-interactive's ${formatRatio(rest)}:1 — the hovered border ` +
        `must be a step above the resting one`,
    );
  }
});

test("A8: the state steps are real and ordered, per mode", () => {
  for (const mode of MODES) {
    const declared = DECLARED[mode];
    const surface = relativeLuminance(token(declared, "--color-surface"));
    const hover = relativeLuminance(token(declared, "--color-surface-hover"));
    const active = relativeLuminance(token(declared, "--color-surface-active"));
    const elevated = relativeLuminance(
      token(declared, "--color-surface-elevated"),
    );

    assert.notEqual(
      hover,
      surface,
      `${mode}: --color-surface-hover must not share --color-surface's luminance ` +
        `(${token(declared, "--color-surface")} vs ` +
        `${token(declared, "--color-surface-hover")}) — the step would be invisible`,
    );
    assert.notEqual(
      active,
      hover,
      `${mode}: --color-surface-active must not share --color-surface-hover's ` +
        `luminance (${token(declared, "--color-surface-hover")} vs ` +
        `${token(declared, "--color-surface-active")})`,
    );

    if (mode === "dark") {
      assert.ok(
        hover > elevated,
        `dark: --color-surface-hover must sit above --color-surface-elevated, so ` +
          `the state step is visible on the canvas, on cards and on overlays — ` +
          `elevated ${token(declared, "--color-surface-elevated")}`,
      );
      assert.ok(
        active > elevated,
        `dark: --color-surface-active must sit above --color-surface-elevated — ` +
          `elevated ${token(declared, "--color-surface-elevated")}`,
      );
    }
  }
});

function colorMixes(css: string): string[] {
  const mixes: string[] = [];
  const marker = "color-mix(";
  let index = css.indexOf(marker);
  while (index !== -1) {
    let depth = 0;
    let cursor = index + marker.length - 1;
    for (; cursor < css.length; cursor += 1) {
      if (css[cursor] === "(") depth += 1;
      else if (css[cursor] === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    mixes.push(css.slice(index + marker.length, cursor));
    index = css.indexOf(marker, cursor);
  }
  return mixes;
}

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  parts.push(current.trim());
  return parts.filter((part) => part !== "");
}

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

function normalise(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*:\s*/g, ": ")
    .trim();
}

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

function escapeSelector(selector: string): string {
  return selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
