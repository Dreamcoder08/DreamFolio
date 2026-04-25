import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Shield, Palette, Mail, Github, Sparkles, Users, Terminal } from 'lucide-react';
import { withBase } from '../../lib/site';

const navigationItems = [
  { name: "Systems", href: "#systems", icon: Shield },
  { name: "Principles", href: "#trinity", icon: Sparkles },
  { name: "Intake", href: "#contact", icon: Mail },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: elementPosition, behavior: "smooth" });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[1000] p-4 md:p-6 pointer-events-none">
        <div className="layout-grid items-center">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-3">
            <a 
              href={withBase('/')} 
              className="glass-clay px-5 py-3 pointer-events-auto flex items-center gap-3 w-fit border-white/5 active:scale-95 transition-all group"
            >
              <Terminal className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
              <span className="font-display font-black text-xs uppercase tracking-[0.3em]">
                DreamFolio <span className="text-muted-text/30 ml-1 hidden sm:inline">v2.5</span>
              </span>
            </a>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex col-span-6 justify-center">
            <div className="glass-clay p-1.5 flex gap-1 pointer-events-auto border-white/5">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="px-6 py-2 rounded-full text-[10px] font-mono font-black uppercase tracking-widest text-muted-text hover:text-primary hover:bg-white/5 transition-all"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="col-span-2 md:col-span-5 lg:col-span-3 flex justify-end gap-3">
            <a 
              href="https://github.com/dreamcoder08" 
              target="_blank" 
              className="hidden md:flex glass-clay touch-target px-4 pointer-events-auto border-white/5 hover:text-primary transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <button 
              onClick={() => setIsOpen(true)}
              className="glass-clay touch-target px-6 pointer-events-auto border-white/5 active:scale-90 transition-all group"
            >
              <div className="flex flex-col gap-1.5 items-end">
                <div className="w-6 h-0.5 bg-primary group-hover:w-4 transition-all" />
                <div className="w-4 h-0.5 bg-accent group-hover:w-6 transition-all" />
              </div>
            </button>
          </div>

        </div>
      </nav>

      {/* Full-Screen System Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: "-100%" }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[2000] bg-background/95 backdrop-blur-3xl p-6 md:p-12 flex flex-col justify-between overflow-hidden"
          >
            {/* Noise overlay inside menu */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="flex justify-between items-start relative z-10">
              <span className="font-mono text-[10px] font-black text-primary uppercase tracking-[0.5em]">System Handshake // Active</span>
              <button 
                onClick={() => setIsOpen(false)} 
                className="glass-clay touch-target px-8 border-white/10 active:scale-90 transition-all font-mono text-[10px] font-black hover:text-primary"
              >
                TERMINATE [X]
              </button>
            </div>

            <div className="flex flex-col gap-6 relative z-10">
              {navigationItems.map((item, i) => (
                <motion.button
                  key={item.name}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  onClick={() => handleNavClick(item.href)}
                  className="text-[var(--text-fluid-display)] font-display font-black text-foreground italic hover:text-primary transition-all text-left leading-none tracking-tighter"
                >
                  {item.name}
                </motion.button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10 border-t border-white/10 relative z-10">
              <div className="space-y-4">
                <span className="font-mono text-[9px] text-muted-text/30 uppercase tracking-[0.3em]">Status</span>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                  <span className="text-[10px] font-mono text-foreground uppercase font-bold tracking-widest">Integrity: Optimal</span>
                </div>
              </div>
              <div className="space-y-4">
                <span className="font-mono text-[9px] text-muted-text/30 uppercase tracking-[0.3em]">Coordinates</span>
                <span className="text-[10px] font-mono text-foreground uppercase block font-bold tracking-widest">LATAM Node // Global Execution</span>
              </div>
              <div className="space-y-4">
                <span className="font-mono text-[9px] text-muted-text/30 uppercase tracking-[0.3em]">Security</span>
                <span className="text-[10px] font-mono text-accent uppercase block font-bold tracking-widest">Encrypted Handshake Enabled</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
