import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ShieldCheck, Target, Activity, FileText } from 'lucide-react';
import { Card } from '../ui';
import type { SystemUnit as SystemUnitType } from '../../data/systems';

interface Props {
  system: SystemUnitType;
}

export const SystemUnit: React.FC<Props> = ({ system }) => {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, cubicBezier: [0.23, 1, 0.32, 1] }}
      className="glass-clay overflow-hidden flex flex-col lg:flex-row border-white/5 h-full"
    >
      {/* Visual / Domain Side */}
      <div className="lg:w-1/3 bg-background-deep p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary shadow-glow" />
            <span className="font-mono text-[10px] font-black text-primary tracking-[0.3em] uppercase">
              {system.domain}
            </span>
          </div>
          <h3 className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tighter italic leading-none">
            {system.title}
          </h3>
        </div>
        
        <div className="mt-12 flex flex-wrap gap-2">
          {system.stack.map(s => (
            <span key={s} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] text-muted-text font-bold uppercase tracking-widest">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Content / Narrative Side */}
      <div className="lg:w-2/3 p-10 md:p-14 grid md:grid-cols-2 gap-10 md:gap-14">
        
        {/* The Friction */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground/40">
            <Target size={14} strokeWidth={2.5} />
            <h4 className="font-mono text-[10px] font-black uppercase tracking-widest">The Friction</h4>
          </div>
          <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-medium">
            {system.problem}
          </p>
        </div>

        {/* Architectural Role */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground/40">
            <Activity size={14} strokeWidth={2.5} />
            <h4 className="font-mono text-[10px] font-black uppercase tracking-widest">Architectural Role</h4>
          </div>
          <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-medium">
            {system.role}
          </p>
        </div>

        {/* Audit Evidence */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={14} strokeWidth={2.5} />
            <h4 className="font-mono text-[10px] font-black uppercase tracking-widest">Audit Evidence</h4>
          </div>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed font-medium italic">
            {system.evidence}
          </p>
        </div>

        {/* System Outcome */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sage">
            <FileText size={14} strokeWidth={2.5} />
            <h4 className="font-mono text-[10px] font-black uppercase tracking-widest">System Outcome</h4>
          </div>
          <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-black">
            {system.outcome}
          </p>
        </div>

      </div>

      {/* Detail Link Overlay (Top Right) */}
      <div className="absolute top-8 right-8">
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-muted-text hover:text-primary hover:border-primary transition-all group/btn cursor-pointer">
          <ArrowUpRight className="w-6 h-6 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </div>
      </div>
    </motion.article>
  );
};
