import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";
import { FORCE_WEBGL_INIT } from "../../scripts/lib/force-webgl.mjs";

/**
 * This file runs only under the `chromium-forced-webgl` Playwright project
 * (see `playwright.config.ts`), which launches Chromium with
 * `FORCE_WEBGL_ARGS` so its normally-rejected SwiftShader implementation
 * passes the field's own capability checks (see `scripts/lib/force-webgl.mjs`).
 * Every test in `convergence.spec.ts` correctly only ever sees the "removed"
 * fallback branch under a plain Playwright launch — that suite keeps
 * covering that branch. These tests exercise the running WebGL path
 * instead: the on-demand render loop, resize/theme/context-loss recovery,
 * and the reliability fixes from the RDD advisory review
 * (R3-reduced-motion-resize-blank, R3-context-restore-no-redraw,
 * R3-setfield-ignores-upload-failure). A project (rather than a
 * describe-scoped `test.use({ launchOptions })`) is required here because
 * Playwright refuses a `launchOptions` override inside a `describe` block —
 * it forces a new worker, which only a top-level file/project boundary can
 * do.
 */

/** Mount is deferred until after `load` + a `requestIdleCallback` (timeout
 * ~1500ms — see controller.ts's `MOUNT_IDLE_TIMEOUT_MS`), so any assertion
 * about the mount outcome needs a timeout comfortably past that. Larger
 * than `convergence.spec.ts`'s own 3000ms constant of the same name/intent:
 * this file forces real SwiftShader rendering work (rejection sampling +
 * kNN, shader compile/link, the render loop itself) instead of the cheap
 * "removed" path, so it needs more headroom when the full suite's other
 * ~90 tests are competing for CPU under `fullyParallel`. Since T4f (see
 * renderer.ts's `createRenderer`/`build`), the mount also yields once to
 * the scheduler before finishing — deliberately, so its own main-thread
 * task stays short (see `pnpm perf:probe`'s budget) — which under this
 * suite's heaviest real multi-process CPU contention can add real
 * wall-clock delay to when that yield actually resumes; measured flaking
 * at 3000ms in isolation and again at 8000ms under full-suite load. This
 * timeout is test-infrastructure headroom only; it does not relax the
 * production mount-defer budget those other constants describe. */
const MOUNT_SETTLE_TIMEOUT = 15000;

/**
 * Synchronously captures, from *inside* every real `gl.drawArrays` call,
 * whether that draw painted any non-transparent pixel — flipping
 * `window.__convergenceNonBlank` to `true` the moment it does. This is the
 * only reliable way to prove a frame actually drew content in this suite:
 * `WEBGL_CONTEXT_ATTRIBUTES` sets `preserveDrawingBuffer: false`, and
 * measured against this exact build, reading the canvas back *afterwards*
 * — `canvas.toDataURL()`, `drawImage` onto a 2D canvas, a separate
 * `gl.readPixels` call — reliably returns an all-zero buffer even while
 * the field is visibly rendering on screen (confirmed live and via
 * `page.screenshot()`), because Chromium reclaims a non-preserved drawing
 * buffer well before a second `page.evaluate()` round trip can read it.
 * Reading `gl.readPixels` *inside* the same `drawArrays` call this patch
 * wraps has no such gap: it runs in the same task as the draw itself, so
 * there is nothing in between that could invalidate the buffer. Every
 * `render()` call in renderer.ts issues at least one `drawArrays` (the
 * point cloud; the edge lines add a second one once progress is far enough
 * along), so this fires on every real frame, not just an intro-only path.
 */
const CAPTURE_NONBLANK_INIT = `(() => {
  window.__convergenceNonBlank = false;
  const proto = window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype;
  if (!proto) return;
  const original = proto.drawArrays;
  proto.drawArrays = function patchedDrawArrays(mode, first, count) {
    const result = original.call(this, mode, first, count);
    // Once the flag is already true, the proof it exists for has already
    // been made — every render() issues at least one drawArrays (often two,
    // once edge lines are visible) for the rest of the field's lifetime, and
    // reading the whole drawing buffer back with gl.readPixels + a JS alpha
    // scan on *every single one* of those calls was measured as heavy CPU
    // on SwiftShader, slowing the suite on modest machines and CI runners. Tests that reset the
    // flag (to prove a specific later action redraws) re-arm this check by
    // doing so; there is nothing to sample again until then.
    if (window.__convergenceNonBlank) return result;
    try {
      const gl = this;
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      if (w > 0 && h > 0 && count > 0) {
        const pixels = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] !== 0) {
            window.__convergenceNonBlank = true;
            break;
          }
        }
      }
    } catch {
      /* Never let the probe itself break the page under test. */
    }
    return result;
  };
})();`;

