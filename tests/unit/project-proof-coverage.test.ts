import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { ProofSnapshot } from "../../src/lib/project-proof.ts";

// Guards the committed data, not the sync: a featured project without a
// public repository, or without a proof entry, is an unverifiable claim.
const read = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")) as T;

interface ProjectEntry {
  id: string;
  featured?: boolean;
  githubUrl?: string;
  liveUrl?: string;
}

const projects = await read<ProjectEntry[]>("../../src/data/projects.json");
const snapshot = await read<ProofSnapshot>("../../src/data/project-proof.json");

test("every featured project links a public GitHub repository", () => {
  const missing = projects
    .filter((project) => project.featured && !project.githubUrl)
    .map((project) => project.id);
  assert.deepEqual(missing, []);
});

test("every linked project has a proof entry", () => {
  const missing = projects
    .filter((project) => project.githubUrl && !snapshot.projects[project.id])
    .map((project) => project.id);
  assert.deepEqual(missing, []);
});

test("the snapshot is dated", () => {
  assert.match(snapshot.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test("every proof link points inside its own repository", () => {
  for (const [id, proof] of Object.entries(snapshot.projects)) {
    const root = `https://github.com/${proof.repo}`;
    assert.equal(proof.repoUrl, root, id);
    if (proof.ci) assert.ok(proof.ci.url.startsWith(`${root}/actions/`), id);
    for (const decision of proof.decisions) {
      assert.ok(
        decision.url.startsWith(`${root}/blob/`),
        `${id}: ${decision.url}`,
      );
    }
  }
});

test("demo links are https", () => {
  for (const project of projects.filter((p) => p.liveUrl)) {
    assert.equal(new URL(project.liveUrl!).protocol, "https:", project.id);
  }
});
