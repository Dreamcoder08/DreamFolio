import type { CommandDefinition } from "./types.ts";

/** A homepage section the console can jump to. `href` is already resolved
 *  (base path applied) so this module needs no knowledge of Astro's base
 *  path or environment — plain data in, plain data out. */
export interface SectionInput {
  id: string;
  label: string;
  href: string;
  keywords?: string[];
}

export interface ProjectInput {
  slug: string;
  title: string;
  href: string;
}

export interface BuildCommandsInput {
  sections: SectionInput[];
  allProjectsHref: string;
  projects: ProjectInput[];
  githubHref: string;
  xHref: string;
  mailtoHref: string;
  email: string;
}

/** Builds the full command list from plain data. Called at build time from
 *  the Astro component, then serialized to JSON for the client — this
 *  function itself never runs in the browser. Group order is display order:
 *  the frequent actions come first so they never sit below the fold. */
export function buildCommands(input: BuildCommandsInput): CommandDefinition[] {
  const actions: CommandDefinition[] = [
    {
      id: "toggle-theme",
      label: "Cambiar tema",
      group: "Acciones",
      keywords: ["tema", "oscuro", "claro", "dark", "light", "theme"],
      action: { kind: "theme" },
    },
    {
      id: "copy-email",
      label: "Copiar correo",
      group: "Acciones",
      keywords: ["correo", "email", "copiar", "copy", input.email],
      action: { kind: "copy", text: input.email },
    },
    {
      id: "write-email",
      label: "Escribir un correo",
      group: "Acciones",
      keywords: ["correo", "mailto", "escribir", "email"],
      action: { kind: "external", href: input.mailtoHref },
    },
  ];

  const sections = input.sections.map<CommandDefinition>((section) => ({
    id: `section-${section.id}`,
    label: section.label,
    group: "Secciones",
    keywords: section.keywords ?? [],
    action: { kind: "navigate", href: section.href },
  }));

  const projects: CommandDefinition[] = [
    {
      id: "all-projects",
      label: "Ver todos los proyectos",
      group: "Proyectos",
      keywords: ["proyectos", "todos", "lista", "index"],
      action: { kind: "navigate", href: input.allProjectsHref },
    },
    ...input.projects.map<CommandDefinition>((project) => ({
      id: `project-${project.slug}`,
      label: project.title,
      group: "Proyectos",
      keywords: [project.slug],
      action: { kind: "navigate", href: project.href },
    })),
  ];

  const links: CommandDefinition[] = [
    {
      id: "open-github",
      label: "Abrir GitHub",
      group: "Enlaces",
      keywords: ["github", "codigo", "repositorio"],
      action: { kind: "external", href: input.githubHref },
    },
    {
      id: "open-x",
      label: "Abrir X / Twitter",
      group: "Enlaces",
      keywords: ["x", "twitter"],
      action: { kind: "external", href: input.xHref },
    },
  ];

  return [...actions, ...sections, ...projects, ...links];
}
