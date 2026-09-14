# 🏆 Mejores Prácticas de DreamFolio

> Las convenciones que este repositorio realmente sigue. La fuente de verdad es
> `.claude/rules/code-standards.md`; esta guía la explica con ejemplos del árbol que existe, y cada
> versión que cita sale de `package.json`.

---

## 📐 Filosofía

| Pilar | Qué significa aquí | Cómo se aplica |
| ------- | -------------------- | ---------------- |
| **Rendimiento** | HTML pre-renderizado y cero JavaScript de cliente por defecto | `output: 'static'`, sin directivas `client:*` |
| **DX** | Un comando por pregunta | `pnpm dev`, `pnpm verify`, `pnpm test:e2e` |
| **Propósito** | Un portafolio no es una aplicación | Sin backend, sin base de datos, sin estado de cliente |

Un portafolio carga rápido, se indexa bien y muestra trabajo. Toda dependencia nueva tiene que
justificarse contra eso.

---

## 🚀 El stack real

Las tres dependencias directas de `package.json`:

| Dependencia | Versión | Para qué |
| ------------- | --------- | ---------- |
| **Astro** | ^7.3.2 | Salida estática, enrutado y colecciones de contenido |
| **@tailwindcss/vite** | ^4.3.3 | Tailwind 4 a través de su plugin de Vite |
| **@astrojs/sitemap** | 3.7.4 | `sitemap-index.xml` en cada build |

### Lo que está deliberadamente ausente

Esas tres son todas. `package.json` no declara ninguna otra, y en particular no hay ninguna de las
que suelen pedirse para un sitio así: un framework de cliente, una librería de animación, un helper
de clases condicionales, o una dependencia de validación propia.

Tampoco existe `tailwind.config.mjs`: en Tailwind 4 la configuración vive dentro del CSS, en el
bloque `@theme` de `src/styles/global.css`. Y no hay transiciones de vista: nada importa
`astro:transitions`.

La validación del contenido la aporta la capa de contenido de Astro: `src/content.config.ts` usa `z`
reexportado por `astro:content`, junto con el loader `file()`.

> **Regla:** una dependencia nueva necesita una necesidad concreta que el HTML, el CSS o un pequeño
> `<script>` no puedan cubrir.

---

## ⚡ Rendimiento

### Métricas objetivo

| Métrica | Objetivo | El lever real en este repositorio |
| --------- | ---------- | ----------------------------------- |
| **LCP** | < 2.5s | HTML pre-renderizado; fuentes locales desde `public/fonts/` |
| **INP** | < 100ms | Cero JavaScript de cliente por defecto |
| **CLS** | < 0.1 | Dimensiones explícitas en cada imagen |
| **FCP** | < 1.8s | CSS crítico en el documento, sin hojas de terceros |
| **TTFB** | < 600ms | Estático servido desde el CDN de GitHub Pages o Vercel |

### Imágenes

Las imágenes viven ya optimizadas en `public/images/` (`profile/`, `projects/`) y se referencian con
un `<img>` simple. El prefijo de la ruta sale de `withBaseAsset`, porque en GitHub Pages el sitio se
sirve bajo `/DreamFolio` y una ruta absoluta escrita a mano se rompe allí.

```astro
---
import { withBaseAsset } from "../lib/site";
---

<img
  src={withBaseAsset("/images/projects/mi-proyecto.webp")}
  alt="Descripción útil, no el nombre del archivo"
  width="1200"
  height="750"
  loading="lazy"
  decoding="async"
/>
```

Declarar `width` y `height` es lo que protege el CLS; `loading="lazy"` se reserva para lo que está
debajo del pliegue.

### Medir

```bash
pnpm build && pnpm preview   # queda servido en el puerto 4321

# en otra terminal
pnpm lighthouse
```

---

## ♿ Accesibilidad

Cada criterio tiene algo que lo sostiene y que falla cuando se rompe, en vez de depender de la
intención:

| Criterio | Qué lo sostiene |
| ---------- | ----------------- |
| HTML semántico y una sola jerarquía de encabezados | Revisión; las suites leen por rol y por encabezado |
| Texto alternativo en cada imagen | Revisión, y el `alt` de la portada como campo del esquema |
| Anillo de foco consistente | `:focus-visible` consolidado en una sola declaración (3px, offset 5px), asertado en `tests/theme-state/` |
| Contraste de texto ≥ 4.5:1 | El harness de contraste compone y mide reposo, hover, press y foco en ambos temas |
| Contraste no textual ≥ 3:1 | Aserciones A7 del contrato de tokens |
| `prefers-reduced-motion` | Guarda en `src/styles/global.css` que neutraliza transiciones y animaciones |
| `prefers-contrast: more` | Bloques de tokens en ambos temas |
| `forced-colors` | Señales no cromáticas en `portfolio.css` |
| Navegación por teclado | Los e2e llegan al foco con `Tab` y nunca con un clic: `:focus-visible` sólo coincide así |

---

## 🔍 SEO técnico

El `<head>` completo vive en `src/layouts/BaseLayout.astro`: `canonical`, Open Graph (tipo, url,
título, descripción, imagen, tipo de imagen, alt y `site_name`) y las etiquetas de Twitter. El `site`
y el `base` salen de `astro.config.mjs`, que sirve GitHub Pages bajo `/DreamFolio` y Vercel desde `/`.

### Sitemap y `robots.txt`

