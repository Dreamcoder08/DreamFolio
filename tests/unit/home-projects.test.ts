import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHomeProjects } from "../../src/lib/home-projects.ts";
import type { GitHubRepo } from "../../src/lib/github-repos.ts";

const curated = [
  {
    id: "cleansweep",
    title: "CleanSweep",
    summary: "Rust dotfile manager.",
    domain: "cli",
    stack: ["Rust", "CLI"],
    githubUrl: "https://github.com/Dreamcoder08/CleanSweep",
    liveUrl: undefined,
  },
];

const repos: GitHubRepo[] = [
  {
    owner: "Dreamcoder08",
    name: "CleanSweep",
    url: "https://github.com/Dreamcoder08/CleanSweep",
    description: "Duplicate of curated project.",
    language: "Rust",
    stars: 0,
    pushedAt: "2026-11-10T01:39:20Z",
    cover: {
      src: "/images/repos/dreamcoder08-cleansweep.webp",
      width: 960,
      height: 560,
      alt: "CleanSweep",
    },
  },
  {
    owner: "Dreamcoder08",
    name: "sipges",
    url: "https://github.com/Dreamcoder08/sipges",
    description: "Territorial platform.",
    language: "TypeScript",
    stars: 0,
    pushedAt: "2026-11-10T02:17:10Z",
    cover: {
      src: "/images/repos/dreamcoder08-sipges.webp",
      width: 960,
      height: 540,
      alt: "SIPGES",
    },
  },
];

const archifyMap = {
  "Dreamcoder08/CleanSweep": "/archify/dreamcoder08-cleansweep.html",
  "Dreamcoder08/sipges": "/archify/dreamcoder08-sipges.html",
};

test("buildHomeProjects keeps curated projects first, deduplicates repos by URL, and attaches Archify links", () => {
  const items = buildHomeProjects({
    curated,
    repos,
    archifyMap,
    resolveCover: () => repos[0].cover,
    getSlug: (title) => title.toLowerCase(),
    domainLabel: () => "Herramientas CLI",
  });

  assert.equal(items.length, 2);
  assert.equal(items[0].id, "cleansweep");
  assert.equal(items[0].href, "/projects/cleansweep/");
  assert.equal(items[0].isExternal, false);
  assert.equal(items[0].archifyHref, "/archify/dreamcoder08-cleansweep.html");
  assert.equal(items[0].sharedArtId, "cleansweep");
  assert.deepEqual(items[0].filters, ["case-study", "personal"]);

  assert.equal(items[1].title, "sipges");
  assert.equal(items[1].href, "https://github.com/Dreamcoder08/sipges");
  assert.equal(items[1].isExternal, true);
  assert.equal(items[1].archifyHref, "/archify/dreamcoder08-sipges.html");
  assert.equal(items[1].sharedArtId, undefined);
  assert.deepEqual(items[1].filters, ["personal"]);
});

test("buildHomeProjects propagates optional video and gallery media fields", () => {
  const withMedia = [
    {
      ...curated[0],
      previewVideo: "/videos/projects/cleansweep-preview.webm",
      showcaseVideo: "/videos/projects/cleansweep-full.mp4",
      videoPoster: "/images/repos/dreamcoder08-cleansweep.webp",
      videoCaption: "Demo interactiva de CleanSweep",
      galleryImages: [
        {
          src: "/images/repos/dreamcoder08-cleansweep.webp",
          alt: "Vista TUI",
          aspect: "wide" as const,
        },
      ],
    },
  ];

  const items = buildHomeProjects({
    curated: withMedia,
    repos,
    archifyMap,
    resolveCover: () => repos[0].cover,
    getSlug: (title) => title.toLowerCase(),
    domainLabel: () => "Herramientas CLI",
  });

  assert.equal(
    items[0].previewVideo,
    "/videos/projects/cleansweep-preview.webm",
  );
  assert.equal(items[0].showcaseVideo, "/videos/projects/cleansweep-full.mp4");
  assert.equal(
    items[0].videoPoster,
    "/images/repos/dreamcoder08-cleansweep.webp",
  );
  assert.equal(items[0].videoCaption, "Demo interactiva de CleanSweep");
  assert.deepEqual(items[0].galleryImages, [
    {
      src: "/images/repos/dreamcoder08-cleansweep.webp",
      alt: "Vista TUI",
      aspect: "wide",
    },
  ]);
  assert.equal(items[1].previewVideo, undefined);
  assert.equal(items[1].showcaseVideo, undefined);
});
