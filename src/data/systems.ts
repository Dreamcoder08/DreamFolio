export interface SystemUnit {
  id: string;
  title: string;
  domain: string;
  friction: string;
  architecture: string;
  evidence: string;
  role: string;
  stack: string[];
  outcome: string;
  updatedYear: number;
  featured: boolean;
}

export const mainSystems: SystemUnit[] = [
  {
    id: "drenyra",
    title: "Drenyra — Fiscal Command Center",
    domain: "Fiscal Intelligence",
    friction: "Fiscal teams operate with scattered evidence, manual close cycles, and opaque AI risk.",
    architecture: "Deterministic fiscal runtime with governed agents, evidence graph, and approval gates.",
    evidence: "SUNAT, SIRE, reconciliation, and human-review traces stay inspectable before execution.",
    role: "Founder and Systems Architect — designing the platform and leading the engineering team.",
    stack: ["React", "Bun", "Elysia", "PostgreSQL", "NATS"],
    outcome: "Peru-first fiscal operations become traceable, reviewable, and ready for LATAM expansion.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "edge-traz-agro",
    title: "EdgeTraz Agro",
    domain: "Edge Traceability",
    friction: "Data integrity loss and fraud in disconnected rural edge environments without central authority.",
    architecture: "Offline-first sync protocol with local-first cryptographic signing for every state transition.",
    evidence: "Immutable local-first sync trails with distributed ledger verification for harvest units.",
    role: "Infrastructure Designer — architected the local-first sync protocol and edge resilience strategy.",
    stack: ["TypeScript", "Bun", "Edge", "Docker"],
    outcome: "Verified traceability for distributed harvest units. Eliminated single points of failure.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "dreamcoder-dots",
    title: "Dreamcoder Dots",
    domain: "Developer Experience",
    friction: "Inefficient workstation configuration and lack of visual and technical automation.",
    architecture: "Version-controlled dotfiles with adaptive theming and AI-first system integration.",
    evidence: "22 visual targets from one tokens.json — terminals, editors, shell, desktop, browser.",
    role: "Architect — designed a custom Arch Linux workstation stack for maximum performance.",
    stack: ["Arch Linux", "Lua", "Shell"],
    outcome: "Health-first terminal environment with adaptive day/dusk/night modes. 22 targets, one source.",
    updatedYear: 2026,
    featured: true
  }
];
