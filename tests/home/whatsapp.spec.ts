import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";

const WA = /^https:\/\/wa\.me\/51926437404\?text=/;

test.describe("Contact — WhatsApp", () => {
  for (const path of ["/", "/projects/", "/does-not-exist/"]) {
    test(
      `floating button links to wa.me in a new tab on ${path}`,
      { tag: ["@critical", "@contact", "@WHATSAPP-FAB-001"] },
      async ({ page }) => {
        await page.goto(path);
        const fab = page
          .getByRole("link", { name: /WhatsApp/ })
          .and(page.locator("[data-whatsapp-fab]"));
        await expect(fab).toBeVisible();
        await expect(fab).toHaveAttribute("href", WA);
        await expect(fab).toHaveAttribute("target", "_blank");
        await expect(fab).toHaveAttribute("rel", /noopener/);
        await expect(fab).toHaveAccessibleName(/\+51 926 437 404/);
      },
    );
  }

  test(
    "contact section offers WhatsApp first, then email, and shows the number",
    { tag: ["@critical", "@contact", "@WHATSAPP-CONTACT-001"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const actions = page.locator("#connect .contact-actions a");
      await expect(actions).toHaveCount(2);
      await expect(actions.nth(0)).toHaveAttribute("href", WA);
      await expect(actions.nth(1)).toHaveAttribute("href", /^mailto:/);
      await expect(
        page.locator("#connect .contact-channels").getByRole("link", {
          name: "+51 926 437 404",
        }),
      ).toHaveAttribute("href", WA);
    },
  );

  for (const width of [320, 390, 1280]) {
    test(
      `floating button stays inside the viewport at ${width}px with a 44px+ target`,
      { tag: ["@critical", "@contact", `@WHATSAPP-FAB-${width}`] },
      async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        const home = new HomePage(page);
        await home.goto();
        const box = await page.locator("[data-whatsapp-fab]").boundingBox();
        expect(box, "button must render").not.toBeNull();
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        expect(box!.y + box!.height).toBeLessThanOrEqual(800);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);
      },
    );
  }

  test(
    "is hidden while the command console is open",
    { tag: ["@contact", "@WHATSAPP-FAB-CONSOLE"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const fab = page.locator("[data-whatsapp-fab]");
      await expect(fab).toBeVisible();
      await page.evaluate(() =>
        (
          document.getElementById("ship-console") as HTMLDialogElement
        ).showModal(),
      );
      await expect(fab).toBeHidden();
    },
  );
});
