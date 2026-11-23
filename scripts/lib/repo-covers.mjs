// Gives each synced repo a local WebP cover from its README (CSP: img-src 'self'),
// falling back to committed custom covers when a README has no usable image.
import { access, mkdir, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pickReadmeImages } from "../../src/lib/readme-image.ts";
import {
  resolveFallbackCover,
  selectRepoCover,
} from "../../src/lib/repo-cover-fallbacks.ts";
import { closeRasterizer, rasterizeSvg } from "./svg-raster.mjs";

const PUBLIC_DIR = "/images/repos";
const MAX_BYTES = 10 * 1024 * 1024;
const WIDTH = 960;
// Narrower than this is an icon or a logo.
const MIN_SOURCE_WIDTH = 400;
// A README often opens with a small logo: look a few images further.
const MAX_CANDIDATES = 4;

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

/** The README's usable images in order; empty when the repo has none. */
async function findImages(repo, headers) {
  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/readme`,
    { headers, signal: AbortSignal.timeout(15_000) },
  );
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`readme HTTP ${response.status}`);
  const readme = await response.json();
  const markdown = Buffer.from(readme.content ?? "", "base64").toString("utf8");
  const base = new URL(".", readme.download_url).href;
  return pickReadmeImages(markdown, base).slice(0, MAX_CANDIDATES);
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`image HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) {
    throw new Error(`not an image (${type || "no content-type"})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error("image over 10 MB");
  return bytes;
}

/** Decodes `bytes` via sharp, returning null for small icons or flat fills. */
async function decode(sharp, bytes) {
  const { width = 0, format } = await sharp(bytes).metadata();
  if (width < MIN_SOURCE_WIDTH) return null;
  const pixels =
    format === "svg" ? ((await rasterizeSvg(bytes)) ?? bytes) : bytes;
  const { channels } = await sharp(pixels).stats();
  if (channels.every((channel) => channel.stdev < 2)) return null;
  return sharp(pixels).rotate();
}

/** Attaches README covers to `repos`, falling back to `fallbacks` or `previous`. */
export async function attachCovers(
  repos,
  previous,
  { token, outDir, fallbacks = {} },
) {
  const sharp = loadSharp();
  const before = new Map(previous.map((repo) => [repo.url, repo.cover]));
  const pick = (repo, readmeCover) =>
    selectRepoCover({
      readmeCover,
      fallbackCover: resolveFallbackCover(repo, fallbacks),
    });
  if (!sharp) {
    console.warn("::warning::repo covers: sharp unavailable, covers kept");
    return repos.map((repo) => ({
      ...repo,
      cover: pick(repo, before.get(repo.url)),
    }));
  }
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dreamfolio-repo-sync",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  await mkdir(outDir, { recursive: true });

  const result = await Promise.all(
    repos.map(async (repo) => {
      const file = fileName(repo);
      try {
        let image;
        let source;
        for (const candidate of await findImages(repo, headers)) {
          const decoded = await decode(sharp, await download(candidate.url));
          if (!decoded) continue;
          [image, source] = [candidate, decoded];
          break;
        }
        if (!source) return { ...repo, cover: pick(repo, undefined) };
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
        const kept = await access(join(outDir, file)).then(
          () => before.get(repo.url),
          () => undefined,
        );
        return { ...repo, cover: pick(repo, kept) };
      }
    }),
  );

  await closeRasterizer();

  // Drop covers of repos that left the list or no longer have an image.
  const used = new Set(
    result.map((repo) => repo.cover?.src.split("/").pop()).filter(Boolean),
  );
  for (const file of await readdir(outDir)) {
    if (file.endsWith(".webp") && !used.has(file)) await rm(join(outDir, file));
  }
  return result;
}
