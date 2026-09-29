import { test, expect } from "@playwright/test";
import { HomePage } from "./home-page";
import {
  MOUNT_SETTLE_TIMEOUT,
  hasDrawnNonBlankFrame,
  installForcedWebglProbes,
  type NonBlankWindow,
} from "./forced-webgl";

/**
 * Forced-WebGL recovery path: rendering resumes after a context loss and
 * restore, and a failed re-upload or rebuild degrades to the removed fallback
 * (R3-context-restore-no-redraw, R3-setfield-ignores-upload-failure). Setup
 * and probes live in `./forced-webgl.ts`.
 */

test.describe("Home — hero convergence field (forced WebGL, context loss and recovery)", () => {
  installForcedWebglProbes();

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
        (window as unknown as NonBlankWindow).__convergenceNonBlank = false;
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
