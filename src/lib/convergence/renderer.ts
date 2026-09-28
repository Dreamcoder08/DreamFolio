/**
 * WebGL2 adapter for the hero convergence field. Together with the internal
 * `renderer-*.ts` stages and `gl-resources.ts` helpers, it owns the GL API —
 * `controller.ts` drives it with plain numbers and never imports `gl`
 * directly, so the WebGL surface stays isolated from the DOM/rAF/observer
 * wiring around it. This file is only the composition root: capability
 * probe (`renderer-probe.ts`) → shared state (`renderer-state.ts`) → yielded
 * build (`renderer-build.ts`) → loss/restore/teardown
 * (`renderer-lifecycle.ts`) → per-frame draw (`renderer-draw.ts`).
 *
 * `createRenderer` returns `null` when WebGL2 is unavailable or the shaders
 * fail to compile/link, so callers can fall back to "no field" without
 * throwing.
 */

import type { Field } from "./field.ts";
import { build } from "./renderer-build.ts";
import { render, resize } from "./renderer-draw.ts";
import { attachLifecycle } from "./renderer-lifecycle.ts";
import {
  isSoftwareRenderer,
  WEBGL_CONTEXT_ATTRIBUTES,
} from "./renderer-probe.ts";
import {
  createRendererState,
  type ConvergenceRenderer,
} from "./renderer-state.ts";

/** Re-exported so `controller.ts` sizes its cached uniform buffer against
 * the same number the shaders were compiled with, instead of a second
 * hardcoded constant that could silently drift out of sync. */
export { MAX_PROTECT_RECTS } from "./shaders.ts";
export { computeAspectScale } from "./renderer-draw.ts";
export { WEBGL_CONTEXT_ATTRIBUTES } from "./renderer-probe.ts";
export type {
  ConvergenceRenderer,
  ConvergenceUniforms,
} from "./renderer-state.ts";

/**
 * `buildField` is a thunk rather than an already-computed `Field` on
 * purpose: rejection sampling + k-nearest-neighbor edges for up to ~2600
 * particles is cheap in isolation, but it is still wasted work when the
 * capability check just below is about to reject the context anyway (no
 * WebGL2, or a software renderer) — this way that never happens, and the
 * one real field build only runs once capability is confirmed.
 *
 * `onRestored` is called after a `webglcontextrestored` event has been
 * handled: with `true` once programs are recompiled and the field
 * re-uploaded (the caller should request a fresh frame — see
 * `controller-scheduler.ts`'s `refreshFrame`), or `false` if that rebuild itself
 * failed, in which case this renderer has already disposed itself and the
 * caller must degrade to the no-field fallback instead of expecting further
 * frames.
 *
 * `shouldAbort` is polled between every yielded step of the mount below
 * (see `build`): the caller passes it so a hero that gets unmounted (page
 * navigation) mid-build stops spending any more turns on a renderer
 * nothing will ever use, instead of racing an in-flight `Promise` against
 * a `dispose()` call that has nothing yet to dispose.
 *
 * This whole function is async because the mount work it does — the field
 * generation `buildField` runs (rejection sampling + k-nearest-neighbor
 * edges), compiling and linking two shader programs, and uploading their
 * buffers — used to run as one uninterrupted synchronous call, which
 * measured as a single ~250-350ms main-thread task under mobile CPU
 * throttling (`pnpm perf:probe`), almost entirely NOT this function's own
 * work (profiled at ~25-35ms total in isolation) but adjacent page-load
 * work that this call happened to run back-to-back with, with no task
 * boundary between them for the browser to schedule anything else in. One
 * yield up front (see `build`'s own comment for why just one, not one per
 * phase) breaks that adjacency; a driver that also supports
 * `KHR_parallel_shader_compile` gets further yields for free inside
 * `compileProgramAsync`.
 */
export async function createRenderer(
  canvas: HTMLCanvasElement,
  buildField: () => Field,
  onRestored?: (success: boolean) => void,
  shouldAbort: () => boolean = () => false,
): Promise<ConvergenceRenderer | null> {
  const context = canvas.getContext("webgl2", WEBGL_CONTEXT_ATTRIBUTES);
  if (!context) return null;
  if (isSoftwareRenderer(context)) return null;

  const state = createRendererState(canvas, context, buildField, shouldAbort);
  if (!(await build(state))) return null;

  // Listeners are registered only after the first build succeeded, exactly
  // as before the split: a mount that fails its build never attaches them.
  const { setField, dispose } = attachLifecycle(state, onRestored);

  return {
    resize: (width, height, dpr) => resize(state, width, height, dpr),
    render: (uniforms) => render(state, uniforms),
    setField,
    dispose,
  };
}
