// Generic, repo-agnostic CSS import inliner. A stylesheet that splits into
// ordered partials keeps only `@import "./partial.css";` lines at its own
// path; a test that used to read that stylesheet's text in one `readFileSync`
// call needs the exact same effective text back, with every partial's
// content substituted in source order. This is the one place that knowledge
// lives, so every test that reads a possibly-split stylesheet goes through it
// instead of re-deriving its own inlining.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

// Matches a whole-line `@import "…";` (or `'…'`) statement — the only form
// this repo's split stylesheets use: no `layer(...)`, no media query, no
// `url(...)` wrapper. Anything else is left exactly as written, since
// inlining a conditional or layered import would change what the text means
// rather than just where it lives.
const IMPORT_LINE = /^[ \t]*@import\s+["']([^"']+)["']\s*;[ \t]*$/gm;

/**
 * Reads `relPath` (repo-root-relative) with every relative `@import "…";`
 * line recursively replaced by the imported file's own inlined text, in
 * source order. A non-relative specifier (no leading `./` or `../`) is left
 * untouched rather than resolved, since this repo's own stylesheets never
 * import one and guessing a resolution algorithm for it would be unfounded.
 */
export function readCssInlined(relPath: string): string {
  return inline(join(ROOT, relPath));
}

function inline(absPath: string): string {
  const css = readFileSync(absPath, "utf8");
  const dir = dirname(absPath);
  return css.replace(IMPORT_LINE, (whole, specifier: string) => {
    if (!specifier.startsWith(".")) return whole;
    return inline(join(dir, specifier));
  });
}
