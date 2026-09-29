import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  count,
  exitOf,
  hasExited,
  killAndWait,
  skip,
  sleep,
  spawnSafeRun,
  tmpDir,
  waitUntil,
} from "./support/safe-run.ts";

/**
 * Liveness of the thermal watchdog (issue #61): a stuck-hot zone must not
 * pause a run forever, yet a zone at the hard ceiling must keep it frozen,
 * a fast rise below PAUSE must pause early, and a failing thaw must warn
 * once instead of every tick. All against a fake zone file, never real
 * hardware; every test needs a real user systemd manager and skips without.
 */

// Five 1 s steps: a wall-clock `sleep 5` would "finish" the instant a long
// freeze ends, so only a stepped command proves the run actually progresses.
const STEPS = ["bash", "-c", "for i in 1 2 3 4 5; do sleep 1; done"];
const THRESHOLDS = {
  SAFE_TEMP_PAUSE: "80000",
  SAFE_TEMP_RESUME: "70000",
  SAFE_TEMP_HARD: "88000",
  SAFE_MAX_FREEZE: "2",
  SAFE_GRACE: "60",
  SAFE_POLL: "1",
};

async function withZone(
  initial: string,
  body: (zone: string, dir: string) => Promise<void>,
): Promise<void> {
  const dir = tmpDir();
  const zone = join(dir, "temp");
  writeFileSync(zone, initial);
  try {
    await body(zone, dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// 1 s is the tick the other tests assume; 0.1 s proves the freeze cap and
// grace are wall-clock based, not counted in polls.
for (const poll of ["1", "0.1"]) {
  test(
    `a zone stuck above PAUSE (below HARD) still lets the run finish (poll ${poll}s)`,
    { skip },
    () =>
      withZone("85000", async (zone) => {
        const started = Date.now();
        const { child, out } = spawnSafeRun(STEPS, {
          ...THRESHOLDS,
          SAFE_POLL: poll,
          SAFE_THERMAL_GLOB: zone,
        });
        try {
          // Freeze cap (2 s) + 5 s of steps + margin; the 60 s grace covers it.
          const code = await Promise.race([exitOf(child), sleep(14_000)]);
          assert.equal(code, 0, `run did not finish in time:\n${out.text}`);
          assert.ok(Date.now() - started < 14_000);
          assert.equal(count(out.text, /paused until below/g), 1, out.text);
          assert.match(out.text, /never fell.*60s grace/);
        } finally {
          await killAndWait(child);
        }
      }),
  );
}

test(
  "a zone that fell while frozen gets no grace and re-pauses at PAUSE",
  { skip },
  () =>
    withZone("86000", async (zone) => {
      const { child, out } = spawnSafeRun(["sleep", "30"], {
        ...THRESHOLDS,
        SAFE_THERMAL_GLOB: zone,
      });
      try {
        await waitUntil(() => /paused until/.test(out.text), 5_000, "pause");
        writeFileSync(zone, "83000"); // fell 3 °C: load-related, still hot
        await waitUntil(
          () => count(out.text, /paused until below/g) === 2,
          8_000,
          "a second pause after the forced thaw",
        );
        assert.match(out.text, /resuming anyway/);
        assert.doesNotMatch(out.text, /grace/);
      } finally {
        await killAndWait(child);
      }
    }),
);

test(
  "a zone at the hard ceiling stays frozen past SAFE_MAX_FREEZE",
  { skip },
  () =>
    withZone("90000", async (zone) => {
      const { child, out } = spawnSafeRun(STEPS, {
        ...THRESHOLDS,
        SAFE_THERMAL_GLOB: zone,
      });
      try {
        await waitUntil(() => /hard ceiling/.test(out.text), 5_000, "pause");
        await sleep(4_000); // twice the freeze cap
        assert.equal(hasExited(child), false, out.text);
        assert.doesNotMatch(out.text, /resum/);
        writeFileSync(zone, "40000");
        assert.equal(await exitOf(child), 0, out.text);
        assert.match(out.text, /resumed/);
      } finally {
        await killAndWait(child);
      }
    }),
);

test("a fast rise below PAUSE pauses early", { skip }, () =>
  withZone("71000", async (zone) => {
    const { child, out } = spawnSafeRun(["sleep", "30"], {
      ...THRESHOLDS,
      SAFE_THERMAL_GLOB: zone,
    });
    try {
      await sleep(2_500); // let the watchdog record a steady history
      assert.doesNotMatch(out.text, /paused/);
      writeFileSync(zone, "79500"); // +8.5 °C, still below PAUSE
      await waitUntil(
        () => /79500 m°C \(rising fast\)/.test(out.text),
        4_000,
        "the early pause",
      );
    } finally {
      await killAndWait(child);
    }
  }),
);

test(
  "a failing thaw warns once, never claims to resume, and keeps retrying",
  { skip },
  () =>
    withZone("85000", async (zone, dir) => {
      const real = spawnSync("bash", ["-c", "command -v systemctl"], {
        encoding: "utf8",
      }).stdout.trim();
      const flag = join(dir, "fail-thaw");
      const fake = join(dir, "systemctl");
      writeFileSync(
        fake,
        `#!/bin/sh\n[ "$2" = thaw ] && [ -e "${flag}" ] && exit 1\nexec "${real}" "$@"\n`,
      );
      chmodSync(fake, 0o755);
      writeFileSync(flag, "");
      const { child, out } = spawnSafeRun(STEPS, {
        ...THRESHOLDS,
        SAFE_THERMAL_GLOB: zone,
        PATH: `${dir}:${process.env.PATH ?? ""}`,
      });
      try {
        await waitUntil(() => /paused until/.test(out.text), 5_000, "pause");
        writeFileSync(zone, "40000"); // cool: the watchdog now wants to thaw
        await sleep(3_000); // several failing retries
        assert.equal(count(out.text, /thaw failed/g), 1, out.text);
        assert.doesNotMatch(out.text, /resumed/);
        rmSync(flag); // thaw works again: the retry must pick it up
        assert.equal(await exitOf(child), 0, out.text);
        assert.match(out.text, /resumed/);
      } finally {
        rmSync(flag, { force: true });
        await killAndWait(child);
      }
    }),
);
