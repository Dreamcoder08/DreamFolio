/**
 * Evidence for the three theme-state scenarios that had no rendered test before
 * `theme-state-hardening`: the exempted element's border provenance, the
 * `prefers-contrast: more` overrides, and a press delivered as a touch in a
 * coarse-pointer context.
 *
 * What each group does and does not prove
 * --------------------------------------
 *
 * 1. **Border provenance (computed, both themes).** `getComputedStyle` on
 *    `.contact-section .solid-link` in hover and in press. Three claims: the
 *    computed border differs from the computed `color` — the value `currentColor`
 *    produces, so this is the assertion the old declaration fails; the computed
 *    border *is* the resolved `--color-surface-active`, which is what makes it a
 *    state token rather than some other colour; and the border composited against
 *    the element's own resolved fill clears 1.4.11's 3:1 non-text floor. It proves
 *    the token resolves and the composed math passes. It does not prove the pixels
 *    look right: this change still ships no screenshot baseline.
 *
 * 2. **`prefers-contrast: more`.** The media feature is emulated live and the
 *    lever is asserted through `matchMedia` before any token is read. Each
 *    overridden token is read twice in the same page instance — with
 *    `contrast: "no-preference"` and with `contrast: "more"` — and compared
 *    against the literal `global.css` declares for that theme. It proves the
 *    preference-gated blocks reach custom properties and the one opacity-based
 *    case (the light civic card). It proves nothing about a real operating
 *    system's high-contrast setting, and nothing about the ratios those literals
 *    were chosen for; the ratios live in the design record and in
 *    `tests/unit/tokens.test.ts`.
 *
 * 3. **Touch press (`hasTouch: true`, mobile viewport).** Chromium emulates touch
 *    coarseness; it is not a physical device, and no test here claims a finger.
 *    Which CDP dispatch actually produces a pressed state in this build was
 *    measured rather than assumed, and the measurement contradicts the obvious
 *    route:
 *
 *      - `Input.dispatchTouchEvent` (`touchStart`/`touchEnd` — the same call
 *        Playwright's own `touchscreen.tap()` is implemented with) really does
 *        deliver a touch press: the target received `pointerdown` with
 *        `pointerType: "touch"` and a `touchstart`, and a `click` followed the
 *        release. While the touch was **held**, however, Blink matched `:active`
 *        on zero elements and `:hover` on none, so the computed state was
 *        identical to rest. That path cannot measure a pressed state.
 *      - `Input.emulateTouchFromMouseEvent` (`mousePressed`/`mouseReleased`)
 *        delivered `pointerdown` with `pointerType: "touch"` plus the
 *        compatibility `mousedown`, and while held the target matched `:active`
 *        and `:hover` and carried the pressed `transform` and outline. It does
 *        *not* dispatch `touchstart`/`touchend` DOM events.
 *
 *    The pressed-state assertions therefore use the second path, and the first is
 *    kept as its own measurement so the deviation is visible in the suite instead
 *    of hidden in a commit message.
 *
 *    Hover and press cannot be separated under a finger: the emulated touch
 *    leaves `:hover` matched while the press is held, and it stays matched after
 *    release (the classic sticky-hover artifact), which is also what a mouse
 *    press looks like — a mouse press is hover plus `:active`. What separates them
 *    is computed, not spatial: the held state adds the `:active` transform
 *    (`translateY(2px)` against hover's `translateY(1px)`) and the press ring. So
 *    the suite asserts the delta from **rest** and records the delta from hover
 *    and from a mouse press as annotations. It does not claim that hover is
 *    absent during a touch press, because it measurably is not.
 *
 * Run with `SITE_BASE=/ pnpm run build && npx playwright test
 * tests/theme-state/state-evidence.spec.ts`. Like the rest of this suite, the
 * root-base build is part of the harness contract: against a `dist/` built with
 * the default `/DreamFolio/` base the stylesheet 404s and every read silently
 * measures UA defaults.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  STATE,
  THEME,
  VIEWPORT,
  VIEWPORT_SIZE,
  ThemeStatePage,
  describeRead,
  stateDifferences,
  type InteractionState,
  type StateRead,
  type Theme,
} from "./theme-state-page";
import {
  backgroundChain,
  composite,
  formatRatio,
  parseColor,
  ratio,
  resolveBackground,
  toCss,
} from "../support/contrast";

const HOME = "/";

/** 1.4.11's non-text floor. */
const NON_TEXT_FLOOR = 3;

const THEMES: readonly Theme[] = [THEME.DARK, THEME.LIGHT];

