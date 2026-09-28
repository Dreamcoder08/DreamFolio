// Recording WebGL2 fake for the convergence renderer unit tests. Every
// method call is logged in order; `GL_CONSTANTS` read back as their own
// names so assertions stay readable. Only the behavior the renderer
// branches on is configurable.
import type { Field } from "../../../src/lib/convergence/field.ts";

export type GlCall = [string, ...unknown[]];

export interface FakeGlOptions {
  /** `UNMASKED_RENDERER_WEBGL` string; omitted = debug extension missing. */
  rendererName?: string;
  linkOk?: boolean;
}

export function createFakeGl(options: FakeGlOptions = {}) {
  const calls: GlCall[] = [];
  const state = { failBuffers: false };
  const debugInfo = { UNMASKED_RENDERER_WEBGL: "UNMASKED_RENDERER_WEBGL" };
  let nextId = 0;

  function returnFor(name: string, args: unknown[]): unknown {
    if (name === "getExtension") {
      return args[0] === "WEBGL_debug_renderer_info" &&
        options.rendererName !== undefined
        ? debugInfo
        : null;
    }
    if (name === "getParameter") return options.rendererName;
    if (name === "getProgramParameter") return options.linkOk ?? true;
    if (name === "getUniformLocation") return args[1];
    if (name === "createBuffer" && state.failBuffers) return null;
    if (name.startsWith("create")) return { id: `${name}#${nextId++}` };
    return undefined;
  }

  const gl = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        if (/^[A-Z0-9_]+$/.test(prop)) return prop;
        return (...args: unknown[]) => {
          calls.push([prop, ...args]);
          return returnFor(prop, args);
        };
      },
    },
  ) as unknown as WebGL2RenderingContext;

  return { gl, calls, state };
}

/** An EventTarget-backed canvas whose `getContext` hands back `gl`. */
export function createFakeCanvas(gl: WebGL2RenderingContext | null) {
  const contextRequests: unknown[][] = [];
  const listenerLog: string[] = [];
  const target = new EventTarget();
  const canvas = {
    width: 0,
    height: 0,
    getContext: (...args: unknown[]) => {
      contextRequests.push(args);
      return gl;
    },
    addEventListener: (
      type: string,
      listener: EventListener,
      options?: boolean,
    ) => {
      listenerLog.push(`add:${type}`);
      target.addEventListener(type, listener, options);
    },
    removeEventListener: (
      type: string,
      listener: EventListener,
      options?: boolean,
    ) => {
      listenerLog.push(`remove:${type}`);
      target.removeEventListener(type, listener, options);
    },
    dispatchEvent: (event: Event) => target.dispatchEvent(event),
  };
  return {
    canvas: canvas as unknown as HTMLCanvasElement,
    contextRequests,
    listenerLog,
  };
}

/** Two particles and one edge between two hubs. */
export function tinyField(): Field {
  return {
    chaosPositions: new Float32Array([0, 0, 1, 1]),
    orderPositions: new Float32Array([0, 0, 1, 1]),
    delays: new Float32Array([0, 0]),
    sizes: new Float32Array([1, 1]),
    tones: new Float32Array([0, 1]),
    graph: {
      hubs: [
        { x: -0.5, y: 0.25 },
        { x: 0.5, y: -0.25 },
      ],
      edges: [[0, 1]],
    },
  };
}

/** Lets pending timers/microtasks (the build's yield) run to completion. */
export async function settle(turns = 5): Promise<void> {
  for (let i = 0; i < turns; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
