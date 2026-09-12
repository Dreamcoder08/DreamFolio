import { test, expect } from "@playwright/test";
import { ProjectDetailPage } from "./project-detail-page";

test.describe("Project detail — dynamic route", () => {
  test(
    "direct navigation to a project detail URL renders the right content",
    {
      tag: ["@critical", "@e2e", "@project-detail", "@PROJECT-DETAIL-E2E-001"],
    },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      await detail.goto("digital-public-peru");

      await expect(
        page.getByRole("heading", { level: 1, name: "Digital Public Peru" }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Proyecto de tecnología cívica para explorar información pública y transparencia en Perú.",
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: "Digital Public Peru — civic transparency interface",
        }),
      ).toBeVisible();
    },
  );

  test(
    "has a way back to the home portfolio section",
    {
      tag: ["@critical", "@e2e", "@project-detail", "@PROJECT-DETAIL-E2E-002"],
    },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      await detail.goto("digital-public-peru");

      await expect(detail.backLink).toBeVisible();
      await expect(detail.backLink).toHaveAttribute("href", /\/#projects$/);
    },
  );
});
