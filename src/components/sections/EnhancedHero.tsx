import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight, Activity, Terminal, Database, Book, ArrowUpRight } from 'lucide-react';
import { withBase } from '../../lib/site';

const tabs = [
  { id: 'systems', label: 'Systems', icon: Database, content: 'Arkelythex, civic infrastructure, edge traceability, and workstation engineering.' },
  { id: 'evidence', label: 'Evidence', icon: Shield, content: 'Deterministic rules, human approval gates, and inspectable state transitions.' },
  { id: 'interface', label: 'Interface', icon: Terminal, content: 'Fast, readable technical interfaces. Cocoa terminal warmth without decorative noise.' },
  { id: 'mythology', label: 'Canon', icon: Book, content: 'Build systems that explain themselves before they ask to be trusted.' },
];

const proofSignals = [
  { label: 'Flagship', value: 'Arkelythex' },
  { label: 'Market', value: 'Peru → LATAM' },
  { label: 'Mode', value: 'Evidence-first' },
];

const EnhancedHeroSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('systems');
  const activeTabData = tabs.find(t => t.id === activeTab) ?? tabs[0];

  return (
    <section className="min-h-[100dvh] flex flex-col justify-center relative py-32 md:py-0">
      <div className="layout-grid gap-y-12 items-center">
        {/* Left: Identity Panel */}
        <div className="col-span-4 md:col-span-8 lg:col-span-6 space-y-8">
          <header className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#fbb974]" />
              <span className="terminal-text text-primary">Fiscal AI Systems // LATAM</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter italic text-foreground">
              I build fiscal AI systems that can be audited before they are trusted.
            </h1>
          </header>

          <div className="space-y-8">
            <p className="max-w-xl text-lg md:text-xl text-muted-text font-medium leading-relaxed">
              I design high-integrity product architecture for domains where <span className="text-foreground">wrong decisions are expensive</span>: fiscal operations, compliance workflows, and evidence-driven platforms.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={withBase('/projects/arkelythex/')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/50 bg-primary px-6 py-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-background shadow-soft transition-all hover:bg-accent hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Inspect Arkelythex
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#systems"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-foreground transition-all hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                View systems
              </a>
            </div>
            
            <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {proofSignals.map((signal) => (
                <div key={signal.label} className="rounded-2xl border border-border bg-surface/45 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-text/45">{signal.label}</p>
                  <p className="mt-1 text-sm font-black text-foreground">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Visual Library / Signal Panel */}
        <div className="col-span-4 md:col-span-8 lg:col-span-6">
          <div className="glass-panel p-1 overflow-hidden">
            <div className="bg-background-deep rounded-[1.4rem] overflow-hidden">
              {/* Terminal Header */}
              <div className="bg-surface px-6 py-4 border-b border-border flex justify-between items-center">
                <span className="terminal-text text-muted-text">Architectural Signal</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-border overflow-x-auto no-scrollbar" aria-label="Visual library sections">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                    aria-pressed={activeTab === tab.id}
                    aria-label={`Show ${tab.label} signal`}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 terminal-text transition-all ${
                      activeTab === tab.id 
                      ? 'text-primary bg-surface border-b-2 border-primary' 
                      : 'text-muted-text hover:text-muted-text'
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
                    id={`hero-signal-${activeTab}`}
                    aria-live="polite"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <p className="text-3xl font-display font-black text-foreground italic tracking-tighter">
                      {activeTabData.label}.
                    </p>
                    <p className="text-muted-text text-lg leading-relaxed font-medium">
                      {activeTabData.content}
                    </p>
                    <div className="flex items-center gap-2 text-primary terminal-text pt-4 group">
                      <span>Trace Content Ready</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Decorative Visual OS detail */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
