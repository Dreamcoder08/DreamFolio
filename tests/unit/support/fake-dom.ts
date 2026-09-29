// Recording DOM fakes for the convergence controller's teardown tests: event
// targets that log every add/remove and track which listeners are still
// attached (with DOM semantics — one entry per type+handler, `once`
// listeners drop themselves when dispatched), and observer classes that
// count observe/disconnect per instance.

type Handler = (...args: unknown[]) => void;

export interface ListenerCall {
  op: "add" | "remove";
  target: string;
  type: string;
  handler: Handler;
  once: boolean;
}

export type FakeTarget = ReturnType<typeof createFakeTarget>;

/** Shared call log, so a test can compare adds and removes across targets. */
export function createListenerLog() {
  const calls: ListenerCall[] = [];
  /** `target:type` keys, one per call, sorted — a comparable multiset. */
  function keys(op: ListenerCall["op"]): string[] {
    return calls
      .filter((call) => call.op === op)
      .map((call) => `${call.target}:${call.type}`)
      .sort();
  }
  return { calls, keys };
}

export function createFakeTarget(
  name: string,
  log: ReturnType<typeof createListenerLog>,
  fields: Record<string, unknown> = {},
) {
  let active: { type: string; handler: Handler; once: boolean }[] = [];
  const target = {
    ...fields,
    addEventListener(type: string, handler: Handler, options?: unknown) {
      const once =
        typeof options === "object" && options !== null && "once" in options
          ? Boolean((options as { once?: boolean }).once)
          : false;
      log.calls.push({ op: "add", target: name, type, handler, once });
      if (!active.some((l) => l.type === type && l.handler === handler)) {
        active.push({ type, handler, once });
      }
    },
    removeEventListener(type: string, handler: Handler) {
      log.calls.push({
        op: "remove",
        target: name,
        type,
        handler,
        once: false,
      });
      active = active.filter(
        (l) => !(l.type === type && l.handler === handler),
      );
    },
    /** Calls the listeners attached for `type`, dropping `once` ones first. */
    dispatch(type: string, event: unknown = { type }) {
      const matching = active.filter((l) => l.type === type);
      active = active.filter((l) => !(l.type === type && l.once));
      for (const l of matching) l.handler(event);
    },
    /** `type` of every listener still attached. */
    activeTypes(): string[] {
      return active.map((l) => l.type);
    },
  };
  return target;
}

export interface ObserverRecord {
  kind: string;
  observed: unknown[];
  disconnects: number;
}

/** Fake Resize/Intersection/Mutation observer classes sharing one record. */
export function createFakeObservers() {
  const instances: ObserverRecord[] = [];
  function observerClass(kind: string) {
    return class FakeObserver {
      readonly record: ObserverRecord = { kind, observed: [], disconnects: 0 };
      constructor() {
        instances.push(this.record);
      }
      observe(target: unknown) {
        this.record.observed.push(target);
      }
      disconnect() {
        this.record.disconnects += 1;
      }
    };
  }
  return {
    instances,
    globals: {
      ResizeObserver: observerClass("resize"),
      IntersectionObserver: observerClass("intersection"),
      MutationObserver: observerClass("mutation"),
    },
  };
}
