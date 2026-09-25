// Repo-tree walking helpers shared by tests that need to scan source files
// for a pattern (a token consumer, a banned call, a stale literal).
import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export const TEXT_EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".txt",
]);

/** Every file path under `relative` (repo-root-relative), recursively. */
export function walk(relative: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(join(ROOT, relative), {
    withFileTypes: true,
  })) {
    const next = `${relative}/${entry.name}`;
    if (entry.isDirectory()) found.push(...walk(next));
    else found.push(next);
  }
  return found;
}

/** Every text file under `relative`, concatenated: a consumer may live in any of them. */
export function readTree(relative: string): string {
  return walk(relative)
    .filter((path) => TEXT_EXTENSIONS.has(extname(path)))
    .map((path) => readFileSync(join(ROOT, path), "utf8"))
    .join("\n");
}
