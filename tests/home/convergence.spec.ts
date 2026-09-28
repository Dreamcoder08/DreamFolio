import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";

/**
 * Headless Chromium under Playwright typically only has a software WebGL2
 * implementation (SwiftShader), not GPU-accelerated hardware — CI runners,
 * sandboxes and this suite's default launch all fall in that bucket. The
 * field intentionally treats that the same as "no WebGL2" (see renderer.ts's
 * `isSoftwareRenderer`: a software rasterizer running the render loop
 * measured ~5.4s of Lighthouse Total Blocking Time). So under a plain
 * Playwright launch this suite should — correctly — usually see the canvas
 * removed. It still checks the actual capability first rather than
 * assuming that outcome, so it also passes in an environment with real GPU
 * acceleration, or one that spoofs `UNMASKED_RENDERER_WEBGL` the way
 * scripts/visual-snapshots.mjs does for visual review.
 *
 * Mirrors renderer.ts's own two checks — `WEBGL_CONTEXT_ATTRIBUTES` and
 * `isSoftwareRenderer`'s renderer-string test — exactly, on purpose: a
 * probe with different logic could report "capable" in cases where
 * production actually bails out, or vice versa. `failIfMajorPerformanceCaveat`
 * alone was measured NOT to reject SwiftShader on the Chromium version this
 * repo's tooling uses (it reports as `ANGLE (..., Vulkan ... SwiftShader
 * Device ..., SwiftShader driver)`, and the context is still returned) —
 * the renderer-string check is what actually catches it.
 */
async function hasCapableWebgl2(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl) return false;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return true;
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return (
      typeof renderer !== "string" ||
      !/swiftshader|llvmpipe|software|microsoft basic render/i.test(renderer)
    );
  });
}

/** Mount is deferred until after `load` + a `requestIdleCallback` (timeout
 * ~1500ms — see controller.ts's `MOUNT_IDLE_TIMEOUT_MS`), so any assertion
 * about the mount outcome (canvas present/removed, its `data-state`) needs
 * a timeout comfortably past that instead of firing immediately. */
const MOUNT_SETTLE_TIMEOUT = 3000;

test.describe("Home — hero convergence field", () => {
  test(
    "canvas exists and is aria-hidden when WebGL2 is capable, and is removed entirely otherwise",
    { tag: ["@critical", "@hero", "@HOME-CONVERGENCE-001"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      if (await hasCapableWebgl2(page)) {
        await expect(home.convergenceCanvas).toHaveCount(1);
        await expect(home.convergenceCanvas).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      } else {
        // The canvas is always present in the server-rendered markup — the
        // deferred mount script (load + requestIdleCallback) is what
        // removes it once it detects no capable WebGL2, so this needs to
        // wait for that decision rather than checking immediately.
        await expect(home.convergenceCanvas).toHaveCount(0, {
          timeout: MOUNT_SETTLE_TIMEOUT,
        });
      }
    },
  );

  test(
    "hero h1 stays visible and in front of the field",
    { tag: ["@critical", "@hero", "@HOME-CONVERGENCE-002"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await expect(home.heroTitle).toBeVisible();

      // The canvas is pointer-events: none and layered below the hero
      // content, so a hit test at the title's own position must resolve to
      // the title (or a descendant of it), never the canvas.
      const box = await home.heroTitle.boundingBox();
      expect(box).not.toBeNull();
      const hitsTitle = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          const title = document.getElementById("hero-title");
          return !!el && !!title && title.contains(el);
        },
        { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
      );
      expect(hitsTitle).toBe(true);
    },
  );

  test(
    "loads with no console errors",
    { tag: ["@critical", "@hero", "@HOME-CONVERGENCE-003"] },
    async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(String(error)));

      const home = new HomePage(page);
      await home.goto();
      await expect(home.heroTitle).toBeVisible();
      await page.waitForLoadState("load");
      // Long enough to cover the deferred mount's requestIdleCallback
      // window (see MOUNT_SETTLE_TIMEOUT) so a mount-time error — WebGL
      // context creation, shader compile, field generation — is actually
      // captured instead of the check running before it happens.
      await page.waitForTimeout(MOUNT_SETTLE_TIMEOUT);

      expect(errors).toEqual([]);
    },
  );

  test(
    "prefers-reduced-motion renders one static, fully-converged frame when WebGL2 is capable, and stays removed otherwise",
    { tag: ["@critical", "@hero", "@HOME-CONVERGENCE-004"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const home = new HomePage(page);
      await home.goto();

      // The capability check (see hasCapableWebgl2) happens before the
      // reduced-motion branch inside mountConvergenceField: no capable
      // WebGL2 means the canvas is removed either way, motion preference
      // aside — a single static frame still needs somewhere to draw it.
      if (await hasCapableWebgl2(page)) {
        await expect(home.convergenceCanvas).toHaveAttribute(
          "data-state",
          "static",
          { timeout: MOUNT_SETTLE_TIMEOUT },
        );

        // It must actually stay static — no rAF loop advancing it further.
        await page.waitForTimeout(400);
        await expect(home.convergenceCanvas).toHaveAttribute(
          "data-state",
          "static",
        );
      } else {
        await expect(home.convergenceCanvas).toHaveCount(0, {
          timeout: MOUNT_SETTLE_TIMEOUT,
        });
      }
    },
  );

  test(
    "without reduced motion, the field runs when WebGL2 is available and degrades gracefully otherwise",
    { tag: ["@critical", "@hero", "@HOME-CONVERGENCE-005"] },
    async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));

      const home = new HomePage(page);
      await home.goto();
      await expect(home.heroTitle).toBeVisible();

      if (await hasCapableWebgl2(page)) {
        // "running" while the intro/scroll/pointer are still animating,
        // or already "idle-settled" if the render-on-demand loop finished
        // and stopped scheduling frames before this check ran — both are
        // the correct capable-and-mounted outcome, not a degraded one.
        await expect(home.convergenceCanvas).toHaveAttribute(
          "data-state",
          /^(running|idle-settled)$/,
          { timeout: MOUNT_SETTLE_TIMEOUT },
        );
      } else {
        // No capable WebGL2: the canvas must be removed entirely, not
        // left inert (see MOUNT_SETTLE_TIMEOUT for why this needs to wait
        // for the deferred mount to actually run its decision).
        await expect(home.convergenceCanvas).toHaveCount(0, {
          timeout: MOUNT_SETTLE_TIMEOUT,
        });
      }

      expect(errors).toEqual([]);
    },
  );
});
