import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Shield, Activity, ChevronRight, Layers } from 'lucide-react';
import type { SystemUnit } from '../../data/systems';

interface Props {
  system: SystemUnit;
}

export const DossierCard: React.FC<Props> = ({ system }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-panel overflow-hidden group border-border hover:border-primary/30 transition-all duration-700"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Unit Header */}
        <div className="lg:col-span-4 bg-background-deep p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="terminal-text text-primary">Unit: {system.id}</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-display font-black text-foreground italic tracking-tighter uppercase">
              {system.title}
            </h3>
            <p className="terminal-text text-muted-text/40">{system.domain}</p>
          </div>
          
          <div className="pt-10 flex flex-wrap gap-2">
            {system.stack.map(tech => (
              <span key={tech} className="bg-surface border border-border px-3 py-1 rounded-full terminal-text text-[8px] text-muted-text/60">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Technical Expedition Data */}
        <div className="lg:col-span-8 p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 terminal-text text-danger">
                <Activity className="w-3.5 h-3.5" /> Friction
              </div>
              <p className="text-sm text-muted-text font-medium leading-relaxed">
                {system.friction}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 terminal-text text-lucuma">
                <Layers className="w-3.5 h-3.5" /> Architecture
              </div>
              <p className="text-sm text-muted-text font-medium leading-relaxed">
                {system.architecture}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 terminal-text text-sage">
                <Shield className="w-3.5 h-3.5" /> Evidence
              </div>
              <p className="text-sm text-muted-text font-medium leading-relaxed">
                {system.evidence}
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
                <Terminal className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="terminal-text text-foreground text-[10px]">{system.role}</p>
                <p className="text-xs text-muted-text/40 italic">Outcome: {system.outcome}</p>
              </div>
            </div>
            
            <button className="flex items-center gap-2 terminal-text text-primary group-hover:gap-3 transition-all cursor-pointer">
              <span>Inspect Payload</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
