export const siteConfig = {
  title: "Dreamcoder08 — Software Architect & GDE",
  description: "Building fiscal intelligence infrastructure for LATAM. Founder of ARKELYTHEX.",
  url: "https://dreamfolio.vercel.app",
  author: "Dreamcoder08",
  social: {
    x: "https://x.com/Dreamcoder08",
    github: "https://github.com/Dreamcoder08",
    instagram: "https://www.instagram.com/dreamcoder.08/",
    arkelythex: "https://github.com/arkelythex",
  },
};

const rawBasePath = import.meta.env.BASE_URL ?? '/';

export const basePath = rawBasePath.endsWith('/') ? rawBasePath : `${rawBasePath}/`;

export function withBase(path: string): string {
  if (!path) return basePath;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('mailto:') || path.startsWith('#')) return path;
  if (path === '/') return basePath;
  const normalized = path.replace(/^\/+/, '');
  return `${basePath}${normalized}`;
}

export function withBaseAsset(path: string): string {
  return withBase(path.replace(/^\/+/, ''));
}

export function toAbsoluteSiteUrl(path: string, site: string): string {
  return new URL(withBaseAsset(path), site).toString();
}
