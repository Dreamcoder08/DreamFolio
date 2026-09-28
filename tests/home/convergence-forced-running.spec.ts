import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";
import {
  MOUNT_SETTLE_TIMEOUT,
  hasDrawnNonBlankFrame,
  installForcedWebglProbes,
  resetNonBlankFlag,
} from "./forced-webgl";

/**
 * Forced-WebGL running path: the on-demand loop settles, a theme toggle keeps
 * it rendering, and scrolling the hero away pauses and resumes it. Setup and
 * probes live in `./forced-webgl.ts`.
 */

test.describe("Home — hero convergence field (forced WebGL, running path)", () => {
  installForcedWebglProbes();

  test(
    "running field settles to idle-settled once nothing is animating",
    { tag: ["@hero", "@HOME-CONVERGENCE-006"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      // Past the 3s intro with nothing scrolling/pointing: the on-demand
      // loop must actually stop scheduling frames, not poll forever.
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "idle-settled",
        { timeout: MOUNT_SETTLE_TIMEOUT + 3500 },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "theme toggle keeps the running field rendering",
    { tag: ["@hero", "@HOME-CONVERGENCE-009"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );

      await resetNonBlankFlag(page);
      await home.toggleTheme();
      await page.waitForTimeout(300);

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "scrolling the hero out of view pauses the field, scrolling back resumes it",
    { tag: ["@hero", "@HOME-CONVERGENCE-010"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "paused",
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );

      await resetNonBlankFlag(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );
});
