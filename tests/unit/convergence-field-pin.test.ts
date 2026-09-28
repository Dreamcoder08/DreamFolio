import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createField,
  type CreateFieldOptions,
} from "../../src/lib/convergence/field.ts";

/**
 * Pins the complete output of `createField` for a few seeds and layouts.
 *
 * The hashes were computed with the implementation that existed before
 * `field.ts` was split into `field-types`, `field-sampling`, `graph` and
 * `hubs`, so they lock the original RNG call order and edge weighting, not
 * whatever the current code happens to produce. A deliberate change to the
 * field (new sampling, different constants) should update them on purpose.
 */
const PINNED: [string, CreateFieldOptions, string][] = [
  [
    "wide, default seed",
    { count: 240, seed: 20260924, aspect: 16 / 9, layout: "wide" },
    "be7a4606b2b165b487f13f864878a38aff60f9a7b6a92385859fd21095267fc2",
  ],
  [
    "wide with an exclusion rect",
    {
      count: 240,
      seed: 7,
      aspect: 1.6,
      layout: "wide",
      exclusions: [{ x: 0.5, y: 0, w: 0.5, h: 0.8 }],
    },
    "f00d4b5e50e152e84c240886f2a8210452200f1dea6236c498f8af030b7ef71e",
  ],
  [
    "narrow layout",
    { count: 120, seed: 424242, aspect: 0.46, layout: "narrow" },
    "3464d96f8edb173d275bd6d649bef8b3510a59ae406e4293d60cbbcabeed4514",
  ],
  [
    "large particle count",
    { count: 1500, seed: 1, aspect: 2.1, layout: "wide" },
    "0baef8557b81582fcd16d91f078882e1b6c644d71b614105725978f30797e791",
  ],
];

const ARRAYS = [
  "chaosPositions",
  "orderPositions",
  "delays",
  "sizes",
  "tones",
] as const;

function fingerprint(options: CreateFieldOptions): string {
  const field = createField(options);
  const hash = createHash("sha256");
  for (const key of ARRAYS) {
    const array = field[key];
    hash.update(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
  }
  hash.update(JSON.stringify(field.graph));
  return hash.digest("hex");
}

for (const [name, options, expected] of PINNED) {
  test(`createField output is pinned: ${name}`, () => {
    assert.equal(fingerprint(options), expected);
  });
}
