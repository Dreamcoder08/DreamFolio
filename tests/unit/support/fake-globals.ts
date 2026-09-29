// The one way unit tests install fake browser globals (`window`,
// `document`, `requestAnimationFrame`, observers...) on `globalThis`: every
// install returns its own restore, which puts back the exact previous
// property descriptor — or deletes the key when there was none — so a test
// file stays safe even when run without per-file process isolation. Call the
// restore from an `afterEach`/`after` hook, never inline at the end of a test
// (an assertion failure would skip it).

type FrameCallback = (now: number) => void;

/** Installs `values` on `globalThis`; the returned function undoes it. */
export function installGlobals(values: Record<string, unknown>): () => void {
  const g = globalThis as Record<string, unknown>;
  const saved = Object.keys(values).map(
    (key) => [key, Object.getOwnPropertyDescriptor(g, key)] as const,
  );
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(g, key, {
      value,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
  return function restoreGlobals() {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(g, key, descriptor);
      else delete g[key];
    }
  };
}

/**
 * A fake rAF queue plus `window` (defaults: `scrollY: 0, innerHeight: 800`,
 * overridable/extendable through `windowFields`). `cancelled` records every
 * id passed to `cancelAnimationFrame`.
 */
export function installFakeFrames(windowFields: Record<string, unknown> = {}) {
  const queue = new Map<number, FrameCallback>();
  const cancelled: number[] = [];
  let nextId = 1;
  const restore = installGlobals({
    window: { scrollY: 0, innerHeight: 800, ...windowFields },
    requestAnimationFrame: (cb: FrameCallback) => {
      queue.set(nextId, cb);
      return nextId++;
    },
    cancelAnimationFrame: (id: number) => {
      cancelled.push(id);
      queue.delete(id);
    },
  });
  return {
    queue,
    cancelled,
    restore,
    flush(now: number) {
      const pending = [...queue.values()];
      queue.clear();
      for (const cb of pending) cb(now);
    },
  };
}
