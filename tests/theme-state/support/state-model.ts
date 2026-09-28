import { formatRatio } from "../../support/contrast";

/**
 * The vocabulary every theme-state spec shares: the themes, interaction states and
 * viewports a read is taken under, and the shape of one computed-state read.
 */

/** The key `public/theme-init.js` reads before the first paint. */
export const THEME_STORAGE_KEY = "dreamfolio-theme";

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
