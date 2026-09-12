# DreamFolio - Project Context

## Project Overview

DreamFolio is a high-performance personal portfolio website built for a Cybersecurity Engineer / FinTech Architect / Creative Technologist. The project showcases technical skills, projects, and facilitates professional contact.

## Technology Stack

- **Framework**: Astro 7.x, fully static (`output: 'static'`), zero client-side JS framework
- **Styling**: Tailwind CSS 4.x (CSS-first config, no `tailwind.config.mjs`) with a dual light/dark theme system
- **Language**: TypeScript (strict mode)
- **Testing**: Playwright for e2e (`tests/`)
- **Deployment**: GitHub Pages (primary, base path `/DreamFolio`) and Vercel (`pnpm deploy`), selected at build time via `astro.config.mjs`

React, Motion, Supabase, and Zod were removed from the project (see commits `842b1c3` and `af68540`) — there is no backend, no client-side hydration, and no form validation library.

## Project Structure

```
src/
├── components/
│   └── ui/            # Astro components (Icon, Navbar, ProfileCard)
├── layouts/            # BaseLayout.astro
├── lib/                # icons.ts, site.ts, project-case-studies.ts, project-presentation.ts
├── pages/              # Astro pages
│   ├── index.astro
│   ├── 404.astro
│   └── projects/
│       ├── index.astro
│       └── [id].astro
├── styles/             # global.css (design tokens + theme), portfolio.css
├── data/               # projects.json, systems.ts
└── content.config.ts
tests/                  # Playwright e2e specs
```

## Key Files

- `astro.config.mjs`: Astro config — Tailwind Vite plugin, base path switches between GitHub Pages and Vercel
- `src/styles/global.css`: Design tokens (`@theme`) and `[data-theme="light"]` overrides
- `src/lib/site.ts`, `src/lib/icons.ts`: Site metadata and icon registry
- `src/data/projects.json`: Portfolio project entries

## Design System

### Colors (CSS Variables, dark by default, `[data-theme="light"]` overrides)
- Surface: pure black `#000000` (dark, layered `#0d0d10` / `#17171c`) / warm cream `#f3eadc` (light)
- Text: off-white `#ededeb` (dark) / dark brown `#17120d` (light)
- Text secondary: `#b7b8b3` (dark) / `#6b5947` (light)
- Accent: OLED orange `#ff7a18` (dark) / burnt orange `#8a4e26` (light)
- Danger: `#ff6b6b` (dark) / `#b3261e` (light)

### Typography
- Sans: Inter (body + headings)
- Mono: JetBrains Mono (code, labels)

### Visual Style
- Dual theme (dark default, light opt-in), no glassmorphism
- Responsive design (mobile-first)

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm check        # astro sync + tsc --noEmit
pnpm test:e2e     # Build + run Playwright suite
pnpm verify       # Build + check
pnpm deploy       # Deploy to Vercel (production)
pnpm lighthouse   # Run Lighthouse audit
```

## Important Notes

1. **Build Output**: Static site generated to `dist/`
   - Deployed to GitHub Pages via CI workflow (`Deploy to GitHub Pages`)
   - Also deployable to Vercel (`pnpm deploy` / `pnpm deploy:staging`)

2. **TypeScript**: Strict mode enabled, full type safety

3. **No backend, no forms**: there is no database, no auth, and no contact form in the current codebase — treat any reference to Supabase or a contact form as historical, not current.

## Common Tasks

- Adding a new project: Edit `src/data/projects.json`
- Creating a new UI component: Add to `src/components/ui/`
- Adding e2e coverage: Add a spec under `tests/`


---

## AI Models - February 2026

### Claude (Anthropic)
- **Claude Opus 4.6** (Feb 5, 2026): Flagship model, 1M token context (beta), 65.4% Terminal-Bench 2.0, 80.8% SWE-bench
- **Claude Sonnet 4.6** (Feb 17, 2026): Default model, improved coding, 1M token context (beta), near-Opus performance
- **Adaptive Thinking**: Dynamic effort levels (low/medium/high/max)

### OpenAI
- **GPT-5.3-Codex** (Feb 5, 2026): Agentic coding, 25% faster, 56.8% SWE-Bench, self-generating
- **GPT-5.3-Codex-Spark** (Feb 12, 2026): Ultra-fast, >1000 tokens/sec on Cerebras
- **GPT-5.2** (Dec 2025): Knowledge cutoff August 2025

### Google Gemini
- **Gemini 3.1 Pro** (Feb 19, 2026): Advanced reasoning, complex problem-solving
- **Gemini 3 Deep Think** (Feb 12, 2026): Research-grade reasoning
- **Gemini 2.5 Pro** (Mar 2025): 1M token context, thinking model, SOTA on coding benchmarks

### Framework Updates
- **Astro 6 Beta** (Jan 2026): Redesigned dev server, native CSP, Zod 4, Cloudflare Workers support

---

## Skills for Portfolio (Feb 2026)

### Cybersecurity Engineer
- Cloud Security (AWS/Azure/GCP + zero-trust)
- AI-driven threat detection
- AI/ML security (adversarial attacks)
- Incident Response automation (SOAR + AI)
- Threat hunting con behavioral analytics
- DevSecOps

### FinTech Architect
- AI/ML en banking (fraud detection)
- Blockchain/DeFi integration
- Secure API/Cloud architecture
- Regulatory compliance (GDPR + AI ethics)
- MLOps para financial models

### Creative Technologist
- Agentic AI + multi-agent systems
- Generative AI (diffusion models)
- Multimodal AI (Gemini 3.1)
- Prompt engineering + RAG
- Creative coding (p5.js, Spline)