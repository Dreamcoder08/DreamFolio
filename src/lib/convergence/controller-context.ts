/**
 * The explicit, typed mount state shared by the controller modules. It is
 * built in two stages that mirror the mount itself: `createGeometryContext`
 * captures everything the field build needs before a renderer exists, then
 * `createMountContext` extends that SAME object (never a copy — `buildField`
 * must keep seeing live `isNarrow`/`layout`/`aspectScale` values) with the
 * renderer and the render-loop/pointer/visibility state.
 */

import type { FieldLayoutMode } from "./field.ts";
import {
  computeAspectScale,
  MAX_PROTECT_RECTS,
  type ConvergenceRenderer,
} from "./renderer.ts";
import { readThemeColors, type ThemeColors } from "./theme-geometry.ts";
import type { GeometryElements } from "./controller-geometry.ts";
import type { PointerState } from "./controller-frame.ts";

export const NARROW_BREAKPOINT = 720;

/** "idle-settled" is distinct from "paused": paused means the browser
 * stopped us (off-screen or tab hidden) and we want to resume the moment
 * that changes; idle-settled means WE stopped scheduling frames on
 * purpose because nothing is animating — see the scheduler's `renderFrame`
 * return value and `requestFrame`. */
export type FieldState =
  "idle" | "running" | "paused" | "static" | "idle-settled";

export interface GeometryContext {
  readonly canvas: HTMLCanvasElement;
  readonly hero: HTMLElement;
  readonly reducedMotionQuery: MediaQueryList | null;
  readonly pointerFineQuery: MediaQueryList | null;
  readonly geometryElements: GeometryElements;
  readonly protectElements: readonly (HTMLElement | null)[];
  /** Cached (not per-frame) protect-rect uniform state for the vertex/
   * fragment shaders' targeted alpha dimming — see uProtect/uProtectCount
   * in shaders.ts. A single reused Float32Array (never reallocated) sized
   * to MAX_PROTECT_RECTS * 4 floats; only the first `protectCount` rects
   * are meaningful, matching the shader's own early-break loop. Recomputed
   * only on mount/resize/rebuild, alongside the exclusions, so the render
   * loop itself stays allocation-free. */
  readonly protectRects: Float32Array;
  protectCount: number;
  isNarrow: boolean;
  layout: FieldLayoutMode;
  aspectScale: [number, number];
}

export interface MountContext extends GeometryContext {
  readonly renderer: ConvergenceRenderer;
  colors: ThemeColors;
  disposed: boolean;
  rafId: number;
  /** True while a frame is already queued — `requestFrame` is idempotent
   * so every trigger (scroll, pointer, resize, theme change) can call it
   * unconditionally without stacking up duplicate rAF callbacks. */
  scheduled: boolean;
  startTime: number;
  heroVisible: boolean;
  documentVisible: boolean;
  reducedMotion: boolean;
  /** The last progress value actually rendered — compared against the
   * newly computed one each frame to decide whether the field is still
   * visibly changing. Starts at a value no real progress can equal, so the
   * very first frame always renders. */
  lastProgress: number;
  readonly pointerTarget: PointerState;
  readonly pointerSmooth: PointerState;
  pointerIdleTimer: ReturnType<typeof setTimeout> | null;
  pointerEnabled: boolean;
  /** Hero geometry cache for scrollProgress — see `measureHeroGeometry`. */
  heroAbsoluteTop: number;
  heroHeight: number;
  currentDpr: number;
}

export function createGeometryContext(
  canvas: HTMLCanvasElement,
  heroEl: HTMLElement,
): GeometryContext {
  const reducedMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const pointerFineQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: fine)")
      : null;

  const isNarrow = window.innerWidth <= NARROW_BREAKPOINT;
  const layout: FieldLayoutMode = isNarrow ? "narrow" : "wide";

  // The portrait card and every small-text/interactive hero block are
  // measured directly from the DOM rather than assumed as fixed fractions
  // of the canvas: the hero grid's ratio changes across breakpoints (see
  // portfolio.css), and the canvas itself is full-bleed while this content
  // stays wrap-width. The portrait is only excluded on wide layouts — on
  // narrow it stacks below the copy and can span nearly the full width, so
  // excluding it there risks leaving the hub sampler too little room. Every
  // text block stays excluded on both: keeping hubs off small/interactive
  // text matters regardless of layout, and rejection sampling degrades
  // gracefully (fewer hubs) rather than failing outright if room gets
  // tight. The headline is large display type — protected as a hub
  // exclusion only (see PROTECT_ELEMENTS below for why it does not also
  // get alpha dimming).
  const portraitEl = heroEl.querySelector<HTMLElement>(".hero-portrait");
  const headlineEl = heroEl.querySelector<HTMLElement>(".hero-copy h1");
  const kickerEl = heroEl.querySelector<HTMLElement>(".hero-kicker");
  const introEl = heroEl.querySelector<HTMLElement>(".hero-intro");
  const briefEl = heroEl.querySelector<HTMLElement>(".hero-brief");
  const tickerEl = heroEl.querySelector<HTMLElement>(".hero-ticker");

  // Every small-text/interactive block that also gets the shader's alpha
  // dimming (not just a hub exclusion) — the headline is deliberately left
  // out: it is large display type that only needs 3:1 contrast, so faint
  // particles/edges behind it are fine (see WIDE_ALPHA's comment). Capped
  // at MAX_PROTECT_RECTS, which the shader's uProtect array is sized to;
  // the hero has 4 today, comfortably under the 6-slot budget.
  const PROTECT_ELEMENTS = [kickerEl, introEl, briefEl, tickerEl];
  const geometryElements: GeometryElements = {
    portrait: portraitEl,
    headline: headlineEl,
    protected: PROTECT_ELEMENTS,
  };

  const initialCanvasBox = canvas.getBoundingClientRect();
  const aspectScale = computeAspectScale(
    initialCanvasBox.width || heroEl.clientWidth || 1,
    initialCanvasBox.height || heroEl.clientHeight || 1,
  );

  return {
    canvas,
    hero: heroEl,
    reducedMotionQuery,
    pointerFineQuery,
    geometryElements,
    protectElements: PROTECT_ELEMENTS,
    protectRects: new Float32Array(MAX_PROTECT_RECTS * 4),
    protectCount: 0,
    isNarrow,
    layout,
    aspectScale,
  };
}

/** Extends the geometry context in place once the renderer exists. */
export function createMountContext(
  geometry: GeometryContext,
  renderer: ConvergenceRenderer,
): MountContext {
  return Object.assign(geometry, {
    renderer,
    colors: readThemeColors(),
    disposed: false,
    rafId: 0,
    scheduled: false,
    startTime: 0,
    heroVisible: true,
    documentVisible: !document.hidden,
    reducedMotion: geometry.reducedMotionQuery?.matches ?? false,
    lastProgress: -1,
    pointerTarget: { x: 0, y: 0, strength: 0 },
    pointerSmooth: { x: 0, y: 0, strength: 0 },
    pointerIdleTimer: null,
    pointerEnabled: geometry.pointerFineQuery?.matches ?? false,
    heroAbsoluteTop: 0,
    heroHeight: 0,
    // Placeholder only: the composition root assigns the real value from
    // `applyResize` immediately after this returns, before any frame.
    currentDpr: 1,
  });
}

export function setState(ctx: GeometryContext, state: FieldState): void {
  ctx.canvas.dataset.state = state;
}
