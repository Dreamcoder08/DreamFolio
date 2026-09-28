import { expect, type Page } from "@playwright/test";
import type { Target } from "./interactive-set";
import { pinTheme, twoFrames } from "./page-levers";
import { THEME, VIEWPORT_SIZE, type Theme } from "./state-model";
import { readState, type MotionRead } from "./motion-read";

/**
 * Navigation and pointer control for the motion harness — deliberately *without*
 * the reduced-motion lever that `ThemeStatePage.goto` applies (see
 * `motion.spec.ts`). The lever is asserted off in `open` instead.
 */

/** Thematic pin: the change under test is the dark-theme hardening. */
export const DARK: Theme = THEME.DARK;

/**
 * Longer than the longest declared transition in the set (640ms), so a read is
 * the settled state and not an in-flight frame. An unsettled read would report a
 * spurious difference and fail the coverage rule for the wrong reason.
 */
async function settleTransition(page: Page): Promise<void> {
  await page.waitForTimeout(800);
  await twoFrames(page);
}

/** Parks the pointer off every interactive element, so `:hover` cannot leak between reads. */
export async function parkPointer(page: Page): Promise<void> {
  await page.mouse.move(2, 2);
  await twoFrames(page);
}

/**
 * Moves the pointer onto the first match of `selector`, after scrolling it to the
 * middle of the viewport, and returns whether the element really is hovered.
 * Playwright's own `hover()` can land the pointer on another element when a fixed
 * header or a reveal is in the way, and a hover read that silently measured the
 * rest state would make this whole file vacuous, so the state is asserted.
 */
async function pointAt(page: Page, selector: string): Promise<boolean> {
  const box = await page
    .locator(selector)
    .first()
    .evaluate((el) => {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });
  await page.mouse.move(box.x, box.y);
  await twoFrames(page);
  return page
    .locator(selector)
    .first()
    .evaluate((el) => el.matches(":hover"));
}

export async function readHover(
  page: Page,
  selector: string,
): Promise<MotionRead> {
  expect(
    await pointAt(page, selector),
    `${selector}: the pointer must actually be over the element — a hover read ` +
      `taken on an unfocused element silently measures the rest state`,
  ).toBe(true);
  await settleTransition(page);
  return readState(page, selector);
}

export async function readPress(
  page: Page,
  selector: string,
): Promise<MotionRead> {
  expect(
    await pointAt(page, selector),
    `${selector}: press is measured from the hovered state, so the pointer must ` +
      `reach the element first`,
  ).toBe(true);
  await settleTransition(page);
  await page.mouse.down();
  expect(
    await page
      .locator(selector)
      .first()
      .evaluate((el) => el.matches(":active")),
    `${selector}: the held button must activate the element — an :active read ` +
      `that leaked onto another element would pass without measuring anything`,
  ).toBe(true);
  await settleTransition(page);
  const read = await readState(page, selector);
  await parkPointer(page);
  await page.mouse.up();
  return read;
}

/**
 * The reveal system is opt-in: `BaseLayout.astro` adds `motion-ready` only when
 * reduced motion is off, and only then does `.motion-ready [data-reveal]` hide its
 * targets at `opacity: 0`. A `[data-reveal]` element that is still mid-entrance
 * would make every interaction read of it ambiguous, so this waits for the
 * entrance to finish — and it is also the structural assertion that this page is
 * running *without* the lever, since `motion-ready` never appears under it.
 */
async function settleReveal(page: Page, selector: string): Promise<void> {
  const locator = page.locator(selector).first();
  await locator.scrollIntoViewIfNeeded();
  if (!(await locator.evaluate((el) => el.hasAttribute("data-reveal")))) return;
  await page.waitForFunction(
    (target) =>
      document.querySelector(target)?.classList.contains("is-visible") === true,
    selector,
  );
  await page.waitForFunction((target) => {
    const el = document.querySelector(target);
    return el !== null && getComputedStyle(el).opacity === "1";
  }, selector);
}

async function open(page: Page, target: Target, theme: Theme): Promise<void> {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await pinTheme(page, theme);
  await page.setViewportSize(VIEWPORT_SIZE[target.viewport]);
  await page.goto(target.path);

  expect(
    await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    `this spec must run without the reduced-motion lever: under it ` +
      `global.css's guard sets \`transition: none !important\` and every read ` +
      `below measures 0s regardless of what the stylesheets declare`,
  ).toBe(false);

  // The reveal script returns before adding `motion-ready` when the page carries
  // no `[data-reveal]` targets at all — the project detail page has none — so this
  // waits only where the class is expected. The reduced-motion lever is asserted
  // above, which is what makes this wait meaningful where it does apply.
  const revealTargets = await page.evaluate(
    () => document.querySelectorAll("[data-reveal]").length,
  );
  if (revealTargets > 0) {
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("motion-ready"),
    );
  }
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.getAttribute("data-theme")),
    )
    .toBe(theme);

  if (target.openMenu) {
    await page.getByRole("button", { name: /menú/i }).click();
    await page.locator(".mobile-nav a").first().waitFor({ state: "visible" });
  }
}

/**
 * `open`, plus a wait for the target's entrance to finish. An interaction read
 * taken while a `[data-reveal]` element is still animating would report its
 * opacity change as if the interaction caused it.
 */
export async function prepare(
  page: Page,
  target: Target,
  theme: Theme,
): Promise<void> {
  await open(page, target, theme);
  await settleReveal(page, target.selector);
}

/**
 * `open`, but the target is deliberately left unrevealed and this waits for the
 * entrance machinery to have hidden it (`opacity: 0`) — `BaseLayout.astro` opts
 * the reveal in by adding `motion-ready`, which fades every target out, and the
 * trace has to start after that priming fade or it measures the wrong animation.
 */
export async function prepareReveal(
  page: Page,
  target: Target,
  selector: string,
): Promise<void> {
  await open(page, target, DARK);
  await page.waitForFunction((probe) => {
    const el = document.querySelector(probe);
    return el !== null && getComputedStyle(el).opacity === "0";
  }, selector);
}