interface NonBlankWindow {
  __convergenceNonBlank?: boolean;
}

async function resetNonBlankFlag(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as NonBlankWindow).__convergenceNonBlank = false;
  });
}

/** True once at least one `drawArrays` call since the last reset (or page
 * load) painted a non-transparent pixel — see `CAPTURE_NONBLANK_INIT`. */
async function hasDrawnNonBlankFrame(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  return page.evaluate(
    () => (window as unknown as NonBlankWindow).__convergenceNonBlank === true,
  );
}

test.describe("Home — hero convergence field (forced WebGL, running path)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FORCE_WEBGL_INIT);
    await context.addInitScript(CAPTURE_NONBLANK_INIT);
  });

  test(
    "running field settles to idle-settled once nothing is animating",
    { tag: ["@hero", "@HOME-CONVERGENCE-006"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      // Past the 3s intro with nothing scrolling/pointing: the on-demand
      // loop must actually stop scheduling frames, not poll forever.
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "idle-settled",
        { timeout: MOUNT_SETTLE_TIMEOUT + 3500 },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "reduced motion redraws the static frame after a resize instead of going blank",
    { tag: ["@hero", "@HOME-CONVERGENCE-007"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const home = new HomePage(page);
      await home.goto();

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);

      // R3-reduced-motion-resize-blank: resize sets canvas.width/height,
      // which clears the GL drawing buffer. Before the fix, requestFrame's
      // unconditional `reducedMotion` guard meant nothing ever redrew it —
      // resetting the flag first means the assertion below only passes if
      // the resize itself triggers a fresh, non-blank draw.
      await resetNonBlankFlag(page);
      const original = page.viewportSize();
      await page.setViewportSize({
        width: Math.max(320, (original?.width ?? 1280) - 160),
        height: original?.height ?? 800,
      });
      await page.waitForTimeout(300);

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "reduced motion redraws the static frame with new colors after a theme toggle",
    { tag: ["@hero", "@HOME-CONVERGENCE-008"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const home = new HomePage(page);
      await home.goto();

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);

      // Same bug, different trigger: the theme MutationObserver also only
      // called requestFrame(), which no-ops while reducedMotion is true.
      await resetNonBlankFlag(page);
      await home.toggleTheme();
      await page.waitForTimeout(300);

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "static",
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "theme toggle keeps the running field rendering",
    { tag: ["@hero", "@HOME-CONVERGENCE-009"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );

      await resetNonBlankFlag(page);
      await home.toggleTheme();
      await page.waitForTimeout(300);

      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "scrolling the hero out of view pauses the field, scrolling back resumes it",
    { tag: ["@hero", "@HOME-CONVERGENCE-010"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "paused",
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );

      await resetNonBlankFlag(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );
      expect(await hasDrawnNonBlankFrame(page)).toBe(true);
    },
  );

  test(
    "recovers rendering after a WebGL context loss and restore",
    { tag: ["@hero", "@HOME-CONVERGENCE-011"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      // Specifically idle-settled, not just running/idle-settled: the
      // on-demand loop must have already stopped scheduling frames on its
      // own (see controller.ts's `loop`) before losing the context, or a
      // rAF already in flight from the 3s intro could redraw on its own
      // next tick the moment `contextLost` flips back to false — masking
      // whether `onRestored` actually requested a fresh frame, which is
      // the one thing this test exists to prove.
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "idle-settled",
        { timeout: MOUNT_SETTLE_TIMEOUT + 3500 },
      );

      // loseContext() and restoreContext() must be called on the *same*
      // WEBGL_lose_context object: measured, re-fetching the extension via
      // a fresh getContext()/getExtension() call after the context is
      // already lost returns null (the lost context stops exposing most
      // extensions, this one included, until it is actually restored) — so
      // both calls, and the flag reset in between, run inside one
      // in-page async function instead of separate round trips.
      await page.evaluate(async () => {
        const canvas = document.querySelector<HTMLCanvasElement>(
          ".hero .convergence-field",
        )!;
        const gl = canvas.getContext("webgl2")!;
        const ext = gl.getExtension("WEBGL_lose_context");
        ext?.loseContext();
        await new Promise((resolve) => setTimeout(resolve, 200));
        (
          window as unknown as { __convergenceNonBlank?: boolean }
        ).__convergenceNonBlank = false;
        ext?.restoreContext();
      });

      // R3-context-restore-no-redraw: before the fix, nothing requested a
      // frame after webglcontextrestored — the renderer rebuilt correctly,
      // but no further drawArrays call ever happened, so the canvas stayed
      // blank (idle-settled/static) forever even though build()'s success
      // was silently discarded rather than surfaced anywhere.
      //
      // `data-state` alone does not prove a NEW frame drew here: it was
      // already "idle-settled" before the loss (see the comment above) and
      // nothing in renderer.ts/controller.ts changes it for the loss/
      // restore transition itself, so an immediate match of this same regex
      // right after restoring is not evidence anything redrew — it would
      // pass even if the canvas never drew again. The non-blank flag (reset
      // right before `restoreContext()` above) is the actual proof, and it
      // is polled rather than read once: the redraw is scheduled through
      // `requestAnimationFrame` via `onRestored` → `refreshFrame`, which
      // does not necessarily land inside the same tick this `evaluate` call
      // returns.
      await expect
        .poll(() => hasDrawnNonBlankFrame(page), {
          timeout: MOUNT_SETTLE_TIMEOUT,
        })
        .toBe(true);
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
      );
    },
  );

  test(
    "a failed field re-upload degrades to the removed fallback instead of drawing stale geometry",
    { tag: ["@hero", "@HOME-CONVERGENCE-012"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        /^(running|idle-settled)$/,
        { timeout: MOUNT_SETTLE_TIMEOUT },
      );

      // Break buffer allocation on the already-mounted context so the next
      // setField (triggered below by the resize) fails partway through its
      // upload — R3-setfield-ignores-upload-failure.
      await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>(
          ".hero .convergence-field",
        )!;
        const gl = canvas.getContext("webgl2")!;
        // lib.dom's WebGL2RenderingContext types createBuffer() as always
        // returning a WebGLBuffer, but the real spec (and renderer.ts's own
        // `createFloatBuffer`) treats a null return as the documented
        // allocation-failure case — the cast simulates that real failure
        // mode past the (overly strict) ambient type.
        (gl as unknown as { createBuffer(): WebGLBuffer | null }).createBuffer =
          () => null;
      });

      const original = page.viewportSize();
      await page.setViewportSize({
        width: 500,
        height: original?.height ?? 900,
      });

      await expect(home.convergenceCanvas).toHaveCount(0, {
        timeout: MOUNT_SETTLE_TIMEOUT,
      });
    },
  );

  test(
    "a failed context-restore rebuild degrades to the removed fallback",
    { tag: ["@hero", "@HOME-CONVERGENCE-013"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      // Same idle-settled precondition as the happy-path restore test above
      // — see its comment for why.
      await expect(home.convergenceCanvas).toHaveAttribute(
        "data-state",
        "idle-settled",
        { timeout: MOUNT_SETTLE_TIMEOUT + 3500 },
      );

      await page.evaluate(async () => {
        const canvas = document.querySelector<HTMLCanvasElement>(
          ".hero .convergence-field",
        )!;
        const gl = canvas.getContext("webgl2")!;
        const ext = gl.getExtension("WEBGL_lose_context");
        ext?.loseContext();
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Break buffer allocation before restoring, the same simulated
        // failure the test above uses for a mid-session `setField`
        // re-upload — here it instead fails `uploadField()` inside the
        // rebuild that `handleContextRestored`'s `build()` runs, exercising
        // the *other* documented failure path in renderer.ts: a failed
        // rebuild disposes the renderer → `onRestored(false)` → controller's
        // `degradeToFallback()`, matching the "removed" fallback convention
        // instead of the happy-path recovery HOME-CONVERGENCE-011 covers.
        (gl as unknown as { createBuffer(): WebGLBuffer | null }).createBuffer =
          () => null;
        ext?.restoreContext();
      });

      await expect(home.convergenceCanvas).toHaveCount(0, {
        timeout: MOUNT_SETTLE_TIMEOUT,
      });
    },
  );
});
