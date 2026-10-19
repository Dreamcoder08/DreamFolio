import { test, expect } from "@playwright/test";
import { ProjectsPage } from "./projects-page";

test.describe("Projects — GitHub repos", () => {
  test(
    "lists the curated repos grouped by owner, org first, each linking to GitHub",
    { tag: ["@critical", "@e2e", "@projects", "@REPOS-001"] },
    async ({ page }) => {
      const projects = new ProjectsPage(page);
      await projects.goto();
      const section = projects.repoSection;
      await expect(section).toBeVisible();

      const groups = section.locator(".repo-group-title");
      await expect(groups.nth(0)).toContainText("ARKELYTHEX");
      await expect(groups.nth(1)).toContainText("Personal");

      const cards = section.locator(".repo-card");
      expect(await cards.count()).toBeGreaterThan(5);
      const hrefs = await section
        .locator(".repo-card-link")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href") ?? ""),
        );
      for (const href of hrefs) {
        expect(href).toMatch(
          /^https:\/\/github\.com\/(arkelythex|Dreamcoder08)\//,
        );
      }
      // Profile READMEs and org meta repos are curated out.
      expect(hrefs).not.toContain(
        "https://github.com/Dreamcoder08/dreamcoder08",
      );
      expect(hrefs).not.toContain("https://github.com/arkelythex/.github");
    },
  );

  test(
    "a repo with a case study here links to it, and the page never overflows",
    { tag: ["@e2e", "@projects", "@REPOS-002"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const projects = new ProjectsPage(page);
      await projects.goto();
      const card = projects.repoSection
        .locator(".repo-card")
        .filter({ hasText: "CleanSweep" });
      await card.getByRole("link", { name: /Ver caso/ }).click();
      await expect(page).toHaveURL(/\/projects\/cleansweep\/?$/);
      await projects.goto();
      await expect.poll(() => projects.hasHorizontalOverflow()).toBe(false);
    },
  );
});
