/**
 * DOM/rAF driver for the hero convergence field. This is the composition
 * root: it builds the explicit mount context and wires the controller
 * modules together — field build/measurement (`controller-field.ts`), the
 * on-demand rAF loop (`controller-scheduler.ts`), browser event wiring
 * (`controller-listeners.ts`) and the mount/dispose lifecycle
 * (`controller-lifecycle.ts`) — around the pure field + progress modules
 * and the WebGL renderer.
 *
 * `mountConvergenceField` never throws — every failure path (no WebGL2, a
 * compile error, a missing hero element) falls back to removing the canvas
 * so the hero renders exactly as it does with JavaScript disabled.
 */

import {
  createGeometryContext,
  createMountContext,
} from "./controller-context.ts";
import {
  applyResize,
  measureHeroGeometry,
  rebuildField,
  syncProtectUniform,
} from "./controller-field.ts";
import {
  createLifecycle,
  createRendererWithEarlyAbort,
} from "./controller-lifecycle.ts";
import { wireListeners } from "./controller-listeners.ts";
import { createScheduler } from "./controller-scheduler.ts";

export interface ConvergenceHandle {
  dispose(): void;
}

/** Mount is deferred off the critical path (see ConvergenceField.astro):
 * `requestIdleCallback` with this timeout, falling back to a short
 * `setTimeout` where the callback doesn't exist (Safari). Exported so the
 * component's own deferral script and this module agree on one number. */
export const MOUNT_IDLE_TIMEOUT_MS = 1500;

/**
 * Returns a `Promise` (T4f): `renderer.ts`'s `createRenderer` now runs the
 * field build + shader compile/link + buffer upload as several yielded
 * steps rather than one synchronous call — see its own comment for why.
 * `ConvergenceField.astro`'s caller already discards the return value
 * (cleanup is self-managed via the `astro:before-swap`/`pagehide`
 * listeners this function and `mountUnsafe` attach), so this is not a
 * breaking change for that call site.
 */
export async function mountConvergenceField(
  canvas: HTMLCanvasElement,
  heroEl: HTMLElement,
): Promise<ConvergenceHandle | null> {
  try {
    return await mountUnsafe(canvas, heroEl);
  } catch {
    try {
      canvas.remove();
    } catch {
      /* nothing left to clean up */
    }
    return null;
  }
}

/**
 * Side-effect order is part of the contract: matchMedia queries and DOM
 * measurement, the abortable renderer build, the render/pointer state,
 * resize + protect uniform + hero geometry, every listener (see
 * `wireListeners` for its order), the initial `data-state`, and finally the
 * navigation `dispose` listeners.
 */
async function mountUnsafe(
  canvas: HTMLCanvasElement,
  heroEl: HTMLElement,
): Promise<ConvergenceHandle | null> {
  const geometry = createGeometryContext(canvas, heroEl);

  const renderer = await createRendererWithEarlyAbort(geometry, (success) => {
    // Fires after a `webglcontextrestored` event. On success there is a
    // freshly rebuilt (but not yet drawn) frame waiting — request one
    // through the normal on-demand path, or render the settled static
    // frame directly if motion is reduced (see `refreshFrame`). On
    // failure the renderer already disposed itself; finish tearing down
    // the mount the same way a failed `setField` upload does. Only ever
    // fires after this function has returned, so `scheduler` and
    // `lifecycle` below are always initialized by then.
    if (success) {
      scheduler.refreshFrame();
    } else {
      degradeToFallback();
    }
  });
  if (!renderer) return null;

  const ctx = createMountContext(geometry, renderer);
  ctx.currentDpr = applyResize(ctx);
  syncProtectUniform(ctx);
  measureHeroGeometry(ctx);

  const scheduler = createScheduler(ctx);
  const teardownListeners = wireListeners(ctx, scheduler, () =>
    rebuildField(ctx, degradeToFallback),
  );
  scheduler.start();

  const lifecycle = createLifecycle(ctx, teardownListeners);
  function degradeToFallback() {
    lifecycle.degradeToFallback();
  }

  return { dispose: lifecycle.dispose };
}
