import { withBase } from "../site";
import type { SectionInput } from "./registry";

/** The console's static "jump to a section" list — build-time data with
 *  hrefs already base-path-resolved (see registry.ts). Kept out of
 *  CommandConsole.astro so the component's own markup/script stays inside
 *  its file-size budget. */
export const CONSOLE_SECTIONS: SectionInput[] = [
  {
    id: "projects",
    label: "Proyectos",
    href: withBase("/#projects"),
    keywords: ["proyectos", "trabajo", "portafolio"],
  },
  {
    id: "about",
    label: "Sobre mí",
    href: withBase("/#about"),
    keywords: ["sobre mi", "perfil", "bio", "about"],
  },
  {
    id: "architecture",
    label: "Enfoque",
    href: withBase("/#architecture"),
    keywords: ["arquitectura", "enfoque", "architecture"],
  },
  {
    id: "services",
    label: "Servicios",
    href: withBase("/#services"),
    keywords: ["servicios", "precios", "services"],
  },
  {
    id: "process",
    label: "Proceso",
    href: withBase("/#process"),
    keywords: ["proceso", "metodologia", "process"],
  },
  {
    id: "connect",
    label: "Contacto",
    href: withBase("/#connect"),
    keywords: ["contacto", "hablemos", "email", "contact"],
  },
];
