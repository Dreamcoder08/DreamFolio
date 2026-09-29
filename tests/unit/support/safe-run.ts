// Shared harness for the scripts/safe-run.sh tests: spawns the real script
// against fake thermal zones (SAFE_THERMAL_GLOB), never real hardware, and
// polls its stderr. Kept here so the lifecycle and liveness test files don't
// each re-derive process and systemd plumbing.
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
export const SCRIPT = join(ROOT, "scripts/safe-run.sh");
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hasUserSystemd(): boolean {
  const probe = spawnSync(
    "systemd-run",
    ["--user", "--scope", "--quiet", "true"],
    { stdio: "ignore" },
  );
  return probe.status === 0;
}
/** `false` where freeze/thaw can really run, else a skip reason. */
export const skip = hasUserSystemd()
  ? false
  : "no user systemd manager available (`systemd-run --user --scope true` failed) — CI has none";

export function tmpDir(prefix = "safe-run-zones-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** Streams a child's stderr into a growing string so tests can poll it. */
export function collectStderr(child: ChildProcess): { text: string } {
  const state = { text: "" };
  child.stderr?.on("data", (chunk: Buffer) => {
    state.text += chunk.toString();
  });
  return state;
}

export async function waitUntil(
  predicate: () => boolean,
  timeoutMs: number,
  description: string,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`timed out waiting for: ${description}`);
    }
    await sleep(50);
  }
}

export function listSafeRunUnits(pattern = "safe-run-*"): string[] {
  const result = spawnSync(
    "systemctl",
    ["--user", "list-units", pattern, "--no-legend", "--plain"],
    { encoding: "utf8" },
  );
  return (result.stdout ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

/** Resolves with the exit code, at once if the child already exited. */
export function exitOf(child: ChildProcess): Promise<number | null> {
  if (hasExited(child)) return Promise.resolve(child.exitCode);
  return new Promise((resolve) => child.once("exit", (code) => resolve(code)));
}

/**
 * Ends a still-running probe child cleanly so its scope can't linger into
 * the next test — without this, a later test's "did a scope appear" check
 * can match a previous test's not-yet-garbage-collected scope instead of
 * its own. A child that already exited resolves immediately: its "exit"
 * event has fired and will never fire again.
 */
export async function killAndWait(child: ChildProcess): Promise<void> {
  if (hasExited(child)) return;
  const exited = exitOf(child);
  child.kill("SIGTERM");
  await exited;
}

/** Spawns safe-run with `env` layered over the test's environment. */
export function spawnSafeRun(
  args: string[],
  env: Record<string, string>,
): { child: ChildProcess; out: { text: string } } {
  const child = spawn("bash", [SCRIPT, ...args], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "ignore", "pipe"],
  });
  return { child, out: collectStderr(child) };
}

/** Occurrences of `pattern` (a global regex) in `text`. */
export const count = (text: string, pattern: RegExp) =>
  (text.match(pattern) ?? []).length;
