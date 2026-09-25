import { test, expect } from "@playwright/test";
import { TerminalPage } from "./terminal-page";

test.describe("MU-TH-UR terminal — progressive enhancement", () => {
  test(
    "the composer stays hidden without JavaScript, and the existing mailto button still works",
    { tag: ["@critical", "@terminal", "@TERMINAL-001"] },
    async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      const terminal = new TerminalPage(page);
      await terminal.goto();

      await expect(terminal.composer).toBeHidden();
      await expect(terminal.mailtoButton).toBeVisible();
      await expect(terminal.mailtoButton).toHaveAttribute(
        "href",
        /^mailto:dreamcoder\.dev08@gmail\.com/,
      );

      await context.close();
    },
  );

  test(
    "the composer is revealed once the script runs",
    { tag: ["@terminal", "@TERMINAL-002"] },
    async ({ page }) => {
      const terminal = new TerminalPage(page);
      await terminal.goto();
      await expect(terminal.composer).toBeVisible();
    },
  );
});

test.describe("MU-TH-UR terminal — composing a transmission", () => {
  test(
    "submitting builds the expected mailto URL, exposes it via a visible fallback link, and announces it",
    { tag: ["@critical", "@terminal", "@TERMINAL-003"] },
    async ({ page }) => {
      const terminal = new TerminalPage(page);
      await terminal.goto();

      await terminal.subjectInput.fill("Prueba desde e2e");
      await terminal.bodyInput.fill("Hola, este es un mensaje de prueba.");
      await terminal.submitButton.click();

      await expect(terminal.status).toHaveText(/Abriendo tu cliente de correo/);
      // location.href = "mailto:..." never completes a real, observable
      // navigation in Playwright — the fallback link is a real DOM
      // attribute this test can assert on directly, and it's also what a
      // visitor without a mail handler configured actually clicks.
      await expect(terminal.fallbackLink).toBeVisible();
      await expect(terminal.fallbackLink).toHaveAttribute(
        "href",
        "mailto:dreamcoder.dev08%40gmail.com?subject=Prueba%20desde%20e2e&body=Hola%2C%20este%20es%20un%20mensaje%20de%20prueba.",
      );
    },
  );

  test(
    "an empty message still builds a bare mailto without throwing",
    { tag: ["@terminal", "@TERMINAL-004"] },
    async ({ page }) => {
      const terminal = new TerminalPage(page);
      await terminal.goto();
      await terminal.submitButton.click();
      await expect(terminal.status).toHaveText(/Abriendo tu cliente de correo/);
      await expect(terminal.fallbackLink).toHaveAttribute(
        "href",
        "mailto:dreamcoder.dev08%40gmail.com",
      );
    },
  );
});

test.describe("MU-TH-UR terminal — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test(
    "boot lines render as static text with no typing animation, and the cursor does not blink",
    { tag: ["@terminal", "@TERMINAL-005"] },
    async ({ page }) => {
      const terminal = new TerminalPage(page);
      await terminal.goto();

      const firstLine = terminal.bootLines.first();
      await expect(firstLine).toBeVisible();
      await expect(firstLine).toHaveCSS("animation-name", "none");
      await expect(page.locator(".mu-terminal-cursor")).toHaveCSS(
        "animation-name",
        "none",
      );
    },
  );
});

test.describe("MU-TH-UR terminal — motion enabled", () => {
  test(
    "boot lines carry the typing animation when motion is not reduced",
    { tag: ["@terminal", "@TERMINAL-006"] },
    async ({ page }) => {
      const terminal = new TerminalPage(page);
      await terminal.goto();

      const firstLine = terminal.bootLines.first();
      await expect(firstLine).toHaveCSS("animation-name", "mu-type-in");
    },
  );
});
