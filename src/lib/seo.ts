import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sniffImage, type ImageMeta } from "./image-meta";
import { siteConfig, whatsapp } from "./site";

/** og:image type/size from the file in public/ itself (build time only).
 *  Remote or unreadable images return null, and the tags are left out. */
export function localImageMeta(image: string): ImageMeta | null {
  if (/^https?:\/\//.test(image)) return null;
  try {
    const path = join(process.cwd(), "public", image.replace(/^\/+/, ""));
    return sniffImage(readFileSync(path));
  } catch {
    return null;
  }
}

/** The site-wide Person JSON-LD, used when a page passes none of its own. */
export function personJsonLd(canonical: string): Record<string, unknown> {
  const telephone = siteConfig.contact.whatsappDisplay.replace(/\s/g, "");
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Dreamcoder",
    url: canonical,
    jobTitle: "Systems Architect",
    knowsAbout: [
      "Arquitectura de sistemas",
      "Sistemas de IA con supervisión humana",
      "Producto digital",
      "Trazabilidad y evidencia",
    ],
    email: `mailto:${siteConfig.contact.email}`,
    telephone,
    address: { "@type": "PostalAddress", addressCountry: "PE" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "professional inquiries",
      telephone,
      email: siteConfig.contact.email,
      url: whatsapp(),
      availableLanguage: ["es", "en"],
    },
    sameAs: [
      siteConfig.social.github,
      siteConfig.social.x,
      siteConfig.social.instagram,
    ],
  };
}
