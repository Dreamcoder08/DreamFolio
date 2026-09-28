import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class TerminalPage extends BasePage {
  readonly composer: Locator;
  readonly subjectInput: Locator;
  readonly bodyInput: Locator;
  readonly submitButton: Locator;
  readonly status: Locator;
  readonly bootLines: Locator;
  readonly mailtoButton: Locator;
  readonly fallbackLink: Locator;

  constructor(page: Page) {
    super(page);
    this.composer = page.locator("#terminal-composer");
    this.subjectInput = page.locator("#terminal-subject");
    this.bodyInput = page.locator("#terminal-body");
    this.submitButton = page.locator("#terminal-submit");
    this.status = page.locator("#terminal-status");
    this.bootLines = page.locator(".mu-terminal-line");
    this.mailtoButton = page.locator(".contact-bottom .solid-link");
    this.fallbackLink = page.locator("#terminal-fallback-link");
  }

  async goto(): Promise<void> {
    await super.goto("/#connect");
  }
}
