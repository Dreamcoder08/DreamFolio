/**
 * Pure particle field generation for the hero "convergence" effect.
 *
 * Coordinate space: chaos positions, order positions and hub centers are all
 * "clip-ish" — nominally centered on (0, 0) — but, unlike a plain [-1, 1]
 * square, the domain is stretched along whichever axis the canvas is wider
 * on: `domainExtent()` below returns exactly the inverse of the non-uniform
 * `uAspect` scale `renderer.ts` applies at render time (recomputed on
 * resize). That inverse relationship is what lets this pure module reach
 * every pixel a wide canvas can actually show — sampling only the plain
 * [-1, 1] square here would leave the canvas's left/right margins on a wide
 * screen permanently empty, since `uAspect` squeezes that square into a
 * centered region matching the canvas's shorter dimension. Local shape
 * detail (hub jitter radius, edge jitter) is left in un-stretched units on
 * purpose, so `uAspect` squeezes it back down by the same factor and hub
 * clusters keep reading as round rather than stretching into ellipses.
 *
 * `controller.ts` converts DOM rects (the portrait card, the headline, the
 * small-text "brief" block) into this same domain via
 * `domRectToFieldAnchor`, which performs the identical inverse-of-`uAspect`
 * conversion — so an `exclusions` rect passed into `createField` always
 * lines up with where that content actually renders on screen.
 *
 * Everything in this module is a pure function of its inputs: the same
 * `seed` always produces the same field, which is what makes the hero look
 * stable across reloads and what the unit tests rely on.
 */

import { clamp, createRng, type SeededRng } from "./random.ts";
import { buildGraph } from "./graph.ts";

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

const HUB_FRACTION = 0.22;
const BOUNDS = 1;
const HUB_JITTER_RADIUS = 0.055;
const EDGE_JITTER = 0.02;
/** Caps how far `domainExtent` stretches the sampling domain on an extreme
 * aspect ratio (very wide or very tall window), so the field never spreads
 * absurdly thin looking for pixels the canvas cannot usefully show. */
const MAX_DOMAIN_EXTENT = 2.4;

/** Inverse of `renderer.ts`'s `computeAspectScale`: how far the sampling
 * domain needs to stretch on the wider axis so that, after `uAspect`
 * squeezes it back down at render time, positions reach every edge of the
 * canvas instead of only a centered square/rectangle matching its shorter
 * dimension. Returns `[extentX, extentY]`, each >= 1. Exported for the unit
 * tests, which need the same bounds this module samples within. */
export function domainExtent(aspect: number): [number, number] {
  const safeAspect = aspect > 0 ? aspect : 1;
  if (safeAspect >= 1) {
    return [clamp(safeAspect, 1, MAX_DOMAIN_EXTENT), 1];
  }
  return [1, clamp(1 / safeAspect, 1, MAX_DOMAIN_EXTENT)];
}

function pickWeightedEdge(
  graph: FieldGraph,
  cumulativeLengths: number[],
  totalLength: number,
  rng: SeededRng,
): [number, number] {
  const target = rng.next() * totalLength;
  for (let i = 0; i < cumulativeLengths.length; i += 1) {
    if (target <= cumulativeLengths[i]) return graph.edges[i];
  }
  return graph.edges[graph.edges.length - 1];
}

