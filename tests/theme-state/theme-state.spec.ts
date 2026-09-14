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
 * No ratio assertion below claims a WCAG violation anywhere. Container borders,
 * `--color-border-hover`, the `opacity` hover pattern and the focus rings are not
 * violations, and the forced-colors work is best practice, not a requirement. The
 * hover/press assertions restate the change's own stricter law (design §1.3):
 * **no interaction state may lower a live label's contrast below its own at-rest
 * value, in either mode.**
 */

import { test, expect, type Page } from "@playwright/test";
import {
  STATE,
  THEME,
  VIEWPORT,
  describeRead,
  stateDifferences,
  type Theme,
  type Viewport,
} from "./theme-state-page";
import { ThemeStatePage } from "./theme-state-page";
import { composite, formatRatio, parseColor, ratio } from "../support/contrast";

const HOME = "/";
const PROJECT_DETAIL = "/projects/digital-public-peru/";
const PROJECTS_INDEX = "/projects/";

/** The AA floor for the body-size labels in the interactive set — none is large text. */
const BODY_FLOOR = 4.5;
/** 1.4.11's non-text clause for the ink ring on an accent-filled section. */
const NON_TEXT_FLOOR = 3;

interface Target {
  readonly id: string;
  readonly selector: string;
  readonly path: string;
  readonly viewport: Viewport;
  /** Whether the element declares an `:active` rule that this harness asserts. */
  readonly press: boolean;
  /** Whether the focus ring is read on this element. */
  readonly focus: boolean;
  readonly openMenu: boolean;
  /** The selector/token pair whose declarations produce the rest ratio. */
  readonly pair: string;
}

const DESKTOP: Viewport = VIEWPORT.DESKTOP;
const MOBILE: Viewport = VIEWPORT.MOBILE;

const TARGETS: readonly Target[] = [
  {
    id: "01",
    selector: ".desktop-nav a",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text-secondary on --color-surface",
  },
  {
    id: "02",
    selector: ".desktop-nav .nav-contact",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text on --color-surface, border --color-border-interactive",
  },
  {
    id: "03",
    selector: ".theme-toggle",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text-secondary on --color-surface, dark border --color-border-interactive",
  },
  {
    id: "04",
    selector: ".circle-link",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text on --color-surface-alt, border --color-border-interactive",
  },
  {
    id: "05",
    selector: ".module-row",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text-secondary on --color-surface",
  },
  {
    id: "06",
    selector: ".site-footer > a",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text on --color-surface (:first-child)",
  },
  {
    id: "07",
    selector: ".contact-social a",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-on-accent on --color-accent",
  },
  {
    id: "08",
    selector: ".solid-link",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-on-accent on --color-accent",
  },
  {
    id: "09",
    selector: ".quiet-link",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text on --color-surface",
  },
  {
    id: "10",
    selector: ".project-links a",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text on --color-surface-alt",
  },
  {
    id: "11",
    selector: ".contact-section .solid-link",
    path: HOME,
    viewport: DESKTOP,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-surface on --color-text (the palette ceiling)",
  },
  {
    id: "12",
    selector: ".card",
    path: PROJECT_DETAIL,
    viewport: DESKTOP,
    press: false,
    focus: false,
    openMenu: false,
    pair: "--color-text on --color-surface-alt, hover --color-border-strong",
  },
  {
    id: "13",
    selector: ".menu-toggle",
    path: HOME,
    viewport: MOBILE,
    press: true,
    focus: true,
    openMenu: false,
    pair: "--color-text-secondary on --color-surface, dark border --color-border-interactive",
  },
  {
    id: "14",
    selector: ".mobile-nav a",
    path: HOME,
    viewport: MOBILE,
    press: true,
    focus: true,
    openMenu: true,
    pair: "--color-text on --color-surface-alt",
  },
];

const THEMES: readonly Theme[] = [THEME.DARK, THEME.LIGHT];

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

/**
 * The plain focusable selectors — the set that inherited the removed
 * `:focus-visible { border-radius: 4px }` mutation. `.mobile-nav a` is covered by
 * the mobile target above; `.about-copy a:not(.quiet-link)` has no instance in the
 * tree today, so there is nothing to read for it.
 */
const PLAIN_FOCUSABLE: readonly {
  id: string;
  selector: string;
  path: string;
}[] = [
  { id: "01", selector: ".wordmark", path: HOME },
  { id: "02", selector: ".skip-link", path: HOME },
  { id: "03", selector: ".desktop-nav a", path: HOME },
  { id: "04", selector: ".quiet-link", path: HOME },
  { id: "05", selector: ".project-links a", path: HOME },
  { id: "06", selector: ".contact-social a", path: HOME },
  { id: "07", selector: ".site-footer > a", path: HOME },
  { id: "08", selector: ".projects-entry-link", path: PROJECTS_INDEX },
];

