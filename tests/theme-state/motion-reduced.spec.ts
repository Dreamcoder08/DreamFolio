import { test, expect } from "@playwright/test";
import { HOME } from "./support/fixtures";
import { readState } from "./support/motion-read";
import { DARK } from "./support/motion-page";
import { pinTheme } from "./support/page-levers";

/**
 * The reduced-motion end of the motion contract in `motion.spec.ts`: with the
 * lever on, the universal guard must neutralise the interactive set and the
 * reveal.
 */

test.describe("Motion coverage — reduced motion", () => {
  test(
    "the universal guard still neutralises the set and the reveal when the lever is on",
    { tag: ["@critical", "@e2e", "@motion", "@MOTION-REDUCED-GUARD"] },
    async ({ page }) => {
      await pinTheme(page, DARK);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(HOME);
      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
        "the reduced-motion end of this contract needs the lever actually on",
      ).toBe(true);

      for (const selector of [
        ".module-row",
        ".desktop-nav a",
        ".quiet-link",
        ".theme-toggle",
        ".solid-link",
        ".skip-link",
      ]) {
        const read = await readState(page, selector);
        expect(
          read.properties,
          `${selector}: global.css's universal guard must set ` +
            `\`transition: none !important\` — this is the rule every per-selector ` +
            `transition in the set depends on`,
        ).toEqual(["none"]);
        expect(read.durationsMs).toEqual([0]);
      }

      expect(
        await page.evaluate(() =>
          document.documentElement.classList.contains("motion-ready"),
        ),
        "the reveal system must stay off under the lever, which is why " +
          "`motion-ready` is the structural proof that this page is running " +
          "without it",
      ).toBe(false);
      const revealTarget = await page
        .locator("#process article")
        .first()
        .evaluate((el) => {
          const style = getComputedStyle(el);
          return { opacity: style.opacity, transform: style.transform };
        });
      expect(revealTarget).toEqual({ opacity: "1", transform: "none" });
    },
  );
});
