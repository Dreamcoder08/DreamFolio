// The cover a project card shows: its own curated image when it has one,
// otherwise the image its repo's README leads with (synced at build time).
import snapshot from "../data/github-repos.json";
import { coverForRepo, type GitHubRepo, type RepoCover } from "./github-repos";

interface CoverSource {
  coverImage?: string;
  githubUrl?: string;
}

export function projectCover(project: CoverSource): RepoCover | undefined {
  if (project.coverImage) {
    return { src: project.coverImage, width: 1600, height: 900, alt: "" };
  }
  return coverForRepo(snapshot.repos as GitHubRepo[], project.githubUrl);
}
