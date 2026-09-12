import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class ProjectsPage extends BasePage {
  readonly heading: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: "Código para explorar.",
    });
    this.backLink = page.getByRole("link", { name: "Volver al portafolio" });
  }

  async goto(): Promise<void> {
    await super.goto("/projects/");
  }

  projectLink(title: string): Locator {
    return this.page.getByRole("link", { name: title, exact: true });
  }
}
