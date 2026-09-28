/**
 * WebGL2 adapter for the hero convergence field. Together with the internal
 * `gl-resources.ts` helpers, it owns the GL API — `controller.ts` drives it
 * with plain numbers and never imports `gl` directly, so the WebGL surface
 * stays isolated from the DOM/rAF/observer wiring around it.
 *
 * `createRenderer` returns `null` when WebGL2 is unavailable or the shaders
 * fail to compile/link, so callers can fall back to "no field" without
 * throwing.
 */

import type { Field } from "./field.ts";
import {
  compileProgramAsync,
  createFloatBuffer,
  yieldToMain,
} from "./gl-resources.ts";
import {
  FRAGMENT_SHADER,
  LINE_FRAGMENT_SHADER,
  LINE_VERTEX_SHADER,
  MAX_PROTECT_RECTS,
  VERTEX_SHADER,
} from "./shaders.ts";

/** Re-exported so `controller.ts` sizes its cached uniform buffer against
 * the same number the shaders were compiled with, instead of a second
 * hardcoded constant that could silently drift out of sync. */
export { MAX_PROTECT_RECTS };

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

/**
 * Pure: how much a canvas of `width` x `height` scales x and y so a shape
 * defined in field-logical space renders without stretching. Exported so
 * `controller.ts` can apply the exact same scale when converting a DOM rect
 * (the portrait anchor, the pointer) into that same logical space.
 */
export function computeAspectScale(
  width: number,
  height: number,
): [number, number] {
  if (width <= 0 || height <= 0) return [1, 1];
  if (width >= height) return [height / width, 1];
  return [1, width / height];
}

const ATTRIB = {
  chaosPos: 0,
  orderPos: 1,
  delay: 2,
  size: 3,
  tone: 4,
} as const;

const LINE_ATTRIB = { pos: 0 } as const;

/** Flattens the hub graph's edges into a gl.LINES-ready vertex buffer:
 * two (x, y) pairs per edge, at the hubs' fixed order positions. */
function buildLineVertices(field: Field): Float32Array {
  const { hubs, edges } = field.graph;
  const vertices = new Float32Array(edges.length * 4);
  for (let i = 0; i < edges.length; i += 1) {
    const [a, b] = edges[i];
    vertices[i * 4] = hubs[a].x;
    vertices[i * 4 + 1] = hubs[a].y;
    vertices[i * 4 + 2] = hubs[b].x;
    vertices[i * 4 + 3] = hubs[b].y;
  }
  return vertices;
}

/**
 * Context attributes for the WebGL2 canvas, including
 * `failIfMajorPerformanceCaveat`: on browsers that honor it, a
 * software-only implementation (no real GPU) fails context creation
 * outright, the same as no WebGL2 at all. In practice this alone is not
 * sufficient — see `isSoftwareRenderer` below for why — but it is free
 * defense-in-depth on the browsers where it does work, and it documents
 * the intent. Exported so the e2e suite's own capability probe never
 * drifts from what `getContext` is actually called with here.
 */
export const WEBGL_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "low-power",
  failIfMajorPerformanceCaveat: true,
};

/**
 * Substrings that show up in `UNMASKED_RENDERER_WEBGL` for a software (no
 * real GPU) implementation, lowercased for a case-insensitive match.
 * SwiftShader is the one that actually matters here — measured: headless
 * Chromium's `getContext("webgl2", { failIfMajorPerformanceCaveat: true })`
 * still happily returns a context reporting
 * `ANGLE (Google, Vulkan ... (SwiftShader Device ...), SwiftShader driver)`
 * on the Chromium version this repo's Playwright/Lighthouse actually use —
 * the context attribute alone does not reject it. Rendering the field with
 * that renderer measured ~5.4s of Lighthouse Total Blocking Time on this
 * exact page (the same build with the field removed entirely scores TBT
 * 0ms), so this check exists to catch what the context attribute doesn't:
 * mount, read the renderer string back out, and bail if it's software —
 * same fallback path as "no WebGL2 at all". `llvmpipe` (Mesa's software
 * rasterizer, common on headless Linux without `libgl1-mesa-dri`/GPU
 * passthrough) and generic "software"/"microsoft basic render" strings are
 * included for the same reason on other platforms.
 */
