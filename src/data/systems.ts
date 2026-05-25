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
    id: "arkelythex",
    title: "Arkelythex",
    domain: "Fiscal-Operational Intelligence",
    friction: "Fiscal teams operate with scattered evidence, manual close cycles, and opaque AI risk.",
    architecture: "Deterministic fiscal runtime with governed agents, evidence graph, and approval gates.",
    evidence: "SUNAT, SIRE, CPE, reconciliation, and human-review traces stay inspectable before execution.",
    role: "Founder and Systems Architect. Building the company, platform, and Drenyra command center.",
    stack: ["Bun", "React 19", "Elysia", "PostgreSQL", "NATS"],
    outcome: "Peru-first fiscal operations become traceable, reviewable, and ready for LATAM expansion.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "edge-traz-agro",
    title: "edge-traz-agro",
    domain: "Edge Traceability",
    friction: "Data integrity loss and fraud in disconnected rural edge environments without central authority.",
    architecture: "Offline-first sync protocol + local-first cryptographic signing for every state transition.",
    evidence: "Immutable local-first sync trails with distributed ledger verification for harvest units.",
    role: "Infrastructure Designer. Architected the local-first sync protocol and edge resilience strategy.",
    stack: ["TypeScript", "Bun", "SQLite", "Docker"],
    outcome: "Verified traceability for distributed harvest units. Eliminated single points of failure in edge data ingest.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "legal-os",
    title: "legal-os",
    domain: "Legal Intelligence",
    friction: "Manual, error-prone legal operations dealing with fragmented data and lack of traceability.",
    architecture: "Structural legal intelligence engine + deterministic transformation pipelines.",
    evidence: "Decision logs and cryptographically secured legal data transformation trails (Forensic Auditability).",
    role: "System Designer. Built the structural legal intelligence engine for high-volume automation.",
    stack: ["Bun", "Turbo", "Rust", "Python"],
    outcome: "Automated high-volume legal operations with deterministic accuracy and full forensic auditability.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "dreamcoder-dots",
    title: "dreamcoder-dots",
    domain: "Visual OS Laboratory",
    friction: "Inefficient workstation configuration and lack of workstation-level visual and technical automation.",
    architecture: "Version-controlled dotfiles with shader-driven clarity and AI-first system integration.",
    evidence: "Publicly auditable configuration manifests with 99.9% environment replication accuracy.",
    role: "Architect. Designed a custom Arch Linux workstation stack for maximum performance and visual clarity.",
    stack: ["Arch Linux", "Lua", "GLSL", "Shell"],
    outcome: "High-performance terminal stack with shader-driven clarity. Drastic reduction in environment setup latency.",
    updatedYear: 2026,
    featured: true
  }
];
