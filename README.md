# DreamFolio

Elite public portfolio for fiscal AI systems architecture, built around Arkelythex, inspectable systems, and static-first frontend execution.

## Architecture

DreamFolio is intentionally simple: Astro renders the portfolio as static HTML, and React is used only where the UI needs real client-side behavior.

```txt
src/
├── components/
│   ├── sections/          # Landing and project sections
│   │   ├── *.astro        # Static sections, preferred by default
│   │   └── *.tsx          # Hydrated islands only when interaction is real
│   └── ui/                # Small reusable React primitives
├── content.config.ts      # Typed project collection schema
├── data/                  # Public system data
├── layouts/               # Base document layout and SEO
├── lib/                   # Presentation/site helpers
├── pages/                 # Astro routes
└── styles/                # Global Tailwind/Cocoa theme
```

## Hydration policy

Static by default. Hydrate only when the browser must own state or behavior.

Current hydrated islands:

- `Navbar` — mobile menu and smooth section navigation.
- `EnhancedHero` — interactive signal selector.
- `EvidenceEngine` — interactive evidence/preset inspection.
- `TechnicalIntake` — clipboard, local validation, target-domain selection, and `mailto:` draft generation.

Static sections include `VisualLab`, `CollaborationSection`, `SystemUnit`, `CraftProtocol`, `TrinitySection`, and `TechnicalDepth`.

## Tech stack

- Astro 5
- React 19 islands
- Tailwind CSS 4
- Motion for the few remaining interactive islands
- TypeScript strict mode
- pnpm

## Quality gates

```bash
pnpm install
pnpm run verify
git diff --check
```

Recent verification snapshot:

- Build: 37 static pages generated.
- Typecheck: passing.
- Lighthouse mobile: Accessibility 100, Best Practices 100, SEO 100, Agentic Browsing 100.

## Local development

```bash
pnpm install
pnpm dev
```

Preview production build:

```bash
pnpm run build
pnpm run preview
```

## Deployment

The repository is configured for GitHub Pages with:

- `site: https://dreamcoder08.github.io`
- `base: /DreamFolio` in production

Vercel config is also present for static deployment compatibility.

## Public/private boundary

DreamFolio is public by design: it is the proof surface for frontend craft, architecture, accessibility, and product narrative.

Keep private:

- Arkelythex core implementation details
- private fiscal rules and workflows
- credentials and environment secrets
- proprietary agent prompts or internal strategy

## License

Portfolio source for public inspection and personal brand proof. Reuse responsibly.

---

## 🌐 Dreamcoder Ecosystem

| Project | Description |
|---------|-------------|
| [Dreamcoder08](https://github.com/Dreamcoder08) | Software Architect · GDE · MVP — Founder of ARKELYTEX |
| [Dreamcoder_dots](https://github.com/Dreamcoder08/Dreamcoder_dots) | Arch Linux dotfiles — Zsh, Ghostty, Kitty, Stow |
| [CleanSweep](https://github.com/Dreamcoder08/CleanSweep) | AI-assisted dotfile manager in Rust |
| [ARKELYTEX](https://github.com/arkelythex) | Civic, Agri & Legal Tech for Peru |