for (const theme of THEMES) {
  test.describe(`Focus ring geometry — ${theme}`, () => {
    test(
      "the plain focusable selectors keep their at-rest radius under keyboard focus",
      {
        tag: [
          "@critical",
          "@e2e",
          "@theme-state",
          `@THEME-STATE-FOCUS-${theme}`,
        ],
      },
      async ({ page }) => {
        const ui = new ThemeStatePage(page);
        await ui.pinTheme(theme);

        for (const entry of PLAIN_FOCUSABLE) {
          await ui.goto(entry.path);
          await expect.poll(() => ui.currentTheme()).toBe(theme);

          const rest = await ui.readState(entry.selector, STATE.REST);
          const focus = await ui.readState(entry.selector, STATE.FOCUS);

          expect(
            focus.outlineWidth,
            `${entry.selector} — ${theme}: the consolidated ring is 3px for every ` +
              `element (global.css @layer base :focus-visible)`,
          ).toBe("3px");
          expect(
            focus.outlineOffset,
            `${entry.selector} — ${theme}: the consolidated offset is 5px for every ` +
              `element (global.css @layer base :focus-visible)`,
          ).toBe("5px");
          expect(
            focus.borderRadius,
            `${entry.selector} — ${theme}: the gate 2.3 consent removed ` +
              `:focus-visible { border-radius: 4px }, so the focused radius must ` +
              `equal the at-rest radius unconditionally — at rest ` +
              `${rest.borderRadius}, focused ${focus.borderRadius}`,
          ).toBe(rest.borderRadius);
        }
      },
    );
  });
}

/** The ink variant: an accent ring on an accent fill is 1:1, so these read `--color-on-focus`. */
const INK_VARIANTS: readonly {
  id: string;
  selector: string;
  surface: string;
  path: string;
}[] = [
  {
    id: "01",
    selector: ".about-section .quiet-link",
    surface: ".about-section",
    path: HOME,
  },
  {
    id: "02",
    selector: ".contact-social a",
    surface: ".contact-section",
    path: HOME,
  },
  {
    id: "03",
    selector: ".contact-section .solid-link",
    surface: ".contact-section",
    path: HOME,
  },
];

for (const theme of THEMES) {
  test.describe(`Focus ring ink variant — ${theme}`, () => {
    test(
      "links inside the accent-filled sections resolve to --color-on-focus at or above 3:1",
      {
        tag: ["@critical", "@e2e", "@theme-state", `@THEME-STATE-INK-${theme}`],
      },
      async ({ page }) => {
        const ui = new ThemeStatePage(page);
        await ui.pinTheme(theme);

        for (const entry of INK_VARIANTS) {
          await ui.goto(entry.path);
          await expect.poll(() => ui.currentTheme()).toBe(theme);

          const focus = await ui.readState(entry.selector, STATE.FOCUS);
          const section = await ui.resolveBackground(entry.surface);
          const onFocus = await ui.tokenValue("--color-on-focus");
          const pair = `--color-on-focus (${onFocus}) on ${entry.surface}'s fill (${section})`;

          expect(
            focus.outlineColor,
            `${entry.selector} — ${theme}: the ink variant is declared by ` +
              `portfolio.css \`.about-section a:focus-visible, .contact-section a:focus-visible { outline-color: var(--portfolio-yellow-ink) }\`, ` +
              `which resolves to the same value as --color-on-focus`,
          ).toBe(toRgbString(onFocus));

          const ringRatio = ratio(
            composite(focus.outlineColor, section),
            section,
          );
          expect(
            ringRatio,
            `${entry.selector} — ${theme}: the ink ring must clear 1.4.11's 3:1 ` +
              `focus clause — ${pair} measures ${formatRatio(ringRatio)}:1`,
          ).toBeGreaterThanOrEqual(NON_TEXT_FLOOR);
        }
      },
    );
  });
}

function toRgbString(value: string): string {
  const colour = parseColor(value);
  return `rgb(${Math.round(colour.r)}, ${Math.round(colour.g)}, ${Math.round(
    colour.b,
  )})`;
}

/**
 * Forced-colors signals. Best practice, not a WCAG requirement: no success
 * criterion mentions `forced-colors`. Author backgrounds and borders are replaced
 * by the user agent, so each state carries a shape or a decoration instead.
 */
