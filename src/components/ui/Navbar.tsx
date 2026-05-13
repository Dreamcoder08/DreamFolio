import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Github, Terminal, Database, Activity, Menu, X, ChevronRight } from 'lucide-react';
import { withBase } from '../../lib/site';

const navigationItems = [
  { name: "Systems", href: "#systems", icon: Database },
  { name: "Laboratory", href: "#lab", icon: Activity },
  { name: "Intake", href: "#contact", icon: Mail },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const headerHeight = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: elementPosition, behavior: "smooth" });
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-500 p-4 md:p-8 ${
          scrolled ? 'py-4 md:py-6' : 'py-6 md:py-10'
        }`}
      >
        <div className="layout-grid items-center">
          
          {/* Command Dock Main Panel */}
          <div className="col-span-12">
            <motion.div 
              className={`glass-panel p-1 transition-all duration-500 ${
                scrolled ? 'bg-surface/90 backdrop-blur-3xl' : 'bg-surface/40'
              }`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-center justify-between px-4 py-2 md:px-6 md:py-3 bg-background-deep/50 rounded-[1.4rem]">
                
                {/* System Node / Brand */}
                <a 
                  href={withBase('/')} 
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shadow-clay">
                    <Terminal className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="terminal-text text-foreground leading-none">DreamFolio</p>
                    <p className="terminal-text text-[8px] text-muted-text/40 italic">Node: LATAM</p>
                  </div>
                </a>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                  {navigationItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.href)}
                      className="flex items-center gap-2 px-5 py-2 rounded-full terminal-text text-muted-text hover:text-primary hover:bg-white/5 transition-all"
                    >
                      <item.icon className="w-3 h-3" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 md:gap-4">
                  <a 
                    href="https://github.com/dreamcoder08" 
                    target="_blank" 
                    className="hidden md:flex w-10 h-10 rounded-full border border-border bg-surface items-center justify-center text-muted-text hover:text-primary transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  
                  <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-10 h-10 md:w-auto md:px-5 rounded-full border border-border bg-surface flex items-center justify-center gap-2 terminal-text text-primary hover:bg-primary/5 transition-all active:scale-95"
                  >
                    <AnimatePresence mode="wait">
                      {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                          <X className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <motion.div key="menu" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                          <Menu className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className="hidden md:inline">{isOpen ? 'Close' : 'Menu'}</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Inspection Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-28 md:top-36 right-4 md:right-8 z-[900] w-[calc(100%-2rem)] md:w-96"
          >
            <div className="glass-panel p-1">
              <div className="bg-background-deep rounded-[1.4rem] overflow-hidden">
                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <p className="terminal-text text-primary text-[8px]">Inspection Menu // Node Control</p>
                    <div className="space-y-2">
                      {navigationItems.map((item, i) => (
                        <motion.button
                          key={item.name}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleNavClick(item.href)}
                          className="w-full flex items-center justify-between group p-4 rounded-2xl bg-surface/50 border border-border/50 hover:border-primary/30 hover:bg-surface transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <item.icon className="w-5 h-5 text-muted-text group-hover:text-primary transition-colors" />
                            <span className="text-xl font-display font-black italic tracking-tight text-foreground">{item.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-text/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="terminal-text text-[8px] text-muted-text/30">System Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sage" />
                        <span className="terminal-text text-[9px] text-foreground">Verified</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="terminal-text text-[8px] text-muted-text/30">Integrity</p>
                      <span className="terminal-text text-[9px] text-foreground">Optimal</span>
                    </div>
                  </div>
                </div>
                
                <a 
                  href="https://github.com/dreamcoder08" 
                  target="_blank"
                  className="bg-surface p-4 flex items-center justify-center gap-3 terminal-text text-muted-text hover:text-primary transition-all border-t border-border"
                >
                  <Github className="w-4 h-4" />
                  <span>Inspect Source</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
