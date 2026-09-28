# Architecture and Modularity

[Back to the index](./README.md)

## The real stack

The four direct dependencies in `package.json`:

| Dependency            | Version | Purpose                                         |
| --------------------- | ------- | ----------------------------------------------- |
| **astro**             | ^7.3.5  | Static output, routing, and content collections |
| **tailwindcss**       | ^4.3.3  | Tailwind 4 itself, imported from `global.css`   |
| **@tailwindcss/vite** | ^4.3.3  | Tailwind 4 through its Vite plugin              |
| **@astrojs/sitemap**  | 3.7.4   | `sitemap-index.xml` on every build              |

Tooling lives in `devDependencies`: Playwright, Prettier (with the Astro plugin), `serve`, and
TypeScript.

### What is deliberately absent

No client framework, no animation library, no conditional-class helper, and no validation
dependency of its own.

There is no `tailwind.config.mjs`: in Tailwind 4 the configuration lives in CSS, in the `@theme`
block of `src/styles/global.css`.

Content validation comes from Astro's content layer: `src/content.config.ts` uses the `z`
re-exported by `astro:content`, with the `file()` loader from `astro/loaders`.

> **Rule:** a new dependency needs a concrete need that HTML, CSS, or a small component-scoped
> `<script>` cannot cover.

## Source tree

```text
src/
├── components/
│   ├── sections/       # Homepage sections: Hero, About, Architecture, Services, Projects, …
│   └── ui/             # Icon, Navbar, ProfileCard, CommandConsole, MuTerminal, ConvergenceField
├── content.config.ts   # The typed collection over data/projects.json
├── data/               # projects.json — the data
├── layouts/            # BaseLayout.astro — head, CSP, theme bootstrap
├── lib/                # Presentation and build helpers, plus console/, convergence/, terminal/
├── pages/              # index, 404, projects/, projects/[id], robots.txt.ts
├── scripts/            # reveal.ts — the scroll-reveal module
└── styles/             # global.css, base.css, tokens/, components/, portfolio.css + portfolio/
```

| Principle                  | Application                                                                     |
| -------------------------- | ------------------------------------------------------------------------------- |
| **KISS**                   | No abstraction until it is needed                                               |
| **Separation of concerns** | Data (the collection) apart from UI (the components)                            |
| **Colocation**             | Each file near what gives it meaning                                            |
| **No over-engineering**    | Use cases, entities, repositories, and DTOs to read one JSON is an anti-pattern |

## Components and naming

Every component is `.astro` and rendered at build time. Reusable logic goes to `src/lib/`.

| Kind       | Rule               | Example                             |
| ---------- | ------------------ | ----------------------------------- |
| Components | `PascalCase.astro` | `Navbar.astro`, `ProfileCard.astro` |
| Utilities  | `camelCase.ts`     | `site.ts`, `icons.ts`               |
| Pages      | `kebab-case.astro` | `projects/index.astro`              |
| Config     | `camelCase.mjs`    | `astro.config.mjs`                  |

Multi-word modules under `src/lib/` use kebab-case (`project-presentation.ts`,
`controller-geometry.ts`); follow the neighbors in the folder you touch.

### Conditional classes

There is no helper that merges and deduplicates classes. Use a template literal or Astro's
`class:list`:

```astro
<div class:list={["module-row", { "is-visible": visible }]}>…</div>
```

### TypeScript

Strict mode. Interfaces for object shapes, `type` for unions and aliases, never `any` (`unknown`
if truly needed), and types that cross modules are exported.

### When something needs the browser

First a `<script>` scoped to the component, as `Navbar.astro`, `CommandConsole.astro`,
`MuTerminal.astro`, and `ConvergenceField.astro` do. Astro bundles it as a same-origin module,
which the CSP already allows. A client framework is the last option and needs an architecture
decision, not a shortcut.

Never put inline `style=""` attributes in markup: the CSP has no `style-src-attr` override, so the
browser silently drops them.

## Content

Projects are data, not Markdown. `src/content.config.ts` declares the collection with the
`file("src/data/projects.json")` loader and a schema that validates each entry at build time.

| Field                                             | Type                                            |
| ------------------------------------------------- | ----------------------------------------------- |
| `id`, `title`, `summary`, `domain`, `path`        | `string`                                        |
| `lifecycle`                                       | `active` \| `workspace` \| `archived` \| `lab`  |
| `bucket`                                          | `primary` \| `workspace` \| `archived` \| `lab` |
| `updatedYear`                                     | integer                                         |
| `featured`                                        | boolean, default `false`                        |
| `stack`                                           | `string` array, default empty                   |
| `githubUrl`, `liveUrl`                            | optional URL                                    |
| `coverImage`, `coverImageAlt`, `coverImageMobile` | optional `string`                               |

Adding a project means editing `src/data/projects.json`. A mistyped field fails the build, which is
exactly what we want.

## File-size ratchet

`scripts/check-file-size.mjs` fails CI when a tracked file exceeds its line budget in
`scripts/file-size-budget.json`:

| Files                           | Max lines |
| ------------------------------- | --------- |
| `src/**/*.ts`, `src/**/*.astro` | 200       |
| `src/**/*.css`                  | 250       |
| `tests/**/*.ts`                 | 300       |
| `scripts/**/*.{mjs,sh,js}`      | 150       |
| `odd/**/*.md`, `docs/**/*.md`   | 200       |

Existing offenders sit in the allowlist with a ceiling that can only go down. When a file
shrinks, run `node scripts/check-file-size.mjs --update-allowlist`: it lowers ceilings and drops
entries now within budget, and never raises one or adds one. Over budget means extract a real
module, not raise the ceiling.
