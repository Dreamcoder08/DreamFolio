import { test, expect } from "@playwright/test";
import { TARGETS } from "./support/interactive-set";
import { describeRead, readState } from "./support/motion-read";
import { DARK, prepare, prepareReveal, readHover } from "./support/motion-page";
import { traceReveal } from "./support/reveal-trace";

/**
 * `.module-row`'s motion contract under the scroll-driven narrative: the winning
 * declaration, the retired stagger, and the reveal itself. Runs without the
 * reduced-motion lever, like `motion.spec.ts`.
 */

test.describe("Motion coverage — .module-row", () => {
  test(
    "its winning declaration keeps the interaction properties once the scroll-driven narrative owns the reveal",
    {
      tag: ["@critical", "@e2e", "@motion", "@MOTION-MODULE-ROW-MERGE"],
    },
    async ({ page }) => {
      // This contract only holds under the scroll-driven narrative's
      // `@supports (animation-timeline: view())` gate; without it the plain
      // IntersectionObserver reveal owns opacity/transform again.
      test.skip(
        !(await page.evaluate(() =>
          CSS.supports("animation-timeline", "view()"),
        )),
        "browser lacks animation-timeline: view() support",
      );
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
      // This contract only holds under the scroll-driven narrative's
      // `@supports (animation-timeline: view())` gate; without it the plain
      // IntersectionObserver reveal owns opacity/transform again.
      test.skip(
        !(await page.evaluate(() =>
          CSS.supports("animation-timeline", "view()"),
        )),
        "browser lacks animation-timeline: view() support",
      );
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
      // This contract only holds under the scroll-driven narrative's
      // `@supports (animation-timeline: view())` gate; without it the plain
      // IntersectionObserver reveal owns opacity/transform again.
      test.skip(
        !(await page.evaluate(() =>
          CSS.supports("animation-timeline", "view()"),
        )),
        "browser lacks animation-timeline: view() support",
      );
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
