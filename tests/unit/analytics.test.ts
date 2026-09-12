import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAnalytics } from "../../src/lib/analytics.ts";

const CLOUD_SRC = "https://cloud.umami.is/script.js";

test("defaults to the hosted instance and allows its two origins", () => {
  const analytics = resolveAnalytics({});

  assert.equal(analytics.enabled, true);
  assert.equal(analytics.src, CLOUD_SRC);
  assert.deepEqual(analytics.scriptOrigins, ["https://cloud.umami.is"]);
  assert.deepEqual(analytics.connectOrigins, ["https://gateway.umami.is"]);
});

test("self-hosting derives both origins from the script URL", () => {
  const analytics = resolveAnalytics({
    PUBLIC_UMAMI_SRC: "https://analytics.example.com/script.js",
  });

  assert.equal(analytics.enabled, true);
  assert.deepEqual(analytics.scriptOrigins, ["https://analytics.example.com"]);
  assert.deepEqual(analytics.connectOrigins, ["https://analytics.example.com"]);
});

test("a split collection host can be declared separately", () => {
  const analytics = resolveAnalytics({
    PUBLIC_UMAMI_SRC: "https://analytics.example.com/script.js",
    PUBLIC_UMAMI_CONNECT: "https://collect.example.com",
  });

  assert.deepEqual(analytics.scriptOrigins, ["https://analytics.example.com"]);
  assert.deepEqual(analytics.connectOrigins, ["https://collect.example.com"]);
});

test("a same-origin path needs no extra CSP source", () => {
  const analytics = resolveAnalytics({ PUBLIC_UMAMI_SRC: "/umami.js" });

  assert.equal(analytics.enabled, true);
  assert.deepEqual(analytics.scriptOrigins, []);
  assert.deepEqual(analytics.connectOrigins, []);
});

test("an empty website id disables analytics and drops its origins", () => {
  const analytics = resolveAnalytics({ PUBLIC_UMAMI_WEBSITE_ID: "" });

  assert.equal(analytics.enabled, false);
  assert.deepEqual(analytics.scriptOrigins, []);
  assert.deepEqual(analytics.connectOrigins, []);
});

test("an empty script URL disables analytics", () => {
  const analytics = resolveAnalytics({ PUBLIC_UMAMI_SRC: "" });

  assert.equal(analytics.enabled, false);
});
