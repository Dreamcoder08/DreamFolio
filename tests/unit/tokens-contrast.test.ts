import { test } from "node:test";
import assert from "node:assert/strict";
import {
  composite,
  formatRatio,
  ratio,
  relativeLuminance,
} from "../support/contrast.ts";
import { DECLARED, MODES, dark, token } from "./support/theme-tokens.ts";

/**
 * Token contract, contrast half: the A7 state and border floors measured on
 * the declared literals, and the A8 ordering of the state steps.
 */

interface ContrastFloor {
  readonly mode: (typeof MODES)[number];
  readonly foreground: string;
  readonly background: string;
  readonly floor: number;
  readonly role: string;
}

/**
 * Design §1.1's floors, all computed from the declared literals. The dark border
 * set is the change's self-imposed floor and carries no conformance claim; the
 * light border ratios stay at their shipped levels and are recorded as accepted
 * debt, so no light border floor appears here.
 */
const FLOORS: readonly ContrastFloor[] = [
  {
    mode: "dark",
    foreground: "--color-text",
    background: "--color-surface-hover",
    floor: 4.5,
    role: "label on the hovered state step",
  },
  {
    mode: "dark",
    foreground: "--color-text",
    background: "--color-surface-active",
    floor: 4.5,
    role: "label on the pressed state step",
  },
  {
    mode: "dark",
    foreground: "--color-on-accent",
    background: "--color-accent-hover",
    floor: 4.5,
    role: "ink on the hovered accent fill",
  },
  {
    mode: "dark",
    foreground: "--color-on-accent",
    background: "--color-accent-active",
    floor: 4.5,
    role: "ink on the pressed accent fill",
  },
  {
    mode: "dark",
    foreground: "--color-text-tertiary",
    background: "--color-surface",
    floor: 4.5,
    role: "tertiary ink on the canvas",
  },
  {
    mode: "dark",
    foreground: "--color-text-tertiary",
    background: "--color-surface-alt",
    floor: 4.5,
    role: "tertiary ink on the card",
  },
  {
    mode: "dark",
    foreground: "--color-focus",
    background: "--color-surface",
    floor: 3,
    role: "focus ring vs the canvas (1.4.11 focus clause)",
  },
  {
    mode: "dark",
    foreground: "--color-on-focus",
    background: "--color-accent",
    floor: 3,
    role: "ink focus ring on an accent fill",
  },
  {
    mode: "dark",
    foreground: "--color-border-interactive",
    background: "--color-surface",
    floor: 3,
    role: "interactive border on the canvas",
  },
  {
    mode: "dark",
    foreground: "--color-border-interactive",
    background: "--color-surface-alt",
    floor: 3,
    role: "interactive border on the card",
  },
  {
    mode: "dark",
    foreground: "--color-border-interactive",
    background: "--color-surface-elevated",
    floor: 3,
    role: "interactive border on the overlay",
  },
  {
    mode: "light",
    foreground: "--color-text",
    background: "--color-surface-hover",
    floor: 4.5,
    role: "label on the hovered state step",
  },
  {
    mode: "light",
    foreground: "--color-text",
    background: "--color-surface-active",
    floor: 4.5,
    role: "label on the pressed state step",
  },
  {
    mode: "light",
    foreground: "--color-on-accent",
    background: "--color-accent-hover",
    floor: 4.5,
    role: "ink on the hovered accent fill",
  },
  {
    mode: "light",
    foreground: "--color-on-accent",
    background: "--color-accent-active",
    floor: 4.5,
    role: "ink on the pressed accent fill",
  },
  {
    mode: "light",
    foreground: "--color-text-tertiary",
    background: "--color-surface",
    floor: 4.5,
    role: "tertiary ink on the canvas",
  },
  {
    mode: "light",
    foreground: "--color-text-tertiary",
    background: "--color-surface-elevated",
    floor: 4.5,
    role: "tertiary ink on the overlay",
  },
  {
    mode: "light",
    foreground: "--color-focus",
    background: "--color-surface",
    floor: 3,
    role: "focus ring vs the canvas (1.4.11 focus clause)",
  },
  {
    mode: "light",
    foreground: "--color-on-focus",
    background: "--color-accent",
    floor: 3,
    role: "ink focus ring on an accent fill",
  },
];

test("A7: the state and border contrast floors hold on the declared literals", () => {
  for (const floor of FLOORS) {
    const declared = DECLARED[floor.mode];
    const foreground = token(declared, floor.foreground);
    const background = token(declared, floor.background);
    const measured = ratio(composite(foreground, background), background);
    assert.ok(
      measured >= floor.floor,
      `${floor.mode}: ${floor.foreground} ${foreground} on ${floor.background} ` +
        `${background} (${floor.role}) measures ${formatRatio(measured)}:1, ` +
        `below the ${floor.floor}:1 floor`,
    );
  }
});

test("A7: the hovered interactive border is a step above the resting one in dark", () => {
  for (const surface of [
    "--color-surface",
    "--color-surface-alt",
    "--color-surface-elevated",
  ]) {
    const background = token(dark, surface);
    const rest = ratio(
      composite(token(dark, "--color-border-interactive"), background),
      background,
    );
    const hover = ratio(
      composite(token(dark, "--color-border-interactive-hover"), background),
      background,
    );
    assert.ok(
      hover >= rest,
      `dark: --color-border-interactive-hover on ${surface} (${background}) ` +
        `measures ${formatRatio(hover)}:1 against ` +
        `--color-border-interactive's ${formatRatio(rest)}:1 — the hovered border ` +
        `must be a step above the resting one`,
    );
  }
});

test("A8: the state steps are real and ordered, per mode", () => {
  for (const mode of MODES) {
    const declared = DECLARED[mode];
    const surface = relativeLuminance(token(declared, "--color-surface"));
    const hover = relativeLuminance(token(declared, "--color-surface-hover"));
    const active = relativeLuminance(token(declared, "--color-surface-active"));
    const elevated = relativeLuminance(
      token(declared, "--color-surface-elevated"),
    );

    assert.notEqual(
      hover,
      surface,
      `${mode}: --color-surface-hover must not share --color-surface's luminance ` +
        `(${token(declared, "--color-surface")} vs ` +
        `${token(declared, "--color-surface-hover")}) — the step would be invisible`,
    );
    assert.notEqual(
      active,
      hover,
      `${mode}: --color-surface-active must not share --color-surface-hover's ` +
        `luminance (${token(declared, "--color-surface-hover")} vs ` +
        `${token(declared, "--color-surface-active")})`,
    );

    if (mode === "dark") {
      assert.ok(
        hover > elevated,
        `dark: --color-surface-hover must sit above --color-surface-elevated, so ` +
          `the state step is visible on the canvas, on cards and on overlays — ` +
          `elevated ${token(declared, "--color-surface-elevated")}`,
      );
      assert.ok(
        active > elevated,
        `dark: --color-surface-active must sit above --color-surface-elevated — ` +
          `elevated ${token(declared, "--color-surface-elevated")}`,
      );
    }
  }
});
