# Perfil e identidad visual

La portada incluye un espacio de foto independiente del contenido: `src/components/ui/ProfileCard.astro`.

## Poner una fotografía real

1. Añadir una foto cuadrada a `public/images/profile/` (recomendado: WebP, 768 × 768 px).
2. En `src/lib/site.ts`, cambiar `profile.image` por su ruta y `profile.imageAlt` por una descripción real, por ejemplo `Retrato de Dreamcoder`.
3. Ajustar `profile.imagePosition` si hace falta centrar el rostro; por ejemplo `50% 35%`.

La tarjeta adapta automáticamente el encuadre a escritorio y móvil.

## Assets

- `public/images/profile/dreamcoder-portrait.webp`: retrato activo (768 × 768), encuadre `50% 28%` para mantener el rostro visible en el recorte corto de móvil.
- `docs/assets/dreamcoder-retrato-original.png`: retrato original sin pérdida.
- `docs/assets/dreamcoder-compass-original.png`: imagen original generada, conservada sin pérdida (la insignia abstracta previa, `dreamcoder-emblem.webp`, se eliminó de `public/` por no tener ninguna referencia activa).
- `public/favicon.svg`: emblema vectorial de ocho puntas.
- `src/lib/icons.ts`: sistema de iconos, cuadrícula de 24 px y trazo de 1.6 px. Los glifos funcionales son propios; GitHub y X conservan formas reconocibles de sus marcas.
- `src/components/ui/Icon.astro`: componente accesible para iconos decorativos. Los enlaces y botones mantienen sus nombres en texto o `aria-label`.

No se añadieron dependencias. Se respetan las preferencias de movimiento reducido.
