import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  SCRIPT,
  exitOf,
  killAndWait,
  listSafeRunUnits,
  skip,
  spawnSafeRun,
  tmpDir,
  waitUntil,
} from "./support/safe-run.ts";

/**
 * Coverage for the thermal watchdog's process lifecycle: exit-status
 * passthrough, clean shutdown on a signal (no orphaned cgroup), a plain
 * pause/resume, and strict validation so a typo never silently disables
 * protection. Liveness (bounded freeze, grace, hard ceiling, fast rise)
 * lives in safe-run-liveness.test.ts.
 *
 * These spawn real `bash scripts/safe-run.sh` processes against a fake
 * thermal zone (SAFE_THERMAL_GLOB), never real hardware — so they run at
 * whatever temperature the machine actually is. Freeze/thaw and "leaves no
 * scope" need a real user systemd manager; where `systemd-run --user --scope
 * true` fails (CI has none), those tests skip with a reason instead of
 * failing.
 */

test("exit status passes through from the wrapped command", () => {
  const result = spawnSync("bash", [SCRIPT, "bash", "-c", "exit 7"], {
    env: { ...process.env, SAFE_THERMAL_GLOB: "/no/such/thermal_zone*/temp" },
    encoding: "utf8",
  });
  assert.equal(result.status, 7, result.stderr);
});

test(
  "an unreadable, empty or non-numeric thermal zone is ignored, not fatal",
  { skip },
  async () => {
    const dir = tmpDir();
    try {
      writeFileSync(join(dir, "zone_empty"), "");
      writeFileSync(join(dir, "zone_text"), "n/a");
      mkdirSync(join(dir, "zone_isdir")); // matches the glob but cat fails EISDIR
      writeFileSync(join(dir, "zone_ok"), "40000"); // well under any pause threshold
      const result = spawnSync("bash", [SCRIPT, "sleep", "2"], {
        env: {
          ...process.env,
          SAFE_THERMAL_GLOB: join(dir, "zone_*"),
          SAFE_TEMP_PAUSE: "80000",
          SAFE_TEMP_RESUME: "70000",
          SAFE_POLL: "1",
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

test("invalid settings exit 2 with a clear message, never run unguarded", () => {
  const cases: [Record<string, string>, RegExp][] = [
    [{ SAFE_TEMP_PAUSE: "hot" }, /SAFE_TEMP_PAUSE/],
    [
      { SAFE_TEMP_PAUSE: "50000", SAFE_TEMP_RESUME: "60000" },
      /SAFE_TEMP_PAUSE.*SAFE_TEMP_RESUME/s,
    ],
    [{ SAFE_TEMP_HARD: "80000" }, /SAFE_TEMP_HARD.*SAFE_TEMP_PAUSE/s],
    [{ SAFE_TEMP_HARD: "x" }, /SAFE_TEMP_HARD/],
    [{ SAFE_MAX_FREEZE: "0" }, /SAFE_MAX_FREEZE must be at least 1/],
    [{ SAFE_GRACE: "-1" }, /SAFE_GRACE/],
    [{ SAFE_POLL: "0" }, /SAFE_POLL must be a positive number/],
    [{ SAFE_POLL: "-0.5" }, /SAFE_POLL/],
    [{ SAFE_POLL: "fast" }, /SAFE_POLL/],
  ];
  for (const [env, message] of cases) {
    const result = spawnSync("bash", [SCRIPT, "true"], {
      env: { ...process.env, ...env },
      encoding: "utf8",
    });
    assert.equal(result.status, 2, JSON.stringify(env));
    assert.match(result.stderr, message);
  }
});

test(
  "pauses when the fake zone goes hot, resumes once it cools",
  { skip },
  async () => {
    const dir = tmpDir();
    const zone = join(dir, "temp");
    writeFileSync(zone, "82000"); // hot from the start, below the hard ceiling
    const { child, out } = spawnSafeRun(["sleep", "3"], {
      SAFE_THERMAL_GLOB: zone,
      SAFE_TEMP_PAUSE: "80000",
      SAFE_TEMP_RESUME: "70000",
    });
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
      assert.equal(await exitOf(child), 0, out.text);
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

    try {
      await waitUntil(
        () => listSafeRunUnits(ownUnit()).length > 0,
        5_000,
        "the scope to register with systemd",
      );

      const exited = exitOf(child);
      child.kill("SIGINT");
      assert.equal(await exited, 130, "SIGINT should exit as 128 + 2");

      await waitUntil(
        () => listSafeRunUnits(ownUnit()).length === 0,
        5_000,
        "the scope to be gone after SIGINT",
      );
    } finally {
      await killAndWait(child);
    }
  },
);
