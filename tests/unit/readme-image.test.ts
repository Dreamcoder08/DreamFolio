import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pickReadmeImage,
  pickReadmeImages,
} from "../../src/lib/readme-image.ts";

const base = "https://raw.githubusercontent.com/acme/app/main/";
const pick = (markdown: string) => pickReadmeImage(markdown, base);

test("takes the first markdown image and resolves it against the README", () => {
  assert.deepEqual(pick("# App\n\n![Dashboard](docs/shot.png)\n"), {
    url: `${base}docs/shot.png`,
    alt: "Dashboard",
  });
});

test("reads HTML img tags, whatever the attribute order", () => {
  assert.deepEqual(
    pick(
      '<p align="center"><img width="600" alt="Hero" src="./hero.webp"></p>',
    ),
    { url: `${base}hero.webp`, alt: "Hero" },
  );
});

test("skips badges but keeps vector images, in document order", () => {
  const markdown = [
    "[![CI](https://github.com/acme/app/actions/workflows/ci.yml/badge.svg)](x)",
    "![npm](https://img.shields.io/npm/v/app.png)",
    "![Banner](assets/banner.light.svg#gh-light-mode-only)",
    '<img src="docs/real.jpg" alt="Real">',
  ].join("\n");
  assert.deepEqual(
    pickReadmeImages(markdown, base).map((image) => image.url),
    [
      `${base}assets/banner.light.svg#gh-light-mode-only`,
      `${base}docs/real.jpg`,
    ],
  );
});

test("rewrites a github.com blob link to its raw file", () => {
  assert.equal(
    pick("![x](https://github.com/acme/app/blob/main/docs/a.png?raw=true)")
      ?.url,
    "https://raw.githubusercontent.com/acme/app/main/docs/a.png",
  );
});

test("keeps GitHub-hosted attachments and drops every other host", () => {
  const attachment =
    "https://github.com/user-attachments/assets/1b2c3d4e-0000-4000-8000-123456789abc";
  assert.equal(pick(`![shot](${attachment})`)?.url, attachment);
  assert.equal(pick("![x](https://example.com/a.png)"), null);
  assert.equal(
    pick("![x](http://raw.githubusercontent.com/a/b/main/a.png)"),
    null,
  );
});

test("ignores a title after the URL and images inside code fences", () => {
  assert.equal(
    pick('```md\n![no](docs/no.png)\n```\n![yes](docs/yes.png "A title")')?.url,
    `${base}docs/yes.png`,
  );
});

test("returns null when the README has no usable image", () => {
  assert.equal(pick("# Just text"), null);
  assert.equal(pick(""), null);
});

test("resolves a root-relative path against the repository root, not the host", () => {
  assert.equal(
    pickReadmeImage(
      "![x](/docs/shot.png)",
      "https://raw.githubusercontent.com/acme/app/main/packages/web/",
    )?.url,
    "https://raw.githubusercontent.com/acme/app/main/docs/shot.png",
  );
});

test("lists every usable image in order, so a caller can fall back past a small logo", () => {
  assert.deepEqual(
    pickReadmeImages("![Logo](logo.png)\n![Shot](docs/shot.png)", base).map(
      (image) => image.url,
    ),
    [`${base}logo.png`, `${base}docs/shot.png`],
  );
});
