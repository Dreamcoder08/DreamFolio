import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createField,
  domainExtent,
  type Rect,
} from "../../src/lib/convergence/field.ts";

const BASE_OPTIONS = { count: 240, seed: 20260924, aspect: 16 / 9 } as const;

test("createField is deterministic for the same seed", () => {
  const a = createField({ ...BASE_OPTIONS, layout: "wide" });
  const b = createField({ ...BASE_OPTIONS, layout: "wide" });

  assert.deepEqual(Array.from(a.chaosPositions), Array.from(b.chaosPositions));
  assert.deepEqual(Array.from(a.orderPositions), Array.from(b.orderPositions));
  assert.deepEqual(Array.from(a.delays), Array.from(b.delays));
  assert.deepEqual(Array.from(a.sizes), Array.from(b.sizes));
  assert.deepEqual(Array.from(a.tones), Array.from(b.tones));
  assert.deepEqual(a.graph, b.graph);
});

test("createField differs for a different seed", () => {
  const a = createField({ ...BASE_OPTIONS, seed: 1, layout: "wide" });
  const b = createField({ ...BASE_OPTIONS, seed: 2, layout: "wide" });

  assert.notDeepEqual(
    Array.from(a.orderPositions),
    Array.from(b.orderPositions),
  );
});

test("typed arrays match the requested particle count", () => {
  const count = 333;
  const field = createField({ ...BASE_OPTIONS, count, layout: "narrow" });

  assert.equal(field.chaosPositions.length, count * 2);
  assert.equal(field.orderPositions.length, count * 2);
  assert.equal(field.delays.length, count);
  assert.equal(field.sizes.length, count);
  assert.equal(field.tones.length, count);
});

test("order positions stay within the aspect-extended domain bounds", () => {
  const field = createField({ ...BASE_OPTIONS, count: 500, layout: "wide" });
  const [extentX, extentY] = domainExtent(BASE_OPTIONS.aspect);

  for (let i = 0; i < field.orderPositions.length; i += 2) {
    const x = field.orderPositions[i];
    const y = field.orderPositions[i + 1];
    assert.ok(x >= -extentX && x <= extentX, `order x out of bounds: ${x}`);
    assert.ok(y >= -extentY && y <= extentY, `order y out of bounds: ${y}`);
  }
});

test("per-particle delays stay within [0, 1]", () => {
  const field = createField({ ...BASE_OPTIONS, layout: "wide" });

  for (const delay of field.delays) {
    assert.ok(delay >= 0 && delay <= 1, `delay out of bounds: ${delay}`);
  }
});

test("tones are only the neutral (0) or accent (1) markers", () => {
  const field = createField({ ...BASE_OPTIONS, layout: "wide" });

  for (const tone of field.tones) {
    assert.ok(tone === 0 || tone === 1);
  }
});

test("hub count stays within the documented range per layout, with no exclusions", () => {
  for (const seed of [1, 2, 3, 7, 42, 100, 20260924]) {
    const wide = createField({ ...BASE_OPTIONS, seed, layout: "wide" });
    assert.ok(
      wide.graph.hubs.length >= 9 && wide.graph.hubs.length <= 13,
      `wide hub count out of [9,13]: ${wide.graph.hubs.length}`,
    );

    const narrow = createField({ ...BASE_OPTIONS, seed, layout: "narrow" });
    assert.ok(
      narrow.graph.hubs.length >= 6 && narrow.graph.hubs.length <= 8,
      `narrow hub count out of [6,8]: ${narrow.graph.hubs.length}`,
    );
  }
});

test("every hub has at least one edge, and edges are never duplicated", () => {
  for (const seed of [1, 2, 3, 7, 42]) {
    const field = createField({ ...BASE_OPTIONS, seed, layout: "wide" });
    const { hubs, edges } = field.graph;

    const degree = new Array(hubs.length).fill(0);
    const seen = new Set<string>();
    for (const [a, b] of edges) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      assert.ok(!seen.has(key), `duplicate edge: ${key}`);
      seen.add(key);
      degree[a] += 1;
      degree[b] += 1;
    }
    for (let i = 0; i < hubs.length; i += 1) {
      assert.ok(degree[i] >= 1, `hub ${i} has no edge`);
    }
  }
});

const PORTRAIT_RECT: Rect = { x: 0.5, y: 0, w: 0.5, h: 1.3 };
const HEADLINE_RECT: Rect = { x: -0.5, y: 0.6, w: 0.9, h: 0.5 };
const BRIEF_RECT: Rect = { x: -0.1, y: -0.7, w: 0.8, h: 0.3 };

