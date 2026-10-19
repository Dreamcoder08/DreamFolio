import { test } from "node:test";
import assert from "node:assert/strict";
import {
  carouselOrder,
  domainLabel,
} from "../../src/lib/project-presentation.ts";

test("projects with cover art lead, otherwise the JSON order holds", () => {
  const order = carouselOrder([
    { id: "a" },
    { id: "b", coverImage: "/b.png" },
    { id: "c", coverImage: "" },
    { id: "d", coverImage: "/d.png" },
  ]).map((p) => p.id);
  assert.deepEqual(order, ["b", "d", "a", "c"]);
});

test("domain slugs read as Spanish labels, unknown ones degrade to words", () => {
  assert.equal(domainLabel("govtech"), "Tecnología cívica");
  assert.equal(domainLabel("space-mining"), "space mining");
});
