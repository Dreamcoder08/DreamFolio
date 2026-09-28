import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeExclusions,
  updateProtectUniform,
} from "../../src/lib/convergence/controller-geometry.ts";

const box = { left: 0, top: 0, width: 100, height: 100 };
const canvas = { getBoundingClientRect: () => box } as HTMLCanvasElement;
function element(left: number, width = 10): HTMLElement {
  return {
    getBoundingClientRect: () => ({ ...box, left, width, height: 10 }),
  } as HTMLElement;
}
const scale: [number, number] = [1, 1];

test("exclusions preserve DOM order and omit portrait only on narrow layouts", () => {
  const portrait = element(5);
  const headline = element(20);
  const kicker = element(40);
  const elements = {
    portrait,
    headline,
    protected: [kicker, null, element(60, 0)],
  };
  const wide = computeExclusions(elements, false, canvas, scale);
  const narrow = computeExclusions(elements, true, canvas, scale);
  assert.equal(wide.length, 3);
  assert.deepEqual(narrow, wide.slice(1));
  for (const [index, value] of [-0.8, -0.5, -0.1].entries()) {
    assert.ok(Math.abs(wide[index].x - value) < 1e-9);
  }
  assert.deepEqual(
    computeExclusions(
      elements,
      false,
      {
        getBoundingClientRect: () => ({ ...box, width: 0 }),
      } as HTMLCanvasElement,
      scale,
    ),
    [],
  );
});

test("uniform writes valid half extents up to capacity and reuses storage", () => {
  const uniform = new Float32Array(8);
  const elements = [null, element(20), element(40), element(60)];
  assert.equal(updateProtectUniform(elements, canvas, scale, uniform, 2), 2);
  for (const [index, value] of [
    -0.5, 0.9, 0.1, 0.1, -0.1, 0.9, 0.1, 0.1,
  ].entries()) {
    assert.ok(Math.abs(uniform[index] - value) < 1e-6);
  }
  assert.equal(
    updateProtectUniform([element(60)], canvas, scale, uniform, 2),
    1,
  );
  assert.ok(Math.abs(uniform[0] - 0.3) < 1e-6);
  assert.ok(Math.abs(uniform[4] + 0.1) < 1e-6); // unused tail is intentionally unchanged
});
