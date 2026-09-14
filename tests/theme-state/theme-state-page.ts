import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base-page";
import {
  backgroundChain,
  composite,
  formatRatio,
  parseColor,
  ratio,
  resolveBackground,
  toCss,
} from "../support/contrast";

/** The key `public/theme-init.js` reads before the first paint. */
const THEME_STORAGE_KEY = "dreamfolio-theme";

const MAX_TAB_PRESSES = 80;
const POINTER_REST = { x: 2, y: 2 };

export const THEME = { DARK: "dark", LIGHT: "light" } as const;
export type Theme = (typeof THEME)[keyof typeof THEME];

export const STATE = {
  REST: "rest",
  HOVER: "hover",
  ACTIVE: "active",
  FOCUS: "focus",
} as const;
export type InteractionState = (typeof STATE)[keyof typeof STATE];

export const VIEWPORT = { DESKTOP: "desktop", MOBILE: "mobile" } as const;
export type Viewport = (typeof VIEWPORT)[keyof typeof VIEWPORT];

export const VIEWPORT_SIZE: Record<
  Viewport,
  { width: number; height: number }
> = {
  [VIEWPORT.DESKTOP]: { width: 1280, height: 900 },
  [VIEWPORT.MOBILE]: { width: 390, height: 844 },
};

/** The four computed border colours: the border is a state signal, and its side varies. */
export interface BorderSet {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface StateRead {
  selector: string;
  state: InteractionState;
  /** The computed label colour, with its alpha if it carries one. */
  color: string;
  /** The label composited over `surface` — what the eye receives. */
  label: string;
  /** The effective opaque surface behind the element, `rgb(...)`. */
  surface: string;
  /** `label` against `surface`, WCAG 2.x. */
  ratio: number;
  borders: BorderSet;
  outlineColor: string;
  outlineStyle: string;
  outlineWidth: string;
  outlineOffset: string;
  borderRadius: string;
  textDecorationLine: string;
  transform: string;
  transitionDuration: string;
  opacity: string;
}

const COMPARED: readonly (keyof StateRead)[] = [
  "color",
  "label",
  "surface",
  "ratio",
  "borders",
  "outlineColor",
  "outlineStyle",
  "outlineWidth",
  "outlineOffset",
  "borderRadius",
  "textDecorationLine",
  "transform",
  "transitionDuration",
  "opacity",
];

/** The computed properties in which two reads of the same element differ. */
export function stateDifferences(
  before: StateRead,
  after: StateRead,
): string[] {
  return COMPARED.filter(
    (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
  );
}

export function describeRead(read: StateRead): string {
  return (
    `${read.selector} [${read.state}] ${formatRatio(read.ratio)}:1 ` +
    `(label ${read.label} on ${read.surface})`
  );
}

/**
 * The per-state reader for the theme-state spec.
 *
 * Every read is taken under the harness's determinism levers: the theme pinned in
 * `localStorage` before the first paint, reduced motion emulated before
 * navigation, and focus reached with the keyboard rather than a click. See
 * `theme-state.spec.ts` for why each lever is mandatory.
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

  /**
   * Pins the theme the way the site stores it, through an init script so the value
   * is in `localStorage` before `theme-init.js` runs. Playwright's default
   * `prefers-color-scheme` is light, so without this every "dark" read would
   * silently measure the light theme.
   */
  async pinTheme(theme: Theme): Promise<void> {
    await this.page.addInitScript(
      ([key, value]: readonly [string, Theme]) =>
        localStorage.setItem(key, value),
      [THEME_STORAGE_KEY, theme] as const,
    );
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

    const read = await this.snapshot(selector, locator, state);
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
    await this.page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              resolve();
            }),
          );
        }),
    );
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

  private async snapshot(
    selector: string,
    locator: Locator,
    state: InteractionState,
  ): Promise<StateRead> {
    const layers = await locator.evaluate(backgroundChain);
    const styles = await locator.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        color: style.color,
        opacity: style.opacity,
        borderTop: style.borderTopColor,
        borderRight: style.borderRightColor,
        borderBottom: style.borderBottomColor,
        borderLeft: style.borderLeftColor,
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        borderRadius: style.borderRadius,
        textDecorationLine: style.textDecorationLine,
        transform: style.transform,
        transitionDuration: style.transitionDuration,
      };
    });

    // An element's own `opacity` attenuates its whole box, so both its background
    // layer and its label carry that alpha; the ancestors' opacities do not, which
    // is the one part of the composited chain this harness does not model.
    const elementOpacity = Number.parseFloat(styles.opacity);
    const own = parseColor(layers[0]);
    const surface = composite(
      { ...own, a: own.a * elementOpacity },
      resolveBackground(layers.slice(1)),
    );
    const label = composite(
      {
        ...parseColor(styles.color),
        a: parseColor(styles.color).a * elementOpacity,
      },
      surface,
    );

    return {
      selector,
      state,
      color: styles.color,
      label: toCss(label),
      surface: toCss(surface),
      ratio: ratio(label, surface),
      borders: {
        top: styles.borderTop,
        right: styles.borderRight,
        bottom: styles.borderBottom,
        left: styles.borderLeft,
      },
      outlineColor: styles.outlineColor,
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
      outlineOffset: styles.outlineOffset,
      borderRadius: styles.borderRadius,
      textDecorationLine: styles.textDecorationLine,
      transform: styles.transform,
      transitionDuration: styles.transitionDuration,
      opacity: styles.opacity,
    };
  }
}
