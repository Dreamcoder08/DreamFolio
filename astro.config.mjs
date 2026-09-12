// @ts-check
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { resolveAnalytics } from "./src/lib/analytics.ts";

const isDev = process.env.NODE_ENV === "development";
const mode = isDev ? "development" : "production";

// Vite reads .env, .env.local, .env.[mode] and .env.[mode].local; gives the
// later files precedence; and never overrides a real environment variable.
// This file runs before Vite does, so it has to land on the same value.
// Loading the four files in reverse precedence order relies on
// process.loadEnvFile keeping the first value it sees, and real variables are
// already in process.env, so they win the way Vite intends. Reading only .env
// would let a value set in .env.[mode] reach the component through Vite but
// not the policy built below — the mismatch this wiring exists to remove.
const envDir = new URL(".", import.meta.url);
for (const name of [
  `.env.${mode}.local`,
  `.env.${mode}`,
  ".env.local",
  ".env",
]) {
  const file = fileURLToPath(new URL(name, envDir));
  if (existsSync(file)) {
    process.loadEnvFile(file);
  }
}

// One resolution feeds both the page's script tag and the policy that allows
// it, so self-hosting or disabling analytics cannot desynchronise the two.
const analytics = resolveAnalytics(process.env);
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
        `connect-src 'self'${analytics.connectOrigins
          .map((origin) => ` ${origin}`)
          .join("")}`,
      ],
      // Derived from the same resolution as the script tag, so pointing
      // analytics elsewhere updates the policy with it.
      scriptDirective: {
        resources: ["'self'", ...analytics.scriptOrigins],
      },
      // No styleSrcAttr override: the layout no longer sets inline style
      // attributes, so style attributes stay blocked rather than broadly
      // allowed. Astro still hashes the <style> blocks it emits.
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
