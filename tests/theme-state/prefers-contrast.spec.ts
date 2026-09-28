/**
 * Evidence for the `prefers-contrast: more` overrides — one of the three
 * theme-state scenarios that had no rendered test before `theme-state-hardening`
 * (the others are `border-provenance.spec.ts` and `touch-press.spec.ts`).
 *
 * **`prefers-contrast: more`.** The media feature is emulated live and the
 * lever is asserted through `matchMedia` before any token is read. Each
 * overridden token is read twice in the same page instance — with
 * `contrast: "no-preference"` and with `contrast: "more"` — and compared
 * against the literal `global.css` declares for that theme. It proves the
 * preference-gated blocks reach custom properties and the one opacity-based
 * case (the light civic card). It proves nothing about a real operating
 * system's high-contrast setting, and nothing about the ratios those literals
 * were chosen for; the ratios live in the design record and in
 * `tests/unit/tokens-contrast.test.ts`.
 *
 * Run with `SITE_BASE=/ pnpm run build && npx playwright test
 * tests/theme-state/`. Like the rest of this suite, the root-base build is part of
 * the harness contract: against a `dist/` built with the default `/DreamFolio/`
 * base the stylesheet 404s and every read silently measures UA defaults.
 */

import { test, expect } from "@playwright/test";
import { sameColour } from "./support/evidence";
import { HOME, THEMES } from "./support/fixtures";
import { STATE, THEME, type Theme } from "./support/state-model";
import { ThemeStatePage } from "./theme-state-page";

/**
 * The literals `global.css` declares inside `@media (prefers-contrast: more)`,
 * compared as parsed colours so a serialisation difference is never mistaken for
 * a missing override.
 */
const CONTRAST_TOKENS: Record<Theme, Record<string, string>> = {
  [THEME.DARK]: {
    "--color-text-secondary": "#e2e2df",
    "--color-border": "rgba(255, 255, 255, 0.42)",
    "--color-border-strong": "rgba(255, 255, 255, 0.6)",
  },
  [THEME.LIGHT]: {
    "--color-text-secondary": "#4a3d30",
    "--color-text-tertiary": "#5c4a39",
    "--color-border": "rgba(0, 0, 0, 0.32)",
    "--color-border-strong": "rgba(0, 0, 0, 0.42)",
    "--color-border-interactive": "rgba(0, 0, 0, 0.34)",
    "--color-border-interactive-hover": "rgba(0, 0, 0, 0.5)",
  },
};

/** The one opacity-based case: the light civic card's attenuated text goes opaque. */
const CIVIC_TEXT = ".project-card--civic .project-number";

test(
  "prefers-contrast: more changes the preference-gated declarations in both themes",
  {
    tag: ["@critical", "@e2e", "@theme-state", "@THEME-STATE-CONTRAST"],
  },
  async ({ page }) => {
    const ui = new ThemeStatePage(page);

    for (const theme of THEMES) {
      await ui.pinTheme(theme);
      // Both media features are set together, before navigation and again before
      // the second read, so this test never depends on how a repeated
      // `emulateMedia` call merges with the previous one.
      await page.emulateMedia({
        reducedMotion: "reduce",
        contrast: "no-preference",
      });
      await page.goto(HOME);
      await expect.poll(() => ui.currentTheme()).toBe(theme);

      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-contrast: more)").matches,
        ),
        `${theme}: the baseline read must run with the media feature off, or the ` +
          `"differs without the media feature" clause compares a value with itself`,
      ).toBe(false);

      const names = Object.keys(CONTRAST_TOKENS[theme]);
      const baseline: Record<string, string> = {};
      for (const name of names) baseline[name] = await ui.tokenValue(name);
      const baselineCivic = await ui.readState(CIVIC_TEXT, STATE.REST);

      await page.emulateMedia({ reducedMotion: "reduce", contrast: "more" });

      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-contrast: more)").matches,
        ),
        `${theme}: page.emulateMedia({ contrast: "more" }) must be live before any ` +
          `token is read — without it this asserts the default palette and proves ` +
          `nothing about the preference-gated block`,
      ).toBe(true);

      const overridden: Record<string, string> = {};
      for (const name of names) overridden[name] = await ui.tokenValue(name);

      test.info().annotations.push({
        type: "prefers-contrast-more",
        description:
          `${theme}: no-preference ` +
          names.map((name) => `${name}=${baseline[name]}`).join(" ") +
          ` | more ` +
          names.map((name) => `${name}=${overridden[name]}`).join(" ") +
          ` | civic number opacity ${baselineCivic.opacity} → ` +
          `${(await ui.readState(CIVIC_TEXT, STATE.REST)).opacity}`,
      });

      for (const name of names) {
        const expected = CONTRAST_TOKENS[theme][name];
        expect(
          sameColour(overridden[name], expected),
          `${theme}: \`${name}\` with prefers-contrast: more must resolve to the ` +
            `literal global.css declares (${expected}); it measured ` +
            `\`${overridden[name]}\` against a baseline of \`${baseline[name]}\``,
        ).toBe(true);
        expect(
          overridden[name],
          `${theme}: \`${name}\` measured the same with and without ` +
            `prefers-contrast: more (\`${baseline[name]}\`). Either the override did ` +
            `not apply, or the media feature is not live in this context`,
        ).not.toBe(baseline[name]);
      }

      if (theme === THEME.LIGHT) {
        // The only opacity-based case, and the only theme that declares one: the
        // dark block overrides tokens, not this selector.
        const civic = await ui.readState(CIVIC_TEXT, STATE.REST);
        const tertiary = await ui.tokenValue("--color-text-tertiary");
        expect(
          sameColour(civic.color, tertiary),
          `${theme}: the civic card's number under prefers-contrast: more must take ` +
            `--color-text-tertiary (${tertiary}) directly; it measured ` +
            `${civic.color}, against ${baselineCivic.color} with the media feature off`,
        ).toBe(true);
        expect(
          civic.opacity,
          `${theme}: the civic card's number must go opaque under ` +
            `prefers-contrast: more — opacity ${civic.opacity} measured, ` +
            `${baselineCivic.opacity} without the media feature. An attenuated ` +
            `label is the one thing the media feature cannot fix by colour alone`,
        ).toBe("1");
        expect(
          civic.opacity,
          `${theme}: the civic card's number must actually change with the media ` +
            `feature — both reads measured opacity ${civic.opacity}`,
        ).not.toBe(baselineCivic.opacity);
      }
    }
  },
);
