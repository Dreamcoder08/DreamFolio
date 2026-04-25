import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge, Card, LinkButton, StatusIndicator } from '../ui';
import { withBase } from '../../lib/site';

const signalItems = [
  { label: 'Enfoque', value: 'Resilience', note: 'behavioral clarity' },
  { label: 'Dominio', value: 'Architecture', note: 'audit-first systems' },
  { label: 'Evidencia', value: 'Clarity', note: 'explicit constraints' },
];

const EnhancedHeroSection: React.FC = () => {
  return (
    <section
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-transparent pt-16 sm:pt-20 lg:pt-0"
      aria-labelledby="hero-heading"
    >
      {/* Atmosphere overlays - subtler now that global.css handles the main background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 82% 16%, rgba(251,185,116,0.1), transparent 30%), radial-gradient(circle at 14% 24%, rgba(242,198,109,0.06), transparent 20%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.12]" aria-hidden="true" />

      <div className="container relative z-10 mx-auto flex h-full flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col justify-center lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Badge variant="primary" className="mb-6 w-fit bg-primary/10 border-primary/20 text-primary">
                <StatusIndicator status="online" size="sm" />
                portafolio en linea
              </Badge>

              <p className="mb-5 font-code text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Builder independiente • IA e infraestructura financiera
              </p>

              <h1
                id="hero-heading"
                className="max-w-4xl text-4xl font-display font-extrabold leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Building <span className="gradient-text-primary text-shadow-glow">audit-first AI</span> infrastructure for high-friction domains.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-foreground/90 sm:text-lg">
                I design reliable software systems for financial and operational environments where traceability, constraints, and clarity matter. My current work focuses on audit-first software and high-trust infrastructure.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {signalItems.map((item, idx) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-border/40 bg-card/60 p-5 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:bg-primary/[0.06] hover:-translate-y-1"
                  >
                    <p className="font-code text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                      {item.label}
                    </p>
                    <p className={`mt-2 text-xl font-display font-black tracking-tight ${
                      idx === 0 ? 'text-sage' : idx === 1 ? 'text-primary' : 'text-cyan'
                    }`}>{item.value}</p>
                    <p className="mt-1 text-sm text-foreground/70 font-medium">{item.note}</p>
                  </div>
                ))}
              </div>

              <nav className="mt-10 flex flex-wrap gap-4" aria-label="Primary actions">
                <LinkButton href={withBase('/projects/')} variant="primary" size="lg" showArrow className="rounded-full px-10 shadow-elevated">
                  Ver proyectos
                </LinkButton>
                <LinkButton
                  href="https://github.com/dreamcoder08"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="lg"
                  className="rounded-full px-10 bg-white/10 border-white/20 hover:bg-white/15 text-foreground shadow-soft"
                >
                  Ver GitHub
                </LinkButton>
              </nav>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              <Card variant="glass" className="p-8 sm:p-10 rounded-[32px] shadow-elevated">
                <div className="flex items-center justify-between border-b border-border/40 pb-6">
                  <div>
                    <p className="font-code text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Public Signal
                    </p>
                    <h2 className="mt-2 text-2xl font-display font-bold text-foreground">
                      Public Systems
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-accent/20 bg-accent/10 p-3 text-accent">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-8 space-y-5">
                  {[
                    'ARKONYX — AI compliance and fiscal infrastructure',
                    'EdgeTraz Agro — resilient traceability for distributed ops',
                    'Digital_Public_peru — service integrity infrastructure',
                  ].map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-4 rounded-2xl border border-border/40 bg-white/[0.02] p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.04] hover:translate-x-1"
                    >
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-primary font-bold" aria-hidden="true" />
                      <p className="text-sm leading-relaxed text-foreground/90 font-medium">{point}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.12] to-transparent p-7 shadow-inner">
                  <p className="font-code text-[10px] uppercase tracking-[0.2em] text-accent font-bold">
                    Collaborate
                  </p>
                  <p className="mt-3 text-sm text-foreground/90 leading-relaxed font-medium">
                    For serious programs, product systems, or audit-first infrastructure work.
                  </p>
                  <button className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-accent hover:text-white transition-all hover:translate-x-1">
                    [ Open Conversation ]
                  </button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;
