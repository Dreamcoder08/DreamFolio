/**
 * Focus-ring geometry and the ink variant, under the same determinism levers as
 * `theme-state.spec.ts` (theme pinned before the first paint, reduced motion
 * emulated before navigation, focus reached with real `Tab` presses).
 */

import { test, expect } from "@playwright/test";
import {
  HOME,
  NON_TEXT_FLOOR,
  PROJECTS_INDEX,
  THEMES,
} from "./support/fixtures";
import { STATE } from "./support/state-model";
import { ThemeStatePage } from "./theme-state-page";
import { composite, formatRatio, parseColor, ratio } from "../support/contrast";

/**
 * The plain focusable selectors — the set that inherited the removed
 * `:focus-visible { border-radius: 4px }` mutation. `.mobile-nav a` is covered by
 * the mobile target above; `.about-copy a:not(.quiet-link)` has no instance in the
 * tree today, so there is nothing to read for it.
 */
const PLAIN_FOCUSABLE: readonly {
  id: string;
  selector: string;
  path: string;
}[] = [
  { id: "01", selector: ".wordmark", path: HOME },
  { id: "02", selector: ".skip-link", path: HOME },
  { id: "03", selector: ".desktop-nav a", path: HOME },
  { id: "04", selector: ".quiet-link", path: HOME },
  { id: "05", selector: ".project-links a", path: HOME },
  { id: "06", selector: ".contact-social a", path: HOME },
  { id: "07", selector: ".site-footer > a", path: HOME },
  { id: "08", selector: ".projects-entry-link", path: PROJECTS_INDEX },
];

for (const theme of THEMES) {
  test.describe(`Focus ring geometry — ${theme}`, () => {
    test(
      "the plain focusable selectors keep their at-rest radius under keyboard focus",
      {
        tag: [
          "@critical",
          "@e2e",
          "@theme-state",
          `@THEME-STATE-FOCUS-${theme}`,
        ],
      },
      async ({ page }) => {
        const ui = new ThemeStatePage(page);
        await ui.pinTheme(theme);

        for (const entry of PLAIN_FOCUSABLE) {
          await ui.goto(entry.path);
          await expect.poll(() => ui.currentTheme()).toBe(theme);

          const rest = await ui.readState(entry.selector, STATE.REST);
          const focus = await ui.readState(entry.selector, STATE.FOCUS);

          expect(
            focus.outlineWidth,
            `${entry.selector} — ${theme}: the consolidated ring is 3px for every ` +
              `element (global.css @layer base :focus-visible)`,
          ).toBe("3px");
          expect(
            focus.outlineOffset,
            `${entry.selector} — ${theme}: the consolidated offset is 5px for every ` +
              `element (global.css @layer base :focus-visible)`,
          ).toBe("5px");
          expect(
            focus.borderRadius,
            `${entry.selector} — ${theme}: the gate 2.3 consent removed ` +
              `:focus-visible { border-radius: 4px }, so the focused radius must ` +
              `equal the at-rest radius unconditionally — at rest ` +
              `${rest.borderRadius}, focused ${focus.borderRadius}`,
          ).toBe(rest.borderRadius);
        }
      },
    );
  });
}

/** The ink variant: an accent ring on an accent fill is 1:1, so these read `--color-on-focus`. */
const INK_VARIANTS: readonly {
  id: string;
  selector: string;
  surface: string;
  path: string;
}[] = [
  {
    id: "01",
    selector: ".about-section .quiet-link",
    surface: ".about-section",
    path: HOME,
  },
  {
    id: "02",
    selector: ".contact-social a",
    surface: ".contact-section",
    path: HOME,
  },
  {
    id: "03",
    selector: ".contact-section .solid-link",
    surface: ".contact-section",
    path: HOME,
  },
];

for (const theme of THEMES) {
  test.describe(`Focus ring ink variant — ${theme}`, () => {
    test(
      "links inside the accent-filled sections resolve to --color-on-focus at or above 3:1",
      {
        tag: ["@critical", "@e2e", "@theme-state", `@THEME-STATE-INK-${theme}`],
      },
      async ({ page }) => {
        const ui = new ThemeStatePage(page);
        await ui.pinTheme(theme);

        for (const entry of INK_VARIANTS) {
          await ui.goto(entry.path);
          await expect.poll(() => ui.currentTheme()).toBe(theme);

          const focus = await ui.readState(entry.selector, STATE.FOCUS);
          const section = await ui.resolveBackground(entry.surface);
          const onFocus = await ui.tokenValue("--color-on-focus");
          const pair = `--color-on-focus (${onFocus}) on ${entry.surface}'s fill (${section})`;

          expect(
            focus.outlineColor,
            `${entry.selector} — ${theme}: the ink variant is declared by ` +
              `portfolio.css \`.about-section a:focus-visible, .contact-section a:focus-visible { outline-color: var(--portfolio-yellow-ink) }\`, ` +
              `which resolves to the same value as --color-on-focus`,
          ).toBe(toRgbString(onFocus));

          const ringRatio = ratio(
            composite(focus.outlineColor, section),
            section,
          );
          expect(
            ringRatio,
            `${entry.selector} — ${theme}: the ink ring must clear 1.4.11's 3:1 ` +
              `focus clause — ${pair} measures ${formatRatio(ringRatio)}:1`,
          ).toBeGreaterThanOrEqual(NON_TEXT_FLOOR);
        }
      },
    );
  });
}

function toRgbString(value: string): string {
  const colour = parseColor(value);
  return `rgb(${Math.round(colour.r)}, ${Math.round(colour.g)}, ${Math.round(
    colour.b,
  )})`;
}
