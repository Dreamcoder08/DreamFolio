// Gives each synced repo a cover: the first real image of its README,
// downloaded and re-encoded into public/images/repos/. The site's CSP is
// `img-src 'self'`, so a cover is always a local file, never a hotlink.
//
// Contract (same as the repo sync): nothing here may fail a deploy. A repo
// whose cover cannot be refreshed keeps the one it already had.
import { access, mkdir, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pickReadmeImage } from "../../src/lib/readme-image.ts";

const PUBLIC_DIR = "/images/repos";
const MAX_BYTES = 10 * 1024 * 1024;
const WIDTH = 960;
// Narrower than this is an icon or a logo, not a picture of the project.
const MIN_SOURCE_WIDTH = 400;

/** sharp ships with Astro; resolving it from there avoids a new dependency. */
function loadSharp() {
  try {
    const require = createRequire(import.meta.url);
    return createRequire(require.resolve("astro"))("sharp");
  } catch {
    return null;
  }
}

const fileName = (repo) =>
  `${repo.owner}-${repo.name}`.toLowerCase().replace(/[^a-z0-9._-]/g, "-") +
  ".webp";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** The README's leading image, or null when the repo has none. */
async function findImage(repo, headers) {
  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/readme`,
    { headers, signal: AbortSignal.timeout(15_000) },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`readme HTTP ${response.status}`);
  const readme = await response.json();
  const markdown = Buffer.from(readme.content ?? "", "base64").toString("utf8");
  const base = new URL(".", readme.download_url).href;
  return pickReadmeImage(markdown, base);
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`image HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/") || type.includes("svg")) {
    throw new Error(`not a raster image (${type || "no content-type"})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error("image over 10 MB");
  return bytes;
}

/**
 * Returns `repos` with a `cover` on each one that has a usable README image.
 * `previous` is the committed snapshot, the fallback for a failed refresh.
 */
export async function attachCovers(repos, previous, { token, outDir }) {
  const sharp = loadSharp();
  const before = new Map(previous.map((repo) => [repo.url, repo.cover]));
  if (!sharp) {
    console.warn("::warning::repo covers: sharp unavailable, covers kept");
    return repos.map((repo) => ({ ...repo, cover: before.get(repo.url) }));
  }
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dreamfolio-repo-sync",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  await mkdir(outDir, { recursive: true });

  const result = await Promise.all(
    repos.map(async (repo) => {
      const file = fileName(repo);
      try {
        const image = await findImage(repo, headers);
        if (!image) return { ...repo, cover: undefined };
        const source = sharp(await download(image.url)).rotate();
        const { width = 0 } = await source.metadata();
        if (width < MIN_SOURCE_WIDTH) return { ...repo, cover: undefined };
        const info = await source
          .resize({ width: WIDTH, withoutEnlargement: true })
          .webp({ quality: 74 })
          .toFile(join(outDir, file));
        return {
          ...repo,
          cover: {
            src: `${PUBLIC_DIR}/${file}`,
            width: info.width,
            height: info.height,
            alt: image.alt,
          },
        };
      } catch (error) {
        console.warn(
          `::warning::repo covers: ${repo.owner}/${repo.name}: ${error.message}`,
        );
        const kept = (await exists(join(outDir, file)))
          ? before.get(repo.url)
          : undefined;
        return { ...repo, cover: kept };
      }
    }),
  );

  // Drop covers of repos that left the list or no longer have an image.
  const used = new Set(
    result.map((repo) => repo.cover?.src.split("/").pop()).filter(Boolean),
  );
  for (const file of await readdir(outDir)) {
    if (file.endsWith(".webp") && !used.has(file)) await rm(join(outDir, file));
  }
  return result;
}
