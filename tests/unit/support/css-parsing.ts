// Generic, repo-agnostic CSS text-parsing helpers shared by the token and
// composition contract tests. None of these know about this project's own
// selectors or token names — that knowledge stays in the test files that
// call them.
import { readFileSync } from "node:fs";

/** Reads a file relative to the repo root (two levels up from this file). */
export const at = (rel: string) =>
  readFileSync(new URL(`../../../${rel}`, import.meta.url), "utf8");

/** Strips /* ... *\/ comments so they can't hide inside a matched block. */
export const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** The brace-balanced body of the block whose `{` sits at index `open`. */
export function body(css: string, open: number): string {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && (depth -= 1) === 0)
      return css.slice(open + 1, i);
  }
  throw new Error("unbalanced block");
}

/** Every block body whose header matches `header` (a global regex). */
export function blocks(css: string, header: RegExp): string[] {
  const out: string[] = [];
  for (const match of css.matchAll(header)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    if (css[open] !== "{") {
      throw new Error(`expected "{" at index ${open}`);
    }
    out.push(body(css, open));
  }
  return out;
}

/** Every `property: value;` declaration in `css` whose property is in `names`. */
export function declarations(css: string, names: Set<string>) {
  const out: { property: string; value: string }[] = [];
  for (const chunk of css.split(/[;{}]/)) {
    const match = /^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(chunk);
    if (match && names.has(match[1])) {
      out.push({ property: match[1], value: match[2].replace(/\s+/g, " ") });
    }
  }
  return out;
}

/** The argument lists of every top-level `color-mix(...)` call in `css`. */
export function colorMixes(css: string): string[] {
  const mixes: string[] = [];
  const marker = "color-mix(";
  let index = css.indexOf(marker);
  while (index !== -1) {
    let depth = 0;
    let cursor = index + marker.length - 1;
    for (; cursor < css.length; cursor += 1) {
      if (css[cursor] === "(") depth += 1;
      else if (css[cursor] === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    mixes.push(css.slice(index + marker.length, cursor));
    index = css.indexOf(marker, cursor);
  }
  return mixes;
}

/** Splits a function-argument list on top-level commas (parens don't count). */
export function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  parts.push(current.trim());
  return parts.filter((part) => part !== "");
}

/** Escapes a literal string for use inside a `new RegExp(...)` selector match. */
export function escapeSelector(selector: string): string {
  return selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalises whitespace around a CSS declaration so two equivalent
 *  spellings compare equal. */
export function normalise(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*:\s*/g, ": ")
    .trim();
}
