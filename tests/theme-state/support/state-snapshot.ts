import type { Locator } from "@playwright/test";
import {
  backgroundChain,
  composite,
  parseColor,
  ratio,
  resolveBackground,
  toCss,
} from "../../support/contrast";
import type { InteractionState, StateRead } from "./state-model";

/**
 * Reads the computed state of `locator` as it stands right now — no pointer, focus
 * or scroll is touched here, so the caller owns how the state was reached (a mouse
 * press through `ThemeStatePage.readState`, or a touch held through CDP in the
 * touch-press spec). Both paths share this one read, so their results stay
 * comparable through `stateDifferences`.
 */
export async function readComputedState(
  locator: Locator,
  selector: string,
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
