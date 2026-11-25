import { test, expect } from "@playwright/test";
import { ProjectsPage } from "./projects-page";

test.describe("Projects — repo quick view", () => {
  test(
    "a repo card opens the Image + Video quick view, and its image zooms without closing it",
    { tag: ["@e2e", "@projects", "@REPOS-QUICK-VIEW"] },
    async ({ page }) => {
      const projects = new ProjectsPage(page);
      await projects.goto();
      const startUrl = page.url();

      const link = projects.repoSection.locator(".repo-card-link").first();
      const name = (await link.textContent())?.trim() ?? "";
      const href = await link.getAttribute("href");
      await link.click();

      const modal = page.locator("[data-project-quick-modal]");
      await expect(modal).toHaveJSProperty("open", true);
      await expect(modal.locator("[data-qm-title]")).toHaveText(name);
      await expect(modal.locator('[data-media-slot="image"]')).toBeVisible();
      await expect(modal.locator('[data-media-slot="video"]')).toBeVisible();
      await expect(modal.locator("[data-qm-github]")).toHaveAttribute(
        "href",
        href ?? "",
      );
      expect(page.url()).toBe(startUrl);

      await modal.locator("[data-qm-zoom]").click();
      const zoom = modal.locator("[data-media-lightbox]");
      await expect(zoom).toHaveJSProperty("open", true);
      await zoom.locator("[data-lightbox-close]").click();
      await expect(zoom).toHaveJSProperty("open", false);
      await expect(modal).toHaveJSProperty("open", true);
    },
  );
});
