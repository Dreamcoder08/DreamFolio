// Maps a synced GitHub repo to the card shape ProjectQuickModal renders, so the
// /projects/ repo grid opens the same Image + Video quick view as the home
// carousel. The id follows the `repo-<owner>-<name>` convention of
// buildHomeProjects (src/lib/home-projects.ts).
import type { GitHubRepo } from "./github-repos.ts";
import type { HomeProjectCard } from "./home-projects.ts";

export function repoQuickCard(
  repo: GitHubRepo,
  archifyHref?: string,
): HomeProjectCard {
  const owner = repo.owner.toLowerCase();
  return {
    id: `repo-${owner}-${repo.name}`.toLowerCase(),
    title: repo.name,
    summary: repo.description,
    eyebrow: owner === "arkelythex" ? "ARKELYTHEX" : "Open Source",
    stack: [repo.language, repo.owner].filter((v): v is string => Boolean(v)),
    href: repo.url,
    isExternal: true,
    ctaLabel: "Ver repositorio",
    githubUrl: repo.url,
    archifyHref,
    cover: repo.cover,
    filters: [owner === "arkelythex" ? "arkelythex" : "personal"],
  };
}
