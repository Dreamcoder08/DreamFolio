import { test, expect } from "@playwright/test";
import { ProjectDetailPage } from "./project-detail-page";

// The proof snapshot is regenerated from GitHub, so these checks pin the
// shape and the links, never counts or CI conclusions that change over time.
test.describe("Project detail — verifiable proof", () => {
  test(
    "links the repository, the latest CI run and every ADR",
    { tag: ["@e2e", "@project-detail", "@PROJECT-PROOF-E2E-001"] },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      await detail.goto("digital-public-peru");

      const proof = detail.proof;
      await expect(
        proof.getByRole("heading", { level: 2, name: "Evidencia verificable" }),
      ).toBeVisible();
      await expect(
        proof.getByText(/Comprobado desde GitHub el \d{4}-\d{2}-\d{2}\./),
      ).toBeVisible();
      await expect(
        proof.getByRole("link", { name: "arkelythex/estado" }),
      ).toHaveAttribute("href", "https://github.com/arkelythex/estado");
      await expect(
        proof.getByRole("link", {
          name: /^CI: (pasa|falla) · \d{4}-\d{2}-\d{2}$/,
        }),
      ).toHaveAttribute(
        "href",
        /^https:\/\/github\.com\/arkelythex\/estado\/actions\/runs\/\d+$/,
      );
      await expect(
        proof.getByText(/\d+ archivos de prueba detectados/),
      ).toBeVisible();
      await expect(proof.getByText("Sin demo pública")).toBeVisible();

      const decisions = proof.getByRole("list", {
        name: "Decisiones de arquitectura",
      });
      const links = decisions.getByRole("link");
      expect(await links.count()).toBeGreaterThan(0);
      for (const href of await links.evaluateAll((all) =>
        all.map((a) => a.getAttribute("href")),
      )) {
        expect(href).toMatch(
          /^https:\/\/github\.com\/arkelythex\/estado\/blob\/main\/.+\.md$/,
        );
      }
    },
  );

  test(
    "links the public demo when the project has one",
    { tag: ["@e2e", "@project-detail", "@PROJECT-PROOF-E2E-002"] },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      await detail.goto("pseint-web-lab");

      await expect(
        detail.proof.getByRole("link", { name: "Abrir la demo" }),
      ).toHaveAttribute(
        "href",
        "https://dreamcoder08.github.io/pseint-web-interface/",
      );
    },
  );
});
