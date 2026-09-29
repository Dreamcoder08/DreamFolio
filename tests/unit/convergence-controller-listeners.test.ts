import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import type { MountContext } from "../../src/lib/convergence/controller-context.ts";
import { wireListeners } from "../../src/lib/convergence/controller-listeners.ts";
import type { FrameScheduler } from "../../src/lib/convergence/controller-scheduler.ts";
import {
  createFakeObservers,
  createFakeTarget,
  createListenerLog,
  type FakeTarget,
} from "./support/fake-dom.ts";
import { installGlobals } from "./support/fake-globals.ts";

let restoreGlobals: (() => void) | undefined;
afterEach(() => {
  restoreGlobals?.();
  restoreGlobals = undefined;
});

interface MountOptions {
  finePointer?: boolean;
  /** false = no observers, no matchMedia and no media queries at all. */
  browserApis?: boolean;
}

function wire({ finePointer = true, browserApis = true }: MountOptions = {}) {
  const log = createListenerLog();
  const colorScheme = createFakeTarget("colorScheme", log, { matches: false });
  const win = createFakeTarget("window", log, {
    innerWidth: 1280,
    ...(browserApis ? { matchMedia: () => colorScheme } : {}),
  });
  const doc = createFakeTarget("document", log, {
    hidden: false,
    documentElement: {},
  });
  const observers = createFakeObservers();
  restoreGlobals = installGlobals({
    window: win,
    document: doc,
    MutationObserver: observers.globals.MutationObserver,
    ResizeObserver: browserApis ? observers.globals.ResizeObserver : undefined,
    IntersectionObserver: browserApis
      ? observers.globals.IntersectionObserver
      : undefined,
  });
  const hero = createFakeTarget("hero", log);
  const pointerFine = createFakeTarget("pointerFine", log, {
    matches: finePointer,
  });
  const reducedMotion = createFakeTarget("reducedMotion", log, {
    matches: false,
  });
  const ctx = {
    canvas: {},
    hero,
    pointerFineQuery: browserApis ? pointerFine : null,
    reducedMotionQuery: browserApis ? reducedMotion : null,
    pointerEnabled: finePointer,
    pointerIdleTimer: 0,
    pointerTarget: { x: 0, y: 0, strength: 0 },
  } as unknown as MountContext;
  const scheduler = {
    requestFrame: () => {},
    syncRunning: () => {},
    refreshFrame: () => {},
    handleReducedMotionChange: () => {},
  } as unknown as FrameScheduler;
  const teardown = wireListeners(ctx, scheduler, () => true);
  const targets: FakeTarget[] = [
    win,
    doc,
    hero,
    colorScheme,
    pointerFine,
    reducedMotion,
  ];
  return { log, ctx, teardown, targets, pointerFine, observers };
}

function stillAttached(targets: FakeTarget[]): string[] {
  return targets.flatMap((t) => t.activeTypes());
}

test("teardown removes exactly the listeners wiring added (fine pointer)", () => {
  const { log, teardown, targets, observers } = wire();
  assert.deepEqual(log.keys("add"), [
    "colorScheme:change",
    "document:visibilitychange",
    "hero:pointerleave",
    "pointerFine:change",
    "reducedMotion:change",
    "window:pointermove",
    "window:scroll",
  ]);
  teardown();
  assert.deepEqual(log.keys("remove"), log.keys("add"));
  for (const add of log.calls.filter((c) => c.op === "add")) {
    assert.ok(
      log.calls.some(
        (c) =>
          c.op === "remove" &&
          c.target === add.target &&
          c.type === add.type &&
          c.handler === add.handler,
      ),
      `${add.target}:${add.type} is removed with the handler it was added with`,
    );
  }
  assert.deepEqual(stillAttached(targets), []);
  assert.deepEqual(
    observers.instances.map((o) => [o.kind, o.observed.length, o.disconnects]),
    [
      ["resize", 1, 1],
      ["intersection", 1, 1],
      ["mutation", 1, 1],
    ],
  );
});

test("a coarse pointer never adds pointer listeners, and teardown is still clean", () => {
  const { log, teardown, targets } = wire({ finePointer: false });
  const added = log.keys("add");
  assert.ok(!added.includes("window:pointermove"));
  assert.ok(!added.includes("hero:pointerleave"));
  teardown();
  assert.deepEqual(stillAttached(targets), []);
});

test("pointer capability flips leave nothing attached after teardown", () => {
  const { ctx, teardown, targets, pointerFine } = wire({ finePointer: false });
  for (const matches of [true, false, true]) {
    Object.assign(pointerFine, { matches });
    pointerFine.dispatch("change");
    assert.equal(ctx.pointerEnabled, matches);
  }
  teardown();
  assert.deepEqual(stillAttached(targets), []);
});

test("teardown is idempotent: a second run adds nothing and throws nothing", () => {
  const { log, teardown, targets } = wire();
  teardown();
  const addsAfterFirst = log.keys("add");
  assert.doesNotThrow(() => teardown());
  assert.deepEqual(log.keys("add"), addsAfterFirst);
  assert.deepEqual(stillAttached(targets), []);
});

test("teardown clears a pending pointer-idle timer", () => {
  const { ctx, teardown, targets } = wire();
  Object.assign(ctx.canvas, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  });
  Object.assign(ctx, { aspectScale: [1, 1] });
  const win = targets[0];
  win.dispatch("pointermove", { clientX: 10, clientY: 10 });
  assert.equal(ctx.pointerTarget.strength, 1);
  teardown();
  // A cleared timer never fires: the strength would drop to 0 if it did.
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      assert.equal(ctx.pointerTarget.strength, 1);
      resolve();
    }, 260),
  );
});

test("missing observers, matchMedia and media queries wire and tear down safely", () => {
  const { log, teardown, targets, observers } = wire({ browserApis: false });
  teardown();
  assert.deepEqual(
    observers.instances.map((o) => o.kind),
    ["mutation"],
  );
  assert.ok(log.keys("add").includes("window:scroll"));
  assert.deepEqual(stillAttached(targets), []);
});
