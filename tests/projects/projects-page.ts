import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class ProjectsPage extends BasePage {
  readonly heading: Locator;
  readonly backLink: Locator;
  readonly repoSection: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: "Código para explorar.",
    });
    this.backLink = page.getByRole("link", { name: "Volver al portafolio" });
    this.repoSection = page.getByRole("region", {
      name: "Todo el código abierto.",
    });
  }

  async goto(): Promise<void> {
    await super.goto("/projects/");
  }

  /** A featured case study (the repo grid below may share its name). */
  projectLink(title: string): Locator {
    return this.page
      .locator(".project-pair")
      .getByRole("link", { name: title, exact: true });
  }
}
