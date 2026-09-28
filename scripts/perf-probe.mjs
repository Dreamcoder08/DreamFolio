#!/usr/bin/env node
// Measure main-thread blocking of the built homepage with the convergence
// field forced ON versus its static fallback, under mobile CPU throttling.
//
// Why: Lighthouse runs on SwiftShader, where production deliberately removes
// the field (see renderer.ts `isSoftwareRenderer`), so a green Lighthouse
// score says nothing about the field's own cost. This probe forces the field
// to run and reports the extra blocking time it adds, which is the number
// that regresses when the render loop or mount work grows.
//
// Usage: pnpm perf:probe [baseUrl] [budgetMs]
//   Point it at a running static server on dist/ (e.g. `pnpm exec serve -l
//   4399 dist` after `SITE_BASE=/ pnpm build`). Exits 1 when the field adds
//   more than `budgetMs` (default 250) of median blocking time over the
//   fallback. PROBE_SAMPLES (default 3) sets loads per scenario.
import { chromium } from "@playwright/test";
import { FORCE_WEBGL_ARGS, FORCE_WEBGL_INIT } from "./lib/force-webgl.mjs";

const baseUrl = process.argv[2] ?? "http://localhost:4399/";
const budgetMs = Number(process.argv[3] ?? 250);
const cpuSlowdown = 4; // Lighthouse's mobile preset.
const settleMs = 6000;
// Single loads under CPU throttling vary by ±60 ms; the gate compares
// medians so one noisy sample can't pass or fail it on its own.
const samples = Number(process.env.PROBE_SAMPLES ?? 3);

const scenarios = [
  { label: "field forced", force: true },
  { label: "static fallback", force: false },
];

async function measure(browser, { force }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  if (force) await context.addInitScript(FORCE_WEBGL_INIT);
  await context.addInitScript(() => {
    window.__longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        window.__longTasks.push(Math.round(entry.duration));
    }).observe({ type: "longtask", buffered: true });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuSlowdown });
  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForTimeout(settleMs);
  // Scroll through the hero so on-demand rendering has to wake up.
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(1500);
  const { state, longTasks } = await page.evaluate(() => ({
    state:
      document.querySelector(".convergence-field")?.dataset.state ?? "removed",
    longTasks: window.__longTasks,
  }));
  await context.close();
  const blocking = longTasks.reduce((sum, d) => sum + Math.max(0, d - 50), 0);
  return {
    state,
    longTasks: longTasks.length,
    maxTask: Math.max(0, ...longTasks),
    blocking,
  };
}

const browser = await chromium.launch({ args: FORCE_WEBGL_ARGS });
const rows = [];
try {
  for (const scenario of scenarios) {
    const runs = [];
    // Alternating would be fairer for thermal drift, but sequential keeps
    // one browser context alive at a time on memory-constrained machines.
    for (let i = 0; i < samples; i++)
      runs.push(await measure(browser, scenario));
    const sorted = [...runs].sort((a, b) => a.blocking - b.blocking);
    const median = sorted[Math.floor(sorted.length / 2)];
    rows.push({
      scenario: scenario.label,
      ...median,
      samples: runs.map((r) => r.blocking).join("/"),
    });
  }
} finally {
  await browser.close();
}

console.table(rows);
const [forced, fallback] = rows;
const added = forced.blocking - fallback.blocking;
console.log(
  `Field adds ${added} ms of blocking time (median of ${samples}) at ${cpuSlowdown}x CPU (budget ${budgetMs} ms).`,
);
if (forced.state === "removed")
  console.error(
    "Field did not mount in the forced scenario — probe is invalid.",
  );
process.exitCode = added > budgetMs || forced.state === "removed" ? 1 : 0;
