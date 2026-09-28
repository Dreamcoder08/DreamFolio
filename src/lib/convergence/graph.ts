import type { SeededRng } from "./random.ts";
import type {
  FieldGraph,
  FieldLayoutMode,
  HubNode,
  Rect,
} from "./field-types.ts";
import { sampleHubs } from "./hubs.ts";

const HUB_NEIGHBOR_COUNT = 2;
const HUB_COUNT_RANGE: Record<FieldLayoutMode, readonly [number, number]> = {
  wide: [9, 13],
  narrow: [6, 8],
};

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Connect each hub to its nearest neighbors, deduplicating mutual pairs. */
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

export function buildGraph(
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
