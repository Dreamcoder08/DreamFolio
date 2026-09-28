/**
 * The yielded mount/rebuild sequence of the convergence renderer: field
 * generation, compiling and linking both programs, the field upload,
 * uniform lookup and fixed GL state. Used for the first mount and for every
 * context-restore rebuild; it writes the shared `RendererState` in place.
 */

import { compileProgramAsync, yieldToMain } from "./gl-resources.ts";
import type { RendererState } from "./renderer-state.ts";
import {
  locateLineUniforms,
  locateUniforms,
  uploadField,
} from "./renderer-upload.ts";
import {
  FRAGMENT_SHADER,
  LINE_FRAGMENT_SHADER,
  LINE_VERTEX_SHADER,
  VERTEX_SHADER,
} from "./shaders.ts";

/** Runs the mount/rebuild sequence behind one yield (see `yieldToMain`)
 * instead of one fully synchronous call, plus however many more
 * `compileProgramAsync` adds internally on a driver that actually
 * supports `KHR_parallel_shader_compile` (zero on one that doesn't —
 * confirmed against this project's own forced-SwiftShader review
 * tooling, where the extension is unavailable and that whole polling
 * branch never runs). `shouldAbortBuild` is checked after every yield: a
 * build cancelled partway through (the mount was disposed, or a
 * context-restore rebuild raced a page navigation) stops immediately
 * rather than finishing pointless work.
 *
 * Deliberately ONE yield here, not one per phase: measured with the
 * project's median-gated `pnpm perf:probe` (see `scripts/perf-probe.mjs`
 * and the T4f entries in `odd/tasks/scifi-hero-convergence.md`), the
 * unsplit synchronous version of this mount produced a single ~250-350ms
 * long task under 4x CPU throttling; splitting it behind this one yield
 * brings the field's own median cost down to ~54ms over the same page
 * with the field removed entirely (individual samples still vary by
 * roughly ±100ms — CPU-throttled emulation is noisy, which is exactly why
 * the probe medians several samples instead of trusting one). That
 * remaining ~54ms *is* this module's own work — field generation,
 * compiling and linking two programs, uploading their buffers — not
 * page-load-adjacent work it happened to collide with; the one yield's
 * job is only to stop it running back-to-back with that adjacent work as
 * one unbroken task. Splitting it into more than one yield point was
 * tried and added no further measurable improvement against the probe's
 * budget, while each extra `await` waits for a scheduler turn that
 * measurably hurt total mount latency under real multi-process CPU
 * contention (observed directly in this suite's own parallel test runs)
 * for no offsetting gain — a straight loss, not a tradeoff. */
export async function build(state: RendererState): Promise<boolean> {
  const { gl } = state;
  function shouldAbortBuild(): boolean {
    return state.disposed || state.shouldAbort();
  }

  if (shouldAbortBuild()) return false;
  await yieldToMain();
  if (shouldAbortBuild()) return false;

  state.currentField = state.buildField();
  state.particleCount = state.currentField.tones.length;
  state.lineVertexCount = state.currentField.graph.edges.length * 2;

  state.program = await compileProgramAsync(
    gl,
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    shouldAbortBuild,
  );
  state.lineProgram = await compileProgramAsync(
    gl,
    LINE_VERTEX_SHADER,
    LINE_FRAGMENT_SHADER,
    shouldAbortBuild,
  );
  const { program, lineProgram } = state;
  if (!program || !lineProgram || shouldAbortBuild()) return false;

  if (!uploadField(state)) return false;

  locateUniforms(state, program);
  locateLineUniforms(state, lineProgram);

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.enable(gl.BLEND);
  // Premultiplied-alpha blending: both fragment shaders already multiply
  // color by alpha, so overlapping soft points/lines do not double-brighten.
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return true;
}
