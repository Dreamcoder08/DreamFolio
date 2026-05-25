import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type EvidenceNode = {
  id: string;
  label: string;
  color: string;
  description: string;
};

const baseNodes: EvidenceNode[] = [
  { 
    id: 'input', 
    label: 'INPUT', 
    color: 'text-foreground',
    description: 'Raw domain data enters the system. Ambiguity is identified before it becomes state.'
  },
  { 
    id: 'val', 
    label: 'VALIDATION', 
    color: 'text-sage',
    description: 'Strict rules reject non-deterministic or malicious payloads. Integrity check active.'
  },
  { 
    id: 'const', 
    label: 'CONSTRAINT', 
    color: 'text-primary',
    description: 'Architecture defines what cannot happen. Logic is bounded by deterministic safety.'
  },
  { 
    id: 'risk', 
    label: 'RISK', 
    color: 'text-danger',
    description: 'Real-time scoring of operational and fiscal exposure. Automated mitigation triggers.'
  },
  { 
    id: 'evid', 
    label: 'EVIDENCE', 
    color: 'text-accent',
    description: 'Every state transition leaves a verifiable trace. Immutable forensic audit trail.'
  },
  { 
    id: 'dec', 
    label: 'DECISION', 
    color: 'text-cyan',
    description: 'Human approval or deterministic execution based on verified systemic integrity.'
  },
];

const systemPresets: Record<string, { label: string; thesis: string; overrides: Record<string, string> }> = {
  arkelythex: {
    label: 'Arkelythex',
    thesis: 'Fiscal-operational intelligence for SUNAT, SIRE, CPE, and approval-gated agents.',
    overrides: {
      input: 'Invoices, books, SIRE records, and operational context enter as evidence candidates.',
      val: 'Fiscal rules reject ambiguity before data becomes accounting state.',
      const: 'No opaque automation, no untraceable correction, no silent fiscal mutation.',
      risk: 'Tax exposure, missing evidence, drift, and review obligations surface early.',
      evid: 'Each workflow records input, rule, mismatch, review, evidence, and decision.',
      dec: 'Agents prepare; humans approve; deterministic execution follows inspectable evidence.',
    },
  },
  edgetraz: {
    label: 'EdgeTraz',
    thesis: 'Offline-first traceability for distributed operations where connectivity cannot be trusted.',
    overrides: {
      input: 'Field data, harvest events, and local device records enter from disconnected edge environments.',
      val: 'Local rules validate identity, sequence, and payload integrity before sync.',
      const: 'Offline-first constraints prevent central-server dependency from becoming operational failure.',
      risk: 'The system detects data loss, tampering, duplicate records, and sync conflicts.',
      evid: 'Local traces preserve who recorded what, when, and under which device context.',
      dec: 'Records sync or remain quarantined based on verifiable local integrity.',
    },
  },
  dots: {
    label: 'DreamcoderDots',
    thesis: 'Terminal-first operating environment where workstation state is reproducible evidence.',
    overrides: {
      input: 'Dotfiles, shell scripts, compositor rules, and terminal themes enter as environment declarations.',
      val: 'Configuration rules reject broken paths, missing dependencies, and inconsistent workstation assumptions.',
      const: 'Reproducibility constraints keep the system portable across Arch Linux nodes.',
      risk: 'The stack exposes drift, visual noise, setup latency, and non-deterministic machine state.',
      evid: 'Public manifests and versioned configs become evidence of the operating environment.',
      dec: 'A workstation profile is applied only when the system can explain the resulting state.',
    },
  },
};

export const EvidenceEngine: React.FC = () => {
  const [activePreset, setActivePreset] = useState<keyof typeof systemPresets>('arkelythex');
  const [activeNodeId, setActiveNodeId] = useState(baseNodes[0].id);
  const preset = systemPresets[activePreset];
  const nodes = baseNodes.map((node) => ({
    ...node,
    description: preset.overrides[node.id] ?? node.description,
  }));
  const activeNode = nodes.find((node) => node.id === activeNodeId) ?? nodes[0];

  return (
    <div className="w-full py-32 overflow-hidden glass-panel bg-background-deep/40 my-32">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center mb-20 text-center">
          <span className="terminal-text text-primary mb-4">Integrity Protocol v2.0</span>
          <h3 className="text-4xl md:text-6xl font-display font-black text-foreground italic tracking-tighter">
            The Evidence Engine.
          </h3>
          <p className="mt-5 max-w-2xl text-muted-text font-medium leading-relaxed">
            {preset.thesis}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {(Object.keys(systemPresets) as Array<keyof typeof systemPresets>).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActivePreset(key)}
                aria-pressed={activePreset === key}
                className={`rounded-full border px-4 py-2 terminal-text transition-all ${
                  activePreset === key
                    ? 'border-primary bg-primary text-background'
                    : 'border-border bg-surface/40 text-muted-text hover:border-primary/40 hover:text-primary'
                }`}
              >
                {systemPresets[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Visualizer */}
        <div className="flex flex-wrap justify-center lg:justify-between items-center gap-6 md:gap-8 relative mb-24">
          <div className="absolute top-1/2 left-0 w-full h-px bg-border hidden lg:block -translate-y-1/2 overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            />
          </div>

          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative z-10 flex flex-col items-center"
            >
              <button
                onClick={() => setActiveNodeId(node.id)}
                aria-pressed={activeNode.id === node.id}
                aria-label={`Inspect ${preset.label} ${node.label} evidence stage`}
                className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                  activeNode.id === node.id
                  ? 'border-primary bg-surface shadow-[0_0_20px_rgba(251,185,116,0.2)]' 
                  : 'border-border bg-background-deep hover:border-muted-text/30'
                }`}
              >
                <div className={`flex flex-col items-center gap-2 ${activeNode.id === node.id ? node.color : 'text-muted-text/30'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span className="terminal-text text-[8px] md:text-[9px]">
                    {node.label}
                  </span>
                </div>
              </button>
              
              {i < nodes.length - 1 && (
                <div className="lg:hidden w-px h-8 bg-border mt-4 mb-2" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Description Panel */}
        <div className="bg-background-deep rounded-[2rem] border border-border p-10 min-h-[160px] flex items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activePreset}-${activeNode.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl space-y-4"
            >
              <h4 className={`terminal-text ${activeNode.color}`}>{preset.label} // {activeNode.label} Analysis</h4>
              <p className="text-xl text-muted-text font-medium leading-relaxed">
                {activeNode.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 text-center">
          <p className="terminal-text text-muted-text/20 italic">
            Trace Sequence: {nodes.map(n => n.id).join(' // ')}
          </p>
        </div>
      </div>
    </div>
  );
};
