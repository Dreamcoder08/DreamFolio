/**
 * The on-demand rAF loop for the convergence controller: frame scheduling,
 * settle detection, visibility pausing, the reduced-motion static frame and
 * the intro restart. Every `data-state` transition except the fallback
 * removal happens here. Built once per mount so `loop` is a single stable
 * callback — scheduling a frame never allocates a closure.
 */

import { combineProgress, introProgress, scrollProgress } from "./progress.ts";
import { setState, type MountContext } from "./controller-context.ts";
import {
  currentAlpha,
  pointerSettled,
  shouldKeepAnimating,
  smoothPointer,
} from "./controller-frame.ts";

export interface FrameScheduler {
  requestFrame(): void;
  syncRunning(): void;
  refreshFrame(): void;
  handleReducedMotionChange(): void;
  /** Initial state: the static frame, or `idle` plus a first sync. */
  start(): void;
}

export function createScheduler(ctx: MountContext): FrameScheduler {
  /** Draws one frame and reports whether another one is worth scheduling.
   * Reads only `window.scrollY` / `window.innerHeight` (no layout) against
   * the geometry `measureHeroGeometry` cached on mount/resize — see that
   * function's comment for why a per-frame `getBoundingClientRect()` was
   * the dominant cost this on-demand loop exists to remove. */
  function renderFrame(nowMs: number): boolean {
    const elapsedMs = ctx.startTime === 0 ? 0 : nowMs - ctx.startTime;
    const heroTop = ctx.heroAbsoluteTop - window.scrollY;
    const intro = introProgress(elapsedMs);
    const scroll = scrollProgress(heroTop, ctx.heroHeight, window.innerHeight);
    const progress = combineProgress(intro, scroll);

    smoothPointer(ctx.pointerTarget, ctx.pointerSmooth);

    ctx.renderer.render({
      progress,
      time: nowMs / 1000,
      dpr: ctx.currentDpr,
      pointer: [ctx.pointerSmooth.x, ctx.pointerSmooth.y],
      pointerStrength: ctx.pointerSmooth.strength,
      idleAmount: 1 - progress,
      accent: ctx.colors.accent,
      neutral: ctx.colors.neutral,
      alpha: currentAlpha(ctx.isNarrow),
      protectRects: ctx.protectRects,
      protectCount: ctx.protectCount,
    });

    const keepAnimating = shouldKeepAnimating(
      progress,
      ctx.lastProgress,
      pointerSettled(ctx.pointerTarget, ctx.pointerSmooth),
    );
    ctx.lastProgress = progress;
    return keepAnimating;
  }

  function loop(nowMs: number) {
    ctx.scheduled = false;
    ctx.rafId = 0;
    if (ctx.disposed) return;
    if (!(ctx.heroVisible && ctx.documentVisible)) {
      // Defensive: the visibility/intersection handlers already cancel a
      // pending frame the instant they flip false, but a frame already in
      // flight can still land here in the same tick.
      setState(ctx, "paused");
      return;
    }
    if (ctx.startTime === 0) ctx.startTime = nowMs;
    const stillAnimating = renderFrame(nowMs);
    if (stillAnimating) {
      setState(ctx, "running");
      requestFrame();
    } else {
      // Nothing left to animate: stop scheduling entirely rather than
      // polling every frame to confirm nothing changed. The canvas simply
      // keeps showing its last-drawn pixels (a WebGL context's drawing
      // buffer persists between frames) — including the hub pulse, which
      // freezes at whatever phase it was mid-cycle instead of continuing
      // to breathe forever. A calm, settled system matches the "chaos
      // resolves into structure" intent better than perpetual motion would,
      // and it's what actually makes "on demand" mean zero scheduled work
      // at rest instead of a throttled-but-still-ticking timer.
      setState(ctx, "idle-settled");
    }
  }

  /** The only place a frame gets scheduled. Idempotent — every trigger
   * (scroll, pointer move/settle, resize, theme change, becoming visible
   * again) calls this unconditionally; `scheduled` makes repeat calls
   * within the same pending frame a no-op instead of stacking up queued
   * rAF callbacks. */
  function requestFrame() {
    if (ctx.disposed || ctx.reducedMotion || ctx.scheduled) return;
    if (!(ctx.heroVisible && ctx.documentVisible)) return;
    ctx.scheduled = true;
    ctx.rafId = requestAnimationFrame(loop);
  }

  function syncRunning() {
    if (ctx.disposed || ctx.reducedMotion) return;
    const shouldRun = ctx.heroVisible && ctx.documentVisible;
    if (shouldRun) {
      // Becoming visible again after being paused: the scroll position or
      // pointer state may have changed while nothing was drawing, so
      // always resync with one frame instead of waiting for another
      // trigger that may never come.
      requestFrame();
    } else {
      // Not visible: report "paused" even if we had already settled to
      // idle, so the reason we're not running (visibility, not "nothing
      // changed") stays observable — and cancel any frame that was still
      // in flight from a trigger that fired just before this one did.
      if (ctx.rafId) cancelAnimationFrame(ctx.rafId);
      ctx.rafId = 0;
      ctx.scheduled = false;
      setState(ctx, "paused");
    }
  }

  function renderStaticFrame() {
    ctx.renderer.render({
      progress: 1,
      time: 0,
      dpr: ctx.currentDpr,
      pointer: [0, 0],
      pointerStrength: 0,
      idleAmount: 0,
      accent: ctx.colors.accent,
      neutral: ctx.colors.neutral,
      alpha: currentAlpha(ctx.isNarrow),
      protectRects: ctx.protectRects,
      protectCount: ctx.protectCount,
    });
  }

  /** The one place every trigger that can change what should be on screen
   * while motion is reduced — resize (rebuildField already reshapes the
   * field, but resize also resizes/clears the GL drawing buffer itself),
   * a theme toggle, or an OS-level color-scheme change — funnels through.
   * `requestFrame` alone is not enough here: it unconditionally no-ops
   * while `reducedMotion` is true (see its own guard), which is correct
   * for scroll/pointer (nothing should animate) but wrong for these three,
   * since each one invalidates the single static frame already drawn
   * (a cleared buffer after resize, or stale colors after a theme change)
   * without anything else ever asking for a redraw. */
  function refreshFrame() {
    if (ctx.reducedMotion) {
      renderStaticFrame();
    } else {
      requestFrame();
    }
  }

  function handleReducedMotionChange() {
    ctx.reducedMotion = ctx.reducedMotionQuery?.matches ?? false;
    if (ctx.reducedMotion) {
      if (ctx.rafId) {
        cancelAnimationFrame(ctx.rafId);
        ctx.rafId = 0;
      }
      ctx.scheduled = false;
      setState(ctx, "static");
      renderStaticFrame();
    } else {
      // Restart the intro so re-enabling motion still reads as a
      // convergence rather than snapping straight to the settled graph.
      ctx.startTime = 0;
      ctx.lastProgress = -1;
      syncRunning();
    }
  }

  function start() {
    if (ctx.reducedMotion) {
      setState(ctx, "static");
      renderStaticFrame();
    } else {
      setState(ctx, "idle");
      syncRunning();
    }
  }

  return {
    requestFrame,
    syncRunning,
    refreshFrame,
    handleReducedMotionChange,
    start,
  };
}
