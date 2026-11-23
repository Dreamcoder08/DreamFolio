import type { RepoCover } from "./github-repos.ts";

export type RepoCoverFallbackMap = Record<string, RepoCover>;

/** Finds a committed static fallback cover by `owner/name`, ignoring case. */
export function resolveFallbackCover(
  repo: { owner: string; name: string },
  fallbacks: RepoCoverFallbackMap,
): RepoCover | undefined {
  const target = `${repo.owner}/${repo.name}`.toLowerCase();
  for (const [key, cover] of Object.entries(fallbacks)) {
    if (key.toLowerCase() === target) return cover;
  }
  return undefined;
}

/** Prefers a real README cover, falling back to a curated static cover when absent. */
export function selectRepoCover({
  readmeCover,
  fallbackCover,
}: {
  readmeCover?: RepoCover;
  fallbackCover?: RepoCover;
}): RepoCover | undefined {
  return readmeCover ?? fallbackCover;
}
