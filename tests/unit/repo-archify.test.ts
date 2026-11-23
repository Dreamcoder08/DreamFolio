import { test } from "node:test";
import assert from "node:assert/strict";
import {
  archifyForRepo,
  type RepoArchifyMap,
} from "../../src/lib/repo-archify.ts";

test("archifyForRepo matches owner/name case-insensitively", () => {
  const map: RepoArchifyMap = {
    "arkelythex/drenyra-ai": "/archify/arkelythex-drenyra-ai.html",
  };
  assert.equal(
    archifyForRepo({ owner: "ARKELYTHEX", name: "DRENYRA-AI" }, map),
    "/archify/arkelythex-drenyra-ai.html",
  );
  assert.equal(
    archifyForRepo({ owner: "Dreamcoder08", name: "missing" }, map),
    undefined,
  );
});

test("repo-archify.json entries use valid static HTML paths that exist on disk", async () => {
  const { access, readFile } = await import("node:fs/promises");
  const diagrams = JSON.parse(
    await readFile(
      new URL("../../src/data/repo-archify.json", import.meta.url),
      "utf8",
    ),
  ) as RepoArchifyMap;

  assert.ok(
    diagrams !== null &&
      typeof diagrams === "object" &&
      !Array.isArray(diagrams),
    "repo-archify.json must be a plain object",
  );
  for (const [key, href] of Object.entries(diagrams)) {
    assert.match(key, /^[^/]+\/[^/]+$/, `valid owner/name key: ${key}`);
    assert.match(
      href,
      /^\/archify\/[a-z0-9._-]+\.html$/,
      `static archify html path for ${key}`,
    );
    await access(new URL(`../../public${href}`, import.meta.url));
  }
});
