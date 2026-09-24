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
/** How many of its nearest neighbours each hub links to — enough to read as
 * a cross-linked network diagram rather than a bare chain, deduplicated so
 * a mutual nearest-neighbour pair does not produce two parallel edges. */
const HUB_NEIGHBOR_COUNT = 2;
/** Rejection-sampling retries for one hub before it is skipped — bounded so
 * a pathological set of exclusions (covering nearly the whole domain)
 * degrades to fewer hubs instead of looping forever. */
const MAX_HUB_ATTEMPTS = 40;
/** Clearance kept between a hub CENTER and any exclusion rect's edge. Must
 * comfortably exceed `HUB_JITTER_RADIUS`: a hub's own jitter-cluster
 * particles can land up to that far from its center in any direction, so a
 * margin only slightly bigger than the jitter radius still let a cluster
 * visibly spill back over the excluded content (observed spilling onto the
 * headline's underline during visual review). */
const EXCLUSION_MARGIN = 0.13;
/** Poisson-disk-style target spacing coefficient: with hubs spread over a
 * domain of a given area, this keeps them roughly evenly spaced regardless
 * of how many are requested or how wide/tall the domain is. */
const SPACING_COEFFICIENT = 0.8;
/** Caps how far `domainExtent` stretches the sampling domain on an extreme
 * aspect ratio (very wide or very tall window), so the field never spreads
 * absurdly thin looking for pixels the canvas cannot usefully show. */
const MAX_DOMAIN_EXTENT = 2.4;

const HUB_COUNT_RANGE: Record<FieldLayoutMode, readonly [number, number]> = {
  wide: [9, 13],
  narrow: [6, 8],
};

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

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

function insideExclusion(x: number, y: number, rect: Rect): boolean {
  const halfW = rect.w / 2 + EXCLUSION_MARGIN;
  const halfH = rect.h / 2 + EXCLUSION_MARGIN;
  return Math.abs(x - rect.x) < halfW && Math.abs(y - rect.y) < halfH;
}

function violatesExclusions(x: number, y: number, exclusions: Rect[]): boolean {
  for (const rect of exclusions) {
    if (insideExclusion(x, y, rect)) return true;
  }
  return false;
}

function farEnoughFromExisting(
  x: number,
  y: number,
  hubs: HubNode[],
  minSpacing: number,
): boolean {
  const minSpacingSq = minSpacing * minSpacing;
  for (const hub of hubs) {
    const dx = x - hub.x;
    const dy = y - hub.y;
    if (dx * dx + dy * dy < minSpacingSq) return false;
  }
  return true;
}

/**
 * Rejection-samples up to `targetCount` hub centers across the full
 * `[-extentX, extentX] x [-extentY, extentY]` domain: every candidate is
 * uniform-random, then rejected if it falls inside (plus padding) any
 * exclusion rect or too close to an already-placed hub. This replaces the
 * previous "push hubs radially out to the anchor's border" approach, which
 * piled hubs up along whichever edge of the anchor happened to fall inside
 * the (unextended) domain, reading as a thin strip rather than a graph
 * distributed through the actual empty space around the content.
 *
 * A hub that fails every attempt is skipped rather than retried forever or
 * placed somewhere invalid — the caller ends up with `hubs.length <=
 * targetCount`, which every downstream step (edges, particle assignment)
 * already handles gracefully down to zero hubs.
 */
function sampleHubs(
  targetCount: number,
  extentX: number,
  extentY: number,
  exclusions: Rect[],
  rng: SeededRng,
): HubNode[] {
  const hubs: HubNode[] = [];
  if (targetCount <= 0) return hubs;

  const domainArea = 2 * extentX * BOUNDS * (2 * extentY * BOUNDS);
  const minSpacing = SPACING_COEFFICIENT * Math.sqrt(domainArea / targetCount);

  for (let i = 0; i < targetCount; i += 1) {
    let placed: HubNode | null = null;
    for (let attempt = 0; attempt < MAX_HUB_ATTEMPTS && !placed; attempt += 1) {
      const x = rng.range(-extentX, extentX) * BOUNDS;
      const y = rng.range(-extentY, extentY) * BOUNDS;
      if (violatesExclusions(x, y, exclusions)) continue;
      if (!farEnoughFromExisting(x, y, hubs, minSpacing)) continue;
      placed = { x, y };
    }
    if (placed) hubs.push(placed);
  }
  return hubs;
}

/** Connects every hub to its `HUB_NEIGHBOR_COUNT` nearest neighbours,
 * deduplicated. Unlike a spanning tree this does not guarantee the whole
 * graph is connected, but it does guarantee every hub (with >= 2 hubs
 * total) has at least one edge, and it reads as a cross-linked network
 * rather than a bare chain or a hub-and-spoke tree. */
function buildNearestNeighborEdges(hubs: HubNode[]): [number, number][] {
  const n = hubs.length;
  const edges: [number, number][] = [];
  if (n < 2) return edges;

  const edgeSet = new Set<string>();
  for (let i = 0; i < n; i += 1) {
    const distances: { j: number; distSq: number }[] = [];
    for (let j = 0; j < n; j += 1) {
      if (j === i) continue;
      const dx = hubs[i].x - hubs[j].x;
      const dy = hubs[i].y - hubs[j].y;
      distances.push({ j, distSq: dx * dx + dy * dy });
    }
    distances.sort((a, b) => a.distSq - b.distSq);

    for (
      let k = 0;
      k < Math.min(HUB_NEIGHBOR_COUNT, distances.length);
      k += 1
    ) {
      const j = distances[k].j;
      const key = edgeKey(i, j);
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push(i < j ? [i, j] : [j, i]);
    }
  }
  return edges;
}

function buildGraph(
  layout: FieldLayoutMode,
  extentX: number,
  extentY: number,
  rng: SeededRng,
  exclusions: Rect[],
): FieldGraph {
  const [minHubs, maxHubs] = HUB_COUNT_RANGE[layout];
  const targetHubCount =
    minHubs + Math.floor(rng.next() * (maxHubs - minHubs + 1));
  const hubs = sampleHubs(targetHubCount, extentX, extentY, exclusions, rng);
  const edges = buildNearestNeighborEdges(hubs);
  return { hubs, edges };
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
