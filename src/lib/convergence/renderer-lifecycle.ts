/**
 * Context loss/restore and teardown for the convergence renderer: the
 * `webglcontextlost`/`webglcontextrestored` handlers with their generation
 * token, the field swap (`setField`) whose failed upload disposes, and
 * `dispose` itself. Attached only once the first build has succeeded.
 */

import type { Field } from "./field.ts";
import { build } from "./renderer-build.ts";
import type { RendererState } from "./renderer-state.ts";
import { uploadField } from "./renderer-upload.ts";

export interface RendererLifecycle {
  setField(nextField: Field): boolean;
  dispose(): void;
}

/** Registers the context loss/restore listeners on `state.canvas` and
 * returns the field-swap and teardown operations bound to the same state.
 * `onRestored` is called after every handled restore — see
 * `createRenderer`'s own comment for the `true`/`false` contract. */
export function attachLifecycle(
  state: RendererState,
  onRestored?: (success: boolean) => void,
): RendererLifecycle {
  const { canvas, gl } = state;

  function handleContextLost(event: Event) {
    event.preventDefault();
    state.contextLost = true;
    // A loss also invalidates any rebuild still in flight from an earlier
    // restore, even before the next restore event arrives.
    state.restoreGeneration++;
  }

  async function handleContextRestored() {
    // `contextLost` deliberately stays `true` for the whole rebuild below,
    // not just until this handler starts — `render()` gates on it, so a
    // frame triggered by scroll/pointer/`refreshFrame` during the awaited
    // `build()` (which yields at least once, see that function's comment)
    // can't run with the old (lost) context's `program`/VAO handles, or
    // with a half-updated mix of old and new objects while `build()` is
    // partway through reassigning them. It only flips back to `false` once
    // a rebuild actually finishes successfully, below.
    const generation = ++state.restoreGeneration;
    const success = await build(state);
    // A second `webglcontextlost`/`webglcontextrestored` cycle fired while
    // this rebuild was still in flight (context lost again mid-rebuild):
    // that newer call bumped `restoreGeneration` and owns finishing the
    // rebuild. Finalizing this stale call too — flipping `contextLost` back
    // to `false`, or disposing over a newer build's own objects — could
    // resurrect or tear down state the newer call is still using; bail out
    // instead and let its own resolution be the one that counts.
    if (generation !== state.restoreGeneration) return;
    // A rebuild failure (shader recompile or buffer re-upload, including
    // an abort raced against disposal) leaves this renderer with nothing
    // safe left to draw — dispose it here, the same as a failed `setField`
    // upload below, so both failure paths converge on one state
    // (`disposed`) and the caller's fallback handling (`onRestored`/
    // degrade) never has to special-case which one happened. On success,
    // only now is it safe to let `render()` draw again.
    if (success) state.contextLost = false;
    else dispose();
    onRestored?.(success);
  }

  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

  function setField(nextField: Field): boolean {
    if (state.disposed) return false;
    state.currentField = nextField;
    for (const buffer of state.buffers) if (buffer) gl.deleteBuffer(buffer);
    if (state.lineBuffer) gl.deleteBuffer(state.lineBuffer);
    if (state.pointsVao) gl.deleteVertexArray(state.pointsVao);
    if (state.lineVao) gl.deleteVertexArray(state.lineVao);
    const uploaded = uploadField(state);
    // A failed re-upload (e.g. buffer allocation) would otherwise leave
    // `render()` drawing the old `particleCount`/`lineVertexCount` against
    // buffers that are missing or hold the wrong field's data — dispose
    // immediately instead, so the caller (controller-field.ts's `rebuildField`)
    // sees `false` and degrades to the fallback rather than drawing stale
    // or mismatched geometry.
    if (!uploaded) dispose();
    return uploaded;
  }

  function dispose(): void {
    if (state.disposed) return;
    state.disposed = true;
    canvas.removeEventListener("webglcontextlost", handleContextLost, false);
    canvas.removeEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );
    for (const buffer of state.buffers) {
      if (buffer) gl.deleteBuffer(buffer);
    }
    if (state.lineBuffer) gl.deleteBuffer(state.lineBuffer);
    if (state.pointsVao) gl.deleteVertexArray(state.pointsVao);
    if (state.lineVao) gl.deleteVertexArray(state.lineVao);
    if (state.program) gl.deleteProgram(state.program);
    if (state.lineProgram) gl.deleteProgram(state.lineProgram);
  }

  return { setField, dispose };
}
