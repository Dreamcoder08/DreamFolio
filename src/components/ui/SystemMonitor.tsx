import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const SystemMonitor: React.FC = () => {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setScroll(position);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-[100] hidden xl:flex flex-col items-center space-y-8">
      {/* Progress Track */}
      <div className="h-64 w-px bg-white/5 relative">
        <motion.div 
          className="absolute top-0 left-0 w-full bg-primary shadow-[0_0_10px_var(--color-primary)]"
          style={{ height: `${scroll * 100}%` }}
        />
      </div>

      {/* Label */}
      <div className="flex flex-col items-center space-y-4">
        <span className="font-mono text-[9px] font-black text-primary uppercase rotate-90 origin-left translate-x-1.5 whitespace-nowrap tracking-[0.4em]">
          Portfolio Integrity: {Math.round(scroll * 100)}%
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>

      {/* Metadata Labels */}
      <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
        <span className="font-mono text-[7px] font-black text-foreground uppercase tracking-widest">SYS_0{Math.floor(scroll * 10)}</span>
        <span className="font-mono text-[7px] font-black text-foreground uppercase tracking-widest">ACTIVE</span>
      </div>
    </div>
  );
};
