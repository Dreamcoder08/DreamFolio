import { test } from "node:test";
import assert from "node:assert/strict";
import {
  domRectToFieldAnchor,
  parseHexColor,
  pickParticleCount,
  resolveThemeColors,
} from "../../src/lib/convergence/theme-geometry.ts";

test("parseHexColor parses 3- and 6-digit hex into normalized [0,1] RGB", () => {
  assert.deepEqual(parseHexColor("#fff", [0, 0, 0]), [1, 1, 1]);
  assert.deepEqual(parseHexColor("#000000", [1, 1, 1]), [0, 0, 0]);
  const [r, g, b] = parseHexColor("#ff7a18", [0, 0, 0]);
  assert.ok(Math.abs(r - 1) < 1e-6);
  assert.ok(Math.abs(g - 0.478431) < 1e-4);
  assert.ok(Math.abs(b - 0.094118) < 1e-4);
});

test("parseHexColor falls back on an unparseable value", () => {
  const fallback: readonly [number, number, number] = [0.1, 0.2, 0.3];
  assert.deepEqual(parseHexColor("not-a-color", fallback), fallback);
  assert.deepEqual(parseHexColor("", fallback), fallback);
  assert.deepEqual(parseHexColor("#gg", fallback), fallback);
});

test("resolveThemeColors reads the accent straight through and a dark-mode neutral from text-secondary", () => {
  const colors = resolveThemeColors("#ff7a18", "#b7b8b3", false);
  assert.deepEqual(colors.accent, parseHexColor("#ff7a18", [0, 0, 0]));
  assert.deepEqual(colors.neutral, parseHexColor("#b7b8b3", [0, 0, 0]));
});

test("resolveThemeColors dims the accent for the light-mode neutral instead of reading text-secondary", () => {
  const accent = parseHexColor("#8a4e26", [0, 0, 0]);
  const colors = resolveThemeColors("#8a4e26", "#6b5947", true);
  assert.deepEqual(colors.accent, accent);
  assert.deepEqual(colors.neutral, [
    accent[0] * 0.5,
    accent[1] * 0.5,
    accent[2] * 0.5,
  ]);
});

test("pickParticleCount halves the budget on low-core hardware", () => {
  assert.equal(pickParticleCount(false, 8), 2600);
  assert.equal(pickParticleCount(false, 4), Math.round(2600 * 0.6));
  assert.equal(pickParticleCount(true, 8), 1100);
  assert.equal(pickParticleCount(true, 4), Math.round(1100 * 0.6));
});

test("pickParticleCount treats missing or invalid hardwareConcurrency as full power", () => {
  assert.equal(pickParticleCount(false, undefined), 2600);
  assert.equal(pickParticleCount(false, 0), 2600);
  assert.equal(pickParticleCount(false, -1), 2600);
});

test("domRectToFieldAnchor maps a centered, canvas-filling rect to the origin", () => {
  const canvasBox = { left: 0, top: 0, width: 800, height: 600 };
  const rect = { left: 0, top: 0, width: 800, height: 600 };
  const anchor = domRectToFieldAnchor(rect, canvasBox, [1, 1]);
  assert.ok(Math.abs(anchor.x) < 1e-9);
  assert.ok(Math.abs(anchor.y) < 1e-9);
  assert.ok(Math.abs(anchor.w - 2) < 1e-9);
  assert.ok(Math.abs(anchor.h - 2) < 1e-9);
});

test("domRectToFieldAnchor flips Y (DOM down is positive, field up is positive) and divides by scale", () => {
  const canvasBox = { left: 0, top: 0, width: 200, height: 100 };
  // A 40x20 rect centered at (150, 25): 3/4 across, 1/4 down.
  const rect = { left: 130, top: 15, width: 40, height: 20 };
  const anchor = domRectToFieldAnchor(rect, canvasBox, [2, 1]);
  // ndcX = (150/200)*2 - 1 = 0.5, then /scale[0]=2 -> 0.25
  assert.ok(Math.abs(anchor.x - 0.25) < 1e-9);
  // ndcY = -((25/100)*2 - 1) = 0.5, then /scale[1]=1 -> 0.5
  assert.ok(Math.abs(anchor.y - 0.5) < 1e-9);
});
