# 🚀 Guía de Inicio Rápido

> Configuración inicial del proyecto Dreamfolio Astro en tu entorno local.

---

## 📋 Prerrequisitos

| Herramienta | Versión Mínima | Verificar |
|-------------|----------------|-----------|
| **Node.js** | 18.x | `node --version` |
| **pnpm** | 8.x | `pnpm --version` |
| **Git** | 2.x | `git --version` |

---

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/dreamcoder08/DreamFolio.git
cd DreamFolio
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
# No required environment variables for the public portfolio.
```

> 💡 **Nota:** `TechnicalIntake` genera un borrador `mailto:` local; no hay backend público ni credenciales requeridas.

### 4. Iniciar Servidor de Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

---

## 📂 Estructura del Proyecto

```text
DreamFolio/
├── docs/                 # 📚 Documentación (estás aquí)
├── public/               # 📁 Assets estáticos
├── src/
│   ├── components/       # 🧩 Componentes UI
│   │   ├── sections/     # Secciones de página
│   │   └── ui/           # Componentes base
│   ├── layouts/          # 📐 Layouts Astro
│   ├── lib/              # 📦 Utilidades
│   ├── pages/            # 📄 Páginas/Rutas
│   └── styles/           # 🎨 Estilos globales
├── astro.config.mjs      # ⚙️ Configuración Astro
├── tailwind.config.mjs   # 🎨 Configuración Tailwind
└── package.json          # 📦 Dependencias
```

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo en puerto 4321 |
| `pnpm build` | Build de producción a `dist/` |
| `pnpm preview` | Preview del build de producción |
| `pnpm deploy` | Deploy a Vercel (producción) |
| `pnpm deploy:staging` | Deploy a Vercel (staging) |
| `pnpm lighthouse` | Análisis Lighthouse local |
| `pnpm clean` | Limpia `dist/` y cache |

---

## 🔄 Flujo de Desarrollo

```mermaid
flowchart LR
    A[Edit Code] --> B[Hot Reload]
    B --> C[Test Locally]
    C --> D{Ready?}
    D -->|No| A
    D -->|Yes| E[pnpm build]
    E --> F[pnpm preview]
    F --> G{Looks good?}
    G -->|No| A
    G -->|Yes| H[pnpm deploy]
```

---

## 🎨 Añadir Nuevos Componentes

### Nuevo Componente Astro (Estático)

```astro
---
// src/components/sections/NewSection.astro
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<section class="py-20">
  <h2 class="text-3xl font-bold">{title}</h2>
  <slot />
</section>
```

### Nuevo Componente React (Island)

```tsx
// src/components/sections/TechnicalIntake.tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';

export default function TechnicalIntake() {
  const [count, setCount] = useState(0);
  
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button onClick={() => setCount(c => c + 1)}>
        Clicked: {count}
      </button>
    </motion.section>
  );
}
```

**Usar en página:**

```astro
---
import TechnicalIntake from '../components/sections/TechnicalIntake';
---

<!-- Solo carga JS cuando es visible -->
<TechnicalIntake client:visible />
```

---

## 📊 Verificar Performance

### Lighthouse Local

```bash
# Build y preview
pnpm build && pnpm preview

# En otra terminal, correr Lighthouse
pnpm lighthouse
```

### Web Vitals en Consola

Abre DevTools (F12) y observa los logs de performance en la consola durante desarrollo.

---

## ❓ Solución de Problemas

### Error: Cannot find module

```bash
# Limpiar artefactos de build
pnpm clean
pnpm install
```

### El formulario no envía a un backend

Es intencional. `TechnicalIntake` valida localmente y abre un borrador `mailto:` para evitar credenciales públicas y backend innecesario.

### Build falla en Vercel

Verifica que Vercel use `pnpm install` y `pnpm build`, como está definido en `vercel.json`.

---

## 📚 Próximos Pasos

- [Mejores Prácticas 2025](./best-practices.md) - Stack recomendado
- [Arquitectura](../architecture/README.md) - Decisiones técnicas
- [Componentes](../components/README.md) - Documentación de UI
