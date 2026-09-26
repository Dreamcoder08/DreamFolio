import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readCssInlined } from "./support/css-imports.ts";

/**
 * The exempted element's border contract (`theme-state-hardening`, amended
 * scenario).
 *
 * `.contact-section .solid-link` rests at `--color-surface` on `--color-text` —
 * 17.91:1 dark, 15.60:1 light — which is the palette ceiling. No state can raise
 * that, and the design's own rule for max-brightness elements is therefore to
 * signal through geometry rather than colour. The change that hardened the
 * dark theme left the hover and press `border-color` as `currentColor`, which on
 * this element resolves to `--color-surface` — the exact value the label already
 * carries, i.e. no border change at all, and no state token standing behind the
 * border. The amended scenario requires the *border* of the exempted element to
 * come from a state token even though its label must not move.
 *
 * What this file proves, and what it does not:
 *
 *  - It reads source declarations, not rendered pixels: `node:fs` +
 *    `node:test` + `node:assert/strict`, no new dependency, and no browser.
 *  - It resolves "which declaration wins" for the two state selectors by
 *    emulating the only cascade rule that can matter here — same specificity,
 *    same (unlayered) origin, so last declaration in source order wins. That is a
 *    real simplification: a hypothetical *differently* specific selector would
 *    outrank this order, and this scanner would not see it.
 *  - It says nothing about whether the token's *value* keeps the border legible
 *    against the element's fill. That is measured on the composed value in
 *    `tests/theme-state/state-evidence.spec.ts`.
 *
 * Known tree fact this file has to model: `portfolio.css` carries **two** rules
 * with the selector `.contact-section .solid-link:hover`. The later one declares
 * `color`, `background` and `border-color` and therefore shadows the earlier one
 * for all three properties, so only the later block can decide the computed
 * border. The contract below is deliberately written against the *winning*
 * declaration for that reason: an "every block must be tokenised" clause would
 * be unsatisfiable in the current tree without an edit the change did not
 * authorise, and would fail for a reason the browser never observes.
 */

const at = (rel: string) =>
  readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");

/** Blank out comments while keeping every byte offset (and therefore every
 *  line number) intact, so a failure can point at the real line of the file. */
const blind = (css: string): string =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));

interface Rule {
  readonly prelude: string;
  readonly body: string;
  /** Offset of the body's first character, used to order rules by source position. */
  readonly start: number;
}

/**
 * Minimal block scanner: enough to know a rule's selector list, its body, and
 * where it sits in the file. `;` terminates a prelude so an at-rule statement
 * cannot glue itself onto the next block's header, and nested braces are counted
 * so a declaration-only rule inside an `@media` still closes correctly.
 */
