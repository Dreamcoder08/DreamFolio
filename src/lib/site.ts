export const siteConfig = {
  title: "Dreamcoder — Software, IA & sistemas",
  description:
    "Desarrollador de software y sistemas de IA en Perú. Arquitectura, producto digital y automatización con revisión humana y trazabilidad.",
  url: "https://dreamfolio.vercel.app",
  author: "Dreamcoder08",
  contact: {
    email: "dreamcoder.dev08@gmail.com",
  },
  profile: {
    image: "/images/profile/dreamcoder-portrait.webp",
    imageAlt:
      "Retrato ilustrado de Dreamcoder trabajando en un boceto de arquitectura",
  },
  social: {
    x: "https://x.com/Dreamcoder08",
    twitterHandle: "@Dreamcoder08",
    github: "https://github.com/Dreamcoder08",
    instagram: "https://www.instagram.com/dreamcoder.08/",
  },
};

const rawBasePath = import.meta.env.BASE_URL ?? "/";

export const basePath = rawBasePath.endsWith("/")
  ? rawBasePath
  : `${rawBasePath}/`;

export function withBase(path: string): string {
  if (!path) return basePath;
  if (
    /^(https?:)?\/\//.test(path) ||
    path.startsWith("mailto:") ||
    path.startsWith("#")
  )
    return path;
  if (path === "/") return basePath;
  const normalized = path.replace(/^\/+/, "");
  return `${basePath}${normalized}`;
}

export function withBaseAsset(path: string): string {
  return withBase(path.replace(/^\/+/, ""));
}

export function mailto(subject?: string): string {
  const base = `mailto:${siteConfig.contact.email}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

export function toAbsoluteSiteUrl(path: string, site: string): string {
  return new URL(withBaseAsset(path), site).toString();
}
