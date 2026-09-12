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
