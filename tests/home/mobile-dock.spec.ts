import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";

const dock = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Accesos rápidos" });

test.describe("Mobile dock", () => {
  test(
    "shows four tabs and WhatsApp on phones, and is absent on desktop",
    { tag: ["@critical", "@mobile", "@DOCK-001"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const home = new HomePage(page);
      await home.goto();
      await expect(dock(page)).toBeVisible();
      await expect(dock(page).getByRole("link")).toHaveCount(5);
      for (const name of ["Inicio", "Proyectos", "Sobre mí", "Contacto"]) {
        const link = dock(page).getByRole("link", { name });
        await expect(link).toBeVisible();
        const box = await link.boundingBox();
        expect(box!.height, `${name} is a 44px+ target`).toBeGreaterThanOrEqual(
          44,
        );
      }
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect(dock(page)).toBeHidden();
    },
  );

  test(
    "marks the section being read, and its tabs navigate",
    { tag: ["@critical", "@mobile", "@DOCK-002"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const home = new HomePage(page);
      await home.goto();
      const tab = (name: string) => dock(page).getByRole("link", { name });
      await expect(tab("Inicio")).toHaveAttribute("aria-current", "true");
      await tab("Contacto").click();
      await expect(page).toHaveURL(/#connect$/);
      await expect(tab("Contacto")).toHaveAttribute("aria-current", "true");
      await expect(tab("Inicio")).not.toHaveAttribute("aria-current", "true");
    },
  );

  test(
    "never covers the page's last content and causes no overflow",
    { tag: ["@critical", "@mobile", "@DOCK-003"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      const home = new HomePage(page);
      await home.goto();
      await page.evaluate(() =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "instant",
        }),
      );
      const footer = await page.locator(".site-footer").boundingBox();
      const bar = await dock(page).boundingBox();
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y);
      await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);
    },
  );

  test(
    "steps aside while the mobile menu is open or a contact field has focus",
    { tag: ["@mobile", "@DOCK-004"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const home = new HomePage(page);
      await home.goto();
      await home.openMobileMenu();
      await expect(dock(page)).toBeHidden();
      await home.openMobileMenu();
      await expect(dock(page)).toBeVisible();
      const field = page.locator("#terminal-subject");
      await expect(field).toBeVisible();
      await field.focus();
      await expect(dock(page)).toBeHidden();
    },
  );
});

test.describe("Mobile rails", () => {
  test(
    "projects and principles swipe horizontally on phones and stack on desktop",
    { tag: ["@critical", "@mobile", "@RAILS-001"] },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const home = new HomePage(page);
      await home.goto();
      for (const selector of [".project-bento", "#architecture .principles"]) {
        const rail = page.locator(selector);
        const scrolls = await rail.evaluate(
          (el) =>
            el.scrollWidth > el.clientWidth + 20 &&
            getComputedStyle(el).scrollSnapType.startsWith("x"),
        );
        expect(scrolls, `${selector} is a horizontal snap rail`).toBe(true);
      }
      await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);
      await page.setViewportSize({ width: 1280, height: 900 });
      const desktopScrolls = await page
        .locator(".project-bento")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 20);
      expect(desktopScrolls).toBe(false);
    },
  );
});
