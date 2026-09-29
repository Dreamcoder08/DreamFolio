import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import type { MountContext } from "../../src/lib/convergence/controller-context.ts";
import { createScheduler } from "../../src/lib/convergence/controller-scheduler.ts";
import { installFakeFrames as installSharedFakeFrames } from "./support/fake-globals.ts";

/** Each test installs its own fake frames; the hook always restores them. */
let restoreFrames: (() => void) | undefined;
function installFakeFrames() {
  const frames = installSharedFakeFrames();
  restoreFrames = frames.restore;
  return frames;
}
afterEach(() => {
  restoreFrames?.();
  restoreFrames = undefined;
});

function fakeContext(reducedMotion = false) {
  const renders: { progress: number; time: number }[] = [];
  const query = { matches: reducedMotion };
  const ctx = {
    canvas: { dataset: {} as Record<string, string> },
    reducedMotionQuery: query,
    renderer: {
      render: (u: { progress: number; time: number }) => renders.push(u),
    },
    protectRects: new Float32Array(24),
    protectCount: 0,
    isNarrow: false,
    colors: { accent: [1, 0, 0], neutral: [0, 1, 0] },
    disposed: false,
    rafId: 0,
    scheduled: false,
    startTime: 0,
    heroVisible: true,
    documentVisible: true,
    reducedMotion,
    lastProgress: -1,
    pointerTarget: { x: 0, y: 0, strength: 0 },
    pointerSmooth: { x: 0, y: 0, strength: 0 },
    heroAbsoluteTop: 0,
    heroHeight: 800,
    currentDpr: 1,
  } as unknown as MountContext;
  return { ctx, renders, query };
}

test("motion path: idle, running through the intro, then idle-settled", () => {
  const frames = installFakeFrames();
  const { ctx, renders } = fakeContext();
  const scheduler = createScheduler(ctx);
  scheduler.start();
  assert.equal(ctx.canvas.dataset.state, "idle");
  assert.equal(frames.queue.size, 1);
  scheduler.requestFrame();
  assert.equal(frames.queue.size, 1, "requestFrame is idempotent");
  frames.flush(1000);
  assert.equal(ctx.canvas.dataset.state, "running");
  let now = 1000;
  while (frames.queue.size > 0 && now < 60_000) frames.flush((now += 100));
  assert.equal(ctx.canvas.dataset.state, "idle-settled");
  assert.equal(frames.queue.size, 0, "no frame scheduled at rest");
  // Without scroll, the intro holds at its 0.7 cap (see progress.ts).
  assert.ok(Math.abs((renders.at(-1)?.progress ?? 0) - 0.7) < 0.001);
});

test("hiding pauses and cancels the pending frame; showing resumes", () => {
  const frames = installFakeFrames();
  const { ctx } = fakeContext();
  const scheduler = createScheduler(ctx);
  scheduler.start();
  ctx.documentVisible = false;
  scheduler.syncRunning();
  assert.equal(ctx.canvas.dataset.state, "paused");
  assert.equal(frames.queue.size, 0);
  assert.equal(ctx.scheduled, false);
  ctx.documentVisible = true;
  scheduler.syncRunning();
  assert.equal(frames.queue.size, 1);
});

test("reduced motion renders one static frame and never schedules", () => {
  const frames = installFakeFrames();
  const { ctx, renders } = fakeContext(true);
  const scheduler = createScheduler(ctx);
  scheduler.start();
  assert.equal(ctx.canvas.dataset.state, "static");
  assert.deepEqual(
    renders.map((r) => [r.progress, r.time]),
    [[1, 0]],
  );
  scheduler.refreshFrame();
  assert.equal(renders.length, 2, "refreshFrame redraws the static frame");
  scheduler.requestFrame();
  assert.equal(frames.queue.size, 0);
});

test("reduced-motion change stops the loop, and re-enabling restarts the intro", () => {
  const frames = installFakeFrames();
  const { ctx, query } = fakeContext();
  const scheduler = createScheduler(ctx);
  scheduler.start();
  frames.flush(1000);
  query.matches = true;
  scheduler.handleReducedMotionChange();
  assert.equal(ctx.canvas.dataset.state, "static");
  assert.equal(frames.queue.size, 0);
  assert.equal(ctx.rafId, 0);
  query.matches = false;
  scheduler.handleReducedMotionChange();
  assert.equal(ctx.startTime, 0);
  assert.equal(ctx.lastProgress, -1);
  assert.equal(frames.queue.size, 1);
});

test("a disposed mount never schedules another frame", () => {
  const frames = installFakeFrames();
  const { ctx } = fakeContext();
  const scheduler = createScheduler(ctx);
  ctx.disposed = true;
  scheduler.start();
  scheduler.requestFrame();
  assert.equal(frames.queue.size, 0);
  assert.equal(ctx.canvas.dataset.state, "idle");
});

test("the fake frame globals do not outlive the test that installed them", () => {
  const g = globalThis as Record<string, unknown>;
  assert.equal(g.window, undefined);
  assert.equal(g.requestAnimationFrame, undefined);
  assert.equal(g.cancelAnimationFrame, undefined);
});
