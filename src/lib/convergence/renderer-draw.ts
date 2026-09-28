/**
 * Per-frame side of the convergence renderer: canvas/viewport sizing with
 * the aspect scale, and the draw itself — edge lines first, then points,
 * each with its own VAO, program and uniform upload. Reads the shared
 * `RendererState`; never allocates or (re)builds GPU resources.
 */

import type { ConvergenceUniforms, RendererState } from "./renderer-state.ts";

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

/** Pure: edge-line alpha for a frame — near-invisible at chaos, the thin
 * edges "light up" as progress approaches 1. */
export function computeLineAlpha(progress: number, alpha: number): number {
  return Math.max(0, Math.min(1, (progress - 0.15) / 0.6)) * alpha * 0.8;
}

export function resize(
  state: RendererState,
  width: number,
  height: number,
  dpr: number,
): void {
  const { canvas, gl } = state;
  if (state.disposed) return;
  const backingWidth = Math.max(1, Math.round(width * dpr));
  const backingHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== backingWidth) canvas.width = backingWidth;
  if (canvas.height !== backingHeight) canvas.height = backingHeight;
  gl.viewport(0, 0, backingWidth, backingHeight);

  // Non-uniform scale so a square field stays visually square instead of
  // stretching with the canvas — see field.ts's coordinate-space comment.
  [state.aspectX, state.aspectY] = computeAspectScale(width, height);
}

export function render(
  state: RendererState,
  uniforms: ConvergenceUniforms,
): void {
  const { gl, program, lineProgram, lineVao, aspectX, aspectY } = state;
  if (state.disposed || state.contextLost || !program || !lineProgram) return;
  const { uniformLocations, lineUniformLocations } = state;

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Lines first, underneath the point cloud: thin edges that "light up"
  // as progress approaches 1, near-invisible at chaos.
  const lineAlpha = computeLineAlpha(uniforms.progress, uniforms.alpha);
  if (state.lineVertexCount > 0 && lineAlpha > 0.001 && lineVao) {
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
    gl.drawArrays(gl.LINES, 0, state.lineVertexCount);
  }

  gl.bindVertexArray(state.pointsVao);
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
  gl.drawArrays(gl.POINTS, 0, state.particleCount);
}
