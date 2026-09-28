#!/usr/bin/env node
// Print the median Lighthouse scores and key metrics from the reports that
// `lhci autorun` wrote, and append them to the job summary. `lhci` itself only
// prints assertion failures, so a passing run would otherwise show no numbers.
//
// Usage: node scripts/lighthouse-summary.mjs [reportsDir]
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "lighthouse-reports";
const reports = readdirSync(dir)
  .filter((name) => /^lhr-.*\.json$/.test(name))
  .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")));

if (reports.length === 0) {
  console.error(`No lhr-*.json reports in ${dir}`);
  process.exit(1);
}

const median = (values) =>
  [...values].sort((a, b) => a - b)[values.length >> 1];
const pick = (read) => median(reports.map(read));

const rows = [
  ...["performance", "accessibility", "best-practices", "seo"].map((id) => [
    id,
    Math.round(pick((r) => r.categories[id].score * 100)),
  ]),
  [
    "first-contentful-paint (ms)",
    Math.round(pick((r) => r.audits["first-contentful-paint"].numericValue)),
  ],
  [
    "largest-contentful-paint (ms)",
    Math.round(pick((r) => r.audits["largest-contentful-paint"].numericValue)),
  ],
  [
    "speed-index (ms)",
    Math.round(pick((r) => r.audits["speed-index"].numericValue)),
  ],
  [
    "total-blocking-time (ms)",
    Math.round(pick((r) => r.audits["total-blocking-time"].numericValue)),
  ],
  [
    "cumulative-layout-shift",
    pick((r) => r.audits["cumulative-layout-shift"].numericValue).toFixed(3),
  ],
];

const table = [
  `Lighthouse (mobile), median of ${reports.length} runs`,
  "",
  "| metric | value |",
  "| --- | --- |",
  ...rows.map(([metric, value]) => `| ${metric} | ${value} |`),
].join("\n");

console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
}