const FORCED_HOVER_OUTLINE: readonly { selector: string; path: string }[] = [
  { selector: ".module-row", path: HOME },
  { selector: ".card", path: PROJECT_DETAIL },
  { selector: ".nav-contact", path: HOME },
  { selector: ".circle-link", path: HOME },
  { selector: ".theme-toggle", path: HOME },
];

const FORCED_HOVER_DECORATION: readonly { selector: string; path: string }[] = [
  { selector: ".quiet-link", path: HOME },
  { selector: ".project-links a", path: HOME },
  { selector: ".desktop-nav a", path: HOME },
  { selector: ".site-footer > a", path: HOME },
];

const FORCED_PRESSED: readonly { selector: string; path: string }[] = [
  { selector: ".theme-toggle", path: HOME },
  { selector: ".module-row", path: HOME },
  { selector: ".solid-link", path: HOME },
  { selector: ".quiet-link", path: HOME },
  { selector: ".circle-link", path: HOME },
  { selector: ".project-links a", path: HOME },
  { selector: ".desktop-nav a", path: HOME },
  { selector: ".nav-contact", path: HOME },
  { selector: ".site-footer > a", path: HOME },
  { selector: ".contact-social a", path: HOME },
];

test.describe("Forced-colors signals (best practice, not a WCAG requirement)", () => {
  test(
    "rows, cards and controls that signal hover through colour keep a solid outline",
    {
      tag: [
        "@critical",
        "@e2e",
        "@theme-state",
        "@THEME-STATE-FORCED-HOVER-OUTLINE",
      ],
    },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      for (const theme of THEMES) {
        await page.emulateMedia({ forcedColors: "active" });
        await ui.pinTheme(theme);
        for (const entry of FORCED_HOVER_OUTLINE) {
          await ui.goto(entry.path);
          expect(
            await ui.forcedColorsActive(),
            `${entry.selector} — ${theme}: forcedColors: "active" must be emulated ` +
              `before the read; without it this asserts the default palette instead`,
          ).toBe(true);

          const hover = await ui.readState(entry.selector, STATE.HOVER);
          expect(
            hover.outlineStyle,
            `${entry.selector} — ${theme}: portfolio.css's ` +
              `@media (forced-colors: active) block gives the hovered element an ` +
              `outline, because the agent forces its border and background colour ` +
              `away — outline-style ${hover.outlineStyle}, outline-width ` +
              `${hover.outlineWidth}`,
          ).toBe("solid");
        }
      }
    },
  );

  test(
    "text links that signal hover through colour keep an underline",
    {
      tag: [
        "@critical",
        "@e2e",
        "@theme-state",
        "@THEME-STATE-FORCED-HOVER-TEXT",
      ],
    },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      for (const theme of THEMES) {
        await page.emulateMedia({ forcedColors: "active" });
        await ui.pinTheme(theme);
        for (const entry of FORCED_HOVER_DECORATION) {
          await ui.goto(entry.path);
          expect(
            await ui.forcedColorsActive(),
            `${entry.selector} — ${theme}: forcedColors: "active" must be live`,
          ).toBe(true);

          const hover = await ui.readState(entry.selector, STATE.HOVER);
          expect(
            hover.textDecorationLine,
            `${entry.selector} — ${theme}: the forced-colors block keeps ` +
              `text-decoration: underline as the hover signal — ` +
              `text-decoration-line ${hover.textDecorationLine}`,
          ).toContain("underline");
        }
      }
    },
  );

  test(
    "pressed controls keep a dashed outline, so press is distinguishable from hover",
    {
      tag: ["@critical", "@e2e", "@theme-state", "@THEME-STATE-FORCED-PRESSED"],
    },
    async ({ page }) => {
      const ui = new ThemeStatePage(page);
      for (const theme of THEMES) {
        await page.emulateMedia({ forcedColors: "active" });
        await ui.pinTheme(theme);
        for (const entry of FORCED_PRESSED) {
          await ui.goto(entry.path);
          expect(
            await ui.forcedColorsActive(),
            `${entry.selector} — ${theme}: forcedColors: "active" must be live`,
          ).toBe(true);

          const active = await ui.readState(entry.selector, STATE.ACTIVE);
          expect(
            active.outlineStyle,
            `${entry.selector} — ${theme}: the forced-colors block marks every ` +
              `press with a dashed outline, which distinguishes it from the solid ` +
              `hover outline without colour — outline-style ` +
              `${active.outlineStyle}, outline-width ${active.outlineWidth}`,
          ).toBe("dashed");
        }
      }
    },
  );
});
