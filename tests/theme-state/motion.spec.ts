/**
 * Motion contract for the dark-theme-hardening change — the one harness that must
 * NOT emulate reduced motion.
 *
 * Why this file exists. `theme-state.spec.ts` emulates `prefers-reduced-motion:
 * reduce` before navigation, deliberately, so no contrast read races a transition.
 * `global.css`'s relocated guard then sets `transition: none !important` on every
 * element, which is precisely what makes that harness deterministic — and
 * precisely what makes it structurally blind to animation. Under the lever every
 * element's computed `transition-duration` is `0s` and its `transition-property`
 * is `none`, so a transition declaration that never reaches its element, or a
 * state rule whose changed property is missing from the list, is invisible to it.
 * Three defects shipped inside that blind spot: `.module-row`'s interaction
 * transition was outranked by the reveal rule and never applied, the underline
 * signals of `.desktop-nav a`, `.nav-contact` and `.quiet-link` were in no
 * transition list at all, and the scrollbar hover could not be measured.
 *
 * Do not "simplify" this file back under the lever — no `reducedMotion: "reduce"`
 * here, and nothing may route it through `ThemeStatePage.goto`, which applies the
 * lever. It asserts the other end of the same axis, and the reduced-motion end is
 * pinned further down this same file, so one contract keeps both ends covered.
 * The lever is asserted live before every read instead.
 *
 * What it asserts, as a rule rather than as three cases: for every element in the
 * design's interactive set, every property that actually changes between two
 * interaction states is present in that element's `transition-property` list and
 * carries a non-zero duration, and the element's durations are non-zero at all.
 * That single rule is what all three defects violated. Values are read from
 * `getComputedStyle` after the transition has settled; no screenshot baseline and
 * no new dependency.
 *
 * Honest limits. (a) A declaration reaching the element is not the same as a
 * pleasing interpolation: `text-decoration-line` is discrete, so it is listed but
 * cannot interpolate, and a hover that moves `text-underline-offset` from `auto`
 * to a length stays discrete because `auto` is not an interpolable length — both
 * verified by sampling, not assumed. What does interpolate, and now does, is the
 * `:active` step between two lengths (4px -> 6px, over `--motion-fast`).
 * (b) `outline-*` is excluded from the probed set on purpose: the focus ring is
 * the sibling spec's contract, and the forced-colors outlines are not emulated
 * here. (c) Only the dark theme is exercised. The declarations read here are
 * theme-independent, but that is an argument, not a measurement.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  THEME,
  VIEWPORT,
  VIEWPORT_SIZE,
  type Theme,
  type Viewport,
} from "./theme-state-page";

const HOME = "/";
const PROJECT_DETAIL = "/projects/digital-public-peru/";
/** The key `public/theme-init.js` reads before the first paint. */
const THEME_STORAGE_KEY = "dreamfolio-theme";
/** Thematic pin: the change under test is the dark-theme hardening. */
const DARK: Theme = THEME.DARK;

/**
 * The properties a state can signal through, and the computed name each is read
 * back as. `border-radius` is included because a state-driven radius mutation is
 * the same defect class; `outline-*` is excluded (see the header).
 */
const PROBES: readonly { readonly css: string; readonly computed: string }[] = [
  { css: "color", computed: "color" },
  { css: "background-color", computed: "backgroundColor" },
  { css: "border-top-color", computed: "borderTopColor" },
  { css: "border-right-color", computed: "borderRightColor" },
  { css: "border-bottom-color", computed: "borderBottomColor" },
  { css: "border-left-color", computed: "borderLeftColor" },
  { css: "transform", computed: "transform" },
  { css: "opacity", computed: "opacity" },
  { css: "text-decoration-line", computed: "textDecorationLine" },
  { css: "text-underline-offset", computed: "textUnderlineOffset" },
  { css: "border-radius", computed: "borderRadius" },
];

