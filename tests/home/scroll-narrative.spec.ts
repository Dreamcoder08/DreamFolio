import { test, expect, type Page } from "@playwright/test";
import { HomePage } from "./home-page";

/**
 * Scroll-driven section narrative + HUD progress rail (phase 2, T2) — a
 * CSS-only contract (`animation-timeline: view()`/`scroll()`), no script.
 *
 * Every test here first confirms the browser actually supports scroll-driven
 * animations (`CSS.supports`) and skips otherwise: the feature is gated
 * behind `@supports (animation-timeline: view())` in `portfolio.css`, so a
 * browser without it is a legitimate "nothing here to test" case rather than
 * a failure — this suite is about the gated behavior, not about forcing
 * support that does not exist. Default Chromium (this repo's `chromium`
 * Playwright project) does support it, so in the ordinary case nothing here
 * is skipped.
 */

async function supportsScrollTimelines(page: Page): Promise<boolean> {
  return page.evaluate(() => CSS.supports("animation-timeline", "view()"));
}

/** Elements the design "takes over" from the IO reveal — one representative
 * per group is enough to prove the mechanism, not an exhaustive census. */
const SCENE_SELECTORS = [
  ".scene-kicker",
  ".scene-heading",
  ".scene-card",
] as const;

test.describe("Homepage — HUD progress rail", () => {
  test(
    "is present, aria-hidden, visible on desktop and hidden below the 900px breakpoint",
    { tag: ["@critical", "@e2e", "@scroll-narrative", "@SCROLL-RAIL-001"] },
    async ({ page }) => {
      test.skip(
        !(await supportsScrollTimelines(page)),
        "browser lacks animation-timeline: view()/scroll() support",
      );
      const home = new HomePage(page);
      const rail = page.locator(".scroll-rail");

      await page.setViewportSize({ width: 1280, height: 900 });
      await home.goto();
      await expect(rail).toHaveAttribute("aria-hidden", "true");
      await expect(rail).toBeVisible();
      await expect.poll(() => home.hasHorizontalOverflow()).toBe(false);

      // The rail must clear the fixed glass header, not run under it.
      const header = page.locator(".site-header");
      const headerBox = await header.boundingBox();
      const railBox = await rail.boundingBox();
      expect(headerBox, "header must have a bounding box").not.toBeNull();
      expect(railBox, "rail must have a bounding box").not.toBeNull();
      expect(
        railBox!.y,
        `rail top (${railBox!.y}) must be at or below the header's ` +
          `bottom edge (${headerBox!.y + headerBox!.height})`,
      ).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);

      await page.setViewportSize({ width: 800, height: 900 });
      await page.reload();
      await expect(rail).toBeHidden();
    },
  );

  test(
    "its fill scales with scroll position",
    { tag: ["@critical", "@e2e", "@scroll-narrative", "@SCROLL-RAIL-002"] },
    async ({ page }) => {
      test.skip(
        !(await supportsScrollTimelines(page)),
        "browser lacks animation-timeline: view()/scroll() support",
      );
      await page.setViewportSize({ width: 1280, height: 900 });
      const home = new HomePage(page);
      await home.goto();

      const scaleYOf = (transform: string): number => {
        // `matrix(a, b, c, d, tx, ty)` — `d` is the Y scale.
        const match = /matrix\(([^)]+)\)/.exec(transform);
        if (!match) return transform === "none" ? 1 : Number.NaN;
        const parts = match[1].split(",").map((n) => Number.parseFloat(n));
        return parts[3];
      };

      const fill = page.locator(".scroll-rail-fill");
      const fillScale = async (): Promise<number> =>
        scaleYOf(await fill.evaluate((el) => getComputedStyle(el).transform));
      // Poll the baseline too: before the scroll(root) timeline is active
      // the computed transform is `none`, which reads as scaleY 1 — a value
      // the fill can never exceed, so the growth check below could not pass.
      await expect.poll(fillScale).toBeLessThan(0.2);
      const atTop = await fillScale();
      await page.evaluate(() =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "instant",
        }),
      );
      // Scroll timelines are sampled once per frame, so a synchronous read
      // right after scrollTo can still see the pre-scroll value: poll.
      await expect
        .poll(fillScale, {
          message: `rail fill must grow with scroll from scaleY=${atTop}`,
        })
        .toBeGreaterThan(atTop);
    },
  );

  test(
    "its HUD readout lives inside the aria-hidden rail and tracks --scroll-progress from ~0 to ~100",
    { tag: ["@critical", "@e2e", "@scroll-narrative", "@SCROLL-RAIL-003"] },
    async ({ page }) => {
      test.skip(
        !(await supportsScrollTimelines(page)),
        "browser lacks animation-timeline: view()/scroll() support",
      );
      await page.setViewportSize({ width: 1280, height: 900 });
      const home = new HomePage(page);
      await home.goto();

      const readout = page.locator(".scroll-rail .scroll-rail-readout");
      await expect(readout).toBeAttached();
      // `content: counter(...)` on `::after` isn't readable via
      // getComputedStyle, so this asserts the animated custom property
      // that drives both the counter and the visible fill instead — see
      // portfolio.css's "HUD readout" comment.
      const scrollProgress = () =>
        readout.evaluate((el) =>
          Number.parseFloat(
            getComputedStyle(el).getPropertyValue("--scroll-progress"),
          ),
        );

      await expect.poll(scrollProgress).toBeLessThan(5);

      // The site sets `scroll-behavior: smooth`; an instant jump avoids
      // racing a smooth scroll still in flight when this reads.
      await page.evaluate(() =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "instant",
        }),
      );
      await expect.poll(scrollProgress).toBeGreaterThan(95);
    },
  );
});

