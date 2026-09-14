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

## 🔍 SEO Técnico

### Configuración Básica

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title?: string;
  description?: string;
  image?: string;
}

const { 
  title = 'Dreamcoder08 | Full Stack Developer',
  description = 'Portfolio de desarrollo web...',
  image = '/og-image.jpg'
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO -->
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalURL} />
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={new URL(image, Astro.site)} />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={new URL(image, Astro.site)} />
</head>
```

### Sitemap Automático

```javascript
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://dreamcoder08.github.io/DreamFolio/',
  integrations: [sitemap()],
});
```

### robots.txt

```text
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://dreamcoder08.github.io/DreamFolio//sitemap-index.xml
```

---

## 🌙 Dark Mode

Es casi un estándar esperado en portafolios de desarrolladores.

### Implementación con CSS Variables

```css
/* src/styles/global.css */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 221 83% 53%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 217 91% 60%;
}
```

### Toggle con Sistema de Usuario

```typescript
// Detectar preferencia del sistema
function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

// Inicializar tema
function initTheme() {
  const stored = localStorage.getItem('theme');
  const theme = stored || getSystemTheme();
  
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Toggle theme
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```

---

## 🧩 Arquitectura de Componentes (Atomic Design)

### Utilidad `cn()` - Tailwind Inteligente

En 2025 es estándar usar una utilidad que combine `clsx` + `tailwind-merge` para resolver conflictos de clases:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uso: cn("bg-blue-500 p-4", className) 
// Si className="p-2", resultado es "bg-blue-500 p-2" (sin conflicto)
```

### Componentes Atómicos (`src/components/ui/`)

Sigue el patrón Atomic Design para componentes reutilizables:

| Componente | Descripción | Archivo |
| ------------ | ------------- | --------- |
| **Button** | Variantes, tamaños, loading | `ui/button.tsx` |
| **Input** | Label, error, a11y | `ui/input.tsx` |
| **Textarea** | Label, error, resize | `ui/textarea.tsx` |
| **Card** | Glassmorphism, slots | `ui/card.tsx` |
| **Badge** | Status tags, variantes | `ui/badge.tsx` |
| **StatusIndicator** | Pulse animation | `ui/status-indicator.tsx` |
| **LinkButton** | CTAs con arrow | `ui/link-button.tsx` |

### Patrón de Composición (Slots)

```tsx
// ❌ Mal - Prop drilling
<Card title="Hola" content="Mundo" footerText="Click" />

// ✅ Bien - Composición
<Card>
  <CardHeader>Hola</CardHeader>
  <CardBody>Mundo</CardBody>
  <CardFooter>Click</CardFooter>
</Card>
```

### Custom Hooks - Separar Lógica de UI

```typescript
// hooks/inlineContactValidation.ts
export function inlineContactValidation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // ... toda la lógica
  return { isSubmitting, submitStatus, handleFormSubmit, register, errors };
}

// El componente solo tiene JSX
const TechnicalIntake = () => {
  const { register, errors, isSubmitting, handleFormSubmit } = inlineContactValidation();
  return <form onSubmit={handleFormSubmit}>...</form>;
};
```

### Barrel Exports

```typescript
// src/components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Card, CardHeader, CardBody, CardFooter } from './card';
// ... etc

// Uso limpio
import { Button, Input, Card } from '../ui';
```

---

## 🏛️ Arquitectura \"Feature-First\"

### ❌ No Usar Clean Architecture

Clean Architecture está diseñada para **lógica de negocio compleja**. En un portafolio, tu "lógica de negocio" es simplemente mostrar texto e imágenes.

Implementar Casos de Uso, Entidades, Repositorios y DTOs para leer un archivo Markdown es un **anti-patrón** llamado *Over-engineering*.

### ✅ Usar Feature-First / Colocation

```text
src/
├── components/       # UI Reutilizable
├── content/          # Tu "Base de datos" (Markdown/MDX)
├── layouts/          # Plantillas base
├── pages/            # Rutas del sistema
└── styles/           # CSS global
```

### Principios Clave

| Principio | Aplicación |
| ----------- | ------------ |
| **KISS** | No crear abstracciones hasta necesitarlas |
| **Separation of Concerns** | Data (Content Collections) vs UI (Componentes) |
| **Colocation** | Mantener archivos relacionados juntos |

---

## 📝 Content Collections (Astro)

Para proyectos y contenido estructurado, usa Content Collections con local validation:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    image: z.string().optional(),
    liveUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    publishedAt: z.date(),
  }),
});

export const collections = { projects };
```

```markdown
---
# src/content/projects/my-project.md
title: "Mi Proyecto"
description: "Descripción del proyecto..."
technologies: ["React", "TypeScript", "Tailwind"]
featured: true
publishedAt: 2024-01-15
---

## Contenido MDX con componentes
```

---

## 🔗 View Transitions API

Astro soporta View Transitions nativas para transiciones de página tipo SPA:

```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions';
---

<head>
  <ViewTransitions />
</head>
```

```astro
<!-- Transición personalizada para elemento -->
<h1 transition:name="page-title">
  {title}
</h1>

<Image
  src={image}
  transition:name={`project-${slug}`}
  transition:animate="fade"
/>
```

---

## 📊 Checklist Final

### Performance

- [ ] Lighthouse Performance > 95
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] JS Bundle < 100KB total

### SEO

- [ ] Meta tags configurados
- [ ] Open Graph tags
- [ ] sitemap.xml generado
- [ ] robots.txt

### Accesibilidad

- [ ] HTML semántico
- [ ]ading hierarchy correcto
- [ ] Focus visible en todos los elementos
- [ ] Reduced motion respetado

### DX

- [ ] TypeScript strict
- [ ] ESLint + Prettier configurados
- [ ] Hot reload funcional
- [ ] Documentación actualizada

---

## 📚 Referencias

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Web.dev Vitals](https://web.dev/vitals/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Islands Architecture](https://www.patterns.dev/posts/islands-architecture)