/** The exempted element: at rest `--color-surface` on `--color-text`, the palette ceiling. */
const EXEMPT = ".contact-section .solid-link";

const BORDER_SIDES = ["top", "right", "bottom", "left"] as const;

/**
 * Two identical colours serialise differently (`#26262e` as a custom property
 * value, `rgb(38, 38, 46)` from `getComputedStyle`), so every colour comparison
 * goes through the shared parser rather than string equality.
 */
function sameColour(first: string, second: string): boolean {
  const a = parseColor(first);
  const b = parseColor(second);
  return (
    Math.abs(a.r - b.r) < 0.5 &&
    Math.abs(a.g - b.g) < 0.5 &&
    Math.abs(a.b - b.b) < 0.5 &&
    Math.abs(a.a - b.a) < 0.01
  );
}

async function prepare(page: Page, theme: Theme): Promise<ThemeStatePage> {
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

/* ------------------------------------------------------------------ *
 * 1. Border provenance, computed, both themes
 * ------------------------------------------------------------------ */

const BORDER_STATES: readonly { state: InteractionState; label: string }[] = [
  { state: STATE.HOVER, label: "hover" },
  { state: STATE.ACTIVE, label: "press" },
];

for (const theme of THEMES) {
  test.describe(`Exempted element border provenance — ${theme}`, () => {
    for (const { state, label } of BORDER_STATES) {
      test(
        `${EXEMPT} takes its ${label} border from a state token, not from currentColor`,
        {
          tag: [
            "@critical",
            "@e2e",
            "@theme-state",
            `@THEME-STATE-BORDER-${theme}-${label.toUpperCase()}`,
          ],
        },
        async ({ page }) => {
          const ui = await prepare(page, theme);
          const read = await ui.readState(EXEMPT, state);
          const stateToken = await ui.tokenValue("--color-surface-active");

          const painted = BORDER_SIDES.map(
            (side) => `${side} ${read.borders[side]}`,
          ).join(", ");
          const fillRatio = ratio(read.borders.top, read.surface);
          const context =
            `${EXEMPT} [${label}] — ${theme}: computed color ${read.color}, ` +
            `borders ${painted}, element fill ${read.surface} ` +
            `(${describeRead(read)})`;

          test.info().annotations.push({
            type: "border-provenance",
            description:
              `${EXEMPT} [${label}] — ${theme}: computed color ${read.color}; ` +
              `borders ${painted}; element fill ${read.surface}; label on fill ` +
              `${formatRatio(read.ratio)}:1; border over fill ` +
              `${formatRatio(fillRatio)}:1; --color-surface-active ${stateToken}`,
          });

          for (const side of BORDER_SIDES) {
            expect(
              read.borders[side],
              `${context} — the ${side} border equals the computed \`color\`, which ` +
                `is exactly what \`border-color: currentColor\` resolves to. This ` +
                `element inverts (fill --color-text, ink --color-surface), so ` +
                `currentColor gives the border the label's own value and no state ` +
                `token stands behind it — the requirement the amended scenario ` +
                `fails`,
            ).not.toBe(read.color);
          }

          expect(
            sameColour(read.borders.top, stateToken),
            `${context} — the surviving border colour must be the resolved state ` +
              `token \`--color-surface-active\` (${stateToken}), not merely a colour ` +
              `that is not currentColor: portfolio.css declares ` +
              `\`border-color: var(--color-surface-active)\` for both states`,
          ).toBe(true);

          expect(
            fillRatio,
            `${context} — the ${label === "press" ? "pressed" : "hovered"} border ` +
              `must keep 1.4.11's ${NON_TEXT_FLOOR}:1 against the element's own ` +
              `resolved fill: ${read.borders.top} over ${read.surface} measures ` +
              `${formatRatio(fillRatio)}:1`,
          ).toBeGreaterThanOrEqual(NON_TEXT_FLOOR);
        },
      );
    }
  });
}

/* ------------------------------------------------------------------ *
 * 2. prefers-contrast: more
 * ------------------------------------------------------------------ */

/**
 * The literals `global.css` declares inside `@media (prefers-contrast: more)`,
 * compared as parsed colours so a serialisation difference is never mistaken for
 * a missing override.
 */
const CONTRAST_TOKENS: Record<Theme, Record<string, string>> = {
  [THEME.DARK]: {
    "--color-text-secondary": "#e2e2df",
    "--color-border": "rgba(255, 255, 255, 0.42)",
    "--color-border-strong": "rgba(255, 255, 255, 0.6)",
  },
  [THEME.LIGHT]: {
    "--color-text-secondary": "#4a3d30",
    "--color-text-tertiary": "#5c4a39",
    "--color-border": "rgba(0, 0, 0, 0.32)",
    "--color-border-strong": "rgba(0, 0, 0, 0.42)",
    "--color-border-interactive": "rgba(0, 0, 0, 0.34)",
    "--color-border-interactive-hover": "rgba(0, 0, 0, 0.5)",
  },
};

/** The one opacity-based case: the light civic card's attenuated text goes opaque. */
const CIVIC_TEXT = ".project-card--civic .project-number";

test(
  "prefers-contrast: more changes the preference-gated declarations in both themes",
  {
    tag: ["@critical", "@e2e", "@theme-state", "@THEME-STATE-CONTRAST"],
  },
  async ({ page }) => {
    const ui = new ThemeStatePage(page);

    for (const theme of THEMES) {
      await ui.pinTheme(theme);
      // Both media features are set together, before navigation and again before
      // the second read, so this test never depends on how a repeated
      // `emulateMedia` call merges with the previous one.
      await page.emulateMedia({
        reducedMotion: "reduce",
        contrast: "no-preference",
      });
      await page.goto(HOME);
      await expect.poll(() => ui.currentTheme()).toBe(theme);

      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-contrast: more)").matches,
        ),
        `${theme}: the baseline read must run with the media feature off, or the ` +
          `"differs without the media feature" clause compares a value with itself`,
      ).toBe(false);

      const names = Object.keys(CONTRAST_TOKENS[theme]);
      const baseline: Record<string, string> = {};
      for (const name of names) baseline[name] = await ui.tokenValue(name);
      const baselineCivic = await ui.readState(CIVIC_TEXT, STATE.REST);

      await page.emulateMedia({ reducedMotion: "reduce", contrast: "more" });

      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-contrast: more)").matches,
        ),
        `${theme}: page.emulateMedia({ contrast: "more" }) must be live before any ` +
          `token is read — without it this asserts the default palette and proves ` +
          `nothing about the preference-gated block`,
      ).toBe(true);

      const overridden: Record<string, string> = {};
      for (const name of names) overridden[name] = await ui.tokenValue(name);

      test.info().annotations.push({
        type: "prefers-contrast-more",
        description:
          `${theme}: no-preference ` +
          names.map((name) => `${name}=${baseline[name]}`).join(" ") +
          ` | more ` +
          names.map((name) => `${name}=${overridden[name]}`).join(" ") +
          ` | civic number opacity ${baselineCivic.opacity} → ` +
          `${(await ui.readState(CIVIC_TEXT, STATE.REST)).opacity}`,
      });

      for (const name of names) {
        const expected = CONTRAST_TOKENS[theme][name];
        expect(
          sameColour(overridden[name], expected),
          `${theme}: \`${name}\` with prefers-contrast: more must resolve to the ` +
            `literal global.css declares (${expected}); it measured ` +
            `\`${overridden[name]}\` against a baseline of \`${baseline[name]}\``,
        ).toBe(true);
        expect(
          overridden[name],
          `${theme}: \`${name}\` measured the same with and without ` +
            `prefers-contrast: more (\`${baseline[name]}\`). Either the override did ` +
            `not apply, or the media feature is not live in this context`,
        ).not.toBe(baseline[name]);
      }

      if (theme === THEME.LIGHT) {
        // The only opacity-based case, and the only theme that declares one: the
        // dark block overrides tokens, not this selector.
        const civic = await ui.readState(CIVIC_TEXT, STATE.REST);
        const tertiary = await ui.tokenValue("--color-text-tertiary");
        expect(
          sameColour(civic.color, tertiary),
          `${theme}: the civic card's number under prefers-contrast: more must take ` +
            `--color-text-tertiary (${tertiary}) directly; it measured ` +
            `${civic.color}, against ${baselineCivic.color} with the media feature off`,
        ).toBe(true);
        expect(
          civic.opacity,
          `${theme}: the civic card's number must go opaque under ` +
            `prefers-contrast: more — opacity ${civic.opacity} measured, ` +
            `${baselineCivic.opacity} without the media feature. An attenuated ` +
            `label is the one thing the media feature cannot fix by colour alone`,
        ).toBe("1");
        expect(
          civic.opacity,
          `${theme}: the civic card's number must actually change with the media ` +
            `feature — both reads measured opacity ${civic.opacity}`,
        ).not.toBe(baselineCivic.opacity);
      }
    }
  },
);

