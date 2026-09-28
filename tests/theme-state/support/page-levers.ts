import type { Page } from "@playwright/test";
import { THEME_STORAGE_KEY, type Theme } from "./state-model";

/**
 * Pins the theme the way the site stores it, through an init script so the value
 * is in `localStorage` before `theme-init.js` runs. Playwright's default
 * `prefers-color-scheme` is light, so without this every "dark" read would
 * silently measure the light theme.
 *
 * Deliberately free of the reduced-motion lever, so the motion specs — which must
 * run without it — pin the theme through the same code path as the contrast specs.
 */
export async function pinTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript(
    ([key, value]: readonly [string, Theme]) =>
      localStorage.setItem(key, value),
    [THEME_STORAGE_KEY, theme] as const,
  );
}

/** Two frames: enough for a style change to be computable, not enough to settle it. */
export async function twoFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );
}
