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
    "submitting navigates to the composed mailto URL, exposes it via a visible fallback link, and announces it",
    { tag: ["@critical", "@terminal", "@TERMINAL-003"] },
    async ({ page }) => {
      const terminal = new TerminalPage(page);
      await terminal.goto();

      const expected =
        "mailto:dreamcoder.dev08%40gmail.com?subject=Prueba%20desde%20e2e&body=Hola%2C%20este%20es%20un%20mensaje%20de%20prueba.";
      await terminal.subjectInput.fill("Prueba desde e2e");
      await terminal.bodyInput.fill("Hola, este es un mensaje de prueba.");
      // Chromium reports a script-initiated mailto: navigation as a request
      // (it never commits — the OS protocol handler would take it), so this
      // observes the real `location.href` assignment with no test-only seam
      // shipped in the component. Filtering on "mailto:" keeps the fallback
      // link's href (an attribute, not a navigation) from satisfying it.
      const navigation = page.waitForRequest((request) =>
        request.url().startsWith("mailto:"),
      );
      await terminal.submitButton.click();
      expect((await navigation).url()).toBe(expected);

      await expect(terminal.status).toHaveText(/Abriendo tu cliente de correo/);
      // The visible fallback for visitors with no mail handler configured.
      await expect(terminal.fallbackLink).toBeVisible();
      await expect(terminal.fallbackLink).toHaveAttribute("href", expected);
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

test.describe("MU-TH-UR terminal — narrow screens", () => {
  test.use({ viewport: { width: 375, height: 812 }, colorScheme: "light" });

  test(
    "every boot message fits inside the terminal after motion settles",
    { tag: ["@terminal", "@TERMINAL-007"] },
    async ({ page }) => {
      const terminal = new TerminalPage(page);
      await terminal.goto();
      await expect(terminal.bootLines).toHaveCount(3);
      await page.evaluate(() => document.fonts.ready);

      for (const line of await terminal.bootLines.all()) {
        await expect(line).toHaveCSS("animation-name", "none");
        expect(
          await line.evaluate((element) => {
            const screen = element.closest(".mu-terminal");
            if (!screen) return false;
            const bounds = screen.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(element);
            const textBounds = range.getBoundingClientRect();
            return (
              textBounds.width > 0 &&
              textBounds.left >= bounds.left &&
              textBounds.right <= bounds.right &&
              textBounds.top >= bounds.top &&
              textBounds.bottom <= bounds.bottom &&
              element.scrollWidth <= element.clientWidth
            );
          }),
        ).toBe(true);
      }
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
