import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BORDER,
  EXEMPT_ACTIVE,
  PORTFOLIO,
  STATES,
  blocksFor,
  lineOf,
  ruleDeclarations,
  winner,
} from "./support/state-border.ts";

/**
 * The exempted element's border cascade (`theme-state-hardening`, amended
 * scenario): the winning declaration sits in the last same-selector block,
 * and the press ring and border box survive. See `./support/state-border.ts`
 * for what this contract proves and what it does not.
 */

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
      for (const declaration of ruleDeclarations(rule.body, BORDER)) {
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
