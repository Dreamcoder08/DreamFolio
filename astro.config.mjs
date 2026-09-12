// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

const isDev = process.env.NODE_ENV === "development";
// Vercel injects VERCEL=1 on every build automatically; no dashboard
// configuration required. Vercel serves the site from its domain root,
// while GitHub Pages serves it under /DreamFolio, so the base path must
// differ per platform rather than assume GitHub Pages by default.
const isVercel = process.env.VERCEL === "1";

// https://astro.build/config
export default defineConfig({
  site:
    process.env.SITE_URL ||
    (isVercel && process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://dreamcoder08.github.io"),
  base: process.env.SITE_BASE ?? (isDev || isVercel ? "/" : "/DreamFolio"),
  integrations: [sitemap()],
  server: {
    host: true,
    port: 4321,
  },
  output: "static",
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  security: {
    // Astro hashes the inline scripts and styles it emits and writes a
    // content-security-policy <meta> tag. Meta is the only CSP channel that
    // reaches GitHub Pages, which serves no custom headers.
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "form-action 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://gateway.umami.is",
      ],
      scriptDirective: {
        resources: ["'self'", "https://cloud.umami.is"],
      },
      styleDirective: {
        resources: [
          "'self'",
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 4321,
      strictPort: true,
      ws: {
        host: "localhost",
        protocol: "ws",
        clientPort: 4321,
        port: 4321,
      },
    },
  },
});
