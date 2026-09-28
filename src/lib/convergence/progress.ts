/**
 * Pure progress mapping for the hero convergence field. Two independent
 * signals feed the final 0..1 "how converged is the system" value:
 *
 * - `introProgress`: a time-based ease that plays once on mount, so the
 *   field is already mid-convergence before the visitor does anything.
 * - `scrollProgress`: how far the visitor has scrolled through the hero.
 *
 * `controller.ts` combines them every frame with `combineProgress` and
 * feeds the result to the WebGL `uProgress` uniform.
 */

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Cubic ease-out: fast start, gentle settle — no overshoot. */
export function easeOutCubic(t: number): number {
  const clamped = clamp01(t);
  const inverse = 1 - clamped;
  return 1 - inverse * inverse * inverse;
}

const INTRO_DURATION_MS = 3000;
/** The intro alone never fully converges the system — scroll finishes it. */
const INTRO_CAP = 0.7;

/**
 * Time-based intro: eases from 0 to `INTRO_CAP` over `INTRO_DURATION_MS`
 * after mount, then holds at the cap. `elapsedMs` is milliseconds since the
 * field mounted (e.g. `performance.now() - startTime`).
 */
export function introProgress(elapsedMs: number): number {
  const t = clamp01(elapsedMs / INTRO_DURATION_MS);
  return easeOutCubic(t) * INTRO_CAP;
}

/** How much of one viewport height has to scroll past before the system
 * finishes converging — deliberately small so it resolves early, while the
 * hero is still fully on screen, rather than trailing the scroll all the
 * way to the hero's own (much taller) bottom edge. */
const SCROLL_COMPLETE_FRACTION = 0.35;

/**
 * Scroll-based progress: 0 while the hero's top is at or below the viewport
 * top (nothing scrolled past yet), ramping linearly to 1 once
 * `SCROLL_COMPLETE_FRACTION` of a viewport height has scrolled past the
 * viewport top. Scrolling back down reduces it again — the caller re-reads
 * `heroTop` every frame, so reversal is automatic.
 *
 * The threshold is capped at the hero's own height so a hero shorter than
 * one viewport (a stacked mobile layout can be taller than the viewport,
 * but never needs more than its own height to scroll past) never demands
 * more scroll than the hero actually has.
 *
 * @param heroTop - `heroEl.getBoundingClientRect().top`, in CSS pixels.
 * @param heroHeight - the hero element's rendered height, in CSS pixels.
 * @param viewportHeight - the viewport's height, in CSS pixels.
 */
export function scrollProgress(
  heroTop: number,
  heroHeight: number,
  viewportHeight: number,
): number {
  if (viewportHeight <= 0) return 0;
  const scrolledPast = -heroTop;
  const cappedHeight =
    heroHeight > 0 ? Math.min(heroHeight, viewportHeight) : viewportHeight;
  const threshold = cappedHeight * SCROLL_COMPLETE_FRACTION;
  if (threshold <= 0) return 0;
  return clamp01(scrolledPast / threshold);
}

/**
 * Final progress is whichever signal is further along: the intro guarantees
 * some initial motion on load, scroll can carry it the rest of the way (or
 * all the way, if the visitor scrolls before the intro finishes).
 */
export function combineProgress(intro: number, scroll: number): number {
  return clamp01(Math.max(clamp01(intro), clamp01(scroll)));
}
