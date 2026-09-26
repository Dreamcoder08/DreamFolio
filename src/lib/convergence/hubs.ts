import type { SeededRng } from "./random.ts";
import type { HubNode, Rect } from "./field.ts";

const BOUNDS = 1;
const MAX_HUB_ATTEMPTS = 40;
// Keep hub centers clear of opaque content, including jittered cluster points.
const EXCLUSION_MARGIN = 0.13;
const SPACING_COEFFICIENT = 0.8;

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

/** Rejection-sample centers; failed hubs are skipped rather than placed invalidly. */
export function sampleHubs(
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
