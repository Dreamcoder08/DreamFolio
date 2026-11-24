import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TOUR_STOPS,
  nextTourStep,
  isAbortKey,
} from "../../src/lib/auto-tour.ts";

test("TOUR_STOPS covers all homepage chapters with positive dwell times", () => {
  assert.equal(TOUR_STOPS.length, 6);
  assert.equal(TOUR_STOPS[0].selector, ".hero");
  assert.equal(TOUR_STOPS[1].selector, "#projects");
  assert.ok(TOUR_STOPS[1].dwellMs > TOUR_STOPS[0].dwellMs);
  for (const stop of TOUR_STOPS) {
    assert.ok(stop.dwellMs >= 2000);
  }
});

test("nextTourStep advances linearly and returns null at the end of the reel", () => {
  assert.equal(nextTourStep(0, 6), 1);
  assert.equal(nextTourStep(4, 6), 5);
  assert.equal(nextTourStep(5, 6), null);
  assert.equal(nextTourStep(0, 0), null);
});

test("isAbortKey detects manual navigation keys and ignores modifier-only keys", () => {
  assert.equal(isAbortKey("Escape"), true);
  assert.equal(isAbortKey("ArrowDown"), true);
  assert.equal(isAbortKey("PageDown"), true);
  assert.equal(isAbortKey(" "), true);
  assert.equal(isAbortKey("Shift"), false);
  assert.equal(isAbortKey("a"), false);
});
