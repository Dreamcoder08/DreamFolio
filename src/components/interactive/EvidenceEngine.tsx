import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '../ui';

const nodes = [
  { id: 'input', label: 'INPUT', color: 'text-foreground' },
  { id: 'val', label: 'VALIDATION', color: 'text-sage' },
  { id: 'const', label: 'CONSTRAINT', color: 'text-primary' },
  { id: 'risk', label: 'RISK', color: 'text-lavender' },
  { id: 'evid', label: 'EVIDENCE', color: 'text-accent' },
  { id: 'dec', label: 'DECISION', color: 'text-cyan-soft' },
];

export const EvidenceEngine: React.FC = () => {
  return (
    <div className="w-full py-24 overflow-hidden bg-background-deep/50 rounded-[3rem] border border-white/5 my-20">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center mb-16 text-center">
          <span className="font-mono text-[9px] font-black text-primary uppercase tracking-[0.5em] mb-4">Real-Time Integrity Pipeline</span>
          <h3 className="text-3xl md:text-5xl font-display font-black text-foreground italic tracking-tighter">The Evidence Engine.</h3>
        </div>

        <div className="flex flex-wrap justify-center lg:justify-between items-center gap-6 md:gap-8 relative">
          {/* Animated Background Connection Line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 hidden lg:block -translate-y-1/2 overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            />
          </div>

          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative z-10 flex flex-col items-center group flex-shrink-0"
            >
              <div 
                className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] flex items-center justify-center border border-white/10 bg-background-soft shadow-clay group-hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 ${node.color}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                  <span className="font-mono text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">
                    {node.label}
                  </span>
                </div>
              </div>
              
              {/* Connector for mobile */}
              {i < nodes.length - 1 && (
                <div className="lg:hidden w-px h-8 bg-white/10 mt-4 mb-2" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="font-mono text-[10px] text-muted-text/40 uppercase tracking-[0.2em]">
            Status: System Handshake Initialized // Integrity: Verified
          </p>
        </div>
      </div>
    </div>
  );
};
