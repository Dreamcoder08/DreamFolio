import type { APIRoute } from "astro";
import { siteConfig, withBase, withBaseAsset } from "../lib/site";

// Lets phones "add to home screen" with a real icon and name instead of a
// page screenshot. Paths go through withBase so GitHub Pages' /DreamFolio
// prefix and Vercel's root both resolve.
export const GET: APIRoute = () => {
  const manifest = {
    name: siteConfig.title,
    short_name: "Dreamcoder",
    description: siteConfig.description,
    lang: "es",
    start_url: withBase("/"),
    scope: withBase("/"),
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: withBaseAsset("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: withBaseAsset("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: withBaseAsset("/icons/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
};
