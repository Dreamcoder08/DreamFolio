import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveFallbackCover,
  selectRepoCover,
  type RepoCoverFallbackMap,
} from "../../src/lib/repo-cover-fallbacks.ts";

const sampleFallbacks: RepoCoverFallbackMap = {
  "Dreamcoder08/aurelia21": {
    src: "/images/repos/custom/dreamcoder08-aurelia21.webp",
    width: 960,
    height: 540,
    alt: "AURELIA // 21·09 web experience screenshot",
  },
};

test("resolveFallbackCover matches owner/name case-insensitively", () => {
  assert.deepEqual(
    resolveFallbackCover(
      { owner: "dreamcoder08", name: "AURELIA21" },
      sampleFallbacks,
    ),
    sampleFallbacks["Dreamcoder08/aurelia21"],
  );
  assert.equal(
    resolveFallbackCover(
      { owner: "Dreamcoder08", name: "unknown-repo" },
      sampleFallbacks,
    ),
    undefined,
  );
});

test("selectRepoCover prefers README cover over fallback and uses fallback when README has none", () => {
  const readmeCover = {
    src: "/images/repos/dreamcoder08-aurelia21.webp",
    width: 960,
    height: 540,
    alt: "README screenshot",
  };
  const fallbackCover = sampleFallbacks["Dreamcoder08/aurelia21"];

  assert.deepEqual(
    selectRepoCover({ readmeCover, fallbackCover }),
    readmeCover,
  );
  assert.deepEqual(
    selectRepoCover({ readmeCover: undefined, fallbackCover }),
    fallbackCover,
  );
  assert.equal(
    selectRepoCover({ readmeCover: undefined, fallbackCover: undefined }),
    undefined,
  );
});

test("repo-cover-fallbacks.json entries follow the static custom cover contract", async () => {
  const { readFile } = await import("node:fs/promises");
  const fallbacks = JSON.parse(
    await readFile(
      new URL("../../src/data/repo-cover-fallbacks.json", import.meta.url),
      "utf8",
    ),
  ) as RepoCoverFallbackMap;

  assert.equal(typeof fallbacks, "object");
  for (const [key, cover] of Object.entries(fallbacks)) {
    assert.match(key, /^[^/]+\/[^/]+$/, `valid owner/name key: ${key}`);
    assert.match(
      cover.src,
      /^\/images\/repos\/custom\/[a-z0-9._-]+\.webp$/,
      `custom webp path for ${key}`,
    );
    assert.ok(
      Number.isInteger(cover.width) && cover.width > 0,
      `positive width for ${key}`,
    );
    assert.ok(
      Number.isInteger(cover.height) && cover.height > 0,
      `positive height for ${key}`,
    );
    assert.ok(cover.alt.trim().length > 0, `non-empty alt for ${key}`);
  }
});
