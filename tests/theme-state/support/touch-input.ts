import { expect, type Page } from "@playwright/test";

/**
 * Input instrumentation for the touch-press spec: which DOM events a press really
 * delivered, and where to aim it.
 */

/** The DOM events a touch press must produce, and the pointer type it must carry. */
export const WATCHED_EVENTS = [
  "touchstart",
  "touchend",
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "click",
] as const;

export const POINTER_DOWN_TOUCH = "pointerdown(touch)";

export async function watchInputEvents(
  page: Page,
  selector: string,
): Promise<void> {
  await page.evaluate(
    ({ sel, types }) => {
      const log: string[] = [];
      (window as unknown as { __inputLog: string[] }).__inputLog = log;
      const target = document.querySelector(sel);
      if (target === null) return;
      for (const type of types) {
        target.addEventListener(type, (event) => {
          const pointerType = (event as PointerEvent).pointerType;
          log.push(pointerType ? `${type}(${pointerType})` : type);
        });
      }
    },
    { sel: selector, types: [...WATCHED_EVENTS] },
  );
}

export async function inputLog(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      (window as unknown as { __inputLog?: string[] }).__inputLog?.join(
        " → ",
      ) ?? "",
  );
}

/** Aims at the element's centre, which the caller must already have scrolled into view. */
export async function centreOf(
  page: Page,
  selector: string,
): Promise<{ x: number; y: number }> {
  const box = await page.locator(selector).first().boundingBox();
  expect(
    box,
    `${selector}: the element must be laid out and scrolled into view before an ` +
      `input point can be aimed at it`,
  ).not.toBeNull();
  return {
    x: Math.round(box!.x + box!.width / 2),
    y: Math.round(box!.y + box!.height / 2),
  };
}
