/** Minimal DOM fakes for the ⌘K console's unit tests: just enough of an
 *  element (listeners honoring `signal`, the few properties the driver
 *  writes) and a `document.getElementById` over a fixed id map. */

type Listener = (event: unknown) => void;

export class FakeElement {
  textContent = "";
  hidden = false;
  value = "";
  open = false;
  innerHTML = "";
  /** Makes addEventListener throw for this event type (a mid-mount bug). */
  failOn: string | null = null;
  readonly attributes = new Map<string, string>();
  private readonly listeners = new Map<string, Set<Listener>>();

  addEventListener(
    type: string,
    listener: Listener,
    options?: { signal?: AbortSignal },
  ): void {
    if (type === this.failOn) throw new Error(`cannot listen to ${type}`);
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
    options?.signal?.addEventListener("abort", () => set.delete(listener));
  }

  listenerCount(type?: string): number {
    if (type) return this.listeners.get(type)?.size ?? 0;
    let total = 0;
    for (const set of this.listeners.values()) total += set.size;
    return total;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  focus(): void {}
  select(): void {}
  showModal(): void {
    this.open = true;
  }
  close(): void {
    this.open = false;
  }
}

/** The ids mountConsole() looks up, each backed by a fresh FakeElement. */
export const CONSOLE_IDS = [
  "ship-console",
  "console-input",
  "console-listbox",
  "console-empty",
  "console-status",
  "console-trigger",
  "console-copy-fallback",
  "console-copy-input",
  "console-data",
] as const;

export type ConsoleDom = Record<(typeof CONSOLE_IDS)[number], FakeElement>;

/** Installs a fake `document` whose getElementById serves the console ids. */
export function installConsoleDom(): ConsoleDom {
  const dom = Object.fromEntries(
    CONSOLE_IDS.map((id) => [id, new FakeElement()]),
  ) as ConsoleDom;
  dom["console-data"].textContent = "[]";
  const byId = dom as Record<string, FakeElement | undefined>;
  (globalThis as { document?: unknown }).document = {
    activeElement: null,
    getElementById: (id: string) => byId[id] ?? null,
  };
  return dom;
}
