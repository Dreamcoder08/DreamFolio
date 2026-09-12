import { test, expect } from "@playwright/test";
import { ProjectsPage } from "./projects-page";

test.describe("Projects — list page", () => {
  test(
    "loads and shows real project entries",
    { tag: ["@critical", "@e2e", "@projects", "@PROJECTS-E2E-001"] },
    async ({ page }) => {
      const projects = new ProjectsPage(page);
      await projects.goto();

      await expect(projects.heading).toBeVisible();
      await expect(projects.projectLink("Digital Public Peru")).toBeVisible();
      await expect(projects.projectLink("elect-validate")).toBeVisible();
    },
  );

  test(
    "clicking a project navigates to its detail page",
    { tag: ["@critical", "@e2e", "@projects", "@PROJECTS-E2E-002"] },
    async ({ page }) => {
      const projects = new ProjectsPage(page);
      await projects.goto();

      await projects.projectLink("Digital Public Peru").click();
      await expect(page).toHaveURL(/\/projects\/digital-public-peru\/?$/);
      await expect(
        page.getByRole("heading", { level: 1, name: "Digital Public Peru" }),
      ).toBeVisible();
    },
  );

  test(
    "has a way back to the home portfolio section",
    { tag: ["@medium", "@e2e", "@projects", "@PROJECTS-E2E-003"] },
    async ({ page }) => {
      const projects = new ProjectsPage(page);
      await projects.goto();

      await expect(projects.backLink).toBeVisible();
      await expect(projects.backLink).toHaveAttribute("href", /\/#projects$/);
    },
  );
});
