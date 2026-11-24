import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldAutoplayRun,
  nextActiveIndex,
  type AutoplayConditions,
} from "../../src/lib/project-autoplay.ts";

const base: AutoplayConditions = {
  reducedMotion: false,
  inView: true,
  documentVisible: true,
  hovered: false,
  focused: false,
  pausedByUser: false,
  itemCount: 5,
};

test("shouldAutoplayRun returns true only when all conditions allow motion", () => {
  assert.equal(shouldAutoplayRun(base), true);
  assert.equal(shouldAutoplayRun({ ...base, reducedMotion: true }), false);
  assert.equal(shouldAutoplayRun({ ...base, inView: false }), false);
  assert.equal(shouldAutoplayRun({ ...base, documentVisible: false }), false);
  assert.equal(shouldAutoplayRun({ ...base, hovered: true }), false);
  assert.equal(shouldAutoplayRun({ ...base, focused: true }), false);
  assert.equal(shouldAutoplayRun({ ...base, pausedByUser: true }), false);
  assert.equal(shouldAutoplayRun({ ...base, itemCount: 1 }), false);
  assert.equal(shouldAutoplayRun({ ...base, itemCount: 0 }), false);
});

test("nextActiveIndex advances and wraps cleanly across any count", () => {
  assert.equal(nextActiveIndex(0, 4), 1);
  assert.equal(nextActiveIndex(2, 4), 3);
  assert.equal(nextActiveIndex(3, 4), 0);
  assert.equal(nextActiveIndex(0, 1), 0);
  assert.equal(nextActiveIndex(0, 0), 0);
});
