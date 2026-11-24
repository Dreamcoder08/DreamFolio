import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCENE_CHAPTERS,
  findChapterById,
  pickDominantScene,
} from "../../src/lib/scroll-director.ts";

test("SCENE_CHAPTERS defines ordered portfolio chapters and lookup works by id", () => {
  assert.equal(SCENE_CHAPTERS.length, 6);
  assert.equal(findChapterById("projects")?.code, "02");
  assert.equal(findChapterById("connect")?.label, "Contacto");
  assert.equal(findChapterById("nonexistent"), undefined);
});

test("pickDominantScene chooses the intersecting scene with highest ratio", () => {
  const best = pickDominantScene([
    { id: "hero", intersecting: false, ratio: 0.9 },
    { id: "projects", intersecting: true, ratio: 0.35 },
    { id: "services", intersecting: true, ratio: 0.62 },
  ]);
  assert.equal(best, "services");
  assert.equal(
    pickDominantScene([{ id: "hero", intersecting: false, ratio: 0 }]),
    null,
  );
});
