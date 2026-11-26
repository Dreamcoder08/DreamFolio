import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { getProjectCaseStudy } from "../../src/lib/project-case-studies.ts";

const projects = JSON.parse(
  readFileSync("src/data/projects.json", "utf8"),
) as Array<Record<string, unknown>>;
const sipges = projects.find((project) => project.id === "sipges");

test("SIPGES is a curated project whose media all exist under public/", () => {
  assert.ok(sipges, "projects.json must contain the sipges entry");
  assert.equal(sipges.githubUrl, "https://github.com/Dreamcoder08/sipges");
  const gallery = sipges.galleryImages as Array<{ src: string }>;
  const media = [
    sipges.coverImage,
    sipges.previewVideo,
    sipges.showcaseVideo,
    sipges.videoPoster,
    ...gallery.map((image) => image.src),
  ] as string[];
  assert.equal(gallery.length, 4);
  for (const src of media) {
    assert.ok(existsSync(`public${src}`), `missing public${src}`);
  }
});

test("SIPGES never links the deployed instance, which shows real client data", () => {
  assert.ok(sipges);
  assert.equal(sipges.liveUrl, undefined);
});

test("SIPGES copy and proof name no client, real place, entity or the hydrocarbons edition", () => {
  assert.ok(sipges);
  const caseStudy = getProjectCaseStudy("sipges");
  assert.ok(caseStudy, "a sipges case study must exist");
  // The detail page also renders the synced proof (ADR titles, CI), so a
  // future `pnpm sync:proof` must not be able to leak client names either.
  const proof = JSON.parse(readFileSync("src/data/project-proof.json", "utf8"))
    .projects.sipges;
  assert.ok(proof, "a sipges proof entry must exist");
  const text = JSON.stringify([sipges, caseStudy, proof]);
  for (const forbidden of [
    /sechura/i,
    /piura/i,
    /amsac/i,
    /defensor[ií]a/i,
    /PRJ-/,
    /hidrocarbur/i,
  ]) {
    assert.doesNotMatch(text, forbidden);
  }
  assert.match(String(sipges.videoCaption), /ficticio/i);
});