test.describe("Homepage — scroll-driven section narrative", () => {
  test(
    "under reduced motion, every taken-over element is visible immediately, without scrolling",
    { tag: ["@critical", "@e2e", "@scroll-narrative", "@SCROLL-NARRATIVE-RM"] },
    async ({ page }) => {
      test.skip(
        !(await supportsScrollTimelines(page)),
        "browser lacks animation-timeline: view()/scroll() support",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      const home = new HomePage(page);
      await home.goto();

      for (const selector of SCENE_SELECTORS) {
        const opacities = await page
          .locator(selector)
          .evaluateAll((elements) =>
            elements.map((el) => getComputedStyle(el).opacity),
          );
        expect(
          opacities,
          `${selector}: reduced motion must never leave content hidden`,
        ).toEqual(opacities.map(() => "1"));
      }
    },
  );

  test(
    "scrolling to each section leaves its kicker, heading and cards visible",
    {
      tag: ["@critical", "@e2e", "@scroll-narrative", "@SCROLL-NARRATIVE-001"],
    },
    async ({ page }) => {
      test.skip(
        !(await supportsScrollTimelines(page)),
        "browser lacks animation-timeline: view()/scroll() support",
      );
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const home = new HomePage(page);
      await home.goto();

      // Before any scroll, at least one below-the-fold section's content
      // must still be genuinely hidden — otherwise this test could pass
      // even if the scroll-timeline wiring were entirely broken and
      // everything just rendered statically visible.
      // Polled: in the first frame after navigation the view() timeline may
      // not be resolved yet, and an inactive animation reads as opacity 1.
      await expect
        .poll(
          () =>
            page
              .locator("#connect .scene-kicker")
              .evaluate((el) => Number(getComputedStyle(el).opacity)),
          {
            message:
              "the last section's kicker must start hidden — this is the " +
              "scroll-driven half of the contract; a value of 1 here means " +
              "the animation never ran, and the reduced-motion test above " +
              "already covers the always-visible fallback",
          },
        )
        .toBeLessThan(1);

      for (const id of [
        "projects",
        "about",
        "architecture",
        "services",
        "process",
        "connect",
      ]) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded({ timeout: 5_000 });
        // One scroll-linked frame settles synchronously with scroll, but a
        // frame boundary still has to pass for the browser to have
        // recomputed style.
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            ),
        );
        for (const selector of [".scene-kicker", ".scene-heading"]) {
          const locator = page.locator(`#${id} ${selector}`);
          if ((await locator.count()) === 0) continue;
          await expect
            .poll(() => locator.evaluate((el) => getComputedStyle(el).opacity))
            .toBe("1");
        }
        const cards = page.locator(`#${id} .scene-card`);
        const cardCount = await cards.count();
        for (let index = 0; index < cardCount; index += 1) {
          await expect
            .poll(() =>
              cards.nth(index).evaluate((el) => getComputedStyle(el).opacity),
            )
            .toBe("1");
        }
      }
    },
  );
});

test.describe("Homepage — scroll narrative stagger", () => {
  test(
    "cards within each group start their entrance progressively later",
    { tag: ["@e2e", "@scroll-narrative", "@SCROLL-STAGGER-001"] },
    async ({ page }) => {
      test.skip(
        !(await supportsScrollTimelines(page)),
        "browser lacks animation-timeline: view()/scroll() support",
      );
      // The stagger that `transition-delay` used to carry now lives in each
      // card's `animation-range` start offset, so it is asserted there: a
      // regression that gives every card the same range would make a group
      // enter as one block and would pass every opacity check above.
      await page.setViewportSize({ width: 1280, height: 900 });
      await new HomePage(page).goto();

      for (const group of [
        "#projects",
        "#architecture .principles",
        "#services",
        "#process .principles",
      ]) {
        const starts = await page
          .locator(`${group} .scene-card`)
          .evaluateAll((cards) =>
            cards.map((card) => {
              // Chrome serializes `entry 0%` as a bare `entry` (the default
              // offset is dropped), so a missing number means 0.
              const offset = /-?\d+(\.\d+)?/.exec(
                getComputedStyle(card).animationRangeStart,
              );
              return offset ? Number.parseFloat(offset[0]) : 0;
            }),
          );
        expect(starts.length, `${group} has a staggered group`).toBe(3);
        for (let index = 1; index < starts.length; index += 1) {
          expect(
            starts[index],
            `${group} card ${index + 1} must start after card ${index}`,
          ).toBeGreaterThan(starts[index - 1]);
        }
      }
    },
  );
});
