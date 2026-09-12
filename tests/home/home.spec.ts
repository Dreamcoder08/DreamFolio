import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";

test.describe("Home — responsive layout", () => {
  const widths = [320, 375, 480, 721, 768, 1024, 1280, 1366, 1440, 1920];

  for (const width of widths) {
    test(
      `no horizontal overflow at ${width}px`,
      { tag: ["@critical", "@responsive", `@HOME-RESPONSIVE-${width}`] },
      async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const home = new HomePage(page);
        await home.goto();
        await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);
      },
    );
  }
});

test.describe("Home — navbar", () => {
  test(
    "theme toggle switches and persists across reload",
    { tag: ["@critical", "@navbar", "@HOME-NAVBAR-001"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      const initial = await home.currentTheme();
      await home.toggleTheme();
      await expect.poll(() => home.currentTheme()).not.toBe(initial);

      const toggled = await home.currentTheme();
      await page.reload();
      await expect.poll(() => home.currentTheme()).toBe(toggled);
    },
  );

  test(
    "mobile menu opens, closes on Escape with focus returned, and closes on link click",
    { tag: ["@critical", "@navbar", "@HOME-NAVBAR-002"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const home = new HomePage(page);
      await home.goto();

      await expect(home.mobileNav).toBeHidden();
      await home.openMobileMenu();
      await expect(home.mobileNav).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(home.mobileNav).toBeHidden();
      await expect(home.menuToggle).toBeFocused();

      await home.openMobileMenu();
      await home.mobileNav.getByRole("link").first().click();
      await expect(home.mobileNav).toBeHidden();
    },
  );
});
