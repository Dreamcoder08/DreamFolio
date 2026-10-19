// Refreshes src/data/github-repos.json from the GitHub REST API at build time,
// so the /projects/ grid follows the owner's repos without hand edits.
//
// Usage: node scripts/sync-github-repos.mjs
// GITHUB_TOKEN is optional (it only raises the rate limit). Any failure keeps
// the committed snapshot and exits 0: a GitHub outage must never block a
// deploy, it only means the grid is as fresh as the last successful sync.
import { readFile, writeFile } from "node:fs/promises";
import { curateRepos } from "../src/lib/github-repos.ts";

const CONFIG = new URL("../src/data/github-repos.config.json", import.meta.url);
const OUT = new URL("../src/data/github-repos.json", import.meta.url);

async function listRepos(owner, token) {
  const base =
    owner.kind === "org"
      ? `https://api.github.com/orgs/${owner.login}/repos?type=public`
      : `https://api.github.com/users/${owner.login}/repos?type=owner`;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dreamfolio-repo-sync",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const repos = [];
  for (let page = 1; page <= 5; page += 1) {
    const response = await fetch(`${base}&per_page=100&page=${page}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`${owner.login}: HTTP ${response.status}`);
    }
    const batch = await response.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

try {
  const config = JSON.parse(await readFile(CONFIG, "utf8"));
  const token = process.env.GITHUB_TOKEN;
  const raw = (
    await Promise.all(config.owners.map((owner) => listRepos(owner, token)))
  ).flat();
  const repos = curateRepos(raw, config);
  if (repos.length === 0) throw new Error("curation left no repos");
  await writeFile(OUT, `${JSON.stringify({ repos }, null, 2)}\n`);
  console.log(`github-repos: ${repos.length} of ${raw.length} repos kept`);
} catch (error) {
  console.warn(
    `::warning::github-repos sync failed, keeping the committed snapshot: ${error.message}`,
  );
}
