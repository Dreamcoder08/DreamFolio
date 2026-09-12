import type { Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async currentTheme(): Promise<string | null> {
    return this.page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
  }

  /** Real content overflowing the viewport, not the 15-17px a scrollbar itself accounts for. */
  async hasHorizontalOverflow(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 20,
    );
  }
}
