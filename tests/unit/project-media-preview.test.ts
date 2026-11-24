import { test } from "node:test";
import assert from "node:assert/strict";
import { pickPreviewVideoId } from "../../src/lib/project-media-preview.ts";

test("pickPreviewVideoId prefers hovered card over active card and disables under reduced motion", () => {
  assert.equal(
    pickPreviewVideoId({
      reducedMotion: false,
      hoveredId: "drenyra",
      activeId: "cleansweep",
    }),
    "drenyra",
  );
  assert.equal(
    pickPreviewVideoId({
      reducedMotion: false,
      hoveredId: null,
      activeId: "cleansweep",
    }),
    "cleansweep",
  );
  assert.equal(
    pickPreviewVideoId({
      reducedMotion: true,
      hoveredId: "drenyra",
      activeId: "cleansweep",
    }),
    null,
  );
});
