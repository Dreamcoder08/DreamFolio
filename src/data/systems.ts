export interface SystemUnit {
  id: string;
  title: string;
  domain: string;
  problem: string;
  role: string;
  stack: string[];
  evidence: string;
  outcome: string;
  updatedYear: number;
  featured: boolean;
}

export const mainSystems: SystemUnit[] = [
  {
    id: "arkonyx",
    title: "ARKONYX",
    domain: "Autonomous Finance",
    problem: "Black-box liquidations and non-deterministic execution in high-volatility DeFi environments.",
    role: "Lead Systems Architect. Designed the autonomous fiscal engine and audit-first data layer.",
    stack: ["TypeScript", "Monorepo", "Docker", "Rust"],
    evidence: "On-chain execution logs verified by automated state constraints and cryptographic proof.",
    outcome: "99.9% deterministic recovery under cascade failure scenarios. Infrastructure for high-integrity operations.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "edge-traz-agro",
    title: "EdgeTraz Agro",
    domain: "Supply Chain",
    problem: "Data integrity loss and fraud in disconnected rural edge environments without central authority.",
    role: "Infrastructure Designer. Architected the local-first sync protocol and edge resilience strategy.",
    stack: ["TypeScript", "Bun", "Docker", "SQLite"],
    evidence: "Immutable local-first sync trails with cryptographic signing for every state transition.",
    outcome: "Verified traceability for distributed harvest units. Eliminated single points of failure in edge data ingest.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "digital-public-peru",
    title: "Digital Public Peru",
    domain: "GovTech",
    problem: "Fragmented civic infrastructure and high-friction service flows in public administration.",
    role: "Systems Architect. Modernized civic digital infrastructure through high-integrity administrative design.",
    stack: ["Node.js", "Rust", "PostgreSQL"],
    evidence: "Service flow audit trails and compliance-first administrative architecture documentation.",
    outcome: "Modernized public sector infrastructure with audit-first service integrity and improved reliability.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "legal-os",
    title: "Legal OS",
    domain: "Legal Intelligence",
    problem: "Manual, error-prone legal operations dealing with fragmented data and lack of traceability.",
    role: "System Designer. Built the structural legal intelligence engine for high-volume automation.",
    stack: ["Bun", "Turbo", "Rust", "Python"],
    evidence: "Deterministic decision logs and cryptographically secured legal data transformation trails.",
    outcome: "Automated high-volume legal operations with deterministic accuracy and full forensic auditability.",
    updatedYear: 2026,
    featured: true
  },
  {
    id: "dreamcoder-dots",
    title: "DreamcoderDots",
    domain: "Engineer Experience",
    problem: "Inefficient local environment configuration and lack of workstation-level automation.",
    role: "Architect. Designed a custom Arch Linux workstation stack for maximum performance and visual clarity.",
    stack: ["Arch Linux", "Shell", "Lua", "GLSL"],
    evidence: "Version-controlled dotfiles architecture with AI-first automation and deep system-level integration.",
    outcome: "High-performance terminal stack with shader-driven clarity. Drastic reduction in environment setup latency.",
    updatedYear: 2026,
    featured: true
  }
];
