import { test, expect, type Page } from "@playwright/test";
import { HomePage } from "./home-page";
import projects from "../../src/data/projects.json" with { type: "json" };
import repoSnapshot from "../../src/data/github-repos.json" with { type: "json" };

const seenUrls = new Set(
  projects
    .map((p) => p.githubUrl?.toLowerCase())
    .filter((u): u is string => Boolean(u)),
);
const extraRepos = repoSnapshot.repos.filter(
  (r) => !seenUrls.has(r.url.toLowerCase()),
);
const TOTAL_COUNT = projects.length + extraRepos.length;
const TOTAL = String(TOTAL_COUNT).padStart(2, "0");
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
        TOTAL_COUNT,
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

      // Small mobile viewport (360px) must also have zero horizontal overflow.
      await page.setViewportSize({ width: 360, height: 740 });
      await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);
    },
  );

  test(
    "filter chips narrow visible cards and update the counter live",
    { tag: ["@e2e", "@projects", "@CAROUSEL-004"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await new HomePage(page).goto();

      const casesBtn = page.getByRole("button", { name: /Casos de estudio/ });
      const allBtn = page.getByRole("button", { name: /^Todos/ });
      await casesBtn.click();
      await expect(casesBtn).toHaveAttribute("aria-pressed", "true");
      await expect(
        track(page).locator(".project-card:not([hidden])"),
      ).toHaveCount(projects.length);
      await expect(page.locator(".carousel-count")).toHaveText(
        `01 / ${String(projects.length).padStart(2, "0")}`,
      );

      await allBtn.click();
      await expect(allBtn).toHaveAttribute("aria-pressed", "true");
      await expect(
        track(page).locator(".project-card:not([hidden])"),
      ).toHaveCount(TOTAL_COUNT);
      await expect(page.locator(".carousel-count")).toHaveText(`01 / ${TOTAL}`);
    },
  );
});
