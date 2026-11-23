// Fetches each repository's validated Archify standalone HTML diagram from its
// own repo (`docs/diagrams/*.architecture.html`) into `public/archify/` at
// build/deploy time, updating `src/data/repo-archify.json` only for diagrams
// present on disk. On transient GitHub failures, existing local files are kept.
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const REPOS = new URL("../src/data/github-repos.json", import.meta.url);
const MANIFEST = new URL("../src/data/repo-archify.json", import.meta.url);
const OUT_DIR = fileURLToPath(new URL("../public/archify/", import.meta.url));
const MAX_BYTES = 5 * 1024 * 1024;

const slugOf = (repo) =>
  `${repo.owner}-${repo.name}`.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function fetchDiagram(repo, headers) {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/docs/diagrams`;
  const listRes = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (listRes.status === 404) return null;
  if (!listRes.ok) throw new Error(`contents HTTP ${listRes.status}`);
  const entries = await listRes.json();
  if (!Array.isArray(entries)) return null;
  const html = entries.find(
    (e) =>
      e.type === "file" &&
      typeof e.name === "string" &&
      e.name.endsWith(".architecture.html") &&
      typeof e.download_url === "string",
  );
  if (!html) return null;
  const fileRes = await fetch(html.download_url, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!fileRes.ok) throw new Error(`download HTTP ${fileRes.status}`);
  const declared = Number(fileRes.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    throw new Error(`diagram too large (${declared} bytes)`);
  }
  const bytes = Buffer.from(await fileRes.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error(`invalid diagram size (${bytes.length} bytes)`);
  }
  return bytes;
}

try {
  const { repos } = JSON.parse(await readFile(REPOS, "utf8"));
  const previous = JSON.parse(
    await readFile(MANIFEST, "utf8").catch(() => "{}"),
  );
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dreamfolio-archify-sync",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  await mkdir(OUT_DIR, { recursive: true });

  const entries = await Promise.all(
    repos.map(async (repo) => {
      const key = `${repo.owner}/${repo.name}`;
      const file = `${slugOf(repo)}.html`;
      const dest = join(OUT_DIR, file);
      try {
        const bytes = await fetchDiagram(repo, headers);
        if (!bytes) {
          await rm(dest, { force: true });
          return null;
        }
        await writeFile(dest, bytes);
        return [key, `/archify/${file}`];
      } catch (error) {
        console.warn(`::warning::archify sync: ${key}: ${error.message}`);
        return previous[key] && (await exists(dest))
          ? [key, previous[key]]
          : null;
      }
    }),
  );

  const manifest = Object.fromEntries(entries.filter(Boolean));
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `archify-sync: ${Object.keys(manifest).length} of ${repos.length} repos synced`,
  );
} catch (error) {
  console.warn(`::warning::archify sync failed: ${error.message}`);
}
