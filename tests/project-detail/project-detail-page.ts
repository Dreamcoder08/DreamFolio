import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class ProjectDetailPage extends BasePage {
  readonly heading: Locator;
  readonly backLink: Locator;
  readonly proof: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.backLink = page.getByRole("link", { name: "Volver a los proyectos" });
    this.proof = page.getByRole("region", { name: "Evidencia verificable" });
  }

  async goto(slug: string): Promise<void> {
    await super.goto(`/projects/${slug}/`);
  }
}
