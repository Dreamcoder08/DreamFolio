import { defineConfig, devices } from "@playwright/test";
import { FORCE_WEBGL_ARGS } from "./scripts/lib/force-webgl.mjs";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // Locally, one worker per core launched up to 12 Chromium instances, each
  // rendering WebGL in software (SwiftShader) on a 7 GB laptop — enough
  // memory and heat to shut the machine down mid-run. Cap local runs; CI
  // keeps Playwright's default. Override with PW_WORKERS when needed.
  workers: process.env.CI ? undefined : Number(process.env.PW_WORKERS ?? 2),
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  webServer: {
    // `astro preview` daemonizes itself and returns immediately in this
    // environment, which Playwright reads as "the server process exited" —
    // serve `dist/` directly with a plain static server instead, which
    // stays in the foreground the way Playwright expects.
    command: "pnpm exec serve -l 4321 dist",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Runs everything except the forced-WebGL suite below, which needs a
      // different browser launch (see that project's own comment) and
      // would otherwise also run here, doubling every one of its tests.
      testIgnore: /convergence-forced\.spec\.ts/,
    },
    {
      // Headless Chromium's default WebGL2 implementation (SwiftShader) is
      // exactly what production treats as "no WebGL2" (see renderer.ts's
      // `isSoftwareRenderer`) — correct for a real visitor, but it means
      // the plain `chromium` project above only ever exercises the
      // "removed" fallback branch of the hero convergence field, never the
      // actual running WebGL path. This project launches with
      // `FORCE_WEBGL_ARGS` (see scripts/lib/force-webgl.mjs) so
      // tests/home/convergence-forced.spec.ts can cover that path too.
      // Scoped to that one file via `testMatch`, not a describe-level
      // `test.use({ launchOptions })`, because Playwright refuses a
      // launchOptions override inside a describe block (it would force a
      // new worker) — only a project/file boundary can do it.
      name: "chromium-forced-webgl",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: FORCE_WEBGL_ARGS },
      },
      testMatch: /convergence-forced\.spec\.ts/,
    },
  ],
});
