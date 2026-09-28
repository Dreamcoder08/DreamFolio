/**
 * Public data shapes of the convergence field (see `field.ts`). They live
 * apart from the generator so `graph.ts`/`hubs.ts` and the renderer can
 * share them without importing the sampling code; `field.ts` re-exports
 * every one of them.
 */

export type FieldLayoutMode = "wide" | "narrow";

/**
 * A rectangle in the same field-logical space as every position, `x`/`y`
 * being its center and `w`/`h` its full width/height. Used to keep hub
 * centers out from behind opaque or small-text hero UI (the portrait card,
 * the headline, the brief paragraph/buttons) — see `sampleHubs`.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CreateFieldOptions {
  /** Total particle count. Determines every typed array's length. */
  count: number;
  /** Deterministic seed — same seed + same options => identical field. */
  seed: number;
  /** Canvas width / height at generation time. */
  aspect: number;
  /** 'wide' targets more hubs and a landscape-shaped domain; 'narrow'
   * targets fewer hubs and a portrait-shaped (or square) domain. */
  layout: FieldLayoutMode;
  /**
   * Opaque or small-text UI rects hub centers must not land inside (plus a
   * fixed padding — see `EXCLUSION_MARGIN`). Hub centers are
   * rejection-sampled against every rect in this list; edges between two
   * hubs may still cross a rect between them (they render behind that
   * content, or at low alpha — see `ConvergenceField.astro`/
   * `controller.ts`). Optional so callers that don't need layout awareness
   * (tests, a minimal setup) can omit it.
   */
  exclusions?: Rect[];
}

export interface HubNode {
  x: number;
  y: number;
}

export interface FieldGraph {
  hubs: HubNode[];
  /** Pairs of hub indices, deduplicated, connecting the graph. */
  edges: [number, number][];
}

export interface Field {
  /** count * 2 floats: [x0, y0, x1, y1, ...] scattered "chaos" positions. */
  chaosPositions: Float32Array;
  /** count * 2 floats: the converged hub/edge graph position per particle. */
  orderPositions: Float32Array;
  /** count floats in [0, 1]: per-particle convergence delay. */
  delays: Float32Array;
  /** count floats: relative point size (renderer scales by DPR). */
  sizes: Float32Array;
  /** count floats in [0, 1]: 0 = neutral tone, 1 = accent tone. */
  tones: Float32Array;
  /** The hub/edge graph the order positions were derived from. */
  graph: FieldGraph;
}
