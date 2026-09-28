import { test, type Page } from "@playwright/test";
import { FORCE_WEBGL_INIT } from "../../scripts/lib/force-webgl.mjs";

/**
 * Shared setup for the `tests/home/convergence-forced-*.spec.ts` files, which
 * run only under the `chromium-forced-webgl` Playwright project
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
 * these specs force real SwiftShader rendering work (rejection sampling +
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
export const MOUNT_SETTLE_TIMEOUT = 15000;

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

export async function resetNonBlankFlag(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as NonBlankWindow).__convergenceNonBlank = false;
  });
}

/** True once at least one `drawArrays` call since the last reset (or page
 * load) painted a non-transparent pixel — see `CAPTURE_NONBLANK_INIT`. */
export async function hasDrawnNonBlankFrame(page: Page): Promise<boolean> {
  return page.evaluate(
    () => (window as unknown as NonBlankWindow).__convergenceNonBlank === true,
  );
}

/** Registers the per-test init scripts every forced-WebGL spec needs: the
 * capability-check override and the non-blank draw probe. Call it inside the
 * spec's `test.describe` block. */
export function installForcedWebglProbes(): void {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(FORCE_WEBGL_INIT);
    await context.addInitScript(CAPTURE_NONBLANK_INIT);
  });
}
