import { test, expect } from "@playwright/test";
import { NotFoundPage } from "./404-page";

test.describe("404 — not found page", () => {
  test(
    "unknown route renders the 404 page",
    { tag: ["@critical", "@404", "@404-E2E-001"] },
    async ({ page }) => {
      const notFoundPage = new NotFoundPage(page);
      await notFoundPage.goto();

      await expect(notFoundPage.heading).toBeVisible();
      await expect(page.getByText("404")).toBeVisible();
    },
  );

  test(
    "back link navigates to the home page",
    { tag: ["@critical", "@404", "@404-E2E-002"] },
    async ({ page }) => {
      const notFoundPage = new NotFoundPage(page);
      await notFoundPage.goto();

      await expect(notFoundPage.backLink).toHaveAttribute("href", "/");
      await notFoundPage.backLink.click();

      await expect(page).toHaveURL("/");
    },
  );
});
