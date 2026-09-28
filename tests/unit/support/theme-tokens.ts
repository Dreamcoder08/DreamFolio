// The parsed `--color-*` token maps of both themes, shared by the token
// contract tests. Reads the `@theme` block and the `--color-*`-declaring
// `[data-theme="light"]` block — never the second light block that only sets
// `color-scheme`, which a naive regex would pick up.
import { blocks } from "./css-parsing.ts";
import { GLOBAL } from "./stylesheets.ts";

function tokens(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, key, value] of css.matchAll(
    /(--color-[\w-]+)\s*:\s*([^;]+);/g,
  )) {
    map.set(key, value.trim());
  }
  return map;
}

export const dark = tokens(blocks(GLOBAL, /@theme\s*\{/g)[0]);
export const light = tokens(
  blocks(GLOBAL, /\[data-theme="light"\]\s*\{/g).find((b) =>
    b.includes("--color-"),
  ) ?? "",
);

export const KEYS =
  `--color-surface --color-surface-alt --color-surface-elevated --color-surface-hover
--color-surface-active --color-text --color-text-secondary --color-text-tertiary
--color-accent --color-accent-muted --color-accent-hover --color-accent-active
--color-on-accent --color-border --color-border-strong --color-border-interactive
--color-border-interactive-hover --color-focus --color-on-focus
--color-danger --color-on-danger`.split(/\s+/);

export const MODES = ["dark", "light"] as const;
export const DECLARED: Record<(typeof MODES)[number], Map<string, string>> = {
  dark,
  light,
};

export function token(declared: Map<string, string>, key: string): string {
  const value = declared.get(key);
  if (value === undefined) {
    throw new Error(`${key} is not declared in this mode`);
  }
  return value;
}
