/** Derives the public route slug from a project title.
 *  Centralised so every link and route computes it identically. Changing a
 *  title does change its URL, because the slug is derived from the title. */
export function getProjectSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The projects whose cover art appears both on the homepage carousel and on
 *  their detail page: the only ones given a `view-transition-name`, so the
 *  shared-element morph only applies where both ends exist in the CSS. */
export const SHARED_ART_PROJECT_IDS: ReadonlySet<string> = new Set([
  "drenyra",
  "dreamcoder-workbench",
  "digital-public-peru",
]);

const DOMAIN_LABELS: Record<string, string> = {
  "fiscal-infrastructure": "IA + contabilidad",
  govtech: "Tecnología cívica",
  "civic-tech": "Tecnología cívica",
  agritech: "Agrotecnología",
  "developer-experience": "Developer experience",
  "developer-tools": "Herramientas dev",
  security: "Seguridad",
  education: "Educación",
};

/** A readable Spanish label for a `projects.json` domain slug. */
export function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain.replace(/-/g, " ");
}

/** Carousel order: projects with cover art first (they open strongest),
 *  otherwise the order of `projects.json`. Stable, so the JSON stays the
 *  single place to reorder. */
export function carouselOrder<T extends { coverImage?: string }>(
  projects: readonly T[],
): T[] {
  return projects
    .map((project, index) => ({ project, index }))
    .sort(
      (a, b) =>
        Number(Boolean(b.project.coverImage)) -
          Number(Boolean(a.project.coverImage)) || a.index - b.index,
    )
    .map(({ project }) => project);
}
