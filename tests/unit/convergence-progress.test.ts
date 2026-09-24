import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clamp01,
  combineProgress,
  easeOutCubic,
  introProgress,
  scrollProgress,
} from "../../src/lib/convergence/progress.ts";

test("clamp01 clamps to [0, 1] and treats NaN as 0", () => {
  assert.equal(clamp01(-5), 0);
  assert.equal(clamp01(0.5), 0.5);
  assert.equal(clamp01(5), 1);
  assert.equal(clamp01(Number.NaN), 0);
});

test("easeOutCubic is monotonic and bounded", () => {
  const samples = Array.from({ length: 11 }, (_, i) => easeOutCubic(i / 10));
  assert.equal(samples[0], 0);
  assert.equal(samples[10], 1);
  for (let i = 1; i < samples.length; i += 1) {
    assert.ok(samples[i] >= samples[i - 1], "easeOutCubic must not decrease");
  }
});

test("introProgress starts at 0 and reaches its ~0.7 cap", () => {
  assert.equal(introProgress(0), 0);
  assert.ok(introProgress(3000) > 0.699 && introProgress(3000) <= 0.7);
  // Holds at the cap afterwards instead of continuing to rise.
  assert.equal(introProgress(3000), introProgress(10_000));
});

test("introProgress is monotonic over elapsed time", () => {
  const samples = [0, 200, 600, 1200, 1800, 3000, 4500].map(introProgress);
  for (let i = 1; i < samples.length; i += 1) {
    assert.ok(samples[i] >= samples[i - 1]);
  }
});

test("scrollProgress is 0 with the hero top at or below the viewport top", () => {
  assert.equal(scrollProgress(0, 1500, 800), 0);
  assert.equal(scrollProgress(120, 1500, 800), 0);
});

test("scrollProgress reaches 1 once ~35% of a viewport height has scrolled past", () => {
  // Hero taller than the viewport: the threshold is viewport-relative, not
  // hero-relative, so convergence finishes early while the hero still
  // fills the screen instead of trailing all the way to its own bottom.
  const heroHeight = 1500;
  const viewportHeight = 800;
  const threshold = viewportHeight * 0.35;
  assert.ok(scrollProgress(-threshold, heroHeight, viewportHeight) >= 0.999);
  assert.equal(scrollProgress(-threshold * 2, heroHeight, viewportHeight), 1);
});

test("scrollProgress caps its threshold at a hero shorter than the viewport", () => {
  // A hero shorter than one screen (e.g. a very short viewport) should
  // never demand more scroll than the hero itself has to give.
  const heroHeight = 400;
  const viewportHeight = 800;
  const threshold = heroHeight * 0.35;
  assert.ok(scrollProgress(-threshold, heroHeight, viewportHeight) >= 0.999);
});

test("scrollProgress is monotonic as the hero scrolls further past the top", () => {
  const heroHeight = 1500;
  const tops = [0, -100, -250, -400, -600, -900];
  const samples = tops.map((top) => scrollProgress(top, heroHeight, 800));
  for (let i = 1; i < samples.length; i += 1) {
    assert.ok(samples[i] >= samples[i - 1]);
  }
});

test("scrollProgress falls back to the viewport height when the hero height is unavailable", () => {
  const viewportHeight = 800;
  const threshold = viewportHeight * 0.35;
  assert.ok(scrollProgress(-threshold, 0, viewportHeight) >= 0.999);
});

test("scrollProgress degrades safely for a zero-height viewport", () => {
  assert.equal(scrollProgress(-500, 900, 0), 0);
});

test("combineProgress behaves like max() and stays clamped", () => {
  assert.equal(combineProgress(0.4, 0.1), 0.4);
  assert.equal(combineProgress(0.1, 0.7), 0.7);
  assert.equal(combineProgress(0, 0), 0);
  assert.equal(combineProgress(1, 1), 1);
  // Out-of-range inputs never leak through.
  assert.equal(combineProgress(-1, 2), 1);
});
