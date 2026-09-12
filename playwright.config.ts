import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
