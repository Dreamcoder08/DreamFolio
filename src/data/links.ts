import type { IconName } from "../lib/icons";
import { siteConfig, withBase, mailto } from "../lib/site";

export type LinkKind = "work" | "build" | "social";
type LinkItem = {
  id: string;
  title: string;
  description: string;
  label: string;
  icon: IconName;
  href: string;
  kinds: LinkKind[];
  featured?: boolean;
  external?: boolean;
};

export const links: LinkItem[] = [
  {
    id: "contact",
    title: "Let's work together",
    description: "Roles remotos, consultoría y colaboraciones.",
    label: "CONTACTO DIRECTO",
    icon: "mail",
    href: mailto("Let's work together — DreamCoder"),
    kinds: ["work"],
    featured: true,
  },
  {
    id: "portfolio",
    title: "DreamFolio",
    description: "Proyectos, decisiones técnicas y resultados verificables.",
    label: "PORTAFOLIO",
    icon: "globe",
    href: withBase("/"),
    kinds: ["work", "build"],
    featured: true,
  },
  {
    id: "github",
    title: "GitHub · Dreamcoder08",
    description: "Código abierto y evidencia de ingeniería.",
    label: "ENGINEERING",
    icon: "github",
    href: siteConfig.social.github,
    kinds: ["work", "build", "social"],
    external: true,
  },
  {
    id: "arkelythex",
    title: "ARKELYTHEX",
    description: "Laboratorio de ingeniería e inteligencia operativa.",
    label: "COMPANY",
    icon: "mark",
    href: "https://arkelythex.com/",
    kinds: ["build"],
    external: true,
  },
  {
    id: "drenyra",
    title: "Drenyra",
    description: "Sistemas financieros con IA, validación y control humano.",
    label: "FLAGSHIP PRODUCT",
    icon: "agents",
    href: "https://github.com/arkelythex/drenyra-command-center",
    kinds: ["build"],
    external: true,
  },
  {
    id: "x",
    title: "X / Twitter",
    description: "Ideas, ingeniería y avances de construcción.",
    label: "SOCIAL",
    icon: "x",
    href: siteConfig.social.x,
    kinds: ["social"],
    external: true,
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "Mi lado creativo, visual y personal.",
    label: "SOCIAL",
    icon: "instagram",
    href: siteConfig.social.instagram,
    kinds: ["social"],
    external: true,
  },
];

export const filters = [
  { id: "all", label: "Todos" },
  { id: "work", label: "Trabajo" },
  { id: "build", label: "Proyectos" },
  { id: "social", label: "Social" },
] as const;