const SOFTWARE_RENDERER_PATTERN =
  /swiftshader|llvmpipe|software|microsoft basic render/i;

function isSoftwareRenderer(gl: WebGL2RenderingContext): boolean {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  // Extension unavailable (blocked for fingerprinting, or just missing):
  // there is no reliable signal either way, so this check does not reject
  // the context — failIfMajorPerformanceCaveat above remains the (weaker)
  // line of defense in that case rather than over-rejecting real GPUs.
  if (!debugInfo) return false;
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  return (
    typeof renderer === "string" && SOFTWARE_RENDERER_PATTERN.test(renderer)
  );
}

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
  // Rebound to a non-nullable local: TypeScript does not carry the null
  // check above into the nested closures below, even though `context` is a
  // `const` that can never become null again.
  const gl: WebGL2RenderingContext = context;

  // currentField starts as an empty placeholder — the real field is built
  // inside `build()`'s first yielded step below, not eagerly here, so the
  // (comparatively expensive, ~15-20ms) rejection sampling + kNN work gets
  // its own turn instead of running back-to-back with context creation.
  let currentField: Field = EMPTY_FIELD;
  let particleCount = 0;
  let lineVertexCount = 0;

  let program: WebGLProgram | null = null;
  let lineProgram: WebGLProgram | null = null;
  let buffers: (WebGLBuffer | null)[] = [];
  let lineBuffer: WebGLBuffer | null = null;
  let pointsVao: WebGLVertexArrayObject | null = null;
  let lineVao: WebGLVertexArrayObject | null = null;
  let uniformLocations: Record<string, WebGLUniformLocation | null> = {};
  let lineUniformLocations: Record<string, WebGLUniformLocation | null> = {};
  let disposed = false;
  let contextLost = false;
  /** Incremented once per `handleContextRestored` call, and compared back
   * against itself after that call's `await build()` resolves — see that
   * handler's own comment for why a stale (superseded) rebuild must not
   * finalize renderer state a newer one already owns. */
  let restoreGeneration = 0;
  let aspectX = 1;
  let aspectY = 1;

  function locateUniforms(prog: WebGLProgram) {
    uniformLocations = {
      progress: gl.getUniformLocation(prog, "uProgress"),
      time: gl.getUniformLocation(prog, "uTime"),
      dpr: gl.getUniformLocation(prog, "uDpr"),
      pointer: gl.getUniformLocation(prog, "uPointer"),
      pointerStrength: gl.getUniformLocation(prog, "uPointerStrength"),
      idleAmount: gl.getUniformLocation(prog, "uIdleAmount"),
      aspect: gl.getUniformLocation(prog, "uAspect"),
      accent: gl.getUniformLocation(prog, "uAccent"),
      neutral: gl.getUniformLocation(prog, "uNeutral"),
      alpha: gl.getUniformLocation(prog, "uAlpha"),
      protect: gl.getUniformLocation(prog, "uProtect"),
      protectCount: gl.getUniformLocation(prog, "uProtectCount"),
    };
  }

  function locateLineUniforms(prog: WebGLProgram) {
    lineUniformLocations = {
      aspect: gl.getUniformLocation(prog, "uAspect"),
      color: gl.getUniformLocation(prog, "uColor"),
      alpha: gl.getUniformLocation(prog, "uAlpha"),
      protect: gl.getUniformLocation(prog, "uProtect"),
      protectCount: gl.getUniformLocation(prog, "uProtectCount"),
    };
  }

  /** (Re)uploads `currentField`'s data into fresh GPU buffers and VAOs.
   * Used both on first build and to accept a reshaped field (setField)
   * without paying for a shader recompile. Each draw call binds its own
   * VAO explicitly in render() — attribute bindings are per-VAO state, so
   * without that the line draw would read the points' buffers. */
  function uploadField(): boolean {
    pointsVao = gl.createVertexArray();
    if (!pointsVao) return false;
    gl.bindVertexArray(pointsVao);
    buffers = [
      createFloatBuffer(gl, ATTRIB.chaosPos, currentField.chaosPositions, 2),
      createFloatBuffer(gl, ATTRIB.orderPos, currentField.orderPositions, 2),
      createFloatBuffer(gl, ATTRIB.delay, currentField.delays, 1),
      createFloatBuffer(gl, ATTRIB.size, currentField.sizes, 1),
      createFloatBuffer(gl, ATTRIB.tone, currentField.tones, 1),
    ];
    if (buffers.some((buffer) => buffer === null)) return false;
    particleCount = currentField.tones.length;

    lineVao = gl.createVertexArray();
    if (!lineVao) return false;
    gl.bindVertexArray(lineVao);
    const lineVertices = buildLineVertices(currentField);
    lineBuffer = createFloatBuffer(gl, LINE_ATTRIB.pos, lineVertices, 2);
    if (!lineBuffer) return false;
    lineVertexCount = currentField.graph.edges.length * 2;

    return true;
  }

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
  function shouldAbortBuild(): boolean {
    return disposed || shouldAbort();
  }

  async function build(): Promise<boolean> {
    if (shouldAbortBuild()) return false;
    await yieldToMain();
    if (shouldAbortBuild()) return false;

    currentField = buildField();
    particleCount = currentField.tones.length;
    lineVertexCount = currentField.graph.edges.length * 2;

    program = await compileProgramAsync(
      gl,
      VERTEX_SHADER,
      FRAGMENT_SHADER,
      shouldAbortBuild,
    );
    lineProgram = await compileProgramAsync(
      gl,
      LINE_VERTEX_SHADER,
      LINE_FRAGMENT_SHADER,
      shouldAbortBuild,
    );
    if (!program || !lineProgram || shouldAbortBuild()) return false;

    if (!uploadField()) return false;

    locateUniforms(program);
    locateLineUniforms(lineProgram);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.enable(gl.BLEND);
    // Premultiplied-alpha blending: both fragment shaders already multiply
    // color by alpha, so overlapping soft points/lines do not double-brighten.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }

  if (!(await build())) return null;

  function handleContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    // A loss also invalidates any rebuild still in flight from an earlier
    // restore, even before the next restore event arrives.
    restoreGeneration++;
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
    const generation = ++restoreGeneration;
    const success = await build();
    // A second `webglcontextlost`/`webglcontextrestored` cycle fired while
    // this rebuild was still in flight (context lost again mid-rebuild):
    // that newer call bumped `restoreGeneration` and owns finishing the
    // rebuild. Finalizing this stale call too — flipping `contextLost` back
    // to `false`, or disposing over a newer build's own objects — could
    // resurrect or tear down state the newer call is still using; bail out
    // instead and let its own resolution be the one that counts.
    if (generation !== restoreGeneration) return;
    // A rebuild failure (shader recompile or buffer re-upload, including
    // an abort raced against disposal) leaves this renderer with nothing
    // safe left to draw — dispose it here, the same as a failed `setField`
    // upload below, so both failure paths converge on one state
    // (`disposed`) and the caller's fallback handling (`onRestored`/
    // degrade) never has to special-case which one happened. On success,
    // only now is it safe to let `render()` draw again.
    if (success) contextLost = false;
    else dispose();
    onRestored?.(success);
  }

  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

  function resize(width: number, height: number, dpr: number): void {
    if (disposed) return;
    const backingWidth = Math.max(1, Math.round(width * dpr));
    const backingHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    gl.viewport(0, 0, backingWidth, backingHeight);

    // Non-uniform scale so a square field stays visually square instead of
    // stretching with the canvas — see field.ts's coordinate-space comment.
    [aspectX, aspectY] = computeAspectScale(width, height);
  }

  function setField(nextField: Field): boolean {
    if (disposed) return false;
    currentField = nextField;
    for (const buffer of buffers) if (buffer) gl.deleteBuffer(buffer);
    if (lineBuffer) gl.deleteBuffer(lineBuffer);
    if (pointsVao) gl.deleteVertexArray(pointsVao);
    if (lineVao) gl.deleteVertexArray(lineVao);
    const uploaded = uploadField();
    // A failed re-upload (e.g. buffer allocation) would otherwise leave
    // `render()` drawing the old `particleCount`/`lineVertexCount` against
    // buffers that are missing or hold the wrong field's data — dispose
    // immediately instead, so the caller (controller-field.ts's `rebuildField`)
    // sees `false` and degrades to the fallback rather than drawing stale
    // or mismatched geometry.
    if (!uploaded) dispose();
    return uploaded;
  }

  function render(uniforms: ConvergenceUniforms): void {
    if (disposed || contextLost || !program || !lineProgram) return;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Lines first, underneath the point cloud: thin edges that "light up"
    // as progress approaches 1, near-invisible at chaos.
    const lineAlpha =
      Math.max(0, Math.min(1, (uniforms.progress - 0.15) / 0.6)) *
      uniforms.alpha *
      0.8;
    if (lineVertexCount > 0 && lineAlpha > 0.001 && lineVao) {
      gl.bindVertexArray(lineVao);
      gl.useProgram(lineProgram);
      gl.uniform2f(lineUniformLocations.aspect, aspectX, aspectY);
      gl.uniform3f(
        lineUniformLocations.color,
        uniforms.accent[0],
        uniforms.accent[1],
        uniforms.accent[2],
      );
      gl.uniform1f(lineUniformLocations.alpha, lineAlpha);
      gl.uniform4fv(lineUniformLocations.protect, uniforms.protectRects);
      gl.uniform1i(lineUniformLocations.protectCount, uniforms.protectCount);
      gl.drawArrays(gl.LINES, 0, lineVertexCount);
    }

    gl.bindVertexArray(pointsVao);
    gl.useProgram(program);
    gl.uniform1f(uniformLocations.progress, uniforms.progress);
    gl.uniform1f(uniformLocations.time, uniforms.time);
    gl.uniform1f(uniformLocations.dpr, uniforms.dpr);
    gl.uniform2f(
      uniformLocations.pointer,
      uniforms.pointer[0],
      uniforms.pointer[1],
    );
    gl.uniform1f(uniformLocations.pointerStrength, uniforms.pointerStrength);
    gl.uniform1f(uniformLocations.idleAmount, uniforms.idleAmount);
    gl.uniform2f(uniformLocations.aspect, aspectX, aspectY);
    gl.uniform3f(
      uniformLocations.accent,
      uniforms.accent[0],
      uniforms.accent[1],
      uniforms.accent[2],
    );
    gl.uniform3f(
      uniformLocations.neutral,
      uniforms.neutral[0],
      uniforms.neutral[1],
      uniforms.neutral[2],
    );
    gl.uniform1f(uniformLocations.alpha, uniforms.alpha);
    gl.uniform4fv(uniformLocations.protect, uniforms.protectRects);
    gl.uniform1i(uniformLocations.protectCount, uniforms.protectCount);
    gl.drawArrays(gl.POINTS, 0, particleCount);
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener("webglcontextlost", handleContextLost, false);
    canvas.removeEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );
    for (const buffer of buffers) {
      if (buffer) gl.deleteBuffer(buffer);
    }
    if (lineBuffer) gl.deleteBuffer(lineBuffer);
    if (pointsVao) gl.deleteVertexArray(pointsVao);
    if (lineVao) gl.deleteVertexArray(lineVao);
    if (program) gl.deleteProgram(program);
    if (lineProgram) gl.deleteProgram(lineProgram);
  }

  return { resize, render, setField, dispose };
}
