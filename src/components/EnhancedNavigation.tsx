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
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const navigationItems = [
  { name: "Inicio", href: "#hero", icon: Sparkles },
  { name: "Enfoque", href: "#trinity", icon: Shield },
  { name: "Proyectos", href: "#projects", icon: Palette },
  { name: "Colaboracion", href: "#collaboration", icon: Users },
  { name: "Contacto", href: "#contact", icon: Mail },
];

const socialLinks = [
  { name: "GitHub", href: "https://github.com/dreamcoder08", icon: Github, color: "text-zinc-400 hover:text-primary" },
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
      const headerHeight = 64; // Height of the fixed header
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
        transition={{ duration: 0.6 }}
        className="fixed left-0 right-0 top-4 z-50 px-4 sm:px-6"
      >
        <div
          className={`mx-auto max-w-6xl rounded-full border px-3 sm:px-4 transition-all duration-300 ${
            scrolled
              ? 'border-white/12 bg-black/78 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl'
              : 'border-white/10 bg-black/58 shadow-[0_20px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl'
          }`}
        >
          <div className="flex h-14 items-center justify-between sm:h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <a href={withBase('/')} className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <DreamcoderLogo className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-display font-bold text-primary drop-shadow-lg">
                  DreamFolio
                </span>
              </a>
            </motion.div>

            <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
              {navigationItems.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300 font-tech text-xs relative ${
                      activeSection === item.href.replace("#", "")
                        ? "border border-primary/22 bg-primary/[0.1] text-white shadow-[0_10px_30px_rgba(143,175,209,0.12)]"
                        : "text-zinc-300 hover:bg-white/[0.04] hover:text-primary"
                      }`}
                  >
                    <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                    className={`rounded-full border border-white/10 bg-white/[0.02] p-1.5 sm:p-2 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-primary/[0.05] ${social.color}`}
                  >
                    <social.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </motion.a>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden rounded-full border border-white/10 bg-white/[0.02] p-1.5 sm:p-2 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-primary/[0.05]"
              >
                {isOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed left-4 right-4 top-20 z-40 lg:hidden sm:left-6 sm:right-6"
          >
            <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-white/10 bg-black/88 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <nav className="space-y-2 sm:space-y-4">
                  {navigationItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => handleNavClick(item.href)}
                        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 font-tech text-sm sm:text-base text-left relative ${
                          activeSection === item.href.replace("#", "")
                            ? "border border-primary/20 bg-primary/[0.08] text-white"
                            : "text-zinc-300 hover:bg-white/[0.03] hover:text-primary"
                          }`}
                      >
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                      </button>
                    </motion.div>
                  ))}

                  <div className="border-t border-white/8 pt-3 sm:pt-4">
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                      {socialLinks.map((social) => (
                        <motion.a
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`rounded-full border border-white/10 bg-white/[0.02] p-2.5 sm:p-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-primary/[0.05] ${social.color}`}
                        >
                          <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-px bg-gradient-to-r from-primary via-white to-accent"
        style={{
          scaleX: scrolled ? 1 : 0,
          transformOrigin: "left"
        }}
        transition={{ duration: 0.3 }}
      />
    </>
  );
};

export default EnhancedNavigation;
