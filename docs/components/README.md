# Component Catalog

Three components, all `.astro`, all turned into HTML at build time. There is no client framework in
this repository, and no component carries a browser runtime of its own.

| Component | File | Purpose |
| ----------- | ------ | --------- |
| `Icon` | `src/components/ui/Icon.astro` | Renders one inline SVG from the icon set in `src/lib/icons.ts`. No sprite sheet and no icon font. |
| `Navbar` | `src/components/ui/Navbar.astro` | Site navigation: desktop links, the mobile menu, and the theme toggle, driven by one inline vanilla script. |
| `ProfileCard` | `src/components/ui/ProfileCard.astro` | The portrait and identity block, reading `siteConfig` for its copy and its asset paths. |

## Layout and pages

Not components, but the rest of what renders:

| File | Purpose |
| ------ | --------- |
| `src/layouts/BaseLayout.astro` | The document shell: head, Content-Security-Policy, theme bootstrap and analytics tag. |
| `src/pages/index.astro` | The home page; composes the sections directly. |
| `src/pages/projects/index.astro` | The project index. |
| `src/pages/projects/[id].astro` | One project page, built from the typed collection. |
| `src/pages/404.astro` | The not-found page. |

## Design rule

If a component only renders content it is an `.astro` file, which today is all of them. Adding a
client framework would require an interaction that vanilla JavaScript cannot express.
