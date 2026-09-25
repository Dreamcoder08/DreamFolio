#!/usr/bin/env node
// Fails CI when a tracked file exceeds its line budget. Existing offenders
// are ratcheted through the allowlist in file-size-budget.json: their
// ceiling can only be lowered as files shrink, never raised, so debt cannot
// silently grow.
//
// Usage: node scripts/check-file-size.mjs [--update-allowlist]
//   --update-allowlist rewrites ceilings down to current counts and drops
//   entries now within budget. It never raises a ceiling or adds a new
//   entry — a genuinely new offender requires a human to edit the config.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkBudget, findRule } from "./lib/file-budget.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONFIG_PATH = new URL("./file-size-budget.json", import.meta.url);

function countLines(path) {
  const text = readFileSync(new URL(path, `file://${ROOT}`), "utf8");
  if (text.length === 0) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function loadFiles() {
  const tracked = execSync("git ls-files", { cwd: ROOT })
    .toString()
    .split("\n")
    .filter(Boolean);
  return tracked.map((path) => ({ path, lines: countLines(path) }));
}

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const files = loadFiles();
const { violations, staleAllowlist } = checkBudget(files, config);

const updateAllowlist = process.argv.includes("--update-allowlist");

if (updateAllowlist) {
  const byPath = new Map(files.map((file) => [file.path, file]));
  // Lower each ceiling to the current line count (never raise it), drop
  // entries for files that vanished, and drop entries whose file now fits
  // its rule's own max unaided. Never adds a new entry.
  const kept = config.allowlist
    .filter((entry) => byPath.has(entry.path))
    .map((entry) => ({
      ...entry,
      ceiling: Math.min(entry.ceiling, byPath.get(entry.path).lines),
    }))
    .filter((entry) => {
      const rule = findRule(entry.path, config.rules);
      const lines = byPath.get(entry.path).lines;
      return rule ? lines > rule.max : false;
    });
  const next = { ...config, allowlist: kept };
  writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `Updated allowlist: ${config.allowlist.length} -> ${kept.length} entries.`,
  );
  process.exit(0);
}

if (violations.length === 0 && staleAllowlist.length === 0) {
  console.log(
    `file-size-budget: all ${files.length} tracked files are within budget.`,
  );
  process.exit(0);
}

if (violations.length > 0) {
  console.error(`\nFile size budget violations (${violations.length}):`);
  for (const v of violations) {
    const over = v.lines - (v.ceiling ?? v.max);
    console.error(
      `  ${v.path}: ${v.lines} lines (budget ${v.max}${v.ceiling ? `, ceiling ${v.ceiling}` : ""}), ${over} over`,
    );
  }
}

if (staleAllowlist.length > 0) {
  console.error(`\nStale allowlist entries (${staleAllowlist.length}):`);
  for (const s of staleAllowlist) {
    console.error(`  ${s.path}: ${s.reason}`);
  }
  console.error(
    "\nRun `node scripts/check-file-size.mjs --update-allowlist` to lower or remove these.",
  );
}

process.exit(1);
