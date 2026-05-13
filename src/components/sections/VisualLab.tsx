import React from 'react';
import { motion } from 'motion/react';
import { Palette, Terminal, Layout, Eye } from 'lucide-react';

const labs = [
  {
    title: 'The Nytherx Visual System',
    description: 'A visual architecture for high-density technical interfaces. Graphite, cocoa, and lucuma copper.',
    icon: Palette,
    color: 'text-primary'
  },
  {
    title: 'Cocoa Terminal Environment',
    description: 'A workstation stack designed for visual clarity and technical focus. Built with GLSL and Lua.',
    icon: Terminal,
    color: 'text-lucuma'
  },
  {
    title: 'ARKONYX Fiscal Interface',
    description: 'Command center for audit-first compliance. Turning complex regulation into deterministic evidence.',
    icon: Layout,
    color: 'text-cyan'
  }
];

export const VisualLab: React.FC = () => {
  return (
    <section id="lab" className="py-32 bg-background-soft/30">
      <div className="layout-grid mb-20">
        <div className="col-span-12 space-y-4">
          <p className="terminal-text text-primary">Lab 04 // Visual Systems</p>
          <h2 className="text-5xl md:text-7xl font-display font-black text-foreground italic tracking-tighter italic leading-none">
            Visual Laboratory.
          </h2>
          <p className="max-w-2xl text-lg text-muted-text font-medium leading-relaxed">
            Thinking in systems extends to aesthetics. I design technical interfaces where every element justifies its existence through clarity and architectural intent.
          </p>
        </div>
      </div>

      <div className="layout-grid gap-8">
        {labs.map((lab, i) => (
          <motion.div
            key={lab.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="col-span-4 glass-panel p-8 space-y-6 group hover:border-primary/30 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl bg-background-deep border border-border flex items-center justify-center ${lab.color}`}>
              <lab.icon className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-display font-black text-foreground uppercase tracking-tight italic">
                {lab.title}
              </h3>
              <p className="text-muted-text font-medium leading-relaxed">
                {lab.description}
              </p>
            </div>
            <div className="flex items-center gap-2 terminal-text text-muted-text/30 group-hover:text-primary transition-colors cursor-pointer">
              <Eye className="w-3 h-3" />
              <span>Inspect Lab</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
