import { expect, test } from "@playwright/test";

test.describe("DreamCoder Links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/links/");
  });

  test("renders a working directory without external scripts", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/DreamCoder — Links/);
    const heroHeading = page.getByRole("heading", { level: 1 });
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText("Mil conexiones.");
    await expect(page.locator("[data-link-id]")).toHaveCount(7);
    await expect(page.locator(".links-portrait-image img")).toHaveCount(0);
    await expect(page.locator("[data-link-id=mascli]")).toHaveCount(0);
    await expect(page.locator("[data-link-id=portfolio]")).toHaveAttribute(
      "href",
      "/",
    );
    await expect(page.locator("[data-link-id=github]")).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  test("filters categories, retains accessible pressed state", async ({
    page,
  }) => {
    const work = page.getByRole("button", { name: "Trabajo" });
    await expect(work).toBeVisible();
    await work.click();
    await expect(work).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-link-id]:visible")).toHaveCount(3);
    await expect(page.locator("[data-link-id=arkelythex]")).toBeHidden();

    await page.getByRole("button", { name: "Social" }).click();
    await expect(page.locator("[data-link-id]:visible")).toHaveCount(3);

    await page.getByRole("button", { name: "Todos" }).click();
    await expect(page.locator("[data-link-id]:visible")).toHaveCount(7);
  });

  test("preserves all seven public links when JavaScript is disabled", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/links/");
    await expect(page.locator("[data-link-id]:visible")).toHaveCount(7);
    await expect(page.locator("[data-links-filters]")).toBeHidden();
    await context.close();
  });

  test("looks correct on a narrow phone", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator("[data-link-id=contact]")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("inherits the portfolio navbar and dark/light design tokens", async ({
    page,
  }) => {
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Dreamcoder, inicio" }),
    ).toBeVisible();
    const theme = page.getByRole("button", { name: /Cambiar a tema/ });
    const initial = await page.locator("html").getAttribute("data-theme");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      initial === "dark" ? "light" : "dark",
    );
    const actualBackground = await page
      .locator(".links-page")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(actualBackground).toBe(
      initial === "dark" ? "rgb(243, 234, 220)" : "rgb(0, 0, 0)",
    );
    await expect(page.locator("[data-link-id]")).toHaveCount(7);
  });

  test("reuses the portfolio's thumb-zone mobile navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(page.locator(".mobile-dock")).toBeVisible();
    await expect(page.locator(".mobile-dock-send")).toHaveAttribute(
      "href",
      /wa[.]me[/]/,
    );
  });
});
