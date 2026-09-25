// The comment-stripped source of every hand-authored stylesheet the token
// and composition contract tests read, plus the fixed list a few of those
// tests iterate over.
import { at, strip } from "./css-parsing.ts";
import { readCssInlined } from "./css-imports.ts";

// global.css imports base.css (its `@layer base` block, split out for size),
// so the contracts read them as one global sheet.
export const GLOBAL =
  strip(at("src/styles/global.css")) + "\n" + strip(at("src/styles/base.css"));
// portfolio.css is itself only an ordered list of `@import "./portfolio/…";`
// lines; readCssInlined resolves them recursively so this constant is the
// exact same effective text it was before the split.
export const PORTFOLIO = strip(readCssInlined("src/styles/portfolio.css"));
export const CONSOLE_CSS = strip(at("src/styles/components/console.css"));
export const TERMINAL_CSS = strip(at("src/styles/components/terminal.css"));

// src/styles/tokens/components.css (the --terminal-* token partial moved out
// of global.css) is deliberately not a SHEETS entry: the A11 color-mix()
// composition test requires every SHEETS file to declare at least one
// color-mix(), and the token partial declares none (it only aliases
// --color-* via var()). Its var(--color-*) references are still covered by
// A3/A5, which walk all of src/ rather than this fixed list.
export const SHEETS = [
  ["src/styles/global.css + base.css", GLOBAL],
  ["src/styles/portfolio.css", PORTFOLIO],
  ["src/styles/components/console.css", CONSOLE_CSS],
  ["src/styles/components/terminal.css", TERMINAL_CSS],
] as const;
