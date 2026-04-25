import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown, Shield, Mail } from 'lucide-react';
import { Badge, Button } from '../ui';
import { withBase } from '../../lib/site';

const EnhancedHeroSection: React.FC = () => {
  return (
    <section 
      className="min-h-[100dvh] flex flex-col justify-center relative overflow-hidden py-24 md:py-0"
    >
      <div className="layout-grid">
        <div className="col-span-4 md:col-span-8 lg:col-span-12">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, cubicBezier: [0.23, 1, 0.32, 1] }}
            className="space-y-12"
          >
            <header className="space-y-6">
              <Badge variant="primary" className="mb-4">
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                Audit-First Infrastructure
              </Badge>
              
              <h1 className="text-[var(--text-fluid-hero)] font-display font-black leading-[0.82] tracking-tighter italic text-foreground">
                 Architecting <br/> 
                 <span className="text-muted-text/20 not-italic">systems that</span> <br/>
                 explain themselves.
              </h1>
            </header>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
              <p className="max-w-2xl text-[var(--text-fluid-body)] text-muted-text font-medium leading-relaxed">
                I build high-integrity AI infrastructure for domains where <span className="text-foreground">trust is expensive</span>. 
                My architecture is designed for environments where failure is a liability and evidence is the currency of reliability.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4 md:pt-0">
                <Button 
                  onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-10 bg-primary text-background font-black uppercase text-[10px] tracking-[0.2em] shadow-clay border-none hover:bg-accent transition-all h-[52px] rounded-full"
                >
                  Inspect Systems
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-10 border-white/10 text-foreground font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/5 transition-all h-[52px] rounded-full"
                >
                  Technical Intake
                </Button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Decorative indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <div className="flex flex-col items-center gap-4">
          <span className="font-mono text-[9px] font-black text-muted-text/30 uppercase tracking-[0.4em]">Scroll to Inspect</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary/40 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
};

export default EnhancedHeroSection;
