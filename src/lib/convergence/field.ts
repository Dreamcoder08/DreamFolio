/**
 * Pure particle field generation for the hero "convergence" effect.
 *
 * Coordinate space: chaos positions, order positions and hub centers are all
 * "clip-ish" — nominally centered on (0, 0) — but, unlike a plain [-1, 1]
 * square, the domain is stretched along whichever axis the canvas is wider
 * on: `domainExtent()` (in `field-sampling.ts`) returns exactly the inverse
 * of the non-uniform `uAspect` scale `renderer.ts` applies at render time
 * (recomputed on resize). That inverse relationship is what lets this pure module reach
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

import { clamp, createRng } from "./random.ts";
import { buildGraph } from "./graph.ts";
import {
  cumulativeEdgeLengths,
  domainExtent,
  pickWeightedEdge,
} from "./field-sampling.ts";
import type { CreateFieldOptions, Field } from "./field-types.ts";

export type {
  CreateFieldOptions,
  Field,
  FieldGraph,
  FieldLayoutMode,
  HubNode,
  Rect,
} from "./field-types.ts";
export { domainExtent } from "./field-sampling.ts";

const HUB_FRACTION = 0.22;
const BOUNDS = 1;
const HUB_JITTER_RADIUS = 0.055;
const EDGE_JITTER = 0.02;

export function createField(options: CreateFieldOptions): Field {
  const { count, seed, aspect, layout, exclusions = [] } = options;
  const rng = createRng(seed);

  const [extentX, extentY] = domainExtent(aspect);
  const boundsX = BOUNDS * extentX;
  const boundsY = BOUNDS * extentY;

  const graph = buildGraph(layout, extentX, extentY, rng, exclusions);
  const hubCount = graph.hubs.length;

  const { cumulativeLengths, totalLength } = cumulativeEdgeLengths(graph);

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
