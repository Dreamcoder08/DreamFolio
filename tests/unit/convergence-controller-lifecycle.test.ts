import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import type {
  GeometryContext,
  MountContext,
} from "../../src/lib/convergence/controller-context.ts";
import {
  createLifecycle,
  createRendererWithEarlyAbort,
} from "../../src/lib/convergence/controller-lifecycle.ts";
import { createFakeTarget, createListenerLog } from "./support/fake-dom.ts";
import { installGlobals } from "./support/fake-globals.ts";
import { createFakeCanvas, createFakeGl } from "./support/fake-webgl.ts";

let restoreGlobals: (() => void) | undefined;
afterEach(() => {
  restoreGlobals?.();
  restoreGlobals = undefined;
});

/** Fake `window`/`document` targets plus a recording cancelAnimationFrame. */
function installNavigationTargets() {
  const log = createListenerLog();
  const win = createFakeTarget("window", log);
  const doc = createFakeTarget("document", log);
  const cancelled: number[] = [];
  restoreGlobals = installGlobals({
    window: win,
    document: doc,
    cancelAnimationFrame: (id: number) => cancelled.push(id),
  });
  return { log, win, doc, cancelled };
}

function fakeMount(rafId = 7) {
  const counts = { canvasRemoved: 0, rendererDisposed: 0, teardowns: 0 };
  const ctx = {
    canvas: { remove: () => void (counts.canvasRemoved += 1) },
    renderer: { dispose: () => void (counts.rendererDisposed += 1) },
    disposed: false,
    rafId,
  } as unknown as MountContext;
  const teardownListeners = () => void (counts.teardowns += 1);
  return { ctx, counts, teardownListeners };
}

test("createLifecycle registers dispose once for both navigation events", () => {
  const { log } = installNavigationTargets();
  const { ctx, teardownListeners } = fakeMount();
  const { dispose } = createLifecycle(ctx, teardownListeners);
  assert.deepEqual(
    log.calls.map((c) => [c.op, c.target, c.type, c.handler, c.once]),
    [
      ["add", "document", "astro:before-swap", dispose, true],
      ["add", "window", "pagehide", dispose, true],
    ],
  );
});

test("dispose tears everything down exactly once, however often it runs", () => {
  const { win, doc, cancelled } = installNavigationTargets();
  const { ctx, counts, teardownListeners } = fakeMount(7);
  const { dispose } = createLifecycle(ctx, teardownListeners);
  dispose();
  dispose();
  win.dispatch("pagehide");
  doc.dispatch("astro:before-swap");
  assert.equal(ctx.disposed, true);
  assert.deepEqual(cancelled, [7]);
  assert.equal(counts.teardowns, 1);
  assert.equal(counts.rendererDisposed, 1);
  assert.equal(counts.canvasRemoved, 0, "plain dispose keeps the canvas");
  assert.deepEqual(win.activeTypes(), []);
  assert.deepEqual(doc.activeTypes(), []);
});

test("a navigation event disposes the mount and detaches the other one", () => {
  const { win, doc } = installNavigationTargets();
  const { ctx, counts, teardownListeners } = fakeMount(0);
  createLifecycle(ctx, teardownListeners);
  win.dispatch("pagehide");
  assert.equal(counts.rendererDisposed, 1);
  assert.deepEqual(doc.activeTypes(), [], "astro:before-swap was removed");
  doc.dispatch("astro:before-swap");
  assert.equal(counts.teardowns, 1);
});

test("a mount with no pending frame never cancels one", () => {
  const { cancelled } = installNavigationTargets();
  const { ctx, teardownListeners } = fakeMount(0);
  createLifecycle(ctx, teardownListeners).dispose();
  assert.deepEqual(cancelled, []);
});

test("degradeToFallback disposes once and removes the canvas", () => {
  const { win, doc } = installNavigationTargets();
  const { ctx, counts, teardownListeners } = fakeMount();
  const { degradeToFallback, dispose } = createLifecycle(
    ctx,
    teardownListeners,
  );
  degradeToFallback();
  assert.equal(ctx.disposed, true);
  assert.equal(counts.canvasRemoved, 1);
  assert.equal(counts.teardowns, 1);
  assert.equal(counts.rendererDisposed, 1);
  dispose();
  degradeToFallback();
  assert.equal(counts.teardowns, 1, "a later dispose/degrade is a no-op");
  assert.equal(counts.rendererDisposed, 1);
  assert.deepEqual([...win.activeTypes(), ...doc.activeTypes()], []);
});

function fakeGeometry(canvas: HTMLCanvasElement) {
  let removed = 0;
  Object.assign(canvas, { remove: () => void (removed += 1) });
  const geometry = { canvas } as unknown as GeometryContext;
  return { geometry, removed: () => removed };
}

test("createRendererWithEarlyAbort: no WebGL2 removes the canvas and its listeners", async () => {
  const { log, win, doc } = installNavigationTargets();
  const { canvas } = createFakeCanvas(null);
  const { geometry, removed } = fakeGeometry(canvas);
  assert.equal(await createRendererWithEarlyAbort(geometry, () => {}), null);
  assert.equal(removed(), 1);
  assert.deepEqual(log.keys("add"), log.keys("remove"));
  assert.deepEqual([...win.activeTypes(), ...doc.activeTypes()], []);
});

for (const [target, type] of [
  ["window", "pagehide"],
  ["document", "astro:before-swap"],
] as const) {
  test(`createRendererWithEarlyAbort: ${type} mid-mount aborts the build`, async () => {
    const targets = installNavigationTargets();
    const fake = createFakeGl({ rendererName: "Apple M2" });
    const { canvas } = createFakeCanvas(fake.gl);
    const getContext = canvas.getContext.bind(canvas);
    // The navigation lands right after the capability check starts, i.e.
    // while the async build is in flight.
    Object.assign(canvas, {
      getContext: (...args: Parameters<typeof getContext>) => {
        targets[target === "window" ? "win" : "doc"].dispatch(type);
        return getContext(...args);
      },
    });
    const { geometry, removed } = fakeGeometry(canvas);
    assert.equal(await createRendererWithEarlyAbort(geometry, () => {}), null);
    assert.equal(removed(), 1);
    const built = fake.calls.filter(([name]) =>
      ["createProgram", "createBuffer"].includes(name),
    );
    assert.deepEqual(built, [], "no program or buffer after the abort");
    assert.deepEqual(targets.log.keys("add"), targets.log.keys("remove"));
    assert.deepEqual(
      [...targets.win.activeTypes(), ...targets.doc.activeTypes()],
      [],
    );
  });
}
