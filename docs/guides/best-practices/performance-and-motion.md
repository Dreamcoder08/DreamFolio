# Performance and Motion

[Back to the index](./README.md)

## Target metrics

| Metric   | Target  | The real lever in this repository                                           |
| -------- | ------- | --------------------------------------------------------------------------- |
| **LCP**  | < 2.5s  | Pre-rendered HTML; self-hosted fonts from `public/fonts/`                   |
| **INP**  | < 100ms | No hydration; only small, component-scoped vanilla scripts                  |
| **CLS**  | < 0.1   | Explicit dimensions on every image                                          |
| **FCP**  | < 1.8s  | Small stylesheets inlined (`inlineStylesheets: "auto"`), no third-party CSS |
| **TTFB** | < 600ms | Static files served from the GitHub Pages or Vercel CDN                     |

The Lighthouse goal is mobile Performance ≥ 95 and 100 for Accessibility, Best Practices, and SEO.
The reference measurement is the `Lighthouse` workflow (`.github/workflows/lighthouse.yml`,
`lighthouserc.json`): three runs on a clean runner against the production build, failing on
category scores below the budget, CLS above 0.05 or TBT above 300 ms, with a score table in the
job summary. On the development laptop, a local run measured a 3.4 s first paint against 0.4 s
in a plain headless load, so treat local Lighthouse numbers as indicative only.

## Client JavaScript

There are no `client:*` directives and no client framework. What runs in the browser is
deliberate and small:

- `public/theme-init.js`, the blocking theme bootstrap.
- Component-scoped `<script>` modules in `Navbar`, `CommandConsole`, `MuTerminal`, and
  `ConvergenceField`, plus `src/scripts/reveal.ts`.
- The console loads its heavy part lazily, on first use.

Adding a script needs a concrete interactivity need. Adding a dependency needs more than that.

## Images

Images live pre-optimized in `public/images/` (`profile/`, `projects/`) and are referenced with a
plain `<img>`. The path prefix comes from `withBaseAsset`, because on GitHub Pages the site is
served under `/DreamFolio` and a hand-written absolute path breaks there.

```astro
---
import { withBaseAsset } from "../lib/site";
---

<img
  src={withBaseAsset("/images/projects/my-project.webp")}
  alt="A useful description, not the file name"
  width="1200"
  height="750"
  loading="lazy"
  decoding="async"
/>
```

`width` and `height` protect CLS. Reserve `loading="lazy"` for content below the fold.

## Motion

- Every animation and transition must respect `prefers-reduced-motion`. The global guard in
  `global.css` sets `animation` and `transition` to `none` under `reduce`; do not fight it with
  `!important` of your own.
- Page transitions are native cross-document view transitions in
  `portfolio/20-view-transitions.css`. There is no script and no `astro:transitions`. The
  `@view-transition` opt-in sits inside `prefers-reduced-motion: no-preference`, so unsupported
  browsers and reduced-motion visitors get plain navigation.
- `view-transition-name` values are assigned through classes and must be unique per document.
- Animate `transform` and `opacity`. Never set per-element values through inline `style=""`: the
  CSP drops them.
- WebGL work (`ConvergenceField`) must degrade: software renderers are rejected, and the
  forced-WebGL Playwright project covers the running, reduced-motion, and recovery paths.

## Measure locally

```bash
SITE_BASE=/ pnpm build             # the lighthouse script audits the site root
pnpm exec serve -l 4321 dist       # astro preview daemonizes here; serve stays in the foreground

# in another terminal
pnpm lighthouse                    # writes lighthouse-report.html
```

On the dev laptop, wrap the build in `scripts/safe-run.sh` (see
[Testing and verification](./testing-and-verification.md)). For the release decision, measure the
live site.

## Checklist

- [ ] Lighthouse mobile Performance ≥ 95.
- [ ] No `client:*` directive or new dependency added without a concrete need.
- [ ] Images optimized and with explicit dimensions.
- [ ] New motion checked with `prefers-reduced-motion: reduce`.
