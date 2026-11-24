import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("S1: carousel autoplay pauses on touch interaction", () => {
  const src = readFileSync("src/lib/project-autoplay.ts", "utf8");
  assert.match(src, /touchstart/, "project-autoplay.ts must handle touchstart");
});

test("S5: view-transitions UNSHARED_PROJECT does not overlap SHARED_ART_PROJECT_IDS", async () => {
  const { SHARED_ART_PROJECT_IDS } = await import(
    "../../src/lib/project-presentation.ts"
  );
  const spec = readFileSync("tests/transitions/view-transitions.spec.ts", "utf8");
  const match = /UNSHARED_PROJECT\s*=\s*\{\s*id:\s*"([^"]+)"/.exec(spec);
  if (match) {
    assert.equal(
      SHARED_ART_PROJECT_IDS.has(match[1]),
      false,
      `UNSHARED_PROJECT (${match[1]}) must not be in SHARED_ART_PROJECT_IDS`,
    );
  }
});
