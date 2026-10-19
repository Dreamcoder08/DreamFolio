import { test } from "node:test";
import assert from "node:assert/strict";
import {
  curateRepos,
  groupByOwner,
  type RawRepo,
} from "../../src/lib/github-repos.ts";

const repo = (full: string, extra: Partial<RawRepo> = {}): RawRepo => ({
  name: full.split("/")[1],
  full_name: full,
  html_url: `https://github.com/${full}`,
  description: "Something real.",
  language: "TypeScript",
  stargazers_count: 0,
  pushed_at: "2026-10-01T00:00:00Z",
  fork: false,
  archived: false,
  ...extra,
});

const config = {
  owners: [
    { login: "arkelythex", kind: "org" as const, label: "ARKELYTHEX" },
    { login: "Dreamcoder08", kind: "user" as const, label: "Personal" },
  ],
  exclude: ["Dreamcoder08/dreamcoder08"],
};

test("drops forks, archived, private, undescribed and excluded repos", () => {
  const kept = curateRepos(
    [
      repo("Dreamcoder08/keep"),
      repo("Dreamcoder08/a-fork", { fork: true }),
      repo("Dreamcoder08/old", { archived: true }),
      repo("Dreamcoder08/secret", { private: true }),
      repo("Dreamcoder08/stub", { description: "  " }),
      repo("Dreamcoder08/null-desc", { description: null }),
      repo("dreamcoder08/DREAMCODER08"),
    ],
    config,
  );
  assert.deepEqual(
    kept.map((r) => r.name),
    ["keep"],
  );
});

test("sorts by stars, then by most recent push", () => {
  const kept = curateRepos(
    [
      repo("Dreamcoder08/older", { pushed_at: "2026-01-01T00:00:00Z" }),
      repo("Dreamcoder08/newer", { pushed_at: "2026-09-01T00:00:00Z" }),
      repo("Dreamcoder08/starred", {
        stargazers_count: 3,
        pushed_at: "2025-01-01T00:00:00Z",
      }),
    ],
    config,
  );
  assert.deepEqual(
    kept.map((r) => r.name),
    ["starred", "newer", "older"],
  );
});

test("groups in config order and drops empty owners", () => {
  const kept = curateRepos([repo("Dreamcoder08/one")], config);
  const groups = groupByOwner(kept, config.owners);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].owner.label, "Personal");
});

test("the committed snapshot already satisfies the curation rules", async () => {
  const { readFile } = await import("node:fs/promises");
  const snapshot = JSON.parse(
    await readFile(
      new URL("../../src/data/github-repos.json", import.meta.url),
      "utf8",
    ),
  );
  const excluded = new Set(
    JSON.parse(
      await readFile(
        new URL("../../src/data/github-repos.config.json", import.meta.url),
        "utf8",
      ),
    ).exclude.map((name: string) => name.toLowerCase()),
  );
  assert.ok(snapshot.repos.length > 0);
  for (const r of snapshot.repos) {
    assert.ok(r.description.trim() !== "", `${r.name} has a description`);
    assert.ok(!excluded.has(`${r.owner}/${r.name}`.toLowerCase()), r.name);
  }
});
