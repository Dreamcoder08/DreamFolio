import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProjectSlug } from "../../src/lib/project-presentation.ts";

const GPUI_REPO = "https://github.com/arkelythex/drenyra-gpui";

const projects = JSON.parse(
  readFileSync("src/data/projects.json", "utf8"),
) as Array<Record<string, unknown>>;
const drenyra = projects.find((project) => project.id === "drenyra");

test("the Drenyra case study is Drenyra GPUI and links its repository", () => {
  assert.ok(drenyra, "projects.json must contain the drenyra entry");
  assert.equal(drenyra.title, "Drenyra GPUI");
  assert.equal(getProjectSlug(drenyra.title as string), "drenyra-gpui");
  assert.equal(drenyra.githubUrl, GPUI_REPO);
});

test("the Drenyra link points to drenyra-gpui, not the renamed command center", () => {
  // links.ts imports site.ts without an extension, so node cannot load it
  // directly; the entry is read as text instead.
  const source = readFileSync("src/data/links.ts", "utf8");
  const entry = /id: "drenyra",[\s\S]*?href: "([^"]+)"/.exec(source);
  assert.ok(entry, "links.ts must contain the drenyra link");
  assert.equal(entry[1], GPUI_REPO);
});

test("no published data names the retired Fiscal Command Center", () => {
  for (const file of [
    "src/data/projects.json",
    "src/data/links.ts",
    "src/lib/project-case-studies.ts",
  ]) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /command[ -]?center/i,
      `${file} still names the Fiscal Command Center`,
    );
  }
});
