/**
 * Pure per-frame math for the convergence controller: pointer smoothing and
 * settle detection, the field alpha per layout, and the client-to-field
 * pointer conversion. No DOM, no rAF — `controller-scheduler.ts` and
 * `controller-listeners.ts` feed these plain numbers, so the decisions that
 * drive the render-on-demand loop are unit-testable in isolation.
 */

export interface PointerState {
  x: number;
  y: number;
  strength: number;
}

export interface BoxRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const POINTER_SMOOTHING = 0.12;
/** Below this, a progress/pointer delta is visually imperceptible — the
 * render-on-demand loop treats the field as "settled" once every
 * exponential-smoothing target has converged past these, rather than
 * requiring an exact match it would asymptotically never reach. */
export const PROGRESS_EPSILON = 0.0005;
export const POINTER_EPSILON = 0.001;
// Raised from the first pass so the field reads clearly on dark instead of
// like dust. Text contrast is now protected by keeping hubs out of every
// small-text/interactive hero rect (field.ts's exclusions) and dimming
// particles and edge lines near them (see uProtect/uProtectCount in
// shaders.ts) rather than a column-wide mask that hid the whole headline.
export const WIDE_ALPHA = 0.8;
export const NARROW_ALPHA = 0.5;

export function currentAlpha(isNarrow: boolean): number {
  return isNarrow ? NARROW_ALPHA : WIDE_ALPHA;
}

/** Moves `smooth` one exponential-smoothing step toward `target`, in place
 * (the render loop stays allocation-free). */
export function smoothPointer(
  target: Readonly<PointerState>,
  smooth: PointerState,
): void {
  smooth.x += (target.x - smooth.x) * POINTER_SMOOTHING;
  smooth.y += (target.y - smooth.y) * POINTER_SMOOTHING;
  smooth.strength += (target.strength - smooth.strength) * POINTER_SMOOTHING;
}

/** Whether the pointer's smoothed position/strength has converged close
 * enough to its target that continuing to animate it would be
 * imperceptible — exponential smoothing only asymptotically reaches its
 * target, so without this the loop would never consider the pointer
 * "done" and would keep scheduling frames forever after a single move. */
export function pointerSettled(
  target: Readonly<PointerState>,
  smooth: Readonly<PointerState>,
): boolean {
  return (
    Math.abs(target.x - smooth.x) < POINTER_EPSILON &&
    Math.abs(target.y - smooth.y) < POINTER_EPSILON &&
    Math.abs(target.strength - smooth.strength) < POINTER_EPSILON
  );
}

/** "Still animating" if the visible progress moved since the last frame
 * (the intro easing, an in-progress scroll, or a settling pointer can all
 * move it) or the pointer hasn't caught up to its target yet. Once both are
 * false the field is visually static, and scheduling another frame would
 * just redraw the same pixels — see the scheduler's `requestFrame`/`loop`. */
export function shouldKeepAnimating(
  progress: number,
  lastProgress: number,
  settled: boolean,
): boolean {
  const stillChanging = Math.abs(progress - lastProgress) > PROGRESS_EPSILON;
  return stillChanging || !settled;
}

/** Converts a client-space pointer position into field-logical space. */
export function toLogicalPointer(
  box: BoxRect,
  clientX: number,
  clientY: number,
  aspectScale: readonly [number, number],
): { x: number; y: number } {
  if (box.width <= 0 || box.height <= 0) return { x: 0, y: 0 };
  const ndcX = ((clientX - box.left) / box.width) * 2 - 1;
  const ndcY = -(((clientY - box.top) / box.height) * 2 - 1);
  // Inverse of the vertex shader's `pos * uAspect`, so the repulsion
  // radius lines up with where the particles actually render instead of
  // being stretched/squashed relative to the cursor on a wide canvas.
  return { x: ndcX / aspectScale[0], y: ndcY / aspectScale[1] };
}
