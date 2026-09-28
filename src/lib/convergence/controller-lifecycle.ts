/**
 * Mount lifecycle for the convergence controller: the abortable async
 * renderer creation, and the dispose / degrade-to-fallback teardown.
 */

import { createRenderer, type ConvergenceRenderer } from "./renderer.ts";
import type { GeometryContext, MountContext } from "./controller-context.ts";
import { buildField } from "./controller-field.ts";

/**
 * Creates the renderer, or returns `null` after removing the canvas when
 * WebGL2 is unusable or a navigation aborted the mount mid-build.
 *
 * The field build is passed as a thunk, not called here: createRenderer
 * only invokes it once the WebGL2 capability check (context creation, then
 * the software-renderer check) has actually passed, so a rejected
 * environment never pays for rejection sampling + kNN edges it would just
 * throw away.
 *
 * createRenderer is async (T4f): it spans several yielded turns (field
 * build, shader compile/link, buffer upload — see its own comment) instead
 * of one synchronous call, which is the whole point — that spread-out
 * window is exactly why a navigation *during* it needs its own abort
 * signal. The render loop's own `disposed` flag and `dispose()` don't exist
 * yet at this point (there is no handle to return one yet), so this
 * temporary flag + listener pair stands in for them until either the mount
 * finishes (and the real ones take over) or one of these fires first.
 */
export async function createRendererWithEarlyAbort(
  geometry: GeometryContext,
  onRestored: (success: boolean) => void,
): Promise<ConvergenceRenderer | null> {
  const { canvas } = geometry;
  let earlyAbort = false;
  function requestEarlyAbort() {
    earlyAbort = true;
  }
  document.addEventListener("astro:before-swap", requestEarlyAbort, {
    once: true,
  });
  window.addEventListener("pagehide", requestEarlyAbort, { once: true });

  const created: ConvergenceRenderer | null = await createRenderer(
    canvas,
    () => buildField(geometry),
    onRestored,
    () => earlyAbort,
  );

  document.removeEventListener("astro:before-swap", requestEarlyAbort);
  window.removeEventListener("pagehide", requestEarlyAbort);

  if (earlyAbort) {
    // Navigated away mid-mount: createRenderer's own shouldAbort check
    // already stopped the in-flight build, so `created` is null here in
    // practice (JS never interrupts the synchronous tail of `build()`
    // between its last abort check and returning). `created?.dispose()` is
    // defensive belt-and-suspenders, not a documented reachable case.
    created?.dispose();
    canvas.remove();
    return null;
  }
  if (!created) {
    canvas.remove();
    return null;
  }
  return created;
}

export interface MountLifecycle {
  dispose(): void;
  degradeToFallback(): void;
}

/** Builds the teardown pair and registers `dispose` for navigation. */
export function createLifecycle(
  ctx: MountContext,
  teardownListeners: () => void,
): MountLifecycle {
  /** Tears the whole mount down and removes the canvas — the same fallback
   * a capability check failing at mount time already takes (see
   * `mountConvergenceField`'s catch, and the early-abort and `!created`
   * branches above), reused here for the two failures that can only be
   * discovered later: a context-restore rebuild that fails, or a
   * `setField` re-upload that fails. Both leave the renderer already
   * disposed; this finishes the job by disconnecting every
   * observer/listener and removing the now permanently-blank canvas,
   * matching "no WebGL2 at all" from the visitor's point of view instead
   * of leaving an inert, frozen surface. */
  function degradeToFallback() {
    dispose();
    ctx.canvas.remove();
  }

  function dispose() {
    if (ctx.disposed) return;
    ctx.disposed = true;
    if (ctx.rafId) cancelAnimationFrame(ctx.rafId);
    teardownListeners();
    document.removeEventListener("astro:before-swap", dispose);
    window.removeEventListener("pagehide", dispose);
    ctx.renderer.dispose();
  }

  document.addEventListener("astro:before-swap", dispose, { once: true });
  window.addEventListener("pagehide", dispose, { once: true });

  return { dispose, degradeToFallback };
}
