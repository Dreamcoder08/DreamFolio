import { test, expect } from "@playwright/test";
import { ProjectDetailPage } from "./project-detail-page";

test.describe("Project detail — SIPGES showcase", () => {
  test(
    "shows the demo cover, the walkthrough video and every capture, without a live link",
    { tag: ["@e2e", "@project-detail", "@PROJECT-DETAIL-SIPGES"] },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      await detail.goto("sipges");

      await expect(
        page.getByRole("heading", { level: 1, name: "SIPGES" }),
      ).toBeVisible();
      await expect(page.locator("[data-stage-image]")).toHaveAttribute(
        "alt",
        "SIPGES: panel de riesgo socioambiental de un proyecto de demostración",
      );
      await expect(page.locator("[data-stage-video]")).toHaveAttribute(
        "src",
        /\/videos\/projects\/sipges-full\.mp4$/,
      );
      // The cover plus the four gallery captures.
      await expect(page.locator("[data-stage-thumb]")).toHaveCount(5);
      // The deployed instance shows real client data, so the page only links
      // to the public repository.
      await expect(
        page.getByRole("link", { name: /Conocer el proyecto/ }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: /Ver en GitHub/ }),
      ).toHaveAttribute("href", "https://github.com/Dreamcoder08/sipges");
    },
  );
});
