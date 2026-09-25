import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class ConsolePage extends BasePage {
  readonly trigger: Locator;
  readonly dialog: Locator;
  readonly input: Locator;
  readonly listbox: Locator;
  readonly options: Locator;
  readonly empty: Locator;
  readonly status: Locator;
  readonly copyFallbackInput: Locator;

  constructor(page: Page) {
    super(page);
    this.trigger = page.locator("#console-trigger");
    this.dialog = page.locator("#ship-console");
    this.input = page.locator("#console-input");
    this.listbox = page.locator("#console-listbox");
    this.options = page.locator("#console-listbox [role='option']");
    this.empty = page.locator("#console-empty");
    this.status = page.locator("#console-status");
    this.copyFallbackInput = page.locator("#console-copy-input");
  }

  async openWithShortcut(): Promise<void> {
    const isMac = process.platform === "darwin";
    await this.page.keyboard.press(isMac ? "Meta+K" : "Control+K");
  }

  async openWithTrigger(): Promise<void> {
    await this.trigger.click();
  }

  async typeQuery(query: string): Promise<void> {
    await this.input.fill(query);
  }
}
