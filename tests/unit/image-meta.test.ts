import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { sniffImage } from "../../src/lib/image-meta.ts";

const dir = new URL("../../public/images/projects/", import.meta.url);

test("reads the real type of fiscal-workspace.jpg (a PNG) and its size", () => {
  const meta = sniffImage(readFileSync(new URL("fiscal-workspace.jpg", dir)));
  assert.deepEqual(meta, { type: "image/png", width: 1920, height: 1080 });
});

test("recognises every shipped project image", () => {
  for (const name of readdirSync(dir)) {
    const meta = sniffImage(readFileSync(new URL(name, dir)));
    assert.ok(meta, `${name} must be recognised`);
    assert.ok(meta.width > 0 && meta.height > 0, `${name} has a size`);
  }
});

test("reads a baseline JPEG frame header", () => {
  // SOI, APP0 (len 4), SOF0 with height 300, width 600.
  const jpeg = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11,
    0x08, 0x01, 0x2c, 0x02, 0x58, 0x03,
  ]);
  assert.deepEqual(sniffImage(jpeg), {
    type: "image/jpeg",
    width: 600,
    height: 300,
  });
});

test("returns null for unknown bytes", () => {
  assert.equal(sniffImage(new Uint8Array(64)), null);
});
