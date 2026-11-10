/**
 * Focus-ring geometry and the neutral-section ring, under the same determinism levers as
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
 * `:focus-visible { border-radius: 4px }` mutation. `.about-copy a:not(.quiet-link)`
 * has no instance in the tree today, so there is nothing to read for it.
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
  { id: "06", selector: ".contact-channels a", path: HOME },
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

/**
 * The about band and the contact panel were accent fills with an ink ring. They
 * are neutral surfaces now, so their links carry the one site ring, `--color-focus`.
 */
const NEUTRAL_SECTIONS: readonly {
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
    selector: ".contact-channels a",
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
  test.describe(`Focus ring on neutral sections — ${theme}`, () => {
    test(
      "links inside the about and contact sections resolve to --color-focus at or above 3:1",
      {
        tag: ["@critical", "@e2e", "@theme-state", `@THEME-STATE-INK-${theme}`],
      },
      async ({ page }) => {
        const ui = new ThemeStatePage(page);
        await ui.pinTheme(theme);

        for (const entry of NEUTRAL_SECTIONS) {
          await ui.goto(entry.path);
          await expect.poll(() => ui.currentTheme()).toBe(theme);

          const focus = await ui.readState(entry.selector, STATE.FOCUS);
          const section = await ui.resolveBackground(entry.surface);
          const ringToken = await ui.tokenValue("--color-focus");
          const pair = `--color-focus (${ringToken}) on ${entry.surface}'s fill (${section})`;

          expect(
            focus.outlineColor,
            `${entry.selector} — ${theme}: no section overrides the ring, so it ` +
              `resolves to base.css \`:focus-visible { outline: 3px solid var(--color-focus) }\``,
          ).toBe(toRgbString(ringToken));

          const ringRatio = ratio(
            composite(focus.outlineColor, section),
            section,
          );
          expect(
            ringRatio,
            `${entry.selector} — ${theme}: the ring must clear 1.4.11's 3:1 ` +
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
