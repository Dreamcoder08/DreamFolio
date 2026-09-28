import { test, expect } from "@playwright/test";
import { HomePage } from "../home/home-page";
import { ConsolePage } from "./console-page";
import { ProjectDetailPage } from "../project-detail/project-detail-page";

const PROJECT_SLUG = "drenyra-fiscal-command-center";
const PROJECT_TITLE = "Drenyra — Fiscal Command Center";

test.describe("Ship console — opening and focus", () => {
  test(
    "opens with Ctrl+K and focuses the input",
    { tag: ["@critical", "@console", "@CONSOLE-001"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();

      await console_.openWithShortcut();
      await expect(console_.dialog).toBeVisible();
      await expect(console_.input).toBeFocused();
    },
  );

  test(
    "opens via the visible trigger button and focuses the input",
    { tag: ["@critical", "@console", "@CONSOLE-002"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();

      await expect(console_.trigger).toBeVisible();
      await console_.openWithTrigger();
      await expect(console_.dialog).toBeVisible();
      await expect(console_.input).toBeFocused();
    },
  );

  test(
    "Esc closes the console and returns focus to the trigger",
    { tag: ["@console", "@CONSOLE-003"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();

      await console_.openWithTrigger();
      await expect(console_.dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(console_.dialog).toBeHidden();
      await expect(console_.trigger).toBeFocused();
    },
  );

  test(
    "Ctrl+K while already open keeps the query and just re-focuses",
    { tag: ["@console", "@CONSOLE-013"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();

      await console_.openWithTrigger();
      await console_.typeQuery("mi");
      await console_.openWithShortcut();

      // The query must survive a second open, and focus must return to the
      // input rather than reset — proves open() didn't re-run its opening
      // side effects (value reset, returnFocusTo overwrite) a second time.
      await expect(console_.input).toHaveValue("mi");
      await expect(console_.input).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(console_.dialog).toBeHidden();
      await expect(console_.trigger).toBeFocused();
    },
  );
});

test.describe("Ship console — search", () => {
  test(
    "typing filters the list, accent-insensitive",
    { tag: ["@console", "@CONSOLE-004"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();

      // "Sobre mí" is the real label — typing the unaccented "mi" must still
      // match it (accent-insensitive filtering).
      await console_.typeQuery("mi");
      await expect(
        console_.options.filter({ hasText: "Sobre mí" }),
      ).toHaveCount(1);
    },
  );

  test(
    "a query matching nothing shows the empty state",
    { tag: ["@console", "@CONSOLE-005"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();

      await console_.typeQuery("zzzzzznoresult");
      await expect(console_.empty).toBeVisible();
      await expect(console_.options).toHaveCount(0);
    },
  );

  test(
    "an empty query shows the grouped default list",
    { tag: ["@console", "@CONSOLE-006"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();

      await expect.poll(() => console_.options.count()).toBeGreaterThan(5);
    },
  );
});

test.describe("Ship console — running commands", () => {
  test(
    "arrow + Enter navigates to a project page",
    { tag: ["@critical", "@console", "@CONSOLE-007"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();

      await console_.typeQuery(PROJECT_TITLE);
      await expect.poll(() => console_.options.count()).toBeGreaterThan(0);
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_SLUG}/`));
    },
  );

  test(
    "the theme command flips data-theme",
    { tag: ["@console", "@CONSOLE-008"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      const before = await home.currentTheme();

      await console_.openWithTrigger();
      await console_.typeQuery("Cambiar tema");
      await page.keyboard.press("Enter");

      await expect(console_.dialog).toBeHidden();
      await expect.poll(() => home.currentTheme()).not.toBe(before);
    },
  );

  test(
    "copy-email puts the address on the clipboard, or shows the manual-copy fallback",
    { tag: ["@console", "@CONSOLE-009"] },
    async ({ page, context, browserName }) => {
      if (browserName === "chromium") {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      }
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();
      await console_.typeQuery("Copiar correo");
      await page.keyboard.press("Enter");

      const clipboardText = await page
        .evaluate(() => navigator.clipboard.readText())
        .catch(() => null);

      if (clipboardText) {
        expect(clipboardText).toContain("dreamcoder.dev08@gmail.com");
      } else {
        await expect(console_.copyFallbackInput).toBeVisible();
        await expect(console_.copyFallbackInput).toHaveValue(
          "dreamcoder.dev08@gmail.com",
        );
      }
    },
  );

  test(
    "a failed copy keeps the dialog open with a focused, fully-selected fallback",
    { tag: ["@console", "@CONSOLE-014"] },
    async ({ page }) => {
      // Overriding writeText forces the failure branch deterministically,
      // independent of each browser's own clipboard-permission quirks.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error("denied")) },
        });
      });
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();
      await console_.typeQuery("Copiar correo");
      await page.keyboard.press("Enter");

      await expect(console_.dialog).toBeVisible();
      await expect(console_.copyFallbackInput).toBeVisible();
      await expect(console_.copyFallbackInput).toBeFocused();
      await expect(console_.copyFallbackInput).toHaveValue(
        "dreamcoder.dev08@gmail.com",
      );
      const selected = await console_.copyFallbackInput.evaluate(
        (el: HTMLInputElement) =>
          el.value.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0),
      );
      expect(selected).toBe("dreamcoder.dev08@gmail.com");
    },
  );
});

test.describe("Ship console — accessibility", () => {
  test(
    "the combobox and listbox carry the expected ARIA wiring",
    { tag: ["@console", "@a11y", "@CONSOLE-010"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();

      await expect(console_.input).toHaveAttribute("role", "combobox");
      await expect(console_.input).toHaveAttribute(
        "aria-controls",
        "console-listbox",
      );
      await expect(console_.input).toHaveAttribute("aria-expanded", "true");
      await expect(console_.listbox).toHaveAttribute("role", "listbox");

      await console_.typeQuery("Proyectos");
      const activeDescendant = await console_.input.getAttribute(
        "aria-activedescendant",
      );
      expect(activeDescendant).toBeTruthy();
      await expect(page.locator(`#${activeDescendant}`)).toHaveAttribute(
        "role",
        "option",
      );
    },
  );

  test(
    "no horizontal overflow at mobile width with the console open",
    { tag: ["@console", "@responsive", "@CONSOLE-011"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      const home = new HomePage(page);
      const console_ = new ConsolePage(page);
      await home.goto();
      await console_.openWithTrigger();
      await expect(console_.dialog).toBeVisible();

      await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);
    },
  );
});

test.describe("Ship console — other pages", () => {
  test(
    "opens and works from a project detail page",
    { tag: ["@console", "@CONSOLE-012"] },
    async ({ page }) => {
      const detail = new ProjectDetailPage(page);
      const console_ = new ConsolePage(page);
      await detail.goto(PROJECT_SLUG);

      await console_.openWithShortcut();
      await expect(console_.dialog).toBeVisible();
      await console_.typeQuery("Ver todos los proyectos");
      await expect.poll(() => console_.options.count()).toBeGreaterThan(0);
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(/\/projects\/$/);
    },
  );
});
