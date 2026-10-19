import { test, expect, type Page } from "@playwright/test";
import { HomePage } from "./home-page";
import projects from "../../src/data/projects.json" with { type: "json" };

const TOTAL = String(projects.length).padStart(2, "0");
const track = (page: Page) => page.locator("#project-track");
const prev = (page: Page) =>
  page.getByRole("button", { name: "Proyecto anterior" });
const next = (page: Page) =>
  page.getByRole("button", { name: "Proyecto siguiente" });

test.describe("Home — projects carousel", () => {
  test(
    "shows every case study as a card, with arrows and a counter",
    { tag: ["@critical", "@e2e", "@projects", "@CAROUSEL-001"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await new HomePage(page).goto();
      await expect(track(page).locator(".project-card")).toHaveCount(
        projects.length,
      );
      await expect(page.locator(".carousel-count")).toHaveText(`01 / ${TOTAL}`);
      await expect(prev(page)).toBeVisible();
      await expect(next(page)).toBeVisible();
    },
  );

  test(
    "the arrows move one card at a time and wrap around at both ends",
    { tag: ["@critical", "@e2e", "@projects", "@CAROUSEL-002"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1280, height: 900 });
      await new HomePage(page).goto();
      const count = page.locator(".carousel-count");

      await next(page).click();
      await expect(count).toHaveText(`02 / ${TOTAL}`);
      await prev(page).click();
      await expect(count).toHaveText(`01 / ${TOTAL}`);

      // Back from the first card lands on the end, and forward from the
      // end returns to the first.
      await prev(page).click();
      await expect(count).toHaveText(`${TOTAL} / ${TOTAL}`);
      await next(page).click();
      await expect(count).toHaveText(`01 / ${TOTAL}`);
    },
  );

  test(
    "keyboard arrows move the focused track, and phones swipe without overflow",
    { tag: ["@e2e", "@projects", "@CAROUSEL-003"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 390, height: 844 });
      const home = new HomePage(page);
      await home.goto();
      await track(page).focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(".carousel-count")).toHaveText(`02 / ${TOTAL}`);
      await expect(next(page)).toBeVisible();
      await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);
    },
  );
});
