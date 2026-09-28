/**
 * Constants and GLSL shared by both convergence programs (points and
 * lines). See `shaders.ts` for why the shaders ship as inline strings.
 */

/**
 * How many small-text/interactive "protect" rects (the hero kicker, intro
 * line, brief block, ticker row, ...) the point and line shaders can dim
 * particles/edges around in one draw. `renderer.ts` re-exports this so
 * `controller.ts` can size its cached uniform buffer to match without a
 * second hardcoded number. Comfortably above the ~4 rects the hero
 * actually has, with room for a future addition.
 */
export const MAX_PROTECT_RECTS = 6;

/**
 * Shared GLSL, inlined into both the point vertex shader and the line
 * fragment shader (each is a separate compiled program, so the source has
 * to be duplicated — there is no cross-shader `#include` in GLSL ES 3.00).
 * Returns 1.0 far from every protect rect, tapering to 0.0 at/inside the
 * nearest one; `rect` is (center xy, half-extents zw) in field space, and
 * only the first `uProtectCount` entries of `uProtect` are read.
 */
export const PROTECT_CLEARANCE_FN = `
float protectClearance(vec2 p) {
  float clearance = 1.0;
  for (int i = 0; i < ${MAX_PROTECT_RECTS}; i += 1) {
    if (i >= uProtectCount) break;
    vec4 rect = uProtect[i];
    vec2 delta = abs(p - rect.xy) - rect.zw;
    float outside = length(max(delta, 0.0)) + min(max(delta.x, delta.y), 0.0);
    clearance = min(clearance, smoothstep(0.0, 0.08, outside));
  }
  return clearance;
}
`;
