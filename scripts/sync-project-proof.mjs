// Refreshes src/data/project-proof.json from the GitHub REST API: for every
// project with a githubUrl, its latest CI conclusion, test file count and ADR
// links, stamped with the date they were checked.
//
// Usage: node scripts/sync-project-proof.mjs
// GITHUB_TOKEN is optional (it only raises the rate limit). Any failure keeps
// the committed snapshot and exits 0, the same contract as sync-github-repos:
// a GitHub outage must never block a deploy.
import { readFile, writeFile } from "node:fs/promises";
import { buildProof } from "../src/lib/project-proof.ts";

const PROJECTS = new URL("../src/data/projects.json", import.meta.url);
const OUT = new URL("../src/data/project-proof.json", import.meta.url);

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "dreamfolio-proof-sync",
};
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function api(path) {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

async function proofFor(githubUrl) {
  const slug = new URL(githubUrl).pathname.replace(/^\/|\/$/g, "");
  // The repo endpoint follows renames, so full_name is the canonical slug.
  const meta = await api(`repos/${slug}`);
  const repo = meta.full_name;
  const branch = meta.default_branch;
  const [tree, runs] = await Promise.all([
    api(`repos/${repo}/git/trees/${branch}?recursive=1`),
    api(`repos/${repo}/actions/runs?branch=${branch}&per_page=100`),
  ]);
  if (tree.truncated) throw new Error(`${repo}: tree truncated`);
  return buildProof({
    repo,
    branch,
    tree: tree.tree.filter((e) => e.type === "blob").map((e) => e.path),
    runs: runs.workflow_runs,
  });
}

try {
  const projects = JSON.parse(await readFile(PROJECTS, "utf8"));
  const linked = projects.filter((project) => project.githubUrl);
  const entries = await Promise.all(
    linked.map(async (project) => [
      project.id,
      await proofFor(project.githubUrl),
    ]),
  );
  const snapshot = {
    checkedAt: new Date().toISOString().slice(0, 10),
    projects: Object.fromEntries(entries),
  };
  await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`project-proof: ${entries.length} projects checked`);
} catch (error) {
  console.warn(
    `::warning::project-proof sync failed, keeping the committed snapshot: ${error.message}`,
  );
}
