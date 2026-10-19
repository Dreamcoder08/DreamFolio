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
    "contact section offers WhatsApp first, then email, then quiet secondary channels",
    { tag: ["@critical", "@contact", "@WHATSAPP-CONTACT-001"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      const actions = page.locator("#connect .contact-actions a");
      await expect(actions).toHaveCount(2);
      await expect(actions.nth(0)).toHaveAttribute("href", WA);
      await expect(actions.nth(1)).toHaveAttribute("href", /^mailto:/);
      const channels = page.locator("#connect .contact-channels");
      await expect(
        channels.getByRole("link", { name: /Guardar contacto/ }),
      ).toBeVisible();
      await expect(
        channels.getByRole("link", { name: /GitHub/ }),
      ).toHaveAttribute("rel", /\bme\b/);
    },
  );

  for (const width of [320, 390, 1280]) {
    test(
      `the WhatsApp control stays inside the viewport at ${width}px with a 44px+ target`,
      { tag: ["@critical", "@contact", `@WHATSAPP-FAB-${width}`] },
      async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        const home = new HomePage(page);
        await home.goto();
        // Phones get WhatsApp in the bottom dock; wider screens get the
        // floating button. Exactly one of the two is ever visible.
        const [shown, hidden] =
          width <= 720
            ? ["[data-dock-whatsapp]", "[data-whatsapp-fab]"]
            : ["[data-whatsapp-fab]", "[data-dock-whatsapp]"];
        await expect(page.locator(hidden)).toBeHidden();
        await expect(page.locator(shown)).toHaveAttribute("href", WA);
        const box = await page.locator(shown).boundingBox();
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

test.describe("Contact — save contact and install", () => {
  test(
    "the .vcf link serves a vCard with the WhatsApp number and email",
    { tag: ["@critical", "@contact", "@CONTACT-VCARD-001"] },
    async ({ page, request }) => {
      await new HomePage(page).goto();
      const link = page.getByRole("link", { name: /Guardar contacto/ });
      await expect(link).toHaveAttribute("download", "dreamcoder.vcf");
      const href = await link.getAttribute("href");
      const response = await request.get(href!);
      expect(response.ok()).toBe(true);
      const body = await response.text();
      expect(body).toMatch(/^BEGIN:VCARD\r\n/);
      expect(body).toContain("TEL;TYPE=CELL:+51926437404");
      expect(body).toContain("EMAIL;TYPE=INTERNET:dreamcoder.dev08@gmail.com");
    },
  );

  test(
    "the web manifest and every icon it lists resolve",
    { tag: ["@critical", "@seo", "@MANIFEST-001"] },
    async ({ page, request }) => {
      await new HomePage(page).goto();
      const href = await page
        .locator('link[rel="manifest"]')
        .getAttribute("href");
      const manifest = await (await request.get(href!)).json();
      expect(manifest.short_name).toBe("Dreamcoder");
      expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
      for (const icon of manifest.icons) {
        const res = await request.get(icon.src);
        expect(res.ok(), `${icon.src} must load`).toBe(true);
        expect(res.headers()["content-type"]).toContain("image/png");
      }
      const touch = await page
        .locator('link[rel="apple-touch-icon"]')
        .getAttribute("href");
      expect((await request.get(touch!)).ok()).toBe(true);
    },
  );
});
