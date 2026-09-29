import { test, expect, type Page } from "@playwright/test";
import { HomePage } from "../home/home-page";
import { ConsolePage } from "./console-page";
import { ACTION_FAILED, LOAD_FAILED } from "../../src/lib/console/messages";
import { RELOAD_FLAG } from "../../src/lib/console/chunk-recovery";

// The lazily imported console chunk (src/lib/console/driver.ts, hashed by
// the build). Aborting it is exactly what a stale chunk after a redeploy
// looks like to the eager script: a rejected import().
const DRIVER_CHUNK = "**/_astro/driver.*.js";

function countMainFrameNavigations(page: Page): () => number {
  let count = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) count += 1;
  });
  return () => count;
}

async function failTwice(page: Page, console_: ConsolePage): Promise<number> {
  const navigations = countMainFrameNavigations(page);
  const reloaded = page.waitForEvent("load");
  await console_.openWithTrigger();
  await reloaded;
  await console_.openWithTrigger();
  await expect(console_.loadStatus).toHaveText(LOAD_FAILED);
  return navigations();
}

test.describe("Ship console — stale chunk recovery", () => {
  test(
    "a rejected chunk import reloads exactly once, then fails visibly",
    { tag: ["@console", "@CONSOLE-RECOVERY-001"] },
    async ({ page }) => {
      await page.route(DRIVER_CHUNK, (route) => route.abort());
      const console_ = new ConsolePage(page);
      await new HomePage(page).goto();

      expect(await failTwice(page, console_)).toBe(1);
      await expect(console_.loadStatus).toBeVisible();
      await expect(console_.dialog).toBeHidden();
    },
  );

  test(
    "a later successful load clears the error and re-arms the reload",
    { tag: ["@console", "@CONSOLE-RECOVERY-002"] },
    async ({ page }) => {
      await page.route(DRIVER_CHUNK, (route) => route.abort());
      const console_ = new ConsolePage(page);
      await new HomePage(page).goto();
      await failTwice(page, console_);
      expect(
        await page.evaluate((key) => sessionStorage.getItem(key), RELOAD_FLAG),
      ).toBe("1");

      // Chromium caches a rejected dynamic import for the document's
      // lifetime, so the "later success" here follows the reload the error
      // text asks for; browsers that retry failed module fetches in place
      // run the same success branch without it.
      await page.unroute(DRIVER_CHUNK);
      await page.reload();
      await console_.openWithTrigger();

      await expect(console_.dialog).toBeVisible();
      await expect(console_.loadStatus).toBeEmpty();
      await expect(console_.loadStatus).toBeHidden();
      expect(
        await page.evaluate((key) => sessionStorage.getItem(key), RELOAD_FLAG),
      ).toBeNull();
    },
  );
});

test.describe("Ship console — action failures", () => {
  test(
    "a throwing action is announced, keeps the console open, and never escapes as an unhandled error",
    { tag: ["@console", "@CONSOLE-RECOVERY-003"] },
    async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      await page.addInitScript(() => {
        window.open = () => {
          throw new Error("popup blocked");
        };
      });
      const console_ = new ConsolePage(page);
      await new HomePage(page).goto();

      await console_.openWithTrigger();
      await console_.typeQuery("GitHub");
      await console_.input.press("Enter");

      await expect(console_.status).toHaveText(ACTION_FAILED);
      await expect(console_.dialog).toBeVisible();
      expect(errors).toEqual([]);
    },
  );
});
