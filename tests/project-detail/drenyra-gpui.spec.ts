import { test, expect } from "@playwright/test";
import { ProjectDetailPage } from "./project-detail-page";

const GPUI_REPO = "https://github.com/arkelythex/drenyra-gpui";

test.describe("Project detail — Drenyra GPUI", () => {
  test(
    "presents Drenyra GPUI and links its repository",
    { tag: ["@e2e", "@project-detail", "@PROJECT-DETAIL-DRENYRA-GPUI"] },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      await detail.goto("drenyra-gpui");

      await expect(detail.heading).toHaveText("Drenyra GPUI");
      await expect(
        page.getByRole("link", { name: /Ver en GitHub/ }),
      ).toHaveAttribute("href", GPUI_REPO);
    },
  );

  test(
    "the retired Fiscal Command Center URL redirects to Drenyra GPUI",
    { tag: ["@e2e", "@project-detail", "@PROJECT-DETAIL-DRENYRA-REDIRECT"] },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      await detail.goto("drenyra-fiscal-command-center");

      await expect(page).toHaveURL(/\/projects\/drenyra-gpui\/$/);
      await expect(detail.heading).toHaveText("Drenyra GPUI");
    },
  );
});
