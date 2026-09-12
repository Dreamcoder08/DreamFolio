<div align="center">

# DreamFolio

Portafolio público de Dreamcoder08 — arquitectura frontend static-first con Astro, construido con velocidad y accesibilidad de primer nivel.

[![Stack](https://img.shields.io/badge/stack-Astro%20%2B%20Tailwind-informational)](#stack-t%C3%A9cnico)
[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-blue)](https://dreamcoder08.github.io/DreamFolio)

</div>

---

## Demo

![DreamFolio screenshot](./docs/assets/dreamfolio-screenshot.png)

## Índice

- [Descripción](#descripción)
- [Características](#características)
- [Stack técnico](#stack-técnico)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)
- [Licencia](#licencia)

## Descripción

DreamFolio es el portafolio público de Dreamcoder08: una superficie de evidencia para mostrar arquitectura frontend, accesibilidad y las decisiones técnicas detrás de cada proyecto. Astro renderiza el sitio como HTML estático puro — sin framework de UI en el cliente, sin hidratación.

## Características

- **Arquitectura 100% estática** — Astro genera HTML puro; el sitio no envía JavaScript de framework al navegador.
- **Tema dual claro/oscuro** — tokens definidos en `src/styles/global.css`, oscuro por defecto (superficie `#000000` pura con capas `#0d0d10` / `#17171c` y acento `#e6b795`) con overrides `[data-theme="light"]` (`#f3eadc` / `#8a4e26`). El modo oscuro respeta `prefers-contrast: more`.
- **Cobertura e2e con Playwright** — specs en `tests/` para home, listado de proyectos y detalle de proyecto (Page Object Model), corridos en CI.
- **Tipografías autohospedadas** — Inter y JetBrains Mono variables (subset latin) servidas desde `/fonts/`. Ninguna visita contacta a Google Fonts.
- **Analítica opcional** — Umami se controla con `PUBLIC_UMAMI_SRC` y `PUBLIC_UMAMI_WEBSITE_ID`. Apuntar la primera a una instancia propia elimina el tercero; dejar la segunda vacía desactiva la analítica.
- **Despliegue automatizado** — CI/CD vía GitHub Actions a GitHub Pages: typecheck (`astro sync` + `tsc`), e2e y build antes de publicar.

## Stack técnico

| Capa               | Tecnología                                                   |
| ------------------ | ------------------------------------------------------------ |
| Framework          | Astro 7 (SSG, static-first)                                  |
| Estilos            | Tailwind CSS 4 (config CSS-first, sin `tailwind.config.mjs`) |
| Lenguaje           | TypeScript (modo estricto)                                   |
| Testing            | Playwright (e2e)                                             |
| Gestor de paquetes | pnpm                                                         |
| CI/CD              | GitHub Actions → GitHub Pages                                |

## Instalación

```bash
git clone https://github.com/Dreamcoder08/DreamFolio.git
cd DreamFolio
pnpm install
```

## Uso

```bash
# desarrollo
pnpm dev

# build de producción + preview local
pnpm run build
pnpm run preview

# typecheck + build (quality gate usado en CI)
pnpm run verify
```

## Estructura del proyecto

```
DreamFolio/
├── src/
│   ├── components/
│   │   └── ui/              # Componentes Astro (Icon, Navbar, ProfileCard)
│   ├── content.config.ts    # Esquema tipado de la colección de proyectos
│   ├── data/                 # Datos públicos del sitio (projects.json)
│   ├── layouts/               # Layout base y SEO
│   ├── lib/                    # Helpers de presentación/sitio
│   ├── pages/                   # Rutas de Astro
│   └── styles/                   # Tokens de tema (global.css) y layout (portfolio.css)
├── tests/                           # Specs e2e de Playwright (Page Object Model)
├── docs/                             # Documentación del proyecto
└── public/                            # Assets estáticos
```

## Despliegue

El sitio se despliega automáticamente a GitHub Pages en cada push a `main`/`master` mediante `.github/workflows/deploy.yml` (instala con pnpm, corre typecheck, e2e con Playwright, build y publica `dist/`). También incluye `vercel.json` para despliegue alternativo en Vercel.

> **Nota sobre `.env.example`**: el archivo referencia Supabase y APIs de IA (OpenAI/Anthropic/Google). Confirmado por historial de git (`842b1c3` — "remove Supabase, go fully static") que son remanentes de una iteración anterior del proyecto: ninguna variable ahí listada es consumida por el código actual en `src/`.

## Seguridad

Canal de divulgación responsable: `dreamcoder.dev08@gmail.com`, publicado también en
`/.well-known/security.txt` (RFC 9116). No abras un issue público para reportar
una vulnerabilidad.

### Riesgo aceptado: clave anon de Supabase en el historial (sin remediar)

`gitleaks` reporta dos hallazgos `generic-api-key` en el historial de git, ambos
valores `PUBLIC_SUPABASE_ANON_KEY` dentro de documentación que ya no existe en
`HEAD` (commit `27945a8`, 28-feb-2026).

- **Estado: SIN REMEDIAR.** La clave no se ha rotado. Una clave anon de Supabase
  es pública por diseño en aplicaciones cliente, pero solo es inofensiva con Row
  Level Security activo; sin RLS da acceso a los datos, y las claves de Supabase
  no expiran solas. El proyecto salió del código (commit `842b1c3`), pero eso no
  invalida la clave.
- **Por qué un repositorio privado no lo resuelve:** el valor es público desde
  febrero de 2026, así que hay que asumir que ya fue recolectado. La visibilidad
  no es retroactiva.
- **Remediación:** rotar o eliminar la clave en el panel de Supabase. Eso deja
  inerte el valor filtrado, y recién entonces se borra el waiver.

### El waiver vence, a propósito

`.gitleaksignore` incluye una fecha `# expires:` y los dos workflows de CI la leen
y **fallan cerrado** si falta o ya pasó. Pasada esa fecha, el escaneo rompe el
build hasta que la credencial se rote y el waiver se elimine.

Es deliberado: un waiver abierto dejaría el escaneo permanentemente verde sobre
una credencial viva, lo que es peor que no tener escaneo — convierte una
exposición conocida en una invisible.

## Licencia

<TODO: completar — no se encontró archivo LICENSE en el repositorio. Definir y agregar la licencia antes de publicitar el proyecto como open source.>