export function createField(options: CreateFieldOptions): Field {
  const { count, seed, aspect, layout, exclusions = [] } = options;
  const rng = createRng(seed);

  const [extentX, extentY] = domainExtent(aspect);
  const boundsX = BOUNDS * extentX;
  const boundsY = BOUNDS * extentY;

  const graph = buildGraph(layout, extentX, extentY, rng, exclusions);
  const hubCount = graph.hubs.length;

  const edgeLengths = graph.edges.map(([a, b]) => {
    const dx = graph.hubs[a].x - graph.hubs[b].x;
    const dy = graph.hubs[a].y - graph.hubs[b].y;
    return Math.hypot(dx, dy) || 1e-4;
  });
  const cumulativeLengths: number[] = [];
  let totalLength = 0;
  for (const length of edgeLengths) {
    totalLength += length;
    cumulativeLengths.push(totalLength);
  }

  const chaosPositions = new Float32Array(count * 2);
  const orderPositions = new Float32Array(count * 2);
  const delays = new Float32Array(count);
  const sizes = new Float32Array(count);
  const tones = new Float32Array(count);

  const hasEdges = graph.edges.length > 0;
  // Chaos scatter spread scales with the same domain extent as everything
  // else, so the "ideas" cloud fills a wide canvas instead of staying
  // confined to a centered square.
  const chaosSigmaX = 0.42 * extentX;
  const chaosSigmaY = 0.4 * extentY;
  const chaosClampX = 1.4 * extentX;
  const chaosClampY = 1.4 * extentY;

  for (let i = 0; i < count; i += 1) {
    let ox: number;
    let oy: number;

    if (hubCount === 0) {
      // Every candidate hub was rejected (exclusions covering nearly the
      // whole domain) — fall back to a free-floating point so `count`
      // particles are still produced instead of throwing.
      ox = rng.range(-boundsX, boundsX);
      oy = rng.range(-boundsY, boundsY);
      tones[i] = rng.next() < 0.12 ? 1 : 0;
      sizes[i] = 1.0 + rng.next() * 0.9;
    } else if (!hasEdges || rng.next() < HUB_FRACTION) {
      const hub = graph.hubs[Math.floor(rng.next() * hubCount)];
      const clusterRadius = rng.next() * HUB_JITTER_RADIUS;
      const clusterAngle = rng.next() * Math.PI * 2;
      ox = hub.x + Math.cos(clusterAngle) * clusterRadius;
      oy = hub.y + Math.sin(clusterAngle) * clusterRadius;
      tones[i] = 1;
      // Visibly larger than edge particles so hubs read as nodes, not
      // dust — renderer.ts also gives anything at this size a slow pulse.
      sizes[i] = 3.2 + rng.next() * 1.8;
    } else {
      const [a, b] = pickWeightedEdge(
        graph,
        cumulativeLengths,
        totalLength,
        rng,
      );
      const hubA = graph.hubs[a];
      const hubB = graph.hubs[b];
      const t = rng.next();
      const dx = hubB.x - hubA.x;
      const dy = hubB.y - hubA.y;
      const len = Math.hypot(dx, dy) || 1e-4;
      // Perpendicular unit vector for the "evenly spread, slight jitter"
      // scatter along the edge.
      const perpX = -dy / len;
      const perpY = dx / len;
      const jitter = (rng.next() - 0.5) * EDGE_JITTER;
      ox = hubA.x + dx * t + perpX * jitter;
      oy = hubA.y + dy * t + perpY * jitter;
      tones[i] = rng.next() < 0.12 ? 1 : 0;
      // Stays below the renderer's 2.0 hub-pulse threshold so only true
      // hub-cluster particles (sized above) ever pulse.
      sizes[i] = 1.0 + rng.next() * 0.9;
    }

    orderPositions[i * 2] = clamp(ox, -boundsX, boundsX);
    orderPositions[i * 2 + 1] = clamp(oy, -boundsY, boundsY);
    delays[i] = rng.next();

    // Soft noisy cloud filling the hero area: clamped gaussian scatter
    // rather than uniform, so it reads as "ideas" rather than a grid.
    const cx =
      clamp(rng.gaussian() * chaosSigmaX, -chaosClampX, chaosClampX) * 0.6;
    const cy =
      clamp(rng.gaussian() * chaosSigmaY, -chaosClampY, chaosClampY) * 0.6;
    chaosPositions[i * 2] = cx;
    chaosPositions[i * 2 + 1] = cy;
  }

  return { chaosPositions, orderPositions, delays, sizes, tones, graph };
}
