/**
 * Per-state computed-style harness for the dark-theme-hardening change.
 *
 * Honest limitation. These assertions prove that the tokens resolve and the
 * *composed math* passes: the label colour taken from `getComputedStyle`, composited
 * over the surface the element's background chain actually resolves to, against the
 * WCAG 2.x ratio. They do not prove that the rendered pixels look right — no
 * screenshot baseline exists and this change deliberately introduces none, since a
 * baseline is cross-platform flaky and would need its own maintenance story. A human
 * visual pass on the deployed preview is still required before merge; the missing
 * baseline is recorded as a structural risk in the proposal.
 *
 * The harness reads the *first* match of each selector in the interactive set — the
 * design's primary instance — plus the plain focusable selectors (`.wordmark`,
 * `.skip-link`, `.projects-entry-link`) for the focus-ring geometry. `each element`
 * in the spec's scenarios is therefore approximated by `each selector in the set`;
 * a second instance of the same class inside a different surface (for example the
 * `.quiet-link` inside `.about-section`) is not read by the matrix.
 *
 * Four determinism/correctness levers, three of which are easy to miss:
 *
 * 1. `reducedMotion: "reduce"` is emulated *before* navigation (`ThemeStatePage.goto`),
 *    so `global.css`'s relocated universal guard already sets `transition: none
 *    !important` and no read races a 180-300ms transition. The lever is asserted
 *    live below (`transitionDuration === "0s"`).
 * 2. The theme is pinned through `localStorage` before the first paint *and*
 *    asserted. Playwright's default `prefers-color-scheme` is light, so an unpinned
 *    read silently measures the wrong mode; the lever test below proves that.
 * 3. `forcedColors: "active"` is emulated for the forced-colors reads, and the
 *    emulation is asserted live before those reads.
 * 4. Focus is reached with real `Tab` presses, never a click: `:focus-visible` only
 *    matches for keyboard focus.
 *
 * Run these with `pnpm run test:e2e`, which builds with `SITE_BASE=/` so every asset
 * this page needs is served from the root. Against a `dist/` built with the default
 * `/DreamFolio/` base the stylesheet 404s and every read silently measures the UA
 * defaults, so the build flag is part of the harness's contract rather than an
 * incidental detail.
 *
 * The focus-ring geometry and the forced-colors signals live in `focus-ring.spec.ts`
 * and `forced-colors.spec.ts`; the levers above hold for them too.
 *
 * No ratio assertion below claims a WCAG violation anywhere. Container borders,
 * `--color-border-hover`, the `opacity` hover pattern and the focus rings are not
 * violations, and the forced-colors work is best practice, not a requirement. The
 * hover/press assertions restate the change's own stricter law (design §1.3):
 * **no interaction state may lower a live label's contrast below its own at-rest
 * value, in either mode.**
 */

import { test, expect, type Page } from "@playwright/test";
import { HOME, THEMES } from "./support/fixtures";
import { TARGETS, type Target } from "./support/interactive-set";
import {
  STATE,
  THEME,
  describeRead,
  stateDifferences,
  type Theme,
} from "./support/state-model";
import { ThemeStatePage } from "./theme-state-page";

/** The AA floor for the body-size labels in the interactive set — none is large text. */
const BODY_FLOOR = 4.5;

async function prepare(
  page: Page,
  theme: Theme,
  target: Target,
): Promise<ThemeStatePage> {
  const ui = new ThemeStatePage(page);
  await ui.pinTheme(theme);
  await ui.setViewport(target.viewport);
  await ui.goto(target.path);
  if (target.openMenu) await ui.openMobileMenu();
  await expect
    .poll(() => ui.currentTheme(), {
      message:
        `${target.selector}: the theme must be pinned in localStorage before the ` +
        `first paint — an unpinned read measures prefers-color-scheme, which ` +
        `Playwright defaults to light`,
    })
    .toBe(theme);
  return ui;
}

