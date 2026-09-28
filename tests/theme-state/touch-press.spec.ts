/**
 * Evidence for a press delivered as a touch in a coarse-pointer context — one of
 * the three theme-state scenarios that had no rendered test before
 * `theme-state-hardening` (the others are `border-provenance.spec.ts` and
 * `prefers-contrast.spec.ts`).
 *
 * **Touch press (`hasTouch: true`, mobile viewport).** Chromium emulates touch
 * coarseness; it is not a physical device, and no test here claims a finger.
 * Which CDP dispatch actually produces a pressed state in this build was
 * measured rather than assumed, and the measurement contradicts the obvious
 * route:
 *
 *   - `Input.dispatchTouchEvent` (`touchStart`/`touchEnd` — the same call
 *     Playwright's own `touchscreen.tap()` is implemented with) really does
 *     deliver a touch press: the target received `pointerdown` with
 *     `pointerType: "touch"` and a `touchstart`, and a `click` followed the
 *     release. While the touch was **held**, however, Blink matched `:active`
 *     on zero elements and `:hover` on none, so the computed state was
 *     identical to rest. That path cannot measure a pressed state.
 *   - `Input.emulateTouchFromMouseEvent` (`mousePressed`/`mouseReleased`)
 *     delivered `pointerdown` with `pointerType: "touch"` plus the
 *     compatibility `mousedown`, and while held the target matched `:active`
 *     and `:hover` and carried the pressed `transform` and outline. It does
 *     *not* dispatch `touchstart`/`touchend` DOM events.
 *
 * The pressed-state assertions therefore use the second path, and the first is
 * kept as its own measurement so the deviation is visible in the suite instead
 * of hidden in a commit message.
 *
 * Hover and press cannot be separated under a finger: the emulated touch
 * leaves `:hover` matched while the press is held, and it stays matched after
 * release (the classic sticky-hover artifact), which is also what a mouse
 * press looks like — a mouse press is hover plus `:active`. What separates them
 * is computed, not spatial: the held state adds the `:active` transform
 * (`translateY(2px)` against hover's `translateY(1px)`) and the press ring. So
 * the suite asserts the delta from **rest** and records the delta from hover
 * and from a mouse press as annotations. It does not claim that hover is
 * absent during a touch press, because it measurably is not.
 *
 * Run with `SITE_BASE=/ pnpm run build && npx playwright test
 * tests/theme-state/`. Like the rest of this suite, the root-base build is part of
 * the harness contract: against a `dist/` built with the default `/DreamFolio/`
 * base the stylesheet 404s and every read silently measures UA defaults.
 */

import { test, expect, type Page } from "@playwright/test";
import { EXEMPT, prepare, sameColour } from "./support/evidence";
import { NON_TEXT_FLOOR, THEMES } from "./support/fixtures";
import {
  STATE,
  THEME,
  VIEWPORT,
  VIEWPORT_SIZE,
  describeRead,
  stateDifferences,
  type InteractionState,
  type StateRead,
} from "./support/state-model";
import { readComputedState } from "./support/state-snapshot";
import {
  POINTER_DOWN_TOUCH,
  centreOf,
  inputLog,
  watchInputEvents,
} from "./support/touch-input";
import { formatRatio, ratio } from "../support/contrast";

/**
 * The harness's `readState(…, STATE.ACTIVE)` presses with the mouse
 * (`page.mouse.down()`), so a press delivered through the input pipeline reads
 * the element as it stands, through the same `readComputedState` the page object
 * uses — the two reads stay comparable through `stateDifferences`.
 */
async function readWhileTouched(
  page: Page,
  selector: string,
  state: InteractionState,
): Promise<StateRead> {
  return readComputedState(page.locator(selector).first(), selector, state);
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
