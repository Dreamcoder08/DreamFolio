import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GLOBAL,
  PORTFOLIO,
  STATES,
  blocksFor,
  lineOf,
  winner,
} from "./support/state-border.ts";

/**
 * The exempted element's border provenance (`theme-state-hardening`, amended
 * scenario): its state rules exist, each state's border resolves from a
 * state token, and that token is declared. See `./support/state-border.ts`
 * for what this contract proves and what it does not.
 */

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