`@astrojs/sitemap` genera `sitemap-index.xml` en cada build. `robots.txt` **no es un archivo
estático**: lo emite `src/pages/robots.txt.ts` en tiempo de build, y arma la URL del sitemap con
`withBase` para que respete el `base` — que es exactamente el error que traía el ejemplo viejo de esta
guía, con una barra doble en la URL.

```ts
// src/pages/robots.txt.ts
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL(withBase("sitemap-index.xml"), site);
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
```

---

## 🌙 Tema claro y oscuro

El tema no usa una clase `.dark`: se aplica con el atributo `data-theme` en `<html>`, y los colores
salen de tokens declarados en `src/styles/global.css`.

```css
@theme { /* modo oscuro: los valores canónicos */ }
[data-theme="light"] { /* sobrescrituras del modo claro */ }
```

- `public/theme-init.js` se carga como script clásico bloqueante y aplica el tema guardado **antes
  del primer pintado**. Ésa es toda su razón de existir: diferirlo produce el destello del tema
  equivocado, que es el problema que resuelve.
- La clave de almacenamiento es `dreamfolio-theme`.
- Sin valor guardado, el tema sigue `prefers-color-scheme` del sistema.
- El toggle vive en `src/components/ui/Navbar.astro`, como JavaScript vainilla dentro de un `<script>`.

---

## 🧩 Componentes y nombres

El catálogo son tres archivos, todos `.astro` y todos estáticos.

| Componente | Archivo |
| ------------ | --------- |
| `Icon` | `src/components/ui/Icon.astro` |
| `Navbar` | `src/components/ui/Navbar.astro` |
| `ProfileCard` | `src/components/ui/ProfileCard.astro` |

### Convenciones de nombre

| Tipo | Regla | Ejemplo |
| ------ | ------- | --------- |
| Componentes | `PascalCase.astro` | `Navbar.astro`, `ProfileCard.astro` |
| Utilidades | `camelCase.ts` | `site.ts`, `icons.ts` |
| Páginas | `kebab-case.astro` | `projects/index.astro` |
| Configuración | `camelCase.mjs` | `astro.config.mjs` |

### Clases condicionales

No hay un helper que combine y deduplique clases. Se resuelven con un template literal o con
`class:list` de Astro:

```astro
<div class:list={["module-row", { "is-visible": visible }]}>…</div>
```

### TypeScript

Modo estricto. Interfaces para formas de objeto, `type` para uniones y alias, nunca `any` —`unknown`
si de verdad hace falta— y los tipos que cruzan módulos se exportan.

### Cuando algo necesita el navegador

Primero un `<script>` acotado al componente, como hace `Navbar.astro`. Un framework de cliente es la
última opción y requiere una decisión de arquitectura, no un atajo.

---

## 🏛️ Arquitectura

```text
src/
├── components/ui/      # UI reutilizable: los tres archivos .astro
├── content.config.ts   # La colección tipada sobre data/projects.json
├── data/               # projects.json — los datos
├── layouts/            # BaseLayout.astro
├── lib/                # Helpers de presentación y de build
├── pages/              # index, 404, projects/, projects/[id], robots.txt
└── styles/             # global.css (tokens) + portfolio.css
```

| Principio | Aplicación |
| ----------- | ------------ |
| **KISS** | No crear abstracciones hasta necesitarlas |
| **Separación de responsabilidades** | Los datos (la colección) separados de la UI (los componentes) |
| **Colocation** | Cada archivo cerca de lo que le da sentido |
| **Sin sobre-ingeniería** | Casos de uso, entidades, repositorios y DTOs para leer un JSON son un anti-patrón |

---

## 📝 Contenido

Los proyectos son datos, no Markdown. `src/content.config.ts` declara la colección con el loader
`file("src/data/projects.json")` y un esquema que valida cada entrada durante el build.

| Campo | Tipo |
| ------- | ------ |
| `id`, `title`, `summary`, `domain`, `path` | `string` |
| `lifecycle` | `active` \| `workspace` \| `archived` \| `lab` |
| `bucket` | `primary` \| `workspace` \| `archived` \| `lab` |
| `updatedYear` | entero |
| `featured` | booleano, por defecto `false` |
| `stack` | array de `string`, por defecto vacío |
| `githubUrl`, `liveUrl` | URL opcional |
| `coverImage`, `coverImageAlt`, `coverImageMobile` | `string` opcional |

Agregar un proyecto es editar `src/data/projects.json`: un campo mal tipado falla el build, que es
exactamente lo que se quiere.

---

## 📊 Checklist final

### Antes de publicar

- [ ] `pnpm verify` — build y typecheck
- [ ] `pnpm test:e2e` — suite de Playwright
- [ ] `pnpm format:check`
- [ ] `pnpm secret:scan`
- [ ] `git diff --check`

No hay ESLint configurado: el gate es CI, que corre typecheck, e2e, build, formato y el escaneo de
secretos.

### Rendimiento

- [ ] Lighthouse Performance > 95 contra `pnpm preview`
- [ ] Ninguna directiva `client:*` agregada sin una necesidad concreta
- [ ] Imágenes optimizadas y con dimensiones explícitas

### Accesibilidad y SEO

- [ ] La tabla de accesibilidad de la primera mitad sigue sosteniéndose
- [ ] `canonical` y Open Graph correctos en la página nueva
- [ ] La página aparece en `sitemap-index.xml`

---

## 📚 Referencias

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Web.dev Vitals](https://web.dev/vitals/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
