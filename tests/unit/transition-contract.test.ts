import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Unit 4's RED-first transition contract (design §7.3).
 *
 * This file is written against the tree that still carries `global.css`'s
 * universal `*, *::before, *::after { transition: … }`, and observed failing
 * before that rule is removed. Three clauses:
 *
 *  (a) no universal `*` / `*::before` / `*::after` transition rule remains in
 *      either stylesheet — except the `prefers-reduced-motion: reduce`
 *      neutralisation, which must stay live;
 *  (b) every selector in the interactive set declares a transition containing
 *      `var(--motion-`;
 *  (c) no transition holds a bare time literal.
 *
 * Like the token contract, this reads declarations rather than the cascade: a
 * small block scanner, `node:fs` + `node:test` + `node:assert/strict`, and no
 * new dependency. That is also its honest limitation — it proves the rules
 * exist in source, not that the browser composes them; unit 3's e2e harness and
 * the human visual pass cover that.
 */

const at = (rel: string) =>
  readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

interface Rule {
  readonly prelude: string;
  readonly body: string;
  /** The enclosing `@media` prelude, or null when the rule is unconditional. */
  readonly media: string | null;
}

/**
 * Minimal block scanner: enough to know a rule's selector, its body, and the
 * `@media` that wraps it. `;` terminates a prelude so `@import …;` cannot be
 * glued onto the next block's header, and braces inside declaration bodies are
 * counted so an at-rule nested in a `@media` keeps the right context.
 */
function rules(css: string): Rule[] {
  const found: Rule[] = [];
  const stack: { prelude: string; bodyStart: number; media: string | null }[] =
    [];
  let preludeStart = 0;
  let index = 0;
  while (index < css.length) {
    const character = css[index];
    if (character === "{") {
      const prelude = css.slice(preludeStart, index).trim();
      const parentMedia =
        stack.length > 0 ? stack[stack.length - 1].media : null;
      const media = prelude.startsWith("@media") ? prelude : parentMedia;
      stack.push({ prelude, bodyStart: index + 1, media });
      index += 1;
      preludeStart = index;
    } else if (character === "}") {
      const frame = stack.pop();
      if (frame === undefined) throw new Error("unbalanced CSS block");
      found.push({
        prelude: frame.prelude,
        body: css.slice(frame.bodyStart, index),
        media: frame.media,
      });
      index += 1;
      preludeStart = index;
    } else if (character === ";") {
      index += 1;
      preludeStart = index;
    } else {
      index += 1;
    }
  }
  return found;
}

function selectors(prelude: string): string[] {
  return prelude
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function declarations(body: string, names: Set<string>) {
  const out: { property: string; value: string }[] = [];
  for (const chunk of body.split(";")) {
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

/** The only selector list that may still carry a universal transition. */
const UNIVERSAL = new Set(["*", "*::before", "*::after"]);
const REDUCED_MOTION = "@media (prefers-reduced-motion: reduce)";
const TRANSITION = new Set(["transition"]);

function isUniversal(prelude: string): boolean {
  const parts = selectors(prelude);
  return parts.length > 0 && parts.every((part) => UNIVERSAL.has(part));
}

test("(a) no universal transition rule survives outside the reduced-motion guard", () => {
  const survivors: string[] = [];
  for (const [file, css] of SHEETS) {
    for (const rule of rules(css)) {
      if (!isUniversal(rule.prelude)) continue;
      for (const { value } of declarations(rule.body, TRANSITION)) {
        const neutralisation =
          rule.media === REDUCED_MOTION && /^none\s*!important$/.test(value);
        if (!neutralisation) {
          survivors.push(`${file}: ${rule.prelude} { transition: ${value} }`);
        }
      }
    }
  }
  assert.deepEqual(
    survivors,
    [],
    "the universal transition animated background-color, border-color and color " +
      "on every element, including non-interactive ones, and it is load-bearing by " +
      "accident. It may only be deleted together with its explicit replacements, and " +
      "the sole universal transition that may remain is the reduced-motion " +
      "`none !important` neutralisation",
  );
});

test("(a) the reduced-motion guard still neutralises transition, animation and scroll-behavior", () => {
  const guard = rules(GLOBAL).find(
    (rule) => rule.media === REDUCED_MOTION && isUniversal(rule.prelude),
  );
  assert.ok(
    guard !== undefined,
    "global.css declares no universal reduced-motion guard",
  );
  const neutralised = declarations(
    guard.body,
    new Set(["transition", "animation", "scroll-behavior"]),
  ).map((declaration) => `${declaration.property}: ${declaration.value}`);
  assert.deepEqual(
    neutralised.sort(),
    [
      "animation: none !important",
      "scroll-behavior: auto !important",
      "transition: none !important",
    ].sort(),
    "the reduced-motion guard is a different rule from the universal transition and " +
      "must keep working after the removal: every selector-based transition added in " +
      "unit 4 depends on this `!important` neutralisation",
  );
});

/**
 * The design's explicit interactive set (task 4.3 / design §7.3). `a`, `.card`,
 * the image transforms and `[data-reveal]` already declared tokenised transitions
 * before unit 4; the rest relied on the universal rule alone.
 */
const INTERACTIVE = [
  "a",
  ".theme-toggle",
  ".menu-toggle",
  ".nav-contact",
  ".circle-link",
  ".mobile-nav a",
  ".site-footer > a",
  ".contact-social a",
  ".quiet-link",
  ".project-links a",
  ".desktop-nav a",
  ".solid-link",
  ".btn-primary",
  ".skip-link",
  ".card",
  ".module-row",
  ".project-image img",
  ".compact-image img",
];

const MOTION_PROPERTIES = new Set(["transition"]);

test("(b) every interactive selector declares a tokenised transition", () => {
  const missing: string[] = [];
  for (const selector of INTERACTIVE) {
    const declared = SHEETS.some(([, css]) =>
      rules(css).some(
        (rule) =>
          selectors(rule.prelude).includes(selector) &&
          declarations(rule.body, MOTION_PROPERTIES).some((declaration) =>
            declaration.value.includes("var(--motion-"),
          ),
      ),
    );
    if (!declared) missing.push(selector);
  }
  assert.deepEqual(
    missing,
    [],
    "the universal rule used to transition these selectors implicitly. Once it is " +
      "gone, a selector without an explicit tokenised transition loses its hover " +
      "smoothing silently — there is no rendered test that catches it",
  );
});

const DURATION_PROPERTIES = new Set([
  "transition",
  "transition-duration",
  "transition-delay",
]);
const BARE_TIME = /\b\d*\.?\d+(?:ms|s)\b/;

test("(c) no transition holds a bare time literal", () => {
  const offenders: string[] = [];
  for (const [file, css] of SHEETS) {
    for (const rule of rules(css)) {
      for (const { property, value } of declarations(
        rule.body,
        DURATION_PROPERTIES,
      )) {
        const normalised = value
          .toLowerCase()
          .replace(/!important/g, "")
          .trim();
        if (normalised === "none" || normalised === "") continue;
        if (BARE_TIME.test(normalised)) {
          offenders.push(`${file}: ${rule.prelude} { ${property}: ${value} }`);
        }
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "every transition must resolve through a --motion-* token: a bare duration is " +
      "the second motion system this change consolidates away",
  );
});
