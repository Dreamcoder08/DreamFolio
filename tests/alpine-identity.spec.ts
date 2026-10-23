import { expect, test } from "@playwright/test";

test.describe("Alpine technical identity", () => {
  test("home replaces the old portrait with a text-only technical plate", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".hero-portrait img")).toHaveCount(0);
    await expect(page.locator(".profile-portrait img")).toHaveCount(0);
    await expect(page.locator("[data-technical-identity]")).toBeVisible();
    await expect(page.locator("[data-technical-identity]")).toContainText(
      "AI / SOFTWARE",
    );
  });

  test("links does not render profile photo and uses the shared technical plate", async ({
    page,
  }) => {
    await page.goto("/links/");
    await expect(page.locator(".links-portrait-frame img")).toHaveCount(0);
    await expect(page.locator("[data-technical-identity]")).toBeVisible();
    await expect(page.locator("[data-link-id=mascli]")).toHaveCount(0);
    await expect(page.locator("[data-link-id]")).toHaveCount(7);
  });

  test("mobile remains usable without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    await expect(page.locator("[data-technical-identity]")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 20,
    );
    expect(overflow).toBe(false);
  });
});
