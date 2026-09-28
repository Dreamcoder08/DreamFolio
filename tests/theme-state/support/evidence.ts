import { expect, type Page } from "@playwright/test";
import { parseColor } from "../../support/contrast";
import { HOME } from "./fixtures";
import type { Theme } from "./state-model";
import { ThemeStatePage } from "../theme-state-page";

/**
 * Shared by the border-provenance, prefers-contrast and touch-press evidence
 * specs.
 */

/** The exempted element: at rest `--color-surface` on `--color-text`, the palette ceiling. */
export const EXEMPT = ".contact-section .solid-link";

/**
 * Two identical colours serialise differently (`#26262e` as a custom property
 * value, `rgb(38, 38, 46)` from `getComputedStyle`), so every colour comparison
 * goes through the shared parser rather than string equality.
 */
export function sameColour(first: string, second: string): boolean {
  const a = parseColor(first);
  const b = parseColor(second);
  return (
    Math.abs(a.r - b.r) < 0.5 &&
    Math.abs(a.g - b.g) < 0.5 &&
    Math.abs(a.b - b.b) < 0.5 &&
    Math.abs(a.a - b.a) < 0.01
  );
}

export async function prepare(
  page: Page,
  theme: Theme,
): Promise<ThemeStatePage> {
  const ui = new ThemeStatePage(page);
  await ui.pinTheme(theme);
  await ui.goto(HOME);
  await expect
    .poll(() => ui.currentTheme(), {
      message:
        `the theme must be pinned in localStorage before the first paint: ` +
        `Playwright's default prefers-color-scheme is light, so an unpinned read ` +
        `silently measures the wrong mode`,
    })
    .toBe(theme);
  return ui;
}
