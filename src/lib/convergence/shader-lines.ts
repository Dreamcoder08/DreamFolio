/** GLSL ES 3.00 sources for the line (hub edge) program. */

import { MAX_PROTECT_RECTS, PROTECT_CLEARANCE_FN } from "./shaders-common.ts";

/**
 * Second, much smaller draw call (gl.LINES): thin edges between hubs so the
 * graph reads as a wired system, not a point cloud. Vertex positions are
 * the hubs' fixed order positions — the edges do not themselves travel
 * from chaos to order, they simply light up (see uAlpha in the fragment
 * shader) as the point cloud around them resolves.
 */
export const LINE_VERTEX_SHADER = `#version 300 es

layout(location = 0) in vec2 aPos;

uniform vec2 uAspect;

// The field-space position of this vertex, interpolated linearly across
// the segment for the fragment shader's per-fragment protect check — a
// line's middle can cross a protect rect even when both of its hub
// endpoints (already kept outside every exclusion rect by field.ts) do
// not, so unlike the point shader this cannot be decided per-vertex alone.
out vec2 vFieldPos;

void main() {
  vFieldPos = aPos;
  gl_Position = vec4(aPos * uAspect, 0.0, 1.0);
}
`;

export const LINE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 vFieldPos;

uniform vec3 uColor;
uniform float uAlpha;
uniform vec4 uProtect[${MAX_PROTECT_RECTS}];
uniform int uProtectCount;
${PROTECT_CLEARANCE_FN}
out vec4 fragColor;

void main() {
  // Edges are allowed to cross a protect rect (they render behind that
  // content, or the hub endpoints are already excluded from landing
  // inside one) but should fade to near-zero rather than stay at full
  // line alpha while doing it, so a segment grazing small text does not
  // read as a stray line drawn over it.
  float alpha = uAlpha * mix(0.05, 1.0, protectClearance(vFieldPos));
  // Premultiplied alpha, same convention as the point fragment shader.
  fragColor = vec4(uColor * alpha, alpha);
}
`;
