import type { GitHubRepo, RepoCover } from "./github-repos.ts";
import { archifyForRepo, type RepoArchifyMap } from "./repo-archify.ts";

export interface ProjectGalleryImage {
  src: string;
  alt: string;
  aspect?: "wide" | "mobile";
}

export interface CuratedProjectLike {
  id: string;
  title: string;
  summary: string;
  domain: string;
  stack: string[];
  githubUrl?: string;
  liveUrl?: string;
  previewVideo?: string;
  showcaseVideo?: string;
  videoPoster?: string;
  videoCaption?: string;
  galleryImages?: ProjectGalleryImage[];
}

export type HomeProjectFilter = "case-study" | "arkelythex" | "personal";

export interface HomeProjectCard {
  id: string;
  title: string;
  summary: string;
  eyebrow: string;
  stack: string[];
  href: string;
  isExternal: boolean;
  ctaLabel: string;
  githubUrl?: string;
  liveUrl?: string;
  archifyHref?: string;
  cover?: RepoCover;
  previewVideo?: string;
  showcaseVideo?: string;
  videoPoster?: string;
  videoCaption?: string;
  galleryImages?: ProjectGalleryImage[];
  sharedArtId?: string;
  filters: HomeProjectFilter[];
}

function ownerFilter(owner?: string): "arkelythex" | "personal" {
  return owner?.toLowerCase() === "arkelythex" ? "arkelythex" : "personal";
}

function repoKeyFromUrl(url?: string): { owner: string; name: string } | null {
  if (!url) return null;
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/i.exec(url);
  return match ? { owner: match[1], name: match[2] } : null;
}

/**
 * Unifies curated case studies (first, preserving their detail routes and
 * shared-element art IDs) with every remaining public repository from GitHub
 * (deduplicated by GitHub URL) and attaches Archify diagram links.
 */
export function buildHomeProjects<T extends CuratedProjectLike>({
  curated,
  repos,
  archifyMap,
  resolveCover,
  getSlug,
  domainLabel,
}: {
  curated: readonly T[];
  repos: readonly GitHubRepo[];
  archifyMap: RepoArchifyMap;
  resolveCover: (project: T) => RepoCover | undefined;
  getSlug: (title: string) => string;
  domainLabel: (domain: string) => string;
}): HomeProjectCard[] {
  const seenUrls = new Set<string>();
  const cards: HomeProjectCard[] = curated.map((project) => {
    if (project.githubUrl) seenUrls.add(project.githubUrl.toLowerCase());
    const repoKey = repoKeyFromUrl(project.githubUrl);
    return {
      id: project.id,
      title: project.title,
      summary: project.summary,
      eyebrow: domainLabel(project.domain),
      stack: project.stack.slice(0, 4),
      href: `/projects/${getSlug(project.title)}/`,
      isExternal: false,
      ctaLabel: "Ver el proyecto",
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      archifyHref: repoKey ? archifyForRepo(repoKey, archifyMap) : undefined,
      cover: resolveCover(project),
      previewVideo: project.previewVideo,
      showcaseVideo: project.showcaseVideo,
      videoPoster: project.videoPoster,
      videoCaption: project.videoCaption,
      galleryImages: project.galleryImages,
      sharedArtId: project.id,
      filters: ["case-study", ownerFilter(repoKey?.owner)],
    };
  });

  for (const repo of repos) {
    if (seenUrls.has(repo.url.toLowerCase())) continue;
    const stack = [repo.language, repo.owner].filter((v): v is string =>
      Boolean(v),
    );
    cards.push({
      id: `repo-${repo.owner}-${repo.name}`.toLowerCase(),
      title: repo.name,
      summary: repo.description,
      eyebrow:
        repo.owner.toLowerCase() === "arkelythex"
          ? "ARKELYTHEX"
          : "Open Source",
      stack,
      href: repo.url,
      isExternal: true,
      ctaLabel: "Ver repositorio",
      githubUrl: repo.url,
      archifyHref: archifyForRepo(repo, archifyMap),
      cover: repo.cover,
      filters: [ownerFilter(repo.owner)],
    });
  }

  return cards;
}