/* ------------------------------------------------------------------ *
 * 3. Touch press in a coarse-pointer context
 * ------------------------------------------------------------------ */

/**
 * The harness's `readState(…, STATE.ACTIVE)` presses with the mouse
 * (`page.mouse.down()`) and `ThemeStatePage.snapshot` is private, so a press
 * delivered through the input pipeline needs its own read path. No colour math is
 * re-implemented: `backgroundChain`, `resolveBackground`, `composite`,
 * `parseColor`, `ratio` and `toCss` are the shared helpers, and the compositing
 * below mirrors `snapshot` so the two reads stay comparable through
 * `stateDifferences`.
 */
async function readWhileTouched(
  page: Page,
  selector: string,
  state: InteractionState,
): Promise<StateRead> {
  const locator = page.locator(selector).first();
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

/** The DOM events a touch press must produce, and the pointer type it must carry. */
const WATCHED_EVENTS = [
  "touchstart",
  "touchend",
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "click",
] as const;

const POINTER_DOWN_TOUCH = "pointerdown(touch)";

async function watchInputEvents(page: Page, selector: string): Promise<void> {
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

async function inputLog(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      (window as unknown as { __inputLog?: string[] }).__inputLog?.join(
        " → ",
      ) ?? "",
  );
}

/** Aims at the element's centre, which the caller must already have scrolled into view. */
async function centreOf(
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

/**
 * Elements whose pressed state must be reachable on a touch device at 390px. The
 * exempted element is the one this change is about; the others press through
 * different mechanisms, so a broken emulated press shows up as a per-target
 * failure instead of one unexplained red test.
 */
const TOUCH_TARGETS: readonly string[] = [
  EXEMPT,
  ".theme-toggle",
  ".module-row",
];

test.describe("Touch press in a coarse-pointer context", () => {
  test.use({ hasTouch: true, viewport: VIEWPORT_SIZE[VIEWPORT.MOBILE] });

  test(
    "the raw-touch CDP path is measured, not assumed: it delivers a real touch press, and the held state is recorded rather than asserted",
    {
      tag: ["@e2e", "@theme-state", "@THEME-STATE-TOUCH-PATH"],
    },
    async ({ page, context }) => {
      const ui = await prepare(page, THEME.DARK);
      const rest = await ui.readState(EXEMPT, STATE.REST);
      await page.mouse.move(2, 2);
      const point = await centreOf(page, EXEMPT);
      await watchInputEvents(page, EXEMPT);

      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: point.x, y: point.y, id: 1 }],
      });
      const held = await readWhileTouched(page, EXEMPT, STATE.ACTIVE);
      const log = await inputLog(page);
      const heldDelta = stateDifferences(rest, held);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });

      test.info().annotations.push({
        type: "raw-touch-path",
        description:
          `Input.dispatchTouchEvent (touchStart, held) — ${EXEMPT}, dark: DOM events ` +
          `[${log}]; computed delta from rest [${heldDelta.join(", ")}]`,
      });

      expect(
        log,
        `Input.dispatchTouchEvent must deliver a real touch press to the element — ` +
          `a \`touchstart\` with a touch-typed pointer — or this measurement is not ` +
          `about touch at all. Measured DOM events: [${log}]`,
      ).toContain("touchstart");
      expect(
        log,
        `the touch press must arrive as a coarse-pointer (touch) pointer event. ` +
          `Measured DOM events: [${log}]`,
      ).toContain(POINTER_DOWN_TOUCH);

      // The measurement, not a claim: on this build the held state equals rest, so
      // this path cannot be used for the pressed-state assertions below. It is
      // recorded as an annotation on every run instead of a fixed assertion about
      // a browser behaviour that may change.
    },
  );

  for (const theme of THEMES) {
    for (const selector of TOUCH_TARGETS) {
      test(
        `${selector} — ${theme}: a held touch press reaches a real pressed state`,
        {
          tag: [
            "@critical",
            "@e2e",
            "@theme-state",
            `@THEME-STATE-TOUCH-${theme}-${selector.replace(/\W+/g, "-")}`,
          ],
        },
        async ({ page, context }) => {
          const ui = await prepare(page, theme);

          expect(
            await page.evaluate(
              () => window.matchMedia("(pointer: coarse)").matches,
            ),
            `${selector} — ${theme}: hasTouch: true must make the pointer coarse ` +
              `before the press, or this reads fine-pointer behaviour and calls it a ` +
              `touch press`,
          ).toBe(true);
          expect(
            await page.evaluate(() => navigator.maxTouchPoints),
            `${selector} — ${theme}: navigator.maxTouchPoints must be non-zero — ` +
              `this is Chromium's touch emulation, not a physical device`,
          ).toBeGreaterThan(0);

          // Every page read happens before the press is released: a touch release
          // synthesises a `click`, and a click on a link navigates away.
          const stateToken = await ui.tokenValue("--color-surface-active");
          const rest = await ui.readState(selector, STATE.REST);
          const hover = await ui.readState(selector, STATE.HOVER);
          const mousePressed = await ui.readState(selector, STATE.ACTIVE);

          await page.mouse.move(2, 2);
          const point = await centreOf(page, selector);
          await watchInputEvents(page, selector);

          const cdp = await context.newCDPSession(page);
          await cdp.send("Input.emulateTouchFromMouseEvent", {
            type: "mousePressed",
            x: point.x,
            y: point.y,
            button: "left",
            clickCount: 1,
            deltaX: 0,
            deltaY: 0,
          });

          let held: StateRead | null = null;
          await expect
            .poll(
              async () => {
                held = await readWhileTouched(page, selector, STATE.ACTIVE);
                return stateDifferences(rest, held);
              },
              {
                message:
                  `${selector} — ${theme}: a held touch press must reach the pressed ` +
                  `state within the poll window. Chromium applies the active state ` +
                  `through its input pipeline, so a dispatch that only injects ` +
                  `touchstart never gets here — see the raw-touch measurement in ` +
                  `this file`,
                timeout: 5000,
              },
            )
            .not.toEqual([]);

          const pressed = held as StateRead | null;
          const log = await inputLog(page);

          await cdp.send("Input.emulateTouchFromMouseEvent", {
            type: "mouseReleased",
            x: point.x,
            y: point.y,
            button: "left",
            clickCount: 1,
            deltaX: 0,
            deltaY: 0,
          });

          expect(
            pressed,
            `${selector} — ${theme}: the touch-held read must exist`,
          ).not.toBeNull();
          expect(
            log,
            `${selector} — ${theme}: the press must arrive as a touch-typed pointer, ` +
              `not as a plain mouse press. Measured DOM events: [${log}]`,
          ).toContain(POINTER_DOWN_TOUCH);

          const restDelta = stateDifferences(rest, pressed!);
          const hoverDelta = stateDifferences(hover, pressed!);
          const mousePressDelta = stateDifferences(mousePressed, pressed!);
          test.info().annotations.push({
            type: "touch-press-relation",
            description:
              `${selector} — ${theme}: DOM events [${log}]; held touch vs rest ` +
              `differs in [${restDelta.join(", ")}]; vs mouse hover ` +
              `[${hoverDelta.join(", ")}]; vs mouse hover+press ` +
              `[${mousePressDelta.join(", ")}]; rest transform ` +
              `${rest.transform}, hover transform ${hover.transform}, held transform ` +
              `${pressed!.transform}, held outline ${pressed!.outlineStyle} ` +
              `${pressed!.outlineWidth}`,
          });

          expect(
            restDelta,
            `${selector} — ${theme}: a touch press must be a real computed change ` +
              `from rest, not the rest state held under an input point — rest ` +
              `${describeRead(rest)} (transform ${rest.transform}), held ` +
              `${describeRead(pressed!)} (transform ${pressed!.transform}, outline ` +
              `${pressed!.outlineStyle} ${pressed!.outlineWidth})`,
          ).not.toEqual([]);

          if (selector === EXEMPT) {
            const fillRatio = ratio(pressed!.borders.top, pressed!.surface);
            expect(
              pressed!.borders.top,
              `${selector} — ${theme}: the touch-held border must still come from ` +
                `--color-surface-active (${stateToken}) and must not equal the ` +
                `computed color (${pressed!.color}); measured ${pressed!.borders.top} ` +
                `against a rest border of ${rest.borders.top} and a mouse-pressed ` +
                `border of ${mousePressed.borders.top}`,
            ).not.toBe(pressed!.color);
            expect(
              sameColour(pressed!.borders.top, stateToken),
              `${selector} — ${theme}: the touch-held border measured ` +
                `${pressed!.borders.top}, which is not the state token ${stateToken}`,
            ).toBe(true);
            expect(
              fillRatio,
              `${selector} — ${theme}: the touch-held border ` +
                `${pressed!.borders.top} over the element fill ${pressed!.surface} ` +
                `measures ${formatRatio(fillRatio)}:1, and must clear ` +
                `${NON_TEXT_FLOOR}:1`,
            ).toBeGreaterThanOrEqual(NON_TEXT_FLOOR);
          }
        },
      );
    }
  }
});
