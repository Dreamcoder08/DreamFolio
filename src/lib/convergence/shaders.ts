/**
 * GLSL ES 3.00 sources for the hero convergence field. Kept as plain
 * exported strings (data, not logic) so `renderer.ts` can compile them
 * without a build-time GLSL loader — there are no new dependencies in this
 * project, so the shaders ship as inline template strings like the rest of
 * the WebGL wiring.
 *
 * This barrel keeps the public names stable; the sources live per program in
 * `shader-points.ts` and `shader-lines.ts`, with the shared protect-rect
 * constant and GLSL helper in `shaders-common.ts`.
 */

export { MAX_PROTECT_RECTS } from "./shaders-common.ts";
export { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader-points.ts";
export { LINE_FRAGMENT_SHADER, LINE_VERTEX_SHADER } from "./shader-lines.ts";
