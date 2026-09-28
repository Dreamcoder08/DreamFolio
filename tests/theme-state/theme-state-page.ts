import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base-page";
import { backgroundChain, resolveBackground, toCss } from "../support/contrast";
import { pinTheme, twoFrames } from "./support/page-levers";
import {
  STATE,
  VIEWPORT_SIZE,
  type InteractionState,
  type StateRead,
  type Theme,
  type Viewport,
} from "./support/state-model";
import { readComputedState } from "./support/state-snapshot";

const MAX_TAB_PRESSES = 80;
const POINTER_REST = { x: 2, y: 2 };

/**
 * The per-state reader for the theme-state spec.
 *
 * Every read is taken under the harness's determinism levers: the theme pinned in
 * `localStorage` before the first paint, reduced motion emulated before
 * navigation, and focus reached with the keyboard rather than a click. See
 * `theme-state.spec.ts` for why each lever is mandatory.
 *
 * This class owns how a state is *reached*; the vocabulary lives in
 * `support/state-model.ts` and the computed read in `support/state-snapshot.ts`.
 */
export class ThemeStatePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigation with the reduced-motion lever already in place: the guard must be
   * effective *before* the first style is computed, so a state read never races a
   * 180-300ms transition.
   */
  async goto(path: string): Promise<void> {
    await this.page.emulateMedia({ reducedMotion: "reduce" });
    await super.goto(path);
  }

  /** See `pinTheme` in `support/page-levers.ts`. */
  async pinTheme(theme: Theme): Promise<void> {
    await pinTheme(this.page, theme);
  }

  async setViewport(viewport: Viewport): Promise<void> {
    await this.page.setViewportSize(VIEWPORT_SIZE[viewport]);
  }

  /** Opens the mobile navigation, which is the only way `.mobile-nav a` is reachable. */
  async openMobileMenu(): Promise<void> {
    await this.page.getByRole("button", { name: /menú/i }).click();
    await this.page.locator(".mobile-nav a").first().waitFor({
      state: "visible",
    });
  }

  async forcedColorsActive(): Promise<boolean> {
    return this.page.evaluate(
      () => window.matchMedia("(forced-colors: active)").matches,
    );
  }

  /** The computed value of a custom property, as declared for the current theme. */
  async tokenValue(name: string): Promise<string> {
    return this.page.evaluate(
      (property) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(property)
          .trim(),
      name,
    );
  }

  /** The effective opaque background behind the first match of `selector`. */
  async resolveBackground(selector: string): Promise<string> {
    const layers = await this.locate(selector).evaluate(backgroundChain);
    return toCss(resolveBackground(layers));
  }

  async readState(
    selector: string,
    state: InteractionState,
  ): Promise<StateRead> {
    const locator = this.locate(selector);
    await this.restPointer();
    await this.settle(locator);

    if (state === STATE.HOVER) {
      await locator.hover();
    } else if (state === STATE.ACTIVE) {
      await locator.hover();
      await this.page.mouse.down();
    } else if (state === STATE.FOCUS) {
      await this.focusByKeyboard(selector);
    }

    const read = await readComputedState(locator, selector, state);
    if (state === STATE.ACTIVE) await this.releaseWithoutActivating(locator);
    return read;
  }

  /**
   * Keyboard focus, never a click: `:focus-visible` only matches for keyboard
   * focus, and a click would leave the ring unreadable.
   */
  async focusByKeyboard(selector: string): Promise<void> {
    const locator = this.locate(selector);
    await this.settle(locator);
    await this.page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur(),
    );
    if (await this.isFocused(locator)) return;

    for (let press = 0; press < MAX_TAB_PRESSES; press += 1) {
      await this.page.keyboard.press("Tab");
      if (await this.isFocused(locator)) return;
    }
    throw new Error(
      `keyboard focus never reached ${selector} in ${MAX_TAB_PRESSES} Tab presses`,
    );
  }

  private locate(selector: string): Locator {
    return this.page.locator(selector).first();
  }

  private async isFocused(locator: Locator): Promise<boolean> {
    return locator.evaluate((el) => el === document.activeElement);
  }

  /**
   * Scrolls the element in and waits two frames. Without the scroll a
   * `[data-reveal]` descendant is still at `opacity: 0` and the read measures a
   * surface the reader never sees.
   */
  private async settle(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await twoFrames(this.page);
  }

  /** Parks the pointer off every interactive element, so `:hover` cannot leak between reads. */
  private async restPointer(): Promise<void> {
    await this.page.mouse.move(POINTER_REST.x, POINTER_REST.y);
  }

  /**
   * Releases a held button *away* from the element, so the `mouseup` cannot fire a
   * click: no assertion may toggle the theme or navigate a link.
   */
  private async releaseWithoutActivating(locator: Locator): Promise<void> {
    await this.restPointer();
    await this.page.mouse.up();
    await locator.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur(),
    );
  }
}
