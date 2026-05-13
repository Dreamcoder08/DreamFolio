import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight, Activity, Terminal, Database, Book } from 'lucide-react';

const tabs = [
  { id: 'systems', label: 'Systems', icon: Database, content: 'Flagship infrastructure: ARKONYX, EdgeTraz, LegalOS.' },
  { id: 'evidence', label: 'Evidence', icon: Shield, content: 'Constraint-first verification. Proof over claims.' },
  { id: 'interface', label: 'Interface', icon: Terminal, content: 'Cocoa Terminal. Visual Operating Systems.' },
  { id: 'mythology', label: 'Mythology', icon: Book, content: 'The Architect Canon. Systems that explain themselves.' },
];

const EnhancedHeroSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('systems');

  return (
    <section className="min-h-[100dvh] flex flex-col justify-center relative py-32 md:py-0">
      <div className="layout-grid gap-y-12 items-center">
        {/* Left: Identity Panel */}
        <div className="col-span-4 md:col-span-8 lg:col-span-6 space-y-8">
          <motion.header
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#fbb974]" />
              <span className="terminal-text text-primary">System Node Active</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.85] tracking-tighter italic text-foreground">
              DREAMCODER<br/>
              <span className="text-muted-text/30 not-italic">SYSTEMS ARCHITECT</span>
            </h1>
          </motion.header>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <p className="max-w-xl text-lg md:text-xl text-muted-text font-medium leading-relaxed">
              I design audit-first AI systems for domains where <span className="text-foreground">trust is expensive</span>, failure is visible, and every decision must leave evidence.
            </p>
            
            <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-text/50">
              <span className="flex items-center gap-2 border border-border px-3 py-1 rounded-full">
                <Activity className="w-3 h-3" /> Integrity: Verified
              </span>
              <span className="flex items-center gap-2 border border-border px-3 py-1 rounded-full">
                Location: LATAM Node
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right: Visual Library / Signal Panel */}
        <div className="col-span-4 md:col-span-8 lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-1 overflow-hidden"
          >
            <div className="bg-background-deep rounded-[1.4rem] overflow-hidden">
              {/* Terminal Header */}
              <div className="bg-surface px-6 py-4 border-b border-border flex justify-between items-center">
                <span className="terminal-text text-muted-text/60">Architectural Signal</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-border overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 terminal-text transition-all ${
                      activeTab === tab.id 
                      ? 'text-primary bg-surface border-b-2 border-primary' 
                      : 'text-muted-text/40 hover:text-muted-text/70'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-10 min-h-[240px] flex flex-col justify-center relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h3 className="text-3xl font-display font-black text-foreground italic tracking-tighter">
                      {tabs.find(t => t.id === activeTab)?.label}.
                    </h3>
                    <p className="text-muted-text text-lg leading-relaxed font-medium">
                      {tabs.find(t => t.id === activeTab)?.content}
                    </p>
                    <div className="flex items-center gap-2 text-primary terminal-text pt-4 group cursor-pointer">
                      <span>Trace Content</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Decorative Visual OS detail */}
                <div className="absolute bottom-4 right-6 terminal-text text-[8px] text-muted-text/10 italic">
                  Visual Canon // {activeTab.toUpperCase()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
