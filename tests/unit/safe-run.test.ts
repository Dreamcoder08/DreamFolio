import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Coverage for the thermal watchdog's process lifecycle: clean shutdown on a
 * signal (no orphaned cgroup), a bounded freeze so a stuck-hot or sensorless
 * machine can't hang a run forever, and strict threshold validation so a
 * typo never silently disables protection.
 *
 * These spawn real `bash scripts/safe-run.sh` processes against a fake
 * thermal zone (SAFE_THERMAL_GLOB), never real hardware — so they run at
 * whatever temperature the machine actually is. Freeze/thaw and "leaves no
 * scope" need a real user systemd manager; where `systemd-run --user --scope
 * true` fails (CI has none), those tests skip with a reason instead of
 * failing.
 */

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCRIPT = join(ROOT, "scripts/safe-run.sh");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hasUserSystemd(): boolean {
  const probe = spawnSync(
    "systemd-run",
    ["--user", "--scope", "--quiet", "true"],
    { stdio: "ignore" },
  );
  return probe.status === 0;
}
const HAS_SYSTEMD = hasUserSystemd();
const skip = HAS_SYSTEMD
  ? false
  : "no user systemd manager available (`systemd-run --user --scope true` failed) — CI has none";

function tmpZoneDir(): string {
  return mkdtempSync(join(tmpdir(), "safe-run-zones-"));
}

/** Streams a child's stderr into a growing string so tests can poll it. */
function collectStderr(child: ChildProcess): { text: string } {
  const state = { text: "" };
  child.stderr?.on("data", (chunk: Buffer) => {
    state.text += chunk.toString();
  });
  return state;
}

async function waitUntil(
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

function listSafeRunUnits(pattern = "safe-run-*"): string[] {
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

/**
 * Ends a still-running probe child cleanly so its scope can't linger into
 * the next test — without this, a later test's "did a scope appear" check
 * can match a previous test's not-yet-garbage-collected scope instead of
 * its own.
 */
async function killAndWait(child: ChildProcess): Promise<void> {
  const exited = new Promise<void>((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  await exited;
}

test("exit status passes through from the wrapped command", () => {
  const result = spawnSync("bash", [SCRIPT, "bash", "-c", "exit 7"], {
    env: { ...process.env, SAFE_THERMAL_GLOB: "/no/such/thermal_zone*/temp" },
    encoding: "utf8",
  });
  assert.equal(result.status, 7, result.stderr);
});

test(
  "an unreadable or empty thermal zone is ignored, not fatal",
  { skip },
  async () => {
    const dir = tmpZoneDir();
    try {
      writeFileSync(join(dir, "zone_empty"), "");
      mkdirSync(join(dir, "zone_isdir")); // matches the glob but cat fails EISDIR
      writeFileSync(join(dir, "zone_ok"), "40000"); // well under any pause threshold
      const result = spawnSync("bash", [SCRIPT, "sleep", "2"], {
        env: {
          ...process.env,
          SAFE_THERMAL_GLOB: join(dir, "zone_*"),
          SAFE_TEMP_PAUSE: "80000",
          SAFE_TEMP_RESUME: "70000",
        },
        encoding: "utf8",
        timeout: 15_000,
      });
      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(result.stderr ?? "", /paused/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test("invalid thresholds exit 2 with a clear message, never run unguarded", () => {
  const nonInteger = spawnSync("bash", [SCRIPT, "true"], {
    env: { ...process.env, SAFE_TEMP_PAUSE: "hot" },
    encoding: "utf8",
  });
  assert.equal(nonInteger.status, 2);
  assert.match(nonInteger.stderr, /SAFE_TEMP_PAUSE/);

  const inverted = spawnSync("bash", [SCRIPT, "true"], {
    env: {
      ...process.env,
      SAFE_TEMP_PAUSE: "50000",
      SAFE_TEMP_RESUME: "60000",
    },
    encoding: "utf8",
  });
  assert.equal(inverted.status, 2);
  assert.match(inverted.stderr, /SAFE_TEMP_PAUSE.*SAFE_TEMP_RESUME/s);
});

test(
  "pauses when the fake zone goes hot, resumes once it cools",
  { skip },
  async () => {
    const dir = tmpZoneDir();
    const zone = join(dir, "temp");
    writeFileSync(zone, "90000"); // hot from the start
    const child = spawn("bash", [SCRIPT, "sleep", "3"], {
      env: {
        ...process.env,
        SAFE_THERMAL_GLOB: zone,
        SAFE_TEMP_PAUSE: "80000",
        SAFE_TEMP_RESUME: "70000",
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    const out = collectStderr(child);
    try {
      await waitUntil(
        () => /paused until below/.test(out.text),
        5_000,
        "the pause message",
      );
      writeFileSync(zone, "40000"); // cool it down mid-run
      await waitUntil(
        () => /resumed/.test(out.text),
        10_000,
        "the resume message",
      );
    } finally {
      await killAndWait(child);
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test(
  "a stuck-hot zone thaws anyway once SAFE_MAX_FREEZE elapses",
  { skip },
  async () => {
    const dir = tmpZoneDir();
    const zone = join(dir, "temp");
    writeFileSync(zone, "90000"); // hot and never cooled
    const child = spawn("bash", [SCRIPT, "sleep", "10"], {
      env: {
        ...process.env,
        SAFE_THERMAL_GLOB: zone,
        SAFE_TEMP_PAUSE: "80000",
        SAFE_TEMP_RESUME: "70000",
        SAFE_MAX_FREEZE: "2",
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    const out = collectStderr(child);
    try {
      await waitUntil(
        () => /paused until below/.test(out.text),
        5_000,
        "the pause message",
      );
      await waitUntil(
        () => /paused over 2s.*resuming anyway/.test(out.text),
        6_000,
        "the max-freeze thaw warning",
      );
    } finally {
      await killAndWait(child);
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test(
  "a signal to safe-run leaves no safe-run-* scope behind",
  { skip },
  async () => {
    const child = spawn("bash", [SCRIPT, "sleep", "30"], {
      env: {
        ...process.env,
        SAFE_THERMAL_GLOB: "/no/such/thermal_zone*/temp",
      },
      stdio: ["ignore", "ignore", "ignore"],
    });
    // The unit name embeds this bash process's own pid, so this check can't
    // match a scope left behind by an earlier test still tearing down.
    const ownUnit = () => `safe-run-${child.pid}-*.scope`;
    const exited = new Promise<number | null>((resolve) => {
      child.on("exit", (code) => resolve(code));
    });

    await waitUntil(
      () => listSafeRunUnits(ownUnit()).length > 0,
      5_000,
      "the scope to register with systemd",
    );

    child.kill("SIGINT");
    const code = await exited;
    assert.equal(code, 130, "SIGINT should exit as 128 + 2");

    await waitUntil(
      () => listSafeRunUnits(ownUnit()).length === 0,
      5_000,
      "the scope to be gone after SIGINT",
    );
  },
);
