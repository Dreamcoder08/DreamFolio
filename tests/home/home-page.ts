import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class HomePage extends BasePage {
  readonly themeToggle: Locator;
  readonly heroPortrait: Locator;
  readonly heroTitle: Locator;
  readonly convergenceCanvas: Locator;

  constructor(page: Page) {
    super(page);
    this.themeToggle = page.getByRole("button", { name: /Cambiar a tema/ });
    this.heroPortrait = page.locator(".hero-portrait");
    this.heroTitle = page.locator("#hero-title");
    this.convergenceCanvas = page.locator(".hero .convergence-field");
  }

  async goto(): Promise<void> {
    await super.goto("/");
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }
}
