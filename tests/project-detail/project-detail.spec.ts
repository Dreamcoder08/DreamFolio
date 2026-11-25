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
      await detail.goto("civictech-peru");

      await expect(
        page.getByRole("heading", { level: 1, name: "CivicTech Peru" }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Plataforma cívica de código abierto para Perú: gasto público consultable, alertas fiscales, exportación OCDS 1.1 y reportes ciudadanos anónimos con trazabilidad SHA-256.",
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: "CivicTech Peru — portal de transparencia municipal de Lima",
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
      await detail.goto("civictech-peru");

      await expect(detail.backLink).toBeVisible();
      await expect(detail.backLink).toHaveAttribute("href", /\/#projects$/);
    },
  );
});
