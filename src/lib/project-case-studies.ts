export interface ProjectSignalMetric {
  label: string;
  value: string;
}

export interface ProjectCaseStudySection {
  title: string;
  body: string;
}

export interface ProjectCaseStudyModule {
  name: string;
  description: string;
}

export interface ProjectFlagshipCaseStudy {
  thesis: string;
  sections: ProjectCaseStudySection[];
  modules: ProjectCaseStudyModule[];
  decisions: string[];
}

export interface ProjectCaseStudy {
  eyebrow: string;
  challenge: string;
  approach: string;
  outcome: string;
  evidence: string[];
  signals: string[];
  metrics: ProjectSignalMetric[];
  cardImpact: string;
  highlightRank: number;
  flagship?: ProjectFlagshipCaseStudy;
}

const projectCaseStudies: Record<string, ProjectCaseStudy> = {
  arkelythex: {
    eyebrow: 'Flagship Fiscal-Operational Intelligence',
    challenge:
      'Peruvian fiscal operations still depend on scattered files, manual review, and late visibility. The hard problem is not automation; it is making fiscal decisions traceable before they affect the business.',
    approach:
      'I am building Arkelythex as a fiscal-operational intelligence platform: deterministic rules, governed agents, evidence graph, and human approval gates.',
    outcome:
      'Arkelythex turns close, review, reconciliation, and compliance work into inspectable workflows for Peru-first teams and LATAM expansion.',
    evidence: [
      'Fiscal validation modeled as deterministic gates before state changes.',
      'SIRE, CPE, reconciliation, and close workflows designed around visible evidence.',
      'Governed agents prepare work, but approval and execution stay bounded by traceability.',
    ],
    signals: ['SUNAT', 'SIRE', 'CPE', 'Evidence Graph', 'Governed Agents'],
    metrics: [
      { label: 'Domain', value: 'Peru Fiscal Ops' },
      { label: 'Trust Model', value: 'Evidence-First' },
      { label: 'Execution', value: 'Approval-Gated' },
    ],
    cardImpact:
      'Fiscal-operational intelligence with deterministic rules, evidence trails, and governed agent workflows.',
    highlightRank: 1,
    flagship: {
      thesis:
        'Arkelythex treats fiscal evidence as the operating layer for accounting, compliance, and agent-assisted work.',
      sections: [
        {
          title: 'Problem Space',
          body:
            'Fiscal work breaks when invoices, declarations, accounting context, and review decisions live in disconnected tools.',
        },
        {
          title: 'Architectural Thesis',
          body:
            'Domain rules decide what cannot happen. Agents can assist, but only inside inspectable boundaries.',
        },
        {
          title: 'Evidence Model',
          body:
            'Every workflow explains what entered, which rules ran, what risk appeared, what evidence was produced, and who approved the next step.',
        },
      ],
      modules: [
        {
          name: 'Drenyra Command Center',
          description: 'Coordinates companies, periods, agents, evidence, risk, and approval.',
        },
        {
          name: 'Fiscal Truth Engine',
          description: 'Runs deterministic fiscal rules before accounting state changes.',
        },
        {
          name: 'Evidence Graph',
          description: 'Keeps source trails, mismatches, reviews, and decisions connected.',
        },
        {
          name: 'Governed Agents',
          description: 'Prepare and explain work without bypassing human approval.',
        },
      ],
      decisions: [
        'Position Arkelythex as company + platform, not just a single app.',
        'Keep the narrative short: fiscal evidence, governed agents, human approval.',
        'Use Drenyra as the flagship command center inside the ecosystem.',
      ],
    },
  },
  'legal-os-01': {
    eyebrow: 'Structured Intelligence System',
    challenge:
      'I needed to unify fragmented legal data and complex procedural workflows into a deterministic operating system without compromising data fidelity.',
    approach:
      'I architected a multi-layered data ingestion pipeline with automated semantic tagging and built a modular service layer using Rust and Bun for high-performance processing.',
    outcome:
      'I created a centralized legal intelligence platform that transforms raw documentation into actionable structured data, reducing procedural latency significantly.',
    evidence: [
      'My high-speed document parsing engine with semantic validation.',
      'Deterministic workflow engine I built for complex legal sequences.',
      'Unified schema I designed for cross-jurisdictional data interoperability.',
    ],
    signals: ['Data Engineering', 'Rust Performance', 'LegalTech Architecture'],
    metrics: [
      { label: 'Processing', value: 'Sub-second Parsing' },
      { label: 'Reliability', value: 'Deterministic Flows' },
      { label: 'Scale', value: 'Multi-tenant Ready' },
    ],
    cardImpact: 'Centralized legal intelligence OS I architected for high-volume data orchestration.',
    highlightRank: 5,
  },
  'digital-public-peru': {
    eyebrow: 'Public Service Infrastructure',
    challenge:
      'I needed to modernize public-sector service flows while preserving traceability, compliance constraints, and operational reliability.',
    approach:
      'I designed service boundaries around administrative workflows, with clear data contracts and resilience patterns for high-friction institutional environments.',
    outcome:
      'I shaped a civic infrastructure baseline that improves service continuity and makes system behavior easier to audit and operate.',
    evidence: [
      'Workflow architecture aligned to public-sector constraints and documentation needs.',
      'Service interfaces designed for transparent state transitions.',
      'Operational foundations focused on reliability and long-term maintainability.',
    ],
    signals: ['GovTech Architecture', 'Service Integrity', 'Operational Resilience'],
    metrics: [
      { label: 'Domain', value: 'Public Infrastructure' },
      { label: 'Design', value: 'Service Boundaries' },
      { label: 'Priority', value: 'Traceable Operations' },
    ],
    cardImpact:
      'Civic digital infrastructure focused on service integrity, compliance alignment, and reliable operations.',
    highlightRank: 3,
  },
  'edge-traz-agro': {
    eyebrow: 'Edge Computing Resilience',
    challenge:
      'I faced the challenge of maintaining data integrity and operational traceability in low-connectivity environments where field devices must operate autonomously.',
    approach:
      'I developed an offline-first synchronization protocol and leveraged lightweight containerization to ensure consistent deployment across heterogeneous hardware.',
    outcome:
      'I built a robust traceability system for remote operations, reducing cloud dependency and preserving reliable local capture.',
    evidence: [
      'My asynchronous sync engine with verifiable state hashes.',
      'Low-power edge worker nodes I designed for real-time telemetry.',
      'Hardened hardware-software interface for environmental resilience.',
    ],
    signals: ['Edge Computing', 'Offline-First Sync', 'IoT Resilience'],
    metrics: [
      { label: 'Uptime', value: '99.9% Edge Autonomy' },
      { label: 'Sync Latency', value: 'Optimized Burst' },
      { label: 'Data Safety', value: 'Local Redundancy' },
    ],
    cardImpact: 'Edge traceability infrastructure I built for operational resilience in distributed environments.',
    highlightRank: 2,
  },
  'dreamcoder-dots': {
    eyebrow: 'System Orchestration',
    challenge:
      'I set out to engineer a reproducible, high-performance Linux workstation environment that balances aesthetic polish with extreme operational efficiency.',
    approach:
      'I built a modular configuration system using GNU Stow and custom Shell/Lua orchestrators, integrating GLSL shader-driven visual feedback loops.',
    outcome:
      'I achieved a deterministic development environment that I can bootstrap in minutes, providing a high-signal interface for deep-work sessions.',
    evidence: [
      'Declarative system setup I designed using shell automation.',
      'GPU-accelerated terminal interface with custom GLSL integration.',
      'Modular DX tooling with unified keybinding orchestration.',
    ],
    signals: ['System Design', 'Developer Experience', 'Unix Philosophy'],
    metrics: [
      { label: 'Bootstrap', value: '< 5 min' },
      { label: 'Engine', value: 'Lua + Shell' },
      { label: 'Visuals', value: 'GLSL / GPU' },
    ],
    cardImpact: 'Deterministic Arch Linux workstation environment with custom GPU-driven orchestration.',
    highlightRank: 4,
  },
};

export function getProjectCaseStudy(projectId: string): ProjectCaseStudy | undefined {
  return projectCaseStudies[projectId];
}

export function getProjectHighlightRank(projectId: string): number {
  return projectCaseStudies[projectId]?.highlightRank ?? Number.MAX_SAFE_INTEGER;
}
