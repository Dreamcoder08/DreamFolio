/**
 * Evidence for the exempted element's border provenance — one of the three
 * theme-state scenarios that had no rendered test before `theme-state-hardening`
 * (the others are `prefers-contrast.spec.ts` and `touch-press.spec.ts`).
 *
 * **Border provenance (computed, both themes).** `getComputedStyle` on
 * `.contact-section .solid-link` in hover and in press. Three claims: the
 * computed border differs from the computed `color` — the value `currentColor`
 * produces, so this is the assertion the old declaration fails; the computed
 * border *is* the resolved `--color-surface-active`, which is what makes it a
 * state token rather than some other colour; and the border composited against
 * the element's own resolved fill clears 1.4.11's 3:1 non-text floor. It proves
 * the token resolves and the composed math passes. It does not prove the pixels
 * look right: this change still ships no screenshot baseline.
 *
 * Run with `SITE_BASE=/ pnpm run build && npx playwright test
 * tests/theme-state/`. Like the rest of this suite, the root-base build is part of
 * the harness contract: against a `dist/` built with the default `/DreamFolio/`
 * base the stylesheet 404s and every read silently measures UA defaults.
 */

import { test, expect } from "@playwright/test";
import { EXEMPT, prepare, sameColour } from "./support/evidence";
import { NON_TEXT_FLOOR, THEMES } from "./support/fixtures";
import {
  STATE,
  describeRead,
  type InteractionState,
} from "./support/state-model";
import { formatRatio, ratio } from "../support/contrast";

const BORDER_SIDES = ["top", "right", "bottom", "left"] as const;

const BORDER_STATES: readonly { state: InteractionState; label: string }[] = [
  { state: STATE.HOVER, label: "hover" },
  { state: STATE.ACTIVE, label: "press" },
];

for (const theme of THEMES) {
  test.describe(`Exempted element border provenance — ${theme}`, () => {
    for (const { state, label } of BORDER_STATES) {
      test(
        `${EXEMPT} takes its ${label} border from a state token, not from currentColor`,
        {
          tag: [
            "@critical",
            "@e2e",
            "@theme-state",
            `@THEME-STATE-BORDER-${theme}-${label.toUpperCase()}`,
          ],
        },
        async ({ page }) => {
          const ui = await prepare(page, theme);
          const read = await ui.readState(EXEMPT, state);
          const stateToken = await ui.tokenValue("--color-surface-active");

          const painted = BORDER_SIDES.map(
            (side) => `${side} ${read.borders[side]}`,
          ).join(", ");
          const fillRatio = ratio(read.borders.top, read.surface);
          const context =
            `${EXEMPT} [${label}] — ${theme}: computed color ${read.color}, ` +
            `borders ${painted}, element fill ${read.surface} ` +
            `(${describeRead(read)})`;

          test.info().annotations.push({
            type: "border-provenance",
            description:
              `${EXEMPT} [${label}] — ${theme}: computed color ${read.color}; ` +
              `borders ${painted}; element fill ${read.surface}; label on fill ` +
              `${formatRatio(read.ratio)}:1; border over fill ` +
              `${formatRatio(fillRatio)}:1; --color-surface-active ${stateToken}`,
          });

          for (const side of BORDER_SIDES) {
            expect(
              read.borders[side],
              `${context} — the ${side} border equals the computed \`color\`, which ` +
                `is exactly what \`border-color: currentColor\` resolves to. This ` +
                `element inverts (fill --color-text, ink --color-surface), so ` +
                `currentColor gives the border the label's own value and no state ` +
                `token stands behind it — the requirement the amended scenario ` +
                `fails`,
            ).not.toBe(read.color);
          }

          expect(
            sameColour(read.borders.top, stateToken),
            `${context} — the surviving border colour must be the resolved state ` +
              `token \`--color-surface-active\` (${stateToken}), not merely a colour ` +
              `that is not currentColor: portfolio.css declares ` +
              `\`border-color: var(--color-surface-active)\` for both states`,
          ).toBe(true);

          expect(
            fillRatio,
            `${context} — the ${label === "press" ? "pressed" : "hovered"} border ` +
              `must keep 1.4.11's ${NON_TEXT_FLOOR}:1 against the element's own ` +
              `resolved fill: ${read.borders.top} over ${read.surface} measures ` +
              `${formatRatio(fillRatio)}:1`,
          ).toBeGreaterThanOrEqual(NON_TEXT_FLOOR);
        },
      );
    }
  });
}
