import type { Page } from "@playwright/test";

/**
 * The motion harness's read: which probed properties an element's state changes,
 * and whether its computed transition list covers each of them with a non-zero
 * duration. See `motion.spec.ts` for the contract this measures.
 */

/**
 * The properties a state can signal through, and the computed name each is read
 * back as. `border-radius` is included because a state-driven radius mutation is
 * the same defect class; `outline-*` is excluded (see the `motion.spec.ts` header).
 */
const PROBES: readonly {
  readonly css: string;
  readonly computed: string;
}[] = [
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

export interface MotionRead {
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

export async function readState(
  page: Page,
  selector: string,
): Promise<MotionRead> {
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
export function changedProperties(
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
export function coverageGaps(
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

export function describeRead(read: MotionRead): string {
  return (
    `transition-property=[${read.properties.join(", ")}] ` +
    `durations=[${read.durationsMs.join(", ")}]ms ` +
    `delays=[${read.delaysMs.join(", ")}]ms`
  );
}
