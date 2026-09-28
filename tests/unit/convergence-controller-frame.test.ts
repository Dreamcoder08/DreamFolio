import { test } from "node:test";
import assert from "node:assert/strict";
import {
  currentAlpha,
  NARROW_ALPHA,
  POINTER_EPSILON,
  POINTER_SMOOTHING,
  pointerSettled,
  PROGRESS_EPSILON,
  shouldKeepAnimating,
  smoothPointer,
  toLogicalPointer,
  WIDE_ALPHA,
} from "../../src/lib/convergence/controller-frame.ts";

test("alpha follows the layout", () => {
  assert.equal(currentAlpha(true), NARROW_ALPHA);
  assert.equal(currentAlpha(false), WIDE_ALPHA);
});

test("smoothPointer moves one exponential step toward the target in place", () => {
  const target = { x: 1, y: -1, strength: 1 };
  const smooth = { x: 0, y: 0, strength: 0 };
  smoothPointer(target, smooth);
  assert.equal(smooth.x, POINTER_SMOOTHING);
  assert.equal(smooth.y, -POINTER_SMOOTHING);
  assert.equal(smooth.strength, POINTER_SMOOTHING);
  assert.deepEqual(target, { x: 1, y: -1, strength: 1 });
});

test("repeated smoothing eventually settles the pointer", () => {
  const target = { x: 0.5, y: 0.25, strength: 1 };
  const smooth = { x: 0, y: 0, strength: 0 };
  assert.equal(pointerSettled(target, smooth), false);
  let steps = 0;
  while (!pointerSettled(target, smooth) && steps < 1000) {
    smoothPointer(target, smooth);
    steps += 1;
  }
  assert.ok(steps > 1 && steps < 1000, `settled after ${steps} steps`);
});

test("pointerSettled requires every component within epsilon", () => {
  const target = { x: 0, y: 0, strength: 0 };
  const near = POINTER_EPSILON / 2;
  assert.equal(
    pointerSettled(target, { x: near, y: near, strength: near }),
    true,
  );
  assert.equal(
    pointerSettled(target, { x: 0, y: 0, strength: POINTER_EPSILON }),
    false,
  );
  assert.equal(
    pointerSettled(target, { x: 0, y: -POINTER_EPSILON, strength: 0 }),
    false,
  );
});

test("the loop keeps animating while progress moves or the pointer is unsettled", () => {
  assert.equal(shouldKeepAnimating(0.5, 0.5, true), false);
  assert.equal(
    shouldKeepAnimating(0.5, 0.5 + PROGRESS_EPSILON / 2, true),
    false,
  );
  assert.equal(
    shouldKeepAnimating(0.5, 0.5 + PROGRESS_EPSILON * 2, true),
    true,
  );
  assert.equal(shouldKeepAnimating(0.5, 0.5, false), true);
  // The initial lastProgress of -1 always forces the first frame through.
  assert.equal(shouldKeepAnimating(0, -1, true), true);
});

test("toLogicalPointer maps client space to aspect-corrected field space", () => {
  const box = { left: 100, top: 50, width: 200, height: 100 };
  // The centre maps to the origin (y is -0 from the axis flip, as before).
  assert.deepEqual(toLogicalPointer(box, 200, 100, [1, 1]), { x: 0, y: -0 });
  assert.deepEqual(toLogicalPointer(box, 300, 50, [1, 1]), { x: 1, y: 1 });
  assert.deepEqual(toLogicalPointer(box, 100, 150, [0.5, 1]), { x: -2, y: -1 });
  assert.deepEqual(toLogicalPointer({ ...box, width: 0 }, 200, 100, [1, 1]), {
    x: 0,
    y: 0,
  });
});
