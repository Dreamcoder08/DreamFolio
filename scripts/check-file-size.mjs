#!/usr/bin/env node
// Fails CI when a tracked file exceeds its line budget. Existing offenders
// are ratcheted through the allowlist in file-size-budget.json: their
// ceiling can only be lowered as files shrink, never raised, so debt cannot
// silently grow.
//
// Usage: node scripts/check-file-size.mjs [--update-allowlist]
//   --update-allowlist rewrites ceilings down to current counts and drops
//   entries now within budget, missing, or matching no rule. It never
//   raises a ceiling or adds a new entry, and it still exits 1 if
//   violations remain after the rewrite.
import { execSync } from "node:child_process";
import { lstatSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkBudget,
  countLines,
  findRule,
  updateAllowlist,
} from "./lib/file-budget.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");
const CONFIG_PATH = join(SCRIPT_DIR, "file-size-budget.json");

function listTrackedPaths() {
  // -z gives raw, NUL-separated paths: normal `git ls-files` output quotes
  // non-ASCII names (core.quotePath) into escape sequences that would
  // corrupt them if read as plain text, so this is the only safe split.
  const out = execSync("git ls-files -z", {
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.toString("utf8").split("\0").filter(Boolean);
}

/**
 * Reads only files that match a budget rule — never touches the filesystem
 * for an unbudgeted path. lstat first and skip anything that isn't a plain
 * file (a symlink, a submodule gitlink, or a path missing from the working
 * tree even though it's tracked); a read failure on a file that *did* lstat
 * as regular is collected as a reported error instead of throwing.
 */
function readBudgetedFiles(paths, rules) {
  const files = [];
  const errors = [];
  for (const path of paths) {
    if (!findRule(path, rules)) continue;
    const abs = join(ROOT, path);
    let stat;
    try {
      stat = lstatSync(abs);
    } catch {
      continue; // tracked but absent from the working tree
    }
    if (!stat.isFile()) continue; // symlink, gitlink/submodule, etc.
    try {
      files.push({ path, lines: countLines(readFileSync(abs, "utf8")) });
    } catch (error) {
      errors.push({ path, message: error.message });
    }
  }
  return { files, errors };
}

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const paths = listTrackedPaths();
const { files, errors } = readBudgetedFiles(paths, config.rules);

if (errors.length > 0) {
  console.error(`\nCould not read ${errors.length} budgeted file(s):`);
  for (const e of errors) console.error(`  ${e.path}: ${e.message}`);
}

const updating = process.argv.includes("--update-allowlist");
if (updating) {
  const kept = updateAllowlist(files, config);
  config.allowlist = kept;
  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Updated allowlist: ${kept.length} entries remain.`);
}

const { violations, staleAllowlist } = checkBudget(files, config);

if (
  violations.length === 0 &&
  staleAllowlist.length === 0 &&
  errors.length === 0
) {
  console.log(
    `file-size-budget: all ${files.length} budgeted files are within budget.`,
  );
  process.exit(0);
}

if (violations.length > 0) {
  console.error(`\nFile size budget violations (${violations.length}):`);
  for (const v of violations) {
    const hasCeiling = v.ceiling != null;
    const over = v.lines - (hasCeiling ? v.ceiling : v.max);
    console.error(
      `  ${v.path}: ${v.lines} lines (budget ${v.max}${hasCeiling ? `, ceiling ${v.ceiling}` : ""}), ${over} over`,
    );
  }
}

if (staleAllowlist.length > 0) {
  console.error(`\nStale allowlist entries (${staleAllowlist.length}):`);
  for (const s of staleAllowlist) console.error(`  ${s.path}: ${s.reason}`);
  if (!updating) {
    console.error(
      "\nRun `node scripts/check-file-size.mjs --update-allowlist` to lower or remove these.",
    );
  }
}

process.exit(1);