for (const theme of THEMES) {
  test.describe(`Interactive state set — ${theme}`, () => {
    for (const target of TARGETS) {
      test(
        `${target.selector} keeps its label contrast through rest, hover, press and focus`,
        {
          tag: [
            "@critical",
            "@e2e",
            "@theme-state",
            `@THEME-STATE-${target.id}-${theme}`,
          ],
        },
        async ({ page }) => {
          const ui = await prepare(page, theme, target);
          const pair = `${target.selector} (${target.pair})`;

          const rest = await ui.readState(target.selector, STATE.REST);
          const hover = await ui.readState(target.selector, STATE.HOVER);
          const active = target.press
            ? await ui.readState(target.selector, STATE.ACTIVE)
            : null;
          const focus = target.focus
            ? await ui.readState(target.selector, STATE.FOCUS)
            : null;

          // Every read is taken before the first assertion, so a failure reports
          // the measured values of all four states instead of only the one that
          // tripped first.
          expect(
            rest.ratio,
            `${pair} — ${theme}: rest must clear the ${BODY_FLOOR}:1 body-text ` +
              `floor — ${describeRead(rest)}`,
          ).toBeGreaterThanOrEqual(BODY_FLOOR);

          expect(
            hover.ratio,
            `${pair} — ${theme}: hover must not drop below its own at-rest ratio ` +
              `(design §1.3 / "State-Preserving Hover") — ` +
              `${describeRead(rest)} -> ${describeRead(hover)}` +
              (active ? `; press measured ${describeRead(active)}` : ""),
          ).toBeGreaterThanOrEqual(rest.ratio);

          if (active) {
            expect(
              active.ratio,
              `${pair} — ${theme}: press must not drop below its own at-rest ratio ` +
                `(design §1.3) — ${describeRead(rest)} -> ${describeRead(active)}`,
            ).toBeGreaterThanOrEqual(rest.ratio);
            expect(
              stateDifferences(rest, active),
              `${pair} — ${theme}: the pressed state must be a real computed change ` +
                `from rest (design §1.3 / "Dark-Scoped Press State Coverage")`,
            ).not.toEqual([]);
          }

          if (focus) {
            expect(
              focus.outlineWidth,
              `${pair} — ${theme}: one consolidated ring, ` +
                `global.css @layer base :focus-visible (3px solid var(--color-focus))`,
            ).toBe("3px");
            expect(
              focus.outlineOffset,
              `${pair} — ${theme}: one consolidated offset — global.css @layer ` +
                `base :focus-visible (outline-offset: 5px)`,
            ).toBe("5px");
            expect(
              focus.borderRadius,
              `${pair} — ${theme}: a focused element must keep its at-rest radius: ` +
                `the :focus-visible border-radius mutation was removed under the ` +
                `gate 2.3 consent — at rest ${rest.borderRadius}, focused ` +
                `${focus.borderRadius}`,
            ).toBe(rest.borderRadius);
          }

          expect(
            await ui.currentTheme(),
            `${pair} — ${theme}: no read may activate a control — the theme toggle ` +
              `must still be pinned after every press`,
          ).toBe(theme);
        },
      );
    }
  });
}

test.describe("Determinism levers", () => {
  test(
    "the pinned theme overrides Playwright's light prefers-color-scheme default",
    { tag: ["@critical", "@e2e", "@theme-state", "@THEME-STATE-LEVER-THEME"] },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      await ui.goto(HOME);
      expect(
        await ui.currentTheme(),
        "an unpinned page must resolve through prefers-color-scheme, which " +
          "Playwright reports as light — this is why every read pins the theme",
      ).toBe(THEME.LIGHT);

      await ui.pinTheme(THEME.DARK);
      await ui.goto(HOME);
      await expect.poll(() => ui.currentTheme()).toBe(THEME.DARK);
      expect(
        await page.evaluate(() => localStorage.getItem("dreamfolio-theme")),
        "the pin must go through the same localStorage key public/theme-init.js reads",
      ).toBe(THEME.DARK);
    },
  );

  test(
    "reducedMotion: reduce is emulated before navigation, so no read races a transition",
    { tag: ["@critical", "@e2e", "@theme-state", "@THEME-STATE-LEVER-MOTION"] },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      await ui.pinTheme(THEME.DARK);
      await ui.goto(HOME);

      for (const selector of [
        ".desktop-nav a",
        ".theme-toggle",
        ".solid-link",
      ]) {
        const rest = await ui.readState(selector, STATE.REST);
        expect(
          rest.transitionDuration,
          `${selector}: the reduced-motion lever must be live before the first ` +
            `read — global.css's relocated universal guard sets ` +
            `\`transition: none !important\`, so a non-zero duration means every ` +
            `state read is racing a ${rest.transitionDuration} transition`,
        ).toBe("0s");
      }
    },
  );
});
