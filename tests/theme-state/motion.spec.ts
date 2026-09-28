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
 * Do not "simplify" these files back under the lever — no `reducedMotion: "reduce"`
 * here, and nothing may route them through `ThemeStatePage.goto`, which applies the
 * lever. They assert the other end of the same axis, and the reduced-motion end is
 * pinned in `motion-reduced.spec.ts`, so one contract keeps both ends covered.
 * The lever is asserted live before every read instead. The `.module-row`
 * contract and its reveal trace live in `motion-module-row.spec.ts`; the shared
 * reads are in `support/motion-read.ts` and `support/motion-page.ts`.
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

import { test, expect } from "@playwright/test";
import { TARGETS } from "./support/interactive-set";
import {
  changedProperties,
  coverageGaps,
  describeRead,
  readState,
} from "./support/motion-read";
import {
  DARK,
  parkPointer,
  prepare,
  readHover,
  readPress,
} from "./support/motion-page";

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