interface MotionRead {
  readonly values: Readonly<Record<string, string>>;
  /** The computed `transition-property` list, trimmed and split. */
  readonly properties: readonly string[];
  /** The computed `transition-duration` list, aligned with `properties`, in ms. */
  readonly durationsMs: readonly number[];
  /**
   * The computed `transition-delay` list, aligned with `properties`, in ms.
   *
   * Read because a duration alone cannot see a stagger: a row whose fade is
   * delayed by 80ms and one that is not both report the same duration list. The
   * stagger is the one motion behaviour this harness could not observe, and that
   * blindness is why it regressed unnoticed.
   */
  readonly delaysMs: readonly number[];
}

interface MotionTarget {
  readonly id: string;
  readonly selector: string;
  readonly path: string;
  readonly viewport: Viewport;
  /** Whether the design gives this element an `:active` rule. */
  readonly press: boolean;
  readonly openMenu: boolean;
}

/**
 * The design's interactive set, mirrored from `theme-state.spec.ts` so the two
 * harnesses read the same elements: the contrast contract and the motion contract
 * then cannot drift apart without one of them failing.
 */
const TARGETS: readonly MotionTarget[] = [
  {
    id: "01",
    selector: ".desktop-nav a",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "02",
    selector: ".desktop-nav .nav-contact",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "03",
    selector: ".theme-toggle",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "04",
    selector: ".circle-link",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "05",
    selector: ".module-row",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "06",
    selector: ".site-footer > a",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "07",
    selector: ".contact-social a",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "08",
    selector: ".solid-link",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "09",
    selector: ".quiet-link",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "10",
    selector: ".project-links a",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "11",
    selector: ".contact-section .solid-link",
    path: HOME,
    viewport: VIEWPORT.DESKTOP,
    press: true,
    openMenu: false,
  },
  {
    id: "12",
    selector: ".card",
    path: PROJECT_DETAIL,
    viewport: VIEWPORT.DESKTOP,
    press: false,
    openMenu: false,
  },
  {
    id: "13",
    selector: ".menu-toggle",
    path: HOME,
    viewport: VIEWPORT.MOBILE,
    press: true,
    openMenu: false,
  },
  {
    id: "14",
    selector: ".mobile-nav a",
    path: HOME,
    viewport: VIEWPORT.MOBILE,
    press: true,
    openMenu: true,
  },
];

