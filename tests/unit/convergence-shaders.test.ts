import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as shaders from "../../src/lib/convergence/shaders.ts";

// Pins every GLSL source the renderer compiles, so a shader edit (or a file
// split that accidentally changes a byte) has to update this fixture on
// purpose. Recompute with sha256 over the exported string when intentional.
const PINNED: Record<string, { length: number; sha256: string }> = {
  VERTEX_SHADER: {
    length: 3826,
    sha256: "d46882686b74bfb77731171b9b3a6406a9cc3c356de1770399c4bd3b382e2e7a",
  },
  FRAGMENT_SHADER: {
    length: 705,
    sha256: "ad1ea7c80e37b591ca20d7a5ab6073e7ae756fe6e3c1152978fe373201b03da0",
  },
  LINE_VERTEX_SHADER: {
    length: 542,
    sha256: "c665b540929a4d82fd412c3bceafa55ab8709acedbcf33dc0b8745eeffe241da",
  },
  LINE_FRAGMENT_SHADER: {
    length: 1079,
    sha256: "1ec097d973a71a8f6d3cffc1bc3ea6e6164872dc7c1f05ce7848e7d95dacfa2b",
  },
};

test("the shader barrel exports exactly the pinned sources and constant", () => {
  assert.deepEqual(Object.keys(shaders).sort(), [
    "FRAGMENT_SHADER",
    "LINE_FRAGMENT_SHADER",
    "LINE_VERTEX_SHADER",
    "MAX_PROTECT_RECTS",
    "VERTEX_SHADER",
  ]);
  assert.equal(shaders.MAX_PROTECT_RECTS, 6);
});

for (const [name, pin] of Object.entries(PINNED)) {
  test(`${name} source is byte-identical to its pinned hash`, () => {
    const source = (shaders as Record<string, unknown>)[name];
    assert.equal(typeof source, "string");
    const text = source as string;
    assert.equal(text.length, pin.length);
    assert.equal(createHash("sha256").update(text).digest("hex"), pin.sha256);
  });
}

test("protect-rect interpolations resolve to the shared capacity", () => {
  for (const source of [shaders.VERTEX_SHADER, shaders.LINE_FRAGMENT_SHADER]) {
    assert.ok(source.includes("uniform vec4 uProtect[6];"));
    assert.ok(source.includes("for (int i = 0; i < 6; i += 1)"));
    assert.ok(!source.includes("${"));
  }
});
