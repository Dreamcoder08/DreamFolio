import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";
import {
  MOUNT_SETTLE_TIMEOUT,
  hasDrawnNonBlankFrame,
  installForcedWebglProbes,
  resetNonBlankFlag,
} from "./forced-webgl";

/**
 * Forced-WebGL reduced-motion path: the static frame is redrawn, not left
 * blank, after a resize or a theme toggle (R3-reduced-motion-resize-blank).
 * Setup and probes live in `./forced-webgl.ts`.
 */

test.describe("Home — hero convergence field (forced WebGL, reduced motion)", () => {
  installForcedWebglProbes();

  test(
    "reduced motion redraws the static frame after a resize instead of going blank",
    { tag: ["@hero", "@HOME-CONVERGENCE-007"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const home = new HomePage(page);
      await home.goto();

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);

      // R3-reduced-motion-resize-blank: resize sets canvas.width/height,
      // which clears the GL drawing buffer. Before the fix, requestFrame's
      // unconditional `reducedMotion` guard meant nothing ever redrew it —
      // resetting the flag first means the assertion below only passes if
      // the resize itself triggers a fresh, non-blank draw.
      await resetNonBlankFlag(page);
      const original = page.viewportSize();
      await page.setViewportSize({
        width: Math.max(320, (original?.width ?? 1280) - 160),
        height: original?.height ?? 800,
      });
      await page.waitForTimeout(300);

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "reduced motion redraws the static frame with new colors after a theme toggle",
    { tag: ["@hero", "@HOME-CONVERGENCE-008"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const home = new HomePage(page);
      await home.goto();

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);

      // Same bug, different trigger: the theme MutationObserver also only
      // called requestFrame(), which no-ops while reducedMotion is true.
      await resetNonBlankFlag(page);
      await home.toggleTheme();
      await page.waitForTimeout(300);

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );
});
