import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class NotFoundPage extends BasePage {
  readonly heading: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Página no encontrada" });
    this.backLink = page.getByRole("link", { name: /Volver al inicio/ });
  }

  async goto(): Promise<void> {
    await super.goto("/nonexistent-route-hardening-test");
  }
}
