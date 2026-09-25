/**
 * Pure theme-color parsing and DOM-rect-to-field-space geometry for the hero
 * convergence effect, plus the particle-count budget decision.
 *
 * Split out of `controller.ts` (T0 of the sci-fi scroll narrative phase):
 * that module is the DOM/rAF driver and rightly owns every direct
 * `window`/`document` read, but these four computations are pure functions
 * of plain inputs and were only coupled to the DOM by convenience (reading
 * `navigator`/`getComputedStyle` inline instead of receiving the value as an
 * argument). Pulling them out here makes them independently unit-testable
 * with `node --test` and no DOM/jsdom — `controller.ts` keeps the one-line
 * DOM reads and passes the results in.
 */

import type { Rect } from "./field.ts";

/** Fallback so a missing/unparseable `--color-accent` still renders instead
 * of throwing — matches the OLED-orange accent token in `global.css`. */
const DEFAULT_ACCENT: readonly [number, number, number] = [1, 0.478, 0.094];
/** Fallback for `--color-text-secondary`. */
const DEFAULT_NEUTRAL: readonly [number, number, number] = [
  0.718, 0.722, 0.702,
];

const NARROW_PARTICLE_COUNT = 1100;
const WIDE_PARTICLE_COUNT = 2600;
const LOW_POWER_FACTOR = 0.6;

/** Parses a `#rgb`/`#rrggbb` custom-property value into normalized [0,1] RGB. */
export function parseHexColor(
  value: string,
  fallback: readonly [number, number, number],
): readonly [number, number, number] {
  const hex = value.trim().replace(/^#/, "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].every((n) => !Number.isNaN(n)))
      return [r / 255, g / 255, b / 255];
  } else if (hex.length >= 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].every((n) => !Number.isNaN(n)))
      return [r / 255, g / 255, b / 255];
  }
  return fallback;
}

export interface ThemeColors {
  accent: readonly [number, number, number];
  neutral: readonly [number, number, number];
}

/**
 * Pure half of `readThemeColors` below: takes the already-read custom
 * property values and theme flag, and applies the same light/dark blend
 * rule. Kept separate so the blend logic (the part actually worth testing)
 * needs no `getComputedStyle`/`document` stand-in.
 */
export function resolveThemeColors(
  accentValue: string,
  textSecondaryValue: string,
  isLight: boolean,
): ThemeColors {
  const accent = parseHexColor(accentValue, DEFAULT_ACCENT);
  // Light theme's --color-text-secondary and --color-accent are both muted
  // browns close in hue on a cream surface — mixing them read as dust/dirt
  // rather than a system. Render every "neutral" particle as a dimmed
  // accent instead, so the field stays legibly warm/amber in both themes.
  const neutral = isLight
    ? ([accent[0] * 0.5, accent[1] * 0.5, accent[2] * 0.5] as const)
    : parseHexColor(textSecondaryValue, DEFAULT_NEUTRAL);
  return { accent, neutral };
}

/** Thin DOM edge: reads the two custom properties and the theme attribute,
 * then delegates the actual blend decision to `resolveThemeColors`. */
export function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const isLight = document.documentElement.dataset.theme === "light";
  return resolveThemeColors(
    styles.getPropertyValue("--color-accent"),
    styles.getPropertyValue("--color-text-secondary"),
    isLight,
  );
}

/** Particle budget for the field: fewer on narrow layouts, cut to 60% on
 * low-core-count hardware. `hardwareConcurrency` is passed in rather than
 * read from `navigator` here so the decision stays a pure function of its
 * inputs — `controller.ts` reads `navigator.hardwareConcurrency` at the one
 * call site that has a `navigator` to read. */
export function pickParticleCount(
  isNarrow: boolean,
  hardwareConcurrency: number | undefined,
): number {
  const base = isNarrow ? NARROW_PARTICLE_COUNT : WIDE_PARTICLE_COUNT;
  const lowPower =
    typeof hardwareConcurrency === "number" &&
    hardwareConcurrency > 0 &&
    hardwareConcurrency <= 4;
  return Math.round(lowPower ? base * LOW_POWER_FACTOR : base);
}

/** The subset of `DOMRect` this module actually reads — real `DOMRect`
 * values satisfy it structurally, and a unit test can pass a plain object
 * without a DOM. */
export interface BoxLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Converts a DOM rect (in viewport CSS pixels) into the field's own
 * logical (pre-aspect-scale) coordinate space — the inverse of the
 * `pos * uAspect` the vertex shader applies. `canvasBox` and `scale` must
 * come from the same moment, since both change on resize. */
export function domRectToFieldAnchor(
  rect: BoxLike,
  canvasBox: BoxLike,
  scale: readonly [number, number],
): Rect {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const ndcX = ((cx - canvasBox.left) / canvasBox.width) * 2 - 1;
  const ndcY = -(((cy - canvasBox.top) / canvasBox.height) * 2 - 1);
  const w = (rect.width / canvasBox.width) * 2;
  const h = (rect.height / canvasBox.height) * 2;
  return {
    x: ndcX / scale[0],
    y: ndcY / scale[1],
    w: w / scale[0],
    h: h / scale[1],
  };
}
