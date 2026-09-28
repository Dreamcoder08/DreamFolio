/**
 * Field → GPU upload for the convergence renderer: attribute locations, the
 * edge-line vertex flattening, the per-field buffer/VAO upload and the
 * uniform-location lookups for both programs. Reads and writes the shared
 * `RendererState`; never compiles programs or draws.
 */

import type { Field } from "./field.ts";
import { createFloatBuffer } from "./gl-resources.ts";
import type { RendererState } from "./renderer-state.ts";

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
export function buildLineVertices(field: Field): Float32Array {
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

export function locateUniforms(state: RendererState, prog: WebGLProgram) {
  const { gl } = state;
  state.uniformLocations = {
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

export function locateLineUniforms(state: RendererState, prog: WebGLProgram) {
  const { gl } = state;
  state.lineUniformLocations = {
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
export function uploadField(state: RendererState): boolean {
  const { gl, currentField } = state;
  state.pointsVao = gl.createVertexArray();
  if (!state.pointsVao) return false;
  gl.bindVertexArray(state.pointsVao);
  state.buffers = [
    createFloatBuffer(gl, ATTRIB.chaosPos, currentField.chaosPositions, 2),
    createFloatBuffer(gl, ATTRIB.orderPos, currentField.orderPositions, 2),
    createFloatBuffer(gl, ATTRIB.delay, currentField.delays, 1),
    createFloatBuffer(gl, ATTRIB.size, currentField.sizes, 1),
    createFloatBuffer(gl, ATTRIB.tone, currentField.tones, 1),
  ];
  if (state.buffers.some((buffer) => buffer === null)) return false;
  state.particleCount = currentField.tones.length;

  state.lineVao = gl.createVertexArray();
  if (!state.lineVao) return false;
  gl.bindVertexArray(state.lineVao);
  const lineVertices = buildLineVertices(currentField);
  state.lineBuffer = createFloatBuffer(gl, LINE_ATTRIB.pos, lineVertices, 2);
  if (!state.lineBuffer) return false;
  state.lineVertexCount = currentField.graph.edges.length * 2;

  return true;
}
