import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Shield,
  Palette,
  Mail,
  Github,
  Sparkles,
  Users
} from 'lucide-react';
import { withBase } from '../lib/site';

// DreamcoderLogo component
const DreamcoderLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

const navigationItems = [
  { name: "Inicio", href: "#hero", icon: Sparkles },
  { name: "Enfoque", href: "#trinity", icon: Shield },
  { name: "Public Systems", href: "#projects", icon: Palette },
  { name: "Colaboracion", href: "#collaboration", icon: Users },
  { name: "Contacto", href: "#contact", icon: Mail },
];

const socialLinks = [
  { name: "GitHub", href: "https://github.com/dreamcoder08", icon: Github, color: "text-foreground/60 hover:text-primary" },
];

const EnhancedNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    let ticking = false;

    const syncNavigationState = () => {
      const nextScrolled = window.scrollY > 50;
      setScrolled((current) => (current === nextScrolled ? current : nextScrolled));

      const sections = navigationItems.map(item => item.href.replace("#", ""));
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      setActiveSection((current) =>
        currentSection && current !== currentSection ? currentSection : current
      );
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(syncNavigationState);
    };

    syncNavigationState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const headerHeight = 80; // Height of the fixed header with margin
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, cubicBezier: [0.23, 1, 0.32, 1] }}
        className="fixed left-0 right-0 top-6 z-50 px-4 sm:px-6"
      >
        <div
          className={`mx-auto max-w-6xl rounded-full border px-3 sm:px-5 transition-all duration-500 ${
            scrolled
              ? 'border-primary/20 bg-background-deep/85 shadow-elevated backdrop-blur-3xl py-1'
              : 'border-white/10 bg-white/[0.02] shadow-soft backdrop-blur-2xl py-0.5'
          }`}
        >
          <div className="flex h-14 items-center justify-between sm:h-16">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <a href={withBase('/')} className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <DreamcoderLogo className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary filter drop-shadow-[0_0_10px_rgba(255,194,133,0.3)]" />
                </div>
                <span className="text-lg sm:text-xl font-display font-black text-foreground tracking-tighter">
                  DreamFolio
                </span>
              </a>
            </motion.div>

            <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
              {navigationItems.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-code font-bold text-[10px] uppercase tracking-[0.2em] relative ${
                      activeSection === item.href.replace("#", "")
                        ? "border border-primary/40 bg-primary/10 text-primary shadow-glow"
                        : "text-foreground/60 hover:bg-white/5 hover:text-foreground"
                      }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.name}
                  </button>
                </motion.div>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`rounded-full border border-border/40 bg-white/[0.04] p-2 sm:p-2.5 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-primary/10 ${social.color}`}
                  >
                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden rounded-full border border-border/40 bg-white/[0.04] p-2 sm:p-2.5 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-primary/10"
              >
                {isOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, cubicBezier: [0.23, 1, 0.32, 1] }}
            className="fixed left-4 right-4 top-24 z-40 lg:hidden sm:left-6 sm:right-6"
          >
            <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-primary/20 bg-background-deep/95 backdrop-blur-3xl shadow-elevated overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
              <nav className="space-y-3 sm:space-y-4">
                {navigationItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                  >
                    <button
                      onClick={() => handleNavClick(item.href)}
                      className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 font-display font-black text-lg sm:text-xl text-left relative ${
                        activeSection === item.href.replace("#", "")
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                        }`}
                    >
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                      <span className="flex-1">{item.name}</span>
                    </button>
                  </motion.div>
                ))}

                <div className="border-t border-border/20 pt-6 sm:pt-8 mt-6">
                  <div className="flex items-center justify-center gap-6 sm:gap-8">
                    {socialLinks.map((social) => (
                      <motion.a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className={`rounded-full border border-border/40 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-primary/10 ${social.color}`}
                      >
                        <social.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-primary via-accent to-sage"
        style={{
          scaleX: scrolled ? 1 : 0,
          transformOrigin: "left"
        }}
        transition={{ duration: 0.4 }}
      />
    </>
  );
};

export default EnhancedNavigation;
