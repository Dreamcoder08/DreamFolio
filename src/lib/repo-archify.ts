export type RepoArchifyMap = Record<string, string>;

/** Returns the static `/archify/<slug>.html` path for a repo, ignoring case. */
export function archifyForRepo(
  repo: { owner: string; name: string },
  diagrams: RepoArchifyMap,
): string | undefined {
  const target = `${repo.owner}/${repo.name}`.toLowerCase();
  for (const [key, href] of Object.entries(diagrams)) {
    if (key.toLowerCase() === target) return href;
  }
  return undefined;
}