function rules(css: string): Rule[] {
  const found: Rule[] = [];
  const stack: { prelude: string; bodyStart: number }[] = [];
  let preludeStart = 0;
  let index = 0;
  while (index < css.length) {
    const character = css[index];
    if (character === "{") {
      stack.push({
        prelude: css.slice(preludeStart, index).trim(),
        bodyStart: index + 1,
      });
      index += 1;
      preludeStart = index;
    } else if (character === "}") {
      const frame = stack.pop();
      if (frame === undefined) throw new Error("unbalanced CSS block");
      found.push({
        prelude: frame.prelude,
        body: css.slice(frame.bodyStart, index),
        start: frame.bodyStart,
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
  return found.sort((a, b) => a.start - b.start);
}

function selectors(prelude: string): string[] {
  return prelude
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function declarations(
  body: string,
  names: ReadonlySet<string>,
): { property: string; value: string }[] {
  const out: { property: string; value: string }[] = [];
  for (const chunk of body.split(";")) {
    const match = /^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(chunk);
    if (match && names.has(match[1])) {
      out.push({ property: match[1], value: match[2].replace(/\s+/g, " ") });
    }
  }
  return out;
}

const PORTFOLIO = blind(readCssInlined("src/styles/portfolio.css"));
const GLOBAL = blind(at("src/styles/global.css"));

const lineOf = (css: string, offset: number): number =>
  css.slice(0, offset).split("\n").length;

/** Every rule whose selector list contains `selector`, in source order. */
function blocksFor(css: string, selector: string): Rule[] {
  return rules(css).filter((rule) =>
    selectors(rule.prelude).includes(selector),
  );
}

interface Winner {
  readonly value: string;
  readonly rule: Rule;
}

/**
 * The declaration the browser would use for `selector`'s `property`: same
 * specificity, same unlayered origin, so the last declaration in source order
 * wins. Returns null when no matching rule declares the property at all.
 */
function winner(
  css: string,
  selector: string,
  property: string,
): Winner | null {
  let found: Winner | null = null;
  for (const rule of blocksFor(css, selector)) {
    for (const declaration of declarations(rule.body, new Set([property]))) {
      found = { value: declaration.value, rule };
    }
  }
  return found;
}

/** The two state rules of the exempted element. */
const EXEMPT_HOVER = ".contact-section .solid-link:hover";
const EXEMPT_ACTIVE = ".contact-section .solid-link:active";

const STATES: readonly { selector: string; state: string }[] = [
  { selector: EXEMPT_HOVER, state: "hover" },
  { selector: EXEMPT_ACTIVE, state: "press" },
];

const BORDER = new Set(["border-color", "border"]);

test("(a) the exempted element still declares both of its state rules", () => {
  const missing = STATES.filter(
    ({ selector }) => blocksFor(PORTFOLIO, selector).length === 0,
  ).map(({ selector }) => selector);
  assert.deepEqual(
    missing,
    [],
    "src/styles/portfolio.css no longer declares a rule for every state of " +
      ".contact-section .solid-link. The amended scenario's exempted element is " +
      "identified by these exact selectors: deleting the block, or renaming the " +
      "selector (for example to `.contact-section .solid-link` or to a bare " +
      "`.solid-link`), removes the state signal this contract exists to protect " +
      "and must fail here rather than silently pass",
  );
});

test("(b) each state's border resolves from a state token, never currentColor", () => {
  const failures: string[] = [];
  for (const { selector, state } of STATES) {
    const border = winner(PORTFOLIO, selector, "border-color");
    const where = `${selector} (${state} border)`;
    if (border === null) {
      failures.push(`${where}: no \`border-color\` declaration at all`);
      continue;
    }
    const line = lineOf(PORTFOLIO, border.rule.start);
    if (border.value === "currentColor") {
      failures.push(
        `${where}: src/styles/portfolio.css:${line} declares ` +
          `\`border-color: currentColor\` — the element inverts (fill ` +
          `--color-text, ink --color-surface), so currentColor resolves to ` +
          `--color-surface, which is the label's own value and no state token`,
      );
      continue;
    }
    if (!/^var\(--color-[\w-]+\)$/.test(border.value)) {
      failures.push(
        `${where}: src/styles/portfolio.css:${line} declares ` +
          `\`border-color: ${border.value}\`, which is neither a --color-* state ` +
          `token reference nor a literal this contract can resolve`,
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    "the amended theme-state-hardening scenario requires the exempted element's " +
      "border to come from a state token: an element whose at-rest label sits at " +
      "the palette ceiling may keep its label, but not its border, exempt from the " +
      "state-token system",
  );
});

test("(c) the token the border names is actually declared, so the border cannot fall back", () => {
  const undeclared: string[] = [];
  for (const { selector, state } of STATES) {
    const border = winner(PORTFOLIO, selector, "border-color");
    const token = /^var\((--[\w-]+)\)$/.exec(border?.value ?? "")?.[1] ?? null;
    if (token === null) {
      undeclared.push(
        `${selector} (${state}): the winning border-color is ` +
          `\`${border?.value ?? "<missing>"}\`, so no token can be resolved`,
      );
      continue;
    }
    // Declaration presence is read by splitting, not by building a regex from
    // the token: a dynamically assembled pattern is a ReDoS smell a scanner
    // cannot distinguish from a real one, and this check needs no pattern at all.
    // `blind()` has already blanked comments, so a piece before `:` is the name.
    const declared = GLOBAL.split(/[;{]/).some(
      (declaration) => declaration.split(":")[0]?.trim() === token,
    );
    if (!declared) {
      undeclared.push(
        `${selector} (${state}): \`${token}\` is never declared in ` +
          `src/styles/global.css, so \`var(${token})\` would resolve to nothing ` +
          `and the border would inherit the UA value`,
      );
    }
  }
  assert.deepEqual(
    undeclared,
    [],
    "a token reference that no block declares is worse than the currentColor it " +
      "replaced: it fails at computed-value time, silently, in both themes",
  );
});

test("(d) the winning block is the last same-selector block, so no shadowed block can resurrect currentColor", () => {
  const problems: string[] = [];
  const shadowed: string[] = [];
  for (const { selector, state } of STATES) {
    const blocks = blocksFor(PORTFOLIO, selector);
    const effective = winner(PORTFOLIO, selector, "border-color");
    if (effective === null) {
      problems.push(`${selector} (${state}): no border-color declaration`);
      continue;
    }
    const last = blocks[blocks.length - 1];
    for (const rule of blocks.slice(0, -1)) {
      for (const declaration of declarations(rule.body, BORDER)) {
        shadowed.push(
          `${selector} (${state}): src/styles/portfolio.css:${lineOf(
            PORTFOLIO,
            rule.start,
          )} \`${declaration.property}: ${declaration.value}\``,
        );
      }
    }
    if (last.start !== effective.rule.start) {
      problems.push(
        `${selector} (${state}): the winning declaration sits in an earlier block ` +
          `(src/styles/portfolio.css:${lineOf(PORTFOLIO, effective.rule.start)}), ` +
          `so the last same-selector block declares no border and an earlier value ` +
          `decides the rendered border`,
      );
    }
  }
  assert.deepEqual(
    problems,
    [],
    "with two rules sharing a selector the last one decides. If the winning block " +
      "stops declaring a border-color, an earlier `currentColor` declaration — which " +
      "this change deliberately does not edit — becomes the rendered border again, " +
      "without any visible change to the block the change touched. Shadowed " +
      "declarations found while checking: " +
      (shadowed.length === 0 ? "none" : shadowed.join("; ")),
  );
});

test("(e) the press rule still declares its own outline, so the press ring survives", () => {
  const active = winner(PORTFOLIO, EXEMPT_ACTIVE, "outline");
  const line =
    active === null
      ? "no declaration"
      : `${active.value} (line ${lineOf(PORTFOLIO, active.rule.start)})`;
  assert.ok(
    active !== null,
    "`.contact-section .solid-link:active` lost its `outline` declaration. The press " +
      "ring is the non-colour half of this element's press signal — the element keeps " +
      "its fill by design, so hover and press are told apart by `transform` plus this " +
      "ring, and removing it would take away the light-mode press ring entirely",
  );
  assert.match(
    active.value,
    /^\s*[1-9][\d.]*px\s+/,
    `\`outline: ${line}\` no longer carries a non-zero width, so the press ring ` +
      `renders nothing: the border token this contract enforces is a colour change ` +
      `that other elements also perform, and the ring is what makes the press of ` +
      `this exempted element legible without one`,
  );
});

test("(e) the border box is kept, so the tokenised colour has a border to paint", () => {
  // Guards against "fixing" (b) by deleting the border instead of tokenising
  // its colour: `outline` is drawn outside the element over the page surface, so
  // a ring is not a substitute for a border over the element's own fill.
  const failures: string[] = [];
  for (const { selector, state } of STATES) {
    if (winner(PORTFOLIO, selector, "border-color") === null) {
      failures.push(`${selector} (${state}): border-color is gone`);
      continue;
    }
    const block = blocksFor(PORTFOLIO, selector).at(-1);
    const body = block?.body ?? "";
    if (/border\s*:\s*none/.test(body) || /\bborder-width\s*:\s*0/.test(body)) {
      failures.push(
        `${selector} (${state}): src/styles/portfolio.css:${lineOf(
          PORTFOLIO,
          block?.start ?? 0,
        )} removes the border box instead of tokenising its colour, so there is no ` +
          `border over the element's fill left to contrast-check`,
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    "the exempted element's press ring lives on `outline`, which is painted outside " +
      "the element over the page surface. Deleting the border to satisfy the state " +
      "token requirement swaps a border over the element's own fill for a ring over " +
      "the section fill, which is a different contrast question",
  );
});
