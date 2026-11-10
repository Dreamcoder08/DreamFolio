// Picks the image a README leads with, so a repo card can show the project
// instead of a blank tile. Pure and dependency-free: the build-time sync
// (scripts/lib/repo-covers.mjs) and the unit tests share exactly this logic.

export interface ReadmeImage {
  /** Absolute https URL on a GitHub-owned host. */
  url: string;
  alt: string;
}

/** Hosts the sync may download from. Everything else is dropped. */
const ALLOWED_HOSTS = new Set([
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "github.com",
]);

/** Status badges are images too, but they say nothing about the project. */
const BADGE = /badge|shields\.io|badgen\.net|\/workflows\//i;

const FENCE = /^(```|~~~)[\s\S]*?^\1[^\n]*$/gm;
const IMAGE = /!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?[^)]*\)|<img\b[^>]*>/gi;

function attribute(tag: string, name: string): string {
  const match = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(
    tag,
  );
  return match ? match[1] : "";
}

/** `github.com/o/r/blob/branch/path` serves HTML; the raw host serves the file. */
function toRawUrl(url: URL): URL {
  const blob = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(url.pathname);
  if (url.hostname !== "github.com" || !blob) return url;
  return new URL(
    `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}`,
  );
}

/** `/docs/a.png` means the repository root, which on the raw host is
 *  `/owner/repo/branch/`, not the host root. */
function repoRoot(base: string): string {
  const url = new URL(base);
  if (url.hostname !== "raw.githubusercontent.com") return base;
  return `${url.origin}/${url.pathname.split("/").slice(1, 4).join("/")}/`;
}

function resolve(candidate: string, base: string): URL | null {
  try {
    const rooted = /^\/(?!\/)/.test(candidate);
    const url = toRawUrl(
      rooted
        ? new URL(candidate.slice(1), repoRoot(base))
        : new URL(candidate, base),
    );
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    if (BADGE.test(url.href)) return null;
    // On github.com itself only uploaded attachments are image files.
    if (
      url.hostname === "github.com" &&
      !url.pathname.startsWith("/user-attachments/assets/")
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/**
 * Every image in `markdown` worth showing, in document order. `base` is the
 * README's own raw directory URL, used for relative paths.
 */
export function pickReadmeImages(
  markdown: string,
  base: string,
): ReadmeImage[] {
  const prose = markdown.replace(FENCE, "");
  const images: ReadmeImage[] = [];
  for (const match of prose.matchAll(IMAGE)) {
    const isTag = match[0].startsWith("<");
    const source = isTag ? attribute(match[0], "src") : match[2];
    const url = source ? resolve(source, base) : null;
    if (!url) continue;
    const alt = isTag ? attribute(match[0], "alt") : match[1];
    images.push({ url: url.href, alt: alt.trim() });
  }
  return images;
}

/** The first usable image, or null when the README has none. */
export function pickReadmeImage(
  markdown: string,
  base: string,
): ReadmeImage | null {
  return pickReadmeImages(markdown, base)[0] ?? null;
}
