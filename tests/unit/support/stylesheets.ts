// The comment-stripped source of every hand-authored stylesheet the token
// and composition contract tests read, plus the fixed list a few of those
// tests iterate over.
import { at, strip } from "./css-parsing.ts";
import { readCssInlined } from "./css-imports.ts";

// global.css is an ordered `@import` list of its partials (base.css,
// tokens/components.css, …); readCssInlined resolves them recursively, in
// source order, so the contracts read the one effective global sheet no
// matter how it is split.
export const GLOBAL = strip(readCssInlined("src/styles/global.css"));
// portfolio.css is itself only an ordered list of `@import "./portfolio/…";`
// lines; readCssInlined resolves them recursively so this constant is the
// exact same effective text it was before the split.
export const PORTFOLIO = strip(readCssInlined("src/styles/portfolio.css"));
export const CONSOLE_CSS = strip(at("src/styles/components/console.css"));
export const TERMINAL_CSS = strip(at("src/styles/components/terminal.css"));

// src/styles/tokens/components.css (the --terminal-* token partial) is not a
// SHEETS entry of its own: global.css imports it, so GLOBAL already carries
// its text.
export const SHEETS = [
  ["src/styles/global.css (imports inlined)", GLOBAL],
  ["src/styles/portfolio.css", PORTFOLIO],
  ["src/styles/components/console.css", CONSOLE_CSS],
  ["src/styles/components/terminal.css", TERMINAL_CSS],
] as const;
