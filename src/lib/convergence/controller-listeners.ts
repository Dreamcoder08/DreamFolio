/**
 * Browser event wiring for the convergence controller: pointer, pointer
 * capability, resize, intersection, visibility, `data-theme`, color scheme,
 * scroll and reduced motion — registered in exactly this order. Returns the
 * matching teardown, which the lifecycle's `dispose` runs.
 */

import { readThemeColors } from "./theme-geometry.ts";
import { NARROW_BREAKPOINT, type MountContext } from "./controller-context.ts";
import { applyResize, measureHeroGeometry } from "./controller-field.ts";
import { toLogicalPointer } from "./controller-frame.ts";
import type { FrameScheduler } from "./controller-scheduler.ts";

const POINTER_IDLE_TIMEOUT_MS = 220;

export function wireListeners(
  ctx: MountContext,
  scheduler: FrameScheduler,
  rebuildField: () => boolean,
): () => void {
  const { canvas, hero: heroEl, pointerFineQuery, reducedMotionQuery } = ctx;
  const { requestFrame, syncRunning, refreshFrame } = scheduler;
  const { handleReducedMotionChange } = scheduler;

  function handlePointerMove(event: PointerEvent) {
    if (!ctx.pointerEnabled) return;
    const { x, y } = toLogicalPointer(
      canvas.getBoundingClientRect(),
      event.clientX,
      event.clientY,
      ctx.aspectScale,
    );
    ctx.pointerTarget.x = x;
    ctx.pointerTarget.y = y;
    ctx.pointerTarget.strength = 1;
    requestFrame();
    if (ctx.pointerIdleTimer) clearTimeout(ctx.pointerIdleTimer);
    ctx.pointerIdleTimer = setTimeout(() => {
      ctx.pointerTarget.strength = 0;
      requestFrame();
    }, POINTER_IDLE_TIMEOUT_MS);
  }

  function handlePointerLeave() {
    ctx.pointerTarget.strength = 0;
    requestFrame();
  }

  if (ctx.pointerEnabled) {
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    heroEl.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });
  }

  function handlePointerCapabilityChange() {
    const nowFine = pointerFineQuery?.matches ?? false;
    if (nowFine === ctx.pointerEnabled) return;
    ctx.pointerEnabled = nowFine;
    if (ctx.pointerEnabled) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      heroEl.addEventListener("pointerleave", handlePointerLeave, {
        passive: true,
      });
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      heroEl.removeEventListener("pointerleave", handlePointerLeave);
      ctx.pointerTarget.strength = 0;
      requestFrame();
    }
  }
  pointerFineQuery?.addEventListener?.("change", handlePointerCapabilityChange);

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          ctx.currentDpr = applyResize(ctx);
          ctx.isNarrow = window.innerWidth <= NARROW_BREAKPOINT;
          // rebuildField() can itself degrade to the fallback (a failed GPU
          // re-upload) and remove the canvas — measuring hero geometry or
          // asking for a redraw against that torn-down mount afterward would
          // be work with nothing left to consume it, so stop right here
          // instead of relying on the disposed-state guards inside those
          // calls to make it harmless.
          if (!rebuildField()) return;
          measureHeroGeometry(ctx);
          // Not requestFrame(): a resize always needs a redraw, including
          // while motion is reduced — see refreshFrame's own comment.
          refreshFrame();
        })
      : null;
  resizeObserver?.observe(heroEl);

  const intersectionObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) ctx.heroVisible = entry.isIntersecting;
            syncRunning();
          },
          { threshold: 0.01 },
        )
      : null;
  intersectionObserver?.observe(heroEl);

  function handleVisibilityChange() {
    ctx.documentVisible = !document.hidden;
    syncRunning();
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const themeObserver = new MutationObserver(() => {
    ctx.colors = readThemeColors();
    // Not requestFrame(): the already-drawn static frame is now the wrong
    // colors while motion is reduced — see refreshFrame's own comment.
    refreshFrame();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const colorSchemeQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  function handleColorSchemeChange() {
    ctx.colors = readThemeColors();
    // Not requestFrame(): same reasoning as the theme MutationObserver
    // above — refreshFrame() actually redraws the static frame with the
    // new colors instead of no-op'ing while motion is reduced.
    refreshFrame();
  }
  colorSchemeQuery?.addEventListener?.("change", handleColorSchemeChange);

  // Passive scroll listener: does no work itself beyond scheduling one
  // frame. Per-frame scroll progress is read from `window.scrollY` (a
  // cheap scroll-offset read, no layout) against the cached hero geometry,
  // not recomputed here.
  function handleScroll() {
    requestFrame();
  }
  window.addEventListener("scroll", handleScroll, { passive: true });

  reducedMotionQuery?.addEventListener?.("change", handleReducedMotionChange);

  return function teardownListeners() {
    if (ctx.pointerIdleTimer) clearTimeout(ctx.pointerIdleTimer);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    themeObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("pointermove", handlePointerMove);
    heroEl.removeEventListener("pointerleave", handlePointerLeave);
    pointerFineQuery?.removeEventListener?.(
      "change",
      handlePointerCapabilityChange,
    );
    reducedMotionQuery?.removeEventListener?.(
      "change",
      handleReducedMotionChange,
    );
    colorSchemeQuery?.removeEventListener?.("change", handleColorSchemeChange);
  };
}
