#!/usr/bin/env node
// Capture deterministic visual snapshots of the built site for manual review.
//
// Why: visual checks of motion-driven UI (the hero convergence field) were
// being repeated by hand across viewports, themes and scroll positions. A
// headed browser tab in the background never runs requestAnimationFrame, so
// headless Playwright is the reliable way to see what a visitor sees.
//
// Usage: pnpm snapshots [baseUrl] [outDir]
//   Serves nothing itself — point it at a running server (e.g. `pnpm exec
//   serve -l 4399 dist` after `SITE_BASE=/ pnpm build`).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { FORCE_WEBGL_ARGS, FORCE_WEBGL_INIT } from "./lib/force-webgl.mjs";

const baseUrl = process.argv[2] ?? "http://localhost:4399/";
const outDir = process.argv[3] ?? "test-results/snapshots";
mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 900, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
];
const themes = ["dark", "light"];
// Scroll positions as a fraction of the viewport height.
const scrollSteps = [0, 0.2, 0.4];
const settleMs = 3500;

// See scripts/lib/force-webgl.mjs for why the field needs forcing here.
const browser = await chromium.launch({ args: FORCE_WEBGL_ARGS });
const results = [];
try {
  for (const vp of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });
      await context.addInitScript(FORCE_WEBGL_INIT);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {}
      }, theme);
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await page.waitForTimeout(settleMs);
      for (const step of scrollSteps) {
        await page.evaluate((y) => window.scrollTo(0, y), step * vp.height);
        await page.waitForTimeout(600);
        const file = join(
          outDir,
          `${vp.name}-${theme}-scroll${Math.round(step * 100)}.png`,
        );
        await page.screenshot({ path: file });
      }
      // Read the attribute directly: a missing canvas must not cost a full
      // locator timeout per context.
      const state = await page.evaluate(
        () =>
          document.querySelector(".convergence-field")?.dataset.state ??
          "removed",
      );
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      results.push({ viewport: vp.name, theme, state, overflow, errors });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.table(results.map((r) => ({ ...r, errors: r.errors.length })));
// The field must actually be on screen, or every screenshot is useless.
const failed = results.filter(
  (r) =>
    r.overflow ||
    r.errors.length ||
    !["running", "idle-settled"].includes(r.state),
);
for (const r of failed) console.error(r);
console.log(`Snapshots written to ${outDir}`);
process.exitCode = failed.length ? 1 : 0;
