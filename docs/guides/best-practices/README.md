# DreamFolio Best Practices

The conventions this repository actually follows. The source of truth is
`.claude/rules/code-standards.md`; these guides explain it with examples from the tree that
exists today. Every version they quote comes from `package.json`.

## Philosophy

| Pillar          | What it means here                                   | How it is applied                                 |
| --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| **Performance** | Pre-rendered HTML; no client framework, no hydration | `output: 'static'`, no `client:*` directive       |
| **DX**          | One command per question                             | `pnpm dev`, `pnpm verify`, `pnpm test:e2e`        |
| **Purpose**     | A portfolio is not an application                    | No backend, no database, no client-side app state |

A portfolio loads fast, indexes well, and shows work. Every new dependency has to justify itself
against that.

## Guides

| Guide                                                     | Read it when you…                                         |
| --------------------------------------------------------- | --------------------------------------------------------- |
| [Architecture and modularity](./architecture.md)          | add a file, a component, a dependency, or a project entry |
| [Styling and tokens](./styling-and-tokens.md)             | touch colors, themes, or component styles                 |
| [Accessibility and SEO](./accessibility-and-seo.md)       | add a page, an interactive state, or head metadata        |
| [Performance and motion](./performance-and-motion.md)     | add an image, a script, an animation, or a transition     |
| [Testing and verification](./testing-and-verification.md) | write tests, refactor, or run heavy checks locally        |
| [Workflow and delivery](./workflow-and-delivery.md)       | commit, open a PR, handle a review, or ship               |

## References

- [Astro documentation](https://docs.astro.build)
- [Astro content collections](https://docs.astro.build/en/guides/content-collections/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [web.dev Web Vitals](https://web.dev/vitals/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