/** Two frames: enough for a style change to be computable, not enough to settle it. */
async function twoFrames(page: Page): Promise<void> {
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
async function parkPointer(page: Page): Promise<void> {
  await page.mouse.move(2, 2);
  await twoFrames(page);
}

async function readState(page: Page, selector: string): Promise<MotionRead> {
  return page
    .locator(selector)
    .first()
    .evaluate((el, probes) => {
      const style = getComputedStyle(el) as unknown as Record<string, string>;
      const parseTime = (value: string): number => {
        const parsed = Number.parseFloat(value);
        if (Number.isNaN(parsed)) return 0;
        return value.trim().endsWith("ms") ? parsed : parsed * 1000;
      };
      const values: Record<string, string> = {};
      for (const probe of probes) values[probe.css] = style[probe.computed];
      return {
        values,
        properties: style.transitionProperty
          .split(",")
          .map((part) => part.trim()),
        durationsMs: style.transitionDuration
          .split(",")
          .map((part) => parseTime(part)),
        delaysMs: style.transitionDelay
          .split(",")
          .map((part) => parseTime(part)),
      };
    }, PROBES);
}

/** The probed properties whose computed value differs between two reads. */
function changedProperties(
  before: MotionRead,
  after: MotionRead,
): readonly string[] {
  return PROBES.map((probe) => probe.css).filter(
    (css) => before.values[css] !== after.values[css],
  );
}

/**
 * `transition-property` may name a shorthand, and the computed list keeps the
 * shorthand's spelling: the design's declaration says `border-color`, so the four
 * `border-*-color` longhands are transitioned without appearing in the list by
 * name. Coverage has to expand them, or a correct declaration reads as a gap.
 * `border-color` is the only shorthand the interactive set declares; `all` is
 * handled separately because it is the initial value rather than a declaration.
 */
const SHORTHAND_LONGHANDS: Readonly<Record<string, readonly string[]>> = {
  "border-color": [
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
  ],
};

/**
 * Splits the changed properties into the two ways a transition can fail to
 * animate them: it is not in the list at all, or it is listed with `0s` — the
 * `transition: none !important` guard produces the second shape under reduce
 * motion, and a stray `transition: color 0s` would produce it here.
 */
function coverageGaps(
  read: MotionRead,
  changed: readonly string[],
): {
  readonly missing: readonly string[];
  readonly instant: readonly string[];
} {
  /** The duration that covers `property`, or null when no entry covers it. */
  const durationFor = (property: string): number | null => {
    for (let index = 0; index < read.properties.length; index += 1) {
      const entry = read.properties[index];
      const duration =
        read.durationsMs[index] ??
        read.durationsMs[read.durationsMs.length - 1] ??
        0;
      if (
        entry === property ||
        entry === "all" ||
        (SHORTHAND_LONGHANDS[entry] ?? []).includes(property)
      ) {
        return duration;
      }
    }
    return null;
  };

  const missing: string[] = [];
  const instant: string[] = [];
  for (const property of changed) {
    const duration = durationFor(property);
    if (duration === null) missing.push(property);
    else if (duration === 0) instant.push(property);
  }
  return { missing, instant };
}

function describeRead(read: MotionRead): string {
  return (
    `transition-property=[${read.properties.join(", ")}] ` +
    `durations=[${read.durationsMs.join(", ")}]ms ` +
    `delays=[${read.delaysMs.join(", ")}]ms`
  );
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

async function readHover(page: Page, selector: string): Promise<MotionRead> {
  expect(
    await pointAt(page, selector),
    `${selector}: the pointer must actually be over the element — a hover read ` +
      `taken on an unfocused element silently measures the rest state`,
  ).toBe(true);
  await settleTransition(page);
  return readState(page, selector);
}

async function readPress(page: Page, selector: string): Promise<MotionRead> {
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

async function open(
  page: Page,
  target: MotionTarget,
  theme: Theme,
): Promise<void> {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(
    ([key, value]: readonly [string, Theme]) =>
      localStorage.setItem(key, value),
    [THEME_STORAGE_KEY, theme] as const,
  );
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
async function prepare(
  page: Page,
  target: MotionTarget,
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
async function prepareReveal(
  page: Page,
  target: MotionTarget,
  selector: string,
): Promise<void> {
  await open(page, target, DARK);
  await page.waitForFunction((probe) => {
    const el = document.querySelector(probe);
    return el !== null && getComputedStyle(el).opacity === "0";
  }, selector);
}

/**
 * Samples `opacity` and the translate component of `transform` across a reveal,
 * in one page round trip so no frame of the animation can be missed: the scroll
 * that triggers the `IntersectionObserver` happens inside the same loop.
 */
async function traceReveal(
  page: Page,
  selector: string,
): Promise<{
  readonly opacity: readonly number[];
  readonly translateY: readonly number[];
}> {
  return page.evaluate(
    (target) =>
      new Promise<{ opacity: number[]; translateY: number[] }>((resolve) => {
        const el = document.querySelector(target);
        if (el === null) {
          resolve({ opacity: [], translateY: [] });
          return;
        }
        const opacity: number[] = [];
        const translateY: number[] = [];
        const started = performance.now();
        const sample = (): void => {
          const style = getComputedStyle(el);
          opacity.push(Number.parseFloat(style.opacity));
          const matrix = style.transform.split(",");
          translateY.push(Number.parseFloat(matrix[matrix.length - 1]));
        };
        sample();
        // `smooth`, not `instant`: T2's `.scene-card` elements (see below)
        // are revealed by a scroll-driven `animation-timeline: view()`
        // animation whose progress ties directly to scroll position, with
        // no time-based interpolation of its own — an instant scroll jump
        // therefore produces an instant progress jump (measured: opacity
        // goes straight from 0 to 1 in a single sampled frame), which looks
        // exactly like a cut even though the mechanism is working correctly.
        // A smooth scroll actually takes visible time to complete, so the
        // timeline's progress — and this trace — moves through it gradually,
        // which is the only way to observe "not a cut" for this mechanism.
        // A plain CSS-transition-driven reveal (any `[data-reveal]` element
        // outside T2's scope) is unaffected by this: its own
        // `--motion-reveal` transition supplies the gradualness regardless
        // of how the triggering scroll got there.
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const step = (): void => {
          sample();
          if (performance.now() - started < 1_100) requestAnimationFrame(step);
          else resolve({ opacity, translateY });
        };
        requestAnimationFrame(step);
      }),
    selector,
  );
}

for (const target of TARGETS) {
  test.describe(`Motion coverage — interactive set (${DARK})`, () => {
    test(
      `${target.selector} animates every property its hover and press change`,
      {
        tag: ["@critical", "@e2e", "@motion", `@MOTION-COVERAGE-${target.id}`],
      },
      async ({ page }) => {
        await prepare(page, target, DARK);

        const rest = await readState(page, target.selector);
        expect(
          rest.durationsMs.some((duration) => duration > 0),
          `${target.selector}: the interactive set must not lose its transitions ` +
            `altogether — ${describeRead(rest)}. A declaration that is outranked ` +
            `by a more specific rule shows up exactly like this`,
        ).toBe(true);

        await parkPointer(page);
        const hover = await readHover(page, target.selector);
        const hoverChanged = changedProperties(rest, hover);
        const hoverGaps = coverageGaps(hover, hoverChanged);
        expect(
          hoverGaps.missing,
          `${target.selector}: rest -> hover changes a property that is in no ` +
            `transition list, so it snaps in one frame — ` +
            `changed=[${hoverChanged.join(", ")}], ${describeRead(hover)}`,
        ).toEqual([]);
        expect(
          hoverGaps.instant,
          `${target.selector}: rest -> hover changes a property that is listed ` +
            `with a 0s duration, so it snaps in one frame — ` +
            `changed=[${hoverChanged.join(", ")}], ${describeRead(hover)}`,
        ).toEqual([]);

        if (!target.press) return;

        const press = await readPress(page, target.selector);
        const pressChanged = changedProperties(rest, press);
        expect(
          pressChanged.length,
          `${target.selector}: the pressed state must be a real computed change ` +
            `from rest — rest  ${describeRead(rest)}, press ${describeRead(press)}`,
        ).toBeGreaterThan(0);
        const pressGaps = coverageGaps(press, pressChanged);
        expect(
          pressGaps.missing,
          `${target.selector}: rest -> press changes a property that is in no ` +
            `transition list, so it snaps in one frame — ` +
            `changed=[${pressChanged.join(", ")}], ${describeRead(press)}`,
        ).toEqual([]);
        expect(
          pressGaps.instant,
          `${target.selector}: rest -> press changes a property that is listed ` +
            `with a 0s duration — changed=[${pressChanged.join(", ")}], ` +
            `${describeRead(press)}`,
        ).toEqual([]);
      },
    );
  });
}

test.describe("Motion coverage — .module-row", () => {
  test(
    "its winning declaration keeps the interaction properties once the scroll-driven narrative owns the reveal",
    {
      tag: ["@critical", "@e2e", "@motion", "@MOTION-MODULE-ROW-MERGE"],
    },
    async ({ page }) => {
      const ui = TARGETS.find((target) => target.selector === ".module-row");
      if (ui === undefined) throw new Error(".module-row is not in TARGETS");
      await prepare(page, ui, DARK);

      // Through phase 1, this rule's four-property merge (background-color,
      // color, transform, opacity) was the fix for `.module-row`'s own
      // specificity conflict with the plain IO reveal (see the "Motion"
      // section's comment in portfolio.css). Phase 2 (T2) changes what
      // "the reveal" means for `.module-row` in a browser that supports
      // `animation-timeline: view()` (this one does, per `CSS.supports`
      // checks elsewhere in this repo's e2e suite): `opacity`/`transform`
      // are now the scroll-driven narrative's job (see portfolio.css's
      // "Scroll-driven section narrative" section's `.module-row.scene-card`
      // override), so the winning declaration only needs to keep carrying
      // what it still owns — the hover/press interaction colours.
      const rest = await readState(page, ".module-row");
      expect(
        rest.properties,
        "`.module-row` carries `data-reveal`, so `.motion-ready [data-reveal]` " +
          "(0,2,0) still outranks a declaration on `.module-row` (0,1,0) alone; " +
          "the T2 override that wins here must therefore keep naming the state " +
          "it needs to win in for the two properties it still owns",
      ).toEqual(["background-color", "color"]);
      expect(
        rest.durationsMs,
        "both interaction properties keep --motion-fast (180ms); neither " +
          "opacity nor transform belongs to this declaration any more",
      ).toEqual([180, 180]);
      expect(
        rest.values["opacity"],
        "the row is read once its (now scroll-driven) entrance has settled",
      ).toBe("1");

      const hover = await readHover(page, ".module-row");
      expect(
        hover.values["background-color"],
        "the hovered row must move off its transparent rest background — the " +
          "two properties the merged list adds are the two the state changes",
      ).not.toBe(rest.values["background-color"]);
      expect(
        hover.values["color"],
        "and its label must be promoted off --color-text-secondary",
      ).not.toBe(rest.values["color"]);
    },
  );

  test(
    "the transition-delay stagger is retired for the two interaction properties this rule still owns",
    { tag: ["@critical", "@e2e", "@motion", "@MOTION-MODULE-ROW-STAGGER"] },
    async ({ page }) => {
      const ui = TARGETS.find((target) => target.selector === ".module-row");
      if (ui === undefined) throw new Error(".module-row is not in TARGETS");
      await prepare(page, ui, DARK);

      // Through phase 1, `--motion-stagger` delayed only the reveal's own
      // `opacity` slot, never the two interaction properties (a delayed
      // press was exactly the defect that design fixed). T2 moves
      // `.module-row`'s entrance stagger to the scroll-driven narrative's
      // own mechanism — an `animation-range` offset per `:nth-child`, in
      // portfolio.css's "Scroll-driven section narrative" section — which
      // has no `transition-delay` at all, so there is no longer an
      // `opacity` slot here to carry a stagger. What must still hold is the
      // narrower half of the original guarantee: neither interaction
      // property is ever delayed, regardless of row position.
      for (const child of [1, 2, 3] as const) {
        const read = await readState(
          page,
          `.module-list .module-row:nth-child(${child})`,
        );
        const delays = read.properties.map((property, index) => ({
          property,
          delayMs: read.delaysMs[index] ?? Number.NaN,
        }));
        expect(
          delays,
          `.module-list .module-row:nth-child(${child}) [${describeRead(read)}]: ` +
            "neither interaction property may ever be delayed — a non-zero " +
            "delay here means a hover or a press is being staggered, which is " +
            "worse than not staggering at all",
        ).toEqual([
          { property: "background-color", delayMs: 0 },
          { property: "color", delayMs: 0 },
        ]);
      }
    },
  );

  test(
    "the reveal still animates for it and for another scroll-narrated [data-reveal] element, with no leftover transition underneath",
    { tag: ["@critical", "@e2e", "@motion", "@MOTION-REVEAL-INTACT"] },
    async ({ page }) => {
      const ui = TARGETS.find((target) => target.selector === ".module-row");
      if (ui === undefined) throw new Error(".module-row is not in TARGETS");

      // Both witnesses here (`#process article`, `.module-list .module-row`)
      // carry T2's `.scene-card` class: in this browser (this repo's e2e
      // suite confirms `animation-timeline: view()` support elsewhere),
      // there is no `[data-reveal]` element left on the homepage that is
      // *not* now scroll-narrated — the whole point of T2 is that it takes
      // over every entrance this page has. So this test no longer proves
      // "the plain IO/transition reveal survives elsewhere"; it proves the
      // scroll-driven reveal that replaced it still behaves like a real
      // animation (not a cut) for two independent elements, and leaves no
      // conflicting transition underneath (see the "double animation" note
      // in portfolio.css's "Scroll-driven section narrative" section).
      //
      // One fresh navigation per traced element: the reveal is triggered by the
      // scroll that brings the element into view, and `prepare` deliberately
      // settles `.module-row`'s entrance, so reusing a single page would trace an
      // animation that has already finished (measured: 67 frames of `opacity: 1`).
      for (const selector of ["#process article", ".module-list .module-row"]) {
        await prepareReveal(page, ui, selector);
        const trace = await traceReveal(page, selector);
        const partial = trace.opacity.filter(
          (value) => value > 0 && value < 1,
        ).length;
        expect(
          partial,
          `${selector}: the reveal must be an animation, not a cut — ` +
            `${trace.opacity.length} frames sampled, opacity samples ` +
            `[${trace.opacity.slice(0, 6).join(", ")} …], none strictly between ` +
            `0 and 1`,
        ).toBeGreaterThan(0);
        expect(
          trace.opacity[trace.opacity.length - 1],
          `${selector}: the reveal must settle fully visible`,
        ).toBe(1);
        expect(
          trace.translateY[trace.translateY.length - 1],
          `${selector}: the reveal must settle at its final position`,
        ).toBe(0);
      }

      // No leftover IO/transition mechanism fighting the scroll-driven one:
      // `#process article` is neutralized to `transition: none` exactly
      // because it is `.scene-card` (portfolio.css's `.motion-ready
      // [data-reveal].scene-card` override) — a stray `opacity, transform`
      // transition surviving here would mean the two mechanisms could both
      // animate the same element at once.
      const other = await readState(page, "#process article");
      expect(
        other.properties,
        "a taken-over element must have no transition left to fight its " +
          "scroll-driven animation over opacity/transform",
      ).toEqual(["none"]);
    },
  );
});

test.describe("Motion coverage — reduced motion", () => {
  test(
    "the universal guard still neutralises the set and the reveal when the lever is on",
    { tag: ["@critical", "@e2e", "@motion", "@MOTION-REDUCED-GUARD"] },
    async ({ page }) => {
      await page.addInitScript(
        ([key, value]: readonly [string, Theme]) =>
          localStorage.setItem(key, value),
        [THEME_STORAGE_KEY, DARK] as const,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(HOME);
      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
        "the reduced-motion end of this contract needs the lever actually on",
      ).toBe(true);

      for (const selector of [
        ".module-row",
        ".desktop-nav a",
        ".quiet-link",
        ".theme-toggle",
        ".solid-link",
        ".skip-link",
      ]) {
        const read = await readState(page, selector);
        expect(
          read.properties,
          `${selector}: global.css's universal guard must set ` +
            `\`transition: none !important\` — this is the rule every per-selector ` +
            `transition in the set depends on`,
        ).toEqual(["none"]);
        expect(read.durationsMs).toEqual([0]);
      }

      expect(
        await page.evaluate(() =>
          document.documentElement.classList.contains("motion-ready"),
        ),
        "the reveal system must stay off under the lever, which is why " +
          "`motion-ready` is the structural proof that this page is running " +
          "without it",
      ).toBe(false);
      const revealTarget = await page
        .locator("#process article")
        .first()
        .evaluate((el) => {
          const style = getComputedStyle(el);
          return { opacity: style.opacity, transform: style.transform };
        });
      expect(revealTarget).toEqual({ opacity: "1", transform: "none" });
    },
  );
});
