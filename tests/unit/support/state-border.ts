import { readCssInlined } from "./css-imports.ts";

/**
 * The exempted element's border contract (`theme-state-hardening`, amended
 * scenario): the shared scanner and fixtures read by
 * `tests/unit/state-border-provenance.test.ts` (clauses a-c) and
 * `tests/unit/state-border-cascade.test.ts` (clauses d-e).
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
 * What these files prove, and what they do not:
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
 *    `tests/theme-state/border-provenance.spec.ts`.
 *
 * Known tree fact this file has to model: `portfolio.css` carries **two** rules
 * with the selector `.contact-section .solid-link:hover`. The later one declares
 * `color`, `background` and `border-color` and therefore shadows the earlier one
 * for all three properties, so only the later block can decide the computed
 * border. The contract clauses in `state-border-provenance.test.ts` and
 * `state-border-cascade.test.ts` are deliberately written against the *winning*
 * declaration for that reason: an "every block must be tokenised" clause would
 * be unsatisfiable in the current tree without an edit the change did not
 * authorise, and would fail for a reason the browser never observes.
 */

/** Blank out comments while keeping every byte offset (and therefore every
 *  line number) intact, so a failure can point at the real line of the file. */
export const blind = (css: string): string =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));

export interface Rule {
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
export function rules(css: string): Rule[] {
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

export function selectors(prelude: string): string[] {
  return prelude
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

/**
 * Body-level declarations, split on `;` only. Deliberately not
 * `css-parsing.ts`'s `declarations`, which also splits on braces and would
 * therefore read a nested rule's declarations as the parent rule's own.
 */
export function ruleDeclarations(
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

export const PORTFOLIO = blind(readCssInlined("src/styles/portfolio.css"));
export const GLOBAL = blind(readCssInlined("src/styles/global.css"));

export const lineOf = (css: string, offset: number): number =>
  css.slice(0, offset).split("\n").length;

/** Every rule whose selector list contains `selector`, in source order. */
export function blocksFor(css: string, selector: string): Rule[] {
  return rules(css).filter((rule) =>
    selectors(rule.prelude).includes(selector),
  );
}

export interface Winner {
  readonly value: string;
  readonly rule: Rule;
}

/**
 * The declaration the browser would use for `selector`'s `property`: same
 * specificity, same unlayered origin, so the last declaration in source order
 * wins. Returns null when no matching rule declares the property at all.
 */
export function winner(
  css: string,
  selector: string,
  property: string,
): Winner | null {
  let found: Winner | null = null;
  for (const rule of blocksFor(css, selector)) {
    for (const declaration of ruleDeclarations(
      rule.body,
      new Set([property]),
    )) {
      found = { value: declaration.value, rule };
    }
  }
  return found;
}

/** The two state rules of the exempted element. */
const EXEMPT_HOVER = ".contact-section .solid-link:hover";
export const EXEMPT_ACTIVE = ".contact-section .solid-link:active";

export const STATES: readonly { selector: string; state: string }[] = [
  { selector: EXEMPT_HOVER, state: "hover" },
  { selector: EXEMPT_ACTIVE, state: "press" },
];

export const BORDER = new Set(["border-color", "border"]);
