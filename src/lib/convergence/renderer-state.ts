/**
 * The renderer's public shapes plus the one typed, mutable state object the
 * `renderer-*.ts` stages share. `createRenderer` builds a single
 * `RendererState` per mount and every stage (build, draw, lifecycle) reads
 * and writes that SAME object — never a copy — so a handle reassigned by a
 * context-restore rebuild is the one the next `render()` sees.
 */

import type { Field } from "./field.ts";

export interface ConvergenceUniforms {
  progress: number;
  time: number;
  dpr: number;
  /** Pointer position in the field's own [-1, 1] logical space. */
  pointer: readonly [number, number];
  pointerStrength: number;
  idleAmount: number;
  accent: readonly [number, number, number];
  neutral: readonly [number, number, number];
  alpha: number;
  /** Flat `[cx, cy, halfW, halfH, cx, cy, halfW, halfH, ...]` field-space
   * rects around every small-text/interactive hero block (kicker, intro,
   * brief, ticker, ...) that particles and edge lines are dimmed near.
   * Length is always `MAX_PROTECT_RECTS * 4`; only the first
   * `protectCount` rects (4 floats each) are read — see `uProtect` /
   * `uProtectCount` in shaders.ts. Caller-owned and reused across frames
   * so the render loop stays allocation-free. */
  protectRects: Float32Array;
  protectCount: number;
}

export interface ConvergenceRenderer {
  resize(width: number, height: number, dpr: number): void;
  render(uniforms: ConvergenceUniforms): void;
  /** Re-uploads a new field's data (e.g. after a resize reshapes the hub
   * layout around a moved anchor) without recompiling the programs. Returns
   * `false` if the GPU upload itself fails (e.g. buffer allocation), in
   * which case the renderer has already disposed itself rather than drawing
   * with stale buffer/particle counts — the caller must treat the field as
   * gone (remove the canvas) instead of calling `render` again. */
  setField(field: Field): boolean;
  dispose(): void;
}

/** Placeholder `currentField` for the window between `createRenderer`
 * being called and `build()`'s first yielded step actually running
 * `buildField()` — see that field's own comment. Zero particles/edges, so
 * nothing reads it as real data; `particleCount`/`lineVertexCount` stay 0
 * (and `render()`'s `drawArrays` calls stay no-ops) until the real field
 * replaces it. */
const EMPTY_FIELD: Field = {
  chaosPositions: new Float32Array(0),
  orderPositions: new Float32Array(0),
  delays: new Float32Array(0),
  sizes: new Float32Array(0),
  tones: new Float32Array(0),
  graph: { hubs: [], edges: [] },
};

export interface RendererState {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  readonly buildField: () => Field;
  readonly shouldAbort: () => boolean;
  // currentField starts as an empty placeholder — the real field is built
  // inside `build()`'s first yielded step, not eagerly at creation, so the
  // (comparatively expensive, ~15-20ms) rejection sampling + kNN work gets
  // its own turn instead of running back-to-back with context creation.
  currentField: Field;
  particleCount: number;
  lineVertexCount: number;
  program: WebGLProgram | null;
  lineProgram: WebGLProgram | null;
  buffers: (WebGLBuffer | null)[];
  lineBuffer: WebGLBuffer | null;
  pointsVao: WebGLVertexArrayObject | null;
  lineVao: WebGLVertexArrayObject | null;
  uniformLocations: Record<string, WebGLUniformLocation | null>;
  lineUniformLocations: Record<string, WebGLUniformLocation | null>;
  disposed: boolean;
  contextLost: boolean;
  /** Incremented once per `handleContextRestored` call, and compared back
   * against itself after that call's `await build()` resolves — see that
   * handler's own comment for why a stale (superseded) rebuild must not
   * finalize renderer state a newer one already owns. */
  restoreGeneration: number;
  aspectX: number;
  aspectY: number;
}

export function createRendererState(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  buildField: () => Field,
  shouldAbort: () => boolean,
): RendererState {
  return {
    canvas,
    gl,
    buildField,
    shouldAbort,
    currentField: EMPTY_FIELD,
    particleCount: 0,
    lineVertexCount: 0,
    program: null,
    lineProgram: null,
    buffers: [],
    lineBuffer: null,
    pointsVao: null,
    lineVao: null,
    uniformLocations: {},
    lineUniformLocations: {},
    disposed: false,
    contextLost: false,
    restoreGeneration: 0,
    aspectX: 1,
    aspectY: 1,
  };
}
