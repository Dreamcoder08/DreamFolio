import { HOME, PROJECT_DETAIL } from "./fixtures";
import { VIEWPORT, type Viewport } from "./state-model";

/**
 * The design's interactive set. The contrast harness (`theme-state.spec.ts`) and
 * the motion harness (`motion.spec.ts`) both read this one list, so the contrast
 * contract and the motion contract read the same elements and cannot drift apart.
 */
export interface Target {
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

export const TARGETS: readonly Target[] = [
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
