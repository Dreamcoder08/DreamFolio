import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPortrait,
  normalizeMediaView,
  resolveStageVideo,
} from "../../src/lib/project-media-stage.ts";

test("isPortrait is true only for images taller than wide that have loaded", () => {
  assert.equal(isPortrait(780, 1688), true);
  assert.equal(isPortrait(1600, 1000), false);
  assert.equal(isPortrait(1000, 1000), false);
  assert.equal(isPortrait(0, 0), false);
});

test("normalizeMediaView accepts split, video, image and defaults unknown values to split", () => {
  assert.equal(normalizeMediaView("split"), "split");
  assert.equal(normalizeMediaView("video"), "video");
  assert.equal(normalizeMediaView("image"), "image");
  assert.equal(normalizeMediaView("unknown"), "split");
  assert.equal(normalizeMediaView(undefined), "split");
});

test("resolveStageVideo prefers showcaseVideo over previewVideo and returns null when neither exists", () => {
  assert.equal(
    resolveStageVideo({
      showcaseVideo: "/videos/full.mp4",
      previewVideo: "/videos/preview.webm",
    }),
    "/videos/full.mp4",
  );
  assert.equal(
    resolveStageVideo({
      previewVideo: "/videos/preview.webm",
    }),
    "/videos/preview.webm",
  );
  assert.equal(resolveStageVideo({}), null);
});