test("hubs never land inside any given exclusion rect", () => {
  const exclusions = [PORTRAIT_RECT, HEADLINE_RECT, BRIEF_RECT];

  for (const seed of [1, 2, 3, 7, 42, 100, 20260924]) {
    const field = createField({
      ...BASE_OPTIONS,
      seed,
      layout: "wide",
      exclusions,
    });
    for (const hub of field.graph.hubs) {
      for (const rect of exclusions) {
        const inside =
          Math.abs(hub.x - rect.x) < rect.w / 2 &&
          Math.abs(hub.y - rect.y) < rect.h / 2;
        assert.ok(
          !inside,
          `hub landed inside an exclusion: ${JSON.stringify(hub)} vs ${JSON.stringify(rect)}`,
        );
      }
    }
  }
});

test("hubs respect a minimum spacing from one another", () => {
  const field = createField({
    ...BASE_OPTIONS,
    count: 400,
    seed: 7,
    layout: "wide",
    exclusions: [PORTRAIT_RECT],
  });
  const { hubs } = field.graph;
  const [extentX, extentY] = domainExtent(BASE_OPTIONS.aspect);
  const domainArea = 2 * extentX * (2 * extentY);
  // A generous lower bound looser than the module's own target spacing
  // (0.8x the naive average) — this catches gross pile-ups (the original
  // bug) without being a change-detector on the exact tuning coefficient.
  const minAcceptableSpacing =
    0.4 * Math.sqrt(domainArea / Math.max(1, hubs.length));

  for (let i = 0; i < hubs.length; i += 1) {
    for (let j = i + 1; j < hubs.length; j += 1) {
      const dx = hubs[i].x - hubs[j].x;
      const dy = hubs[i].y - hubs[j].y;
      const dist = Math.hypot(dx, dy);
      assert.ok(
        dist >= minAcceptableSpacing,
        `hubs ${i} and ${j} too close: ${dist} < ${minAcceptableSpacing}`,
      );
    }
  }
});

test("hubs are distributed on both sides of an exclusion, not collapsed to one edge", () => {
  const field = createField({
    ...BASE_OPTIONS,
    count: 400,
    seed: 7,
    layout: "wide",
    exclusions: [PORTRAIT_RECT],
  });

  const halfW = PORTRAIT_RECT.w / 2;
  const left = field.graph.hubs.some((h) => h.x < PORTRAIT_RECT.x - halfW);
  const right = field.graph.hubs.some((h) => h.x > PORTRAIT_RECT.x + halfW);
  assert.ok(left, "expected at least one hub left of the exclusion");
  assert.ok(right, "expected at least one hub right of the exclusion");
});

test("createField is deterministic for the same seed and exclusions", () => {
  const exclusions = [PORTRAIT_RECT, HEADLINE_RECT, BRIEF_RECT];
  const a = createField({
    ...BASE_OPTIONS,
    seed: 55,
    layout: "wide",
    exclusions,
  });
  const b = createField({
    ...BASE_OPTIONS,
    seed: 55,
    layout: "wide",
    exclusions,
  });

  assert.deepEqual(a.graph, b.graph);
  assert.deepEqual(Array.from(a.orderPositions), Array.from(b.orderPositions));
});

test("hub count degrades gracefully (never throws) when exclusions cover nearly the whole domain", () => {
  const hugeExclusion: Rect = { x: 0, y: 0, w: 1000, h: 1000 };
  const field = createField({
    ...BASE_OPTIONS,
    count: 120,
    seed: 3,
    layout: "wide",
    exclusions: [hugeExclusion],
  });

  assert.equal(field.graph.hubs.length, 0);
  assert.equal(field.graph.edges.length, 0);
  // `count` particles are still produced, falling back to free-floating
  // points instead of throwing or looping forever.
  assert.equal(field.orderPositions.length, 120 * 2);
  assert.equal(field.tones.length, 120);
});

test("createField without exclusions behaves the same whether the option is omitted or an empty array", () => {
  const omitted = createField({ ...BASE_OPTIONS, seed: 42, layout: "wide" });
  const explicitlyEmpty = createField({
    ...BASE_OPTIONS,
    seed: 42,
    layout: "wide",
    exclusions: [],
  });
  assert.deepEqual(omitted.graph, explicitlyEmpty.graph);
});
