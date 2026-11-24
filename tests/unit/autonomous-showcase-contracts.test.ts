import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";

test("S1: carousel autoplay pauses on touch interaction", () => {
  const src = readFileSync("src/lib/project-autoplay.ts", "utf8");
  assert.match(src, /touchstart/, "project-autoplay.ts must handle touchstart");
});

test("S5: view-transitions UNSHARED_PROJECT does not overlap SHARED_ART_PROJECT_IDS", async () => {
  const { SHARED_ART_PROJECT_IDS } = await import(
    "../../src/lib/project-presentation.ts"
  );
  const spec = readFileSync("tests/transitions/view-transitions.spec.ts", "utf8");
  const match = /UNSHARED_PROJECT\s*=\s*\{\s*id:\s*"([^"]+)"/.exec(spec);
  if (match) {
    assert.equal(
      SHARED_ART_PROJECT_IDS.has(match[1]),
      false,
      `UNSHARED_PROJECT (${match[1]}) must not be in SHARED_ART_PROJECT_IDS`,
    );
  }
});

test("S3: every curated project and synced repo resolves to an existing cover under public/", async () => {
  const { coverForRepo } = await import("../../src/lib/github-repos.ts");
  const projects = JSON.parse(readFileSync("src/data/projects.json", "utf8")) as Array<{
    id: string;
    coverImage?: string;
    githubUrl?: string;
  }>;
  const snapshot = JSON.parse(readFileSync("src/data/github-repos.json", "utf8")) as {
    repos: Array<{ owner: string; name: string; url: string; cover?: { src: string } }>;
  };

  for (const project of projects) {
    const cover = project.coverImage
      ? { src: project.coverImage }
      : coverForRepo(snapshot.repos as never, project.githubUrl);
    assert.ok(cover?.src, `curated project ${project.id} must resolve a cover`);
    const diskPath = `public${cover.src}`;
    assert.ok(existsSync(diskPath) && statSync(diskPath).size > 0, diskPath);
  }

  for (const repo of snapshot.repos) {
    assert.ok(repo.cover?.src, `synced repo ${repo.owner}/${repo.name} must have cover.src`);
    const diskPath = `public${repo.cover.src}`;
    assert.ok(existsSync(diskPath) && statSync(diskPath).size > 0, diskPath);
  }
});

test("S3/S5: dialog media components never emit empty src=\"\" on <img> and escape JSON payload", () => {
  for (const file of [
    "src/components/ui/ProjectMediaStage.astro",
    "src/components/ui/ProjectQuickModal.astro",
  ]) {
    const src = readFileSync(file, "utf8");
    assert.doesNotMatch(src, /<img\b[^>]*\bsrc=""/, file);
  }
  const modal = readFileSync("src/components/ui/ProjectQuickModal.astro", "utf8");
  assert.match(modal, /replace\(\/<\/g,\s*"\\\\u003c"\)/);
});
