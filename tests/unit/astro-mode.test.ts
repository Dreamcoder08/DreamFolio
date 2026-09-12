import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMode } from "../../src/lib/astro-mode.ts";

const NODE = ["node", "/path/to/astro", "build"];

test("a build without a flag resolves to production", () => {
  assert.equal(resolveMode(NODE, false), "production");
});

test("dev without a flag resolves to development", () => {
  assert.equal(
    resolveMode(["node", "/path/to/astro", "dev"], true),
    "development",
  );
});

test("both spellings of the flag are honoured", () => {
  assert.equal(resolveMode([...NODE, "--mode", "staging"], false), "staging");
  assert.equal(resolveMode([...NODE, "--mode=staging"], false), "staging");
});

test("the flag wins over NODE_ENV", () => {
  // The case that motivated this module: a staging build leaves NODE_ENV as
  // "production", so reading the flag is the only way to find .env.staging.
  assert.equal(resolveMode([...NODE, "--mode", "staging"], false), "staging");
});

test("a flag with no value falls back to the default", () => {
  assert.equal(resolveMode([...NODE, "--mode"], false), "production");
  assert.equal(resolveMode([...NODE, "--mode="], false), "production");
});

test("a mode containing an equals sign survives", () => {
  assert.equal(resolveMode([...NODE, "--mode=a=b"], false), "a=b");
});
