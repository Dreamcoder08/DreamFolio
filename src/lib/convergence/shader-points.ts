/** GLSL ES 3.00 sources for the point (particle) program. */

import { MAX_PROTECT_RECTS, PROTECT_CLEARANCE_FN } from "./shaders-common.ts";

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
