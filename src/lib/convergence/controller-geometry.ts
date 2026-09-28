import type { Rect } from "./field.ts";
import { domRectToFieldAnchor } from "./theme-geometry.ts";

export interface GeometryElements {
  portrait: HTMLElement | null;
  headline: HTMLElement | null;
  protected: readonly (HTMLElement | null)[];
}

export function measureFieldRect(
  element: HTMLElement | null,
  canvas: HTMLCanvasElement,
  aspectScale: readonly [number, number],
): Rect | undefined {
  if (!element) return undefined;
  const canvasBox = canvas.getBoundingClientRect();
  if (canvasBox.width <= 0 || canvasBox.height <= 0) return undefined;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return undefined;
  return domRectToFieldAnchor(rect, canvasBox, aspectScale);
}

export function computeExclusions(
  elements: GeometryElements,
  isNarrow: boolean,
  canvas: HTMLCanvasElement,
  aspectScale: readonly [number, number],
): Rect[] {
  const candidates = isNarrow
    ? [elements.headline, ...elements.protected]
    : [elements.portrait, elements.headline, ...elements.protected];
  const rects: Rect[] = [];
  for (const element of candidates) {
    const rect = measureFieldRect(element, canvas, aspectScale);
    if (rect) rects.push(rect);
  }
  return rects;
}

/** Reuses the caller's uniform storage; the returned count selects its valid prefix. */
export function updateProtectUniform(
  elements: readonly (HTMLElement | null)[],
  canvas: HTMLCanvasElement,
  aspectScale: readonly [number, number],
  uniform: Float32Array,
  capacity: number,
): number {
  let count = 0;
  for (const element of elements) {
    if (count >= capacity) break;
    const rect = measureFieldRect(element, canvas, aspectScale);
    if (!rect) continue;
    uniform[count * 4] = rect.x;
    uniform[count * 4 + 1] = rect.y;
    uniform[count * 4 + 2] = rect.w / 2;
    uniform[count * 4 + 3] = rect.h / 2;
    count += 1;
  }
  return count;
}
