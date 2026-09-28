/**
 * Field build and DOM measurement for the convergence controller: the
 * seeded field build, protect-uniform sync, canvas resize and the cached
 * hero geometry. Everything here runs on mount/resize/rebuild only — never
 * per frame.
 */

import { createField, type Field } from "./field.ts";
import { computeAspectScale, MAX_PROTECT_RECTS } from "./renderer.ts";
import { pickParticleCount } from "./theme-geometry.ts";
import {
  computeExclusions,
  updateProtectUniform,
} from "./controller-geometry.ts";
import type { GeometryContext, MountContext } from "./controller-context.ts";

/** Fixed so the hero graph is stable across reloads — a design choice, not
 * a secret, so it is fine to read directly out of the source. */
const FIELD_SEED = 0x5f3759df;
const DPR_CAP = 1.75;

export function buildField(ctx: GeometryContext): Field {
  const box = ctx.canvas.getBoundingClientRect();
  const aspect =
    (box.width || ctx.hero.clientWidth || 1) /
    Math.max(1, box.height || ctx.hero.clientHeight || 1);
  return createField({
    count: pickParticleCount(
      ctx.isNarrow,
      typeof navigator !== "undefined"
        ? navigator.hardwareConcurrency
        : undefined,
    ),
    seed: FIELD_SEED,
    aspect,
    layout: ctx.layout,
    exclusions: computeExclusions(
      ctx.geometryElements,
      ctx.isNarrow,
      ctx.canvas,
      ctx.aspectScale,
    ),
  });
}

export function syncProtectUniform(ctx: GeometryContext): void {
  ctx.protectCount = updateProtectUniform(
    ctx.protectElements,
    ctx.canvas,
    ctx.aspectScale,
    ctx.protectRects,
    MAX_PROTECT_RECTS,
  );
}

export function applyResize(ctx: MountContext): number {
  const box = ctx.canvas.getBoundingClientRect();
  const width = Math.max(1, box.width || ctx.hero.clientWidth || 1);
  const height = Math.max(1, box.height || ctx.hero.clientHeight || 1);
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  ctx.renderer.resize(width, height, dpr);
  ctx.aspectScale = computeAspectScale(width, height);
  return dpr;
}

/** Reshapes the field around the exclusion rects' current position/size
 * and re-uploads it — cheap relative to a resize event's own cost, and
 * the only way the hub layout can track content that moved (a breakpoint
 * crossing, a font-driven reflow, a window resize). If the GPU upload
 * itself fails, `renderer.setField` has already disposed the renderer —
 * degrade the whole mount to the fallback instead of updating the protect
 * uniform or expecting any further frame to draw. */
export function rebuildField(
  ctx: MountContext,
  degradeToFallback: () => void,
): boolean {
  ctx.layout = ctx.isNarrow ? "narrow" : "wide";
  if (!ctx.renderer.setField(buildField(ctx))) {
    degradeToFallback();
    return false;
  }
  syncProtectUniform(ctx);
  return true;
}

// Hero geometry cache for scrollProgress, read on mount and on every
// ResizeObserver firing — never per frame. `heroAbsoluteTop` is the
// hero's top relative to the *document*, not the viewport, so per-frame
// scroll progress is just `heroAbsoluteTop - window.scrollY`: a plain
// arithmetic subtraction against a scroll offset the browser already
// tracks, instead of a `getBoundingClientRect()` call that forces a
// synchronous layout recalculation if anything on the page is dirty.
// That per-frame layout read was the dominant cost behind this field's
// ~5.4s of measured Lighthouse Total Blocking Time (see renderer.ts's
// WEBGL_CONTEXT_ATTRIBUTES comment for the other major contributor).
export function measureHeroGeometry(ctx: MountContext): void {
  const rect = ctx.hero.getBoundingClientRect();
  ctx.heroAbsoluteTop = rect.top + window.scrollY;
  ctx.heroHeight = rect.height;
}
