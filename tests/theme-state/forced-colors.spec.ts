import { test, expect } from "@playwright/test";
import { HOME, PROJECT_DETAIL, THEMES } from "./support/fixtures";
import { STATE } from "./support/state-model";
import { ThemeStatePage } from "./theme-state-page";

/**
 * Forced-colors signals. Best practice, not a WCAG requirement: no success
 * criterion mentions `forced-colors`. Author backgrounds and borders are replaced
 * by the user agent, so each state carries a shape or a decoration instead.
 */
const FORCED_HOVER_OUTLINE: readonly { selector: string; path: string }[] = [
  { selector: ".module-row", path: HOME },
  { selector: ".card", path: PROJECT_DETAIL },
  { selector: ".nav-contact", path: HOME },
  { selector: ".circle-link", path: HOME },
  { selector: ".theme-toggle", path: HOME },
];

const FORCED_HOVER_DECORATION: readonly { selector: string; path: string }[] = [
  { selector: ".quiet-link", path: HOME },
  { selector: ".project-links a", path: HOME },
  { selector: ".desktop-nav a", path: HOME },
  { selector: ".site-footer > a", path: HOME },
];

const FORCED_PRESSED: readonly { selector: string; path: string }[] = [
  { selector: ".theme-toggle", path: HOME },
  { selector: ".module-row", path: HOME },
  { selector: ".solid-link", path: HOME },
  { selector: ".quiet-link", path: HOME },
  { selector: ".circle-link", path: HOME },
  { selector: ".project-links a", path: HOME },
  { selector: ".desktop-nav a", path: HOME },
  { selector: ".nav-contact", path: HOME },
  { selector: ".site-footer > a", path: HOME },
  { selector: ".contact-social a", path: HOME },
];

test.describe("Forced-colors signals (best practice, not a WCAG requirement)", () => {
  test(
    "rows, cards and controls that signal hover through colour keep a solid outline",
    {
      tag: [
        "@critical",
        "@e2e",
        "@theme-state",
        "@THEME-STATE-FORCED-HOVER-OUTLINE",
      ],
    },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      for (const theme of THEMES) {
        await page.emulateMedia({ forcedColors: "active" });
        await ui.pinTheme(theme);
        for (const entry of FORCED_HOVER_OUTLINE) {
          await ui.goto(entry.path);
          expect(
            await ui.forcedColorsActive(),
            `${entry.selector} — ${theme}: forcedColors: "active" must be emulated ` +
              `before the read; without it this asserts the default palette instead`,
          ).toBe(true);

          const hover = await ui.readState(entry.selector, STATE.HOVER);
          expect(
            hover.outlineStyle,
            `${entry.selector} — ${theme}: portfolio.css's ` +
              `@media (forced-colors: active) block gives the hovered element an ` +
              `outline, because the agent forces its border and background colour ` +
              `away — outline-style ${hover.outlineStyle}, outline-width ` +
              `${hover.outlineWidth}`,
          ).toBe("solid");
        }
      }
    },
  );

  test(
    "text links that signal hover through colour keep an underline",
    {
      tag: [
        "@critical",
        "@e2e",
        "@theme-state",
        "@THEME-STATE-FORCED-HOVER-TEXT",
      ],
    },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      for (const theme of THEMES) {
        await page.emulateMedia({ forcedColors: "active" });
        await ui.pinTheme(theme);
        for (const entry of FORCED_HOVER_DECORATION) {
          await ui.goto(entry.path);
          expect(
            await ui.forcedColorsActive(),
            `${entry.selector} — ${theme}: forcedColors: "active" must be live`,
          ).toBe(true);

          const hover = await ui.readState(entry.selector, STATE.HOVER);
          expect(
            hover.textDecorationLine,
            `${entry.selector} — ${theme}: the forced-colors block keeps ` +
              `text-decoration: underline as the hover signal — ` +
              `text-decoration-line ${hover.textDecorationLine}`,
          ).toContain("underline");
        }
      }
    },
  );

  test(
    "pressed controls keep a dashed outline, so press is distinguishable from hover",
    {
      tag: ["@critical", "@e2e", "@theme-state", "@THEME-STATE-FORCED-PRESSED"],
    },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      for (const theme of THEMES) {
        await page.emulateMedia({ forcedColors: "active" });
        await ui.pinTheme(theme);
        for (const entry of FORCED_PRESSED) {
          await ui.goto(entry.path);
          expect(
            await ui.forcedColorsActive(),
            `${entry.selector} — ${theme}: forcedColors: "active" must be live`,
          ).toBe(true);

          const active = await ui.readState(entry.selector, STATE.ACTIVE);
          expect(
            active.outlineStyle,
            `${entry.selector} — ${theme}: the forced-colors block marks every ` +
              `press with a dashed outline, which distinguishes it from the solid ` +
              `hover outline without colour — outline-style ` +
              `${active.outlineStyle}, outline-width ${active.outlineWidth}`,
          ).toBe("dashed");
        }
      }
    },
  );
});
