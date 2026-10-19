// Curation rules for the GitHub grid on /projects/. Pure and dependency-free
// so the build-time sync script (scripts/sync-github-repos.mjs) and the unit
// tests share exactly the same filter.

/** The subset of a GitHub REST `repository` object the curation reads. */
export interface RawRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  private?: boolean;
}

export interface GitHubRepo {
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string | null;
  stars: number;
  pushedAt: string;
}

export interface RepoOwner {
  login: string;
  kind: "user" | "org";
  label: string;
}

export interface CurationConfig {
  owners: RepoOwner[];
  exclude: string[];
}

/**
 * Keeps what is worth showing: public, original (no forks), maintained (not
 * archived) and described. A repo with no description reads as a stub on a
 * card, so it stays out until it has one. `exclude` is for the rest
 * (profile READMEs, org meta repos, this site itself).
 */
export function curateRepos(
  raw: readonly RawRepo[],
  config: CurationConfig,
): GitHubRepo[] {
  const excluded = new Set(config.exclude.map((name) => name.toLowerCase()));
  return raw
    .filter(
      (repo) =>
        !repo.private &&
        !repo.fork &&
        !repo.archived &&
        (repo.description ?? "").trim() !== "" &&
        !excluded.has(repo.full_name.toLowerCase()),
    )
    .map((repo) => ({
      owner: repo.full_name.split("/")[0],
      name: repo.name,
      url: repo.html_url,
      description: (repo.description ?? "").trim(),
      language: repo.language,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at,
    }))
    .sort(
      (a, b) =>
        b.stars - a.stars || Date.parse(b.pushedAt) - Date.parse(a.pushedAt),
    );
}

/** Repos grouped in the config's owner order, empty groups dropped. */
export function groupByOwner(
  repos: readonly GitHubRepo[],
  owners: readonly RepoOwner[],
): { owner: RepoOwner; repos: GitHubRepo[] }[] {
  return owners
    .map((owner) => ({
      owner,
      repos: repos.filter(
        (repo) => repo.owner.toLowerCase() === owner.login.toLowerCase(),
      ),
    }))
    .filter((group) => group.repos.length > 0);
}
