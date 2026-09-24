/**
 * GLSL ES 3.00 sources for the hero convergence field. Kept as plain
 * exported strings (data, not logic) so `renderer.ts` can compile them
 * without a build-time GLSL loader — there are no new dependencies in this
 * project, so the shaders ship as inline template strings like the rest of
 * the WebGL wiring.
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
const PROTECT_CLEARANCE_FN = `
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

export const VERTEX_SHADER = `#version 300 es

// Per-particle attributes, one value per vertex. Buffer layout is fixed by
// these explicit locations so renderer.ts can rebuild buffers after a
// WebGL context loss without re-querying attribute locations by name.
layout(location = 0) in vec2 aChaosPos;
layout(location = 1) in vec2 aOrderPos;
layout(location = 2) in float aDelay;
layout(location = 3) in float aSize;
layout(location = 4) in float aTone;

uniform float uProgress;
uniform float uTime;
uniform float uDpr;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform vec2 uAspect;
uniform float uIdleAmount;
// Field-space rects (center xy, half-extents zw) around every small-text/
// interactive hero block (kicker, intro line, brief, ticker, ...) —
// particles are dimmed near whichever is closest. Only the first
// uProtectCount entries are read; controller.ts caches and updates this on
// resize, not per frame.
uniform vec4 uProtect[${MAX_PROTECT_RECTS}];
uniform int uProtectCount;
${PROTECT_CLEARANCE_FN}
out float vTone;
out float vAlphaScale;

void main() {
  // Per-particle delay staggers the chaos -> order interpolation so the
  // field ripples into shape instead of every particle moving in lockstep.
  // A particle with delay 0 starts converging immediately; one with delay 1
  // does not start until progress is 65% of the way there.
  float spread = 0.35;
  float start = aDelay * (1.0 - spread);
  float t = smoothstep(start, start + spread, uProgress);
  vec2 pos = mix(aChaosPos, aOrderPos, t);

  // Slow idle drift, unique per particle via gl_VertexID so the cloud
  // breathes rather than pulsing uniformly. It fades out as the system
  // finishes converging (1.0 - t) so the resolved graph reads as calm.
  float phase = float(gl_VertexID) * 12.9898;
  vec2 drift = vec2(
    sin(uTime * 0.6 + phase),
    cos(uTime * 0.5 + phase * 1.7)
  );
  pos += drift * 0.012 * uIdleAmount * (1.0 - t);

  // Desktop-only pointer repulsion. uPointerStrength is smoothed and faded
  // to 0 by the controller on touch input or when the pointer is idle, so
  // this uniform alone is enough to disable the effect entirely.
  vec2 toPointer = pos - uPointer;
  float dist = length(toPointer * uAspect);
  float repulseRadius = 0.22;
  float repulse = uPointerStrength * smoothstep(repulseRadius, 0.0, dist);
  if (dist > 0.0001) {
    pos += normalize(toPointer) * repulse * 0.08;
  }

  vTone = aTone;
  // Particles fade in slightly as they resolve, so the settled graph reads
  // a touch more present than the loose chaos cloud.
  vAlphaScale = mix(0.55, 1.0, t);

  // Targeted contrast protection: dim particles near small-text/
  // interactive hero blocks instead of masking an entire column (see
  // field.ts's exclusion-rect comment for why hubs already avoid these
  // rects outright — this only softens the loose scatter/edge dust still
  // passing near them). A single point has no "middle" separate from its
  // center, so per-vertex clearance is exact here (contrast the line
  // fragment shader, which needs a per-fragment check instead).
  vAlphaScale *= mix(0.2, 1.0, protectClearance(pos));

  gl_Position = vec4(pos * uAspect, 0.0, 1.0);

  // Hub-cluster particles (field.ts sizes them above 2.0, edge particles
  // stay below it) get a slow HAL-9000-style pulse so they read as living
  // nodes rather than static dust.
  float isHub = step(2.0, aSize);
  float pulse = 1.0 + isHub * 0.22 * sin(uTime * 0.9 + phase);
  gl_PointSize = aSize * uDpr * pulse;
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in float vTone;
in float vAlphaScale;

uniform vec3 uAccent;
uniform vec3 uNeutral;
uniform float uAlpha;

out vec4 fragColor;

void main() {
  // Soft round point: a smooth falloff from the center instead of a hard
  // square, for a quiet additive-ish glow rather than flat dots.
  vec2 centered = gl_PointCoord - vec2(0.5);
  float dist = length(centered) * 2.0;
  float soft = smoothstep(1.0, 0.0, dist);
  if (soft <= 0.001) {
    discard;
  }

  vec3 color = mix(uNeutral, uAccent, vTone);
  float alpha = soft * uAlpha * vAlphaScale;
  // Premultiplied alpha: renderer.ts blends with (ONE, ONE_MINUS_SRC_ALPHA).
  fragColor = vec4(color * alpha, alpha);
}
`;

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
