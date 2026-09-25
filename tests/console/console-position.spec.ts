import { test, expect } from "@playwright/test";
import { HomePage } from "../home/home-page";
import { ConsolePage } from "./console-page";

// Regression: Tailwind's preflight zeroes `margin` on every element
// including <dialog>, which killed the UA stylesheet's `margin: auto`
// centering — the dialog rendered pinned to the top-left corner. Fixed by
// positioning it explicitly (see .ship-console in components/console.css).
test.describe("Ship console — positioning", () => {
  for (const width of [1440, 375]) {
    test(
      `the open dialog is horizontally centered at ${width}px`,
      { tag: ["@console", `@CONSOLE-POS-${width}`] },
      async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const home = new HomePage(page);
        const console_ = new ConsolePage(page);
        await home.goto();
        await console_.openWithTrigger();

        const box = await console_.dialog.boundingBox();
        if (!box) throw new Error("dialog has no bounding box");
        const leftGutter = box.x;
        const rightGutter = width - (box.x + box.width);
        expect(Math.abs(leftGutter - rightGutter)).toBeLessThanOrEqual(2);

        if (width === 375) {
          expect(leftGutter).toBeGreaterThanOrEqual(12);
          expect(rightGutter).toBeGreaterThanOrEqual(12);
        }
      },
    );
  }
});
