/**
 * Pure sampling helpers for `createField`: the aspect-stretched domain and
 * length-weighted edge picking. `pickWeightedEdge` consumes exactly one
 * `rng.next()` per call, the same position in the RNG sequence it had when
 * it lived in `field.ts`, so seeded fields are unchanged.
 */

import { clamp, type SeededRng } from "./random.ts";
import type { FieldGraph } from "./field-types.ts";

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

export function pickWeightedEdge(
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

/** Running totals of each edge's length (a zero-length edge counts as 1e-4)
 * plus the grand total, the weights `pickWeightedEdge` samples against. */
export interface EdgeWeights {
  cumulativeLengths: number[];
  totalLength: number;
}

export function cumulativeEdgeLengths(graph: FieldGraph): EdgeWeights {
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
  return { cumulativeLengths, totalLength };
}
