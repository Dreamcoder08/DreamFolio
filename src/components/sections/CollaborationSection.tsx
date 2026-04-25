import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Code, Github, Mail } from 'lucide-react';
import { Card, Badge } from '../ui';
import { withBase } from '../../lib/site';

interface PublicRepoItem {
  name: string;
  href: string;
  description: string;
}

const featuredPublicRepos: PublicRepoItem[] = [
  {
    name: 'Digital_Public_peru',
    href: 'https://github.com/dreamcoder08/Digital_Public_peru',
    description: 'Civic digital infrastructure and architecture for public services.',
  },
  {
    name: 'Dreamcoder_dots',
    href: 'https://github.com/dreamcoder08/Dreamcoder_dots',
    description: 'Arch Linux workstation and engineering stack for the terminal.',
  },
  {
    name: 'peru-electoral-interface',
    href: 'https://github.com/dreamcoder08/landyng-page-Electoral-Peru',
    description: 'Electoral landing and public information interface for civic engagement.',
  },
  {
    name: 'CleanSweep',
    href: 'https://github.com/dreamcoder08/CleanSweep',
    description: 'AI-first dotfiles manager built in Rust for high-performance automation.',
  },
  {
    name: 'operations-admin-lab',
    href: 'https://github.com/dreamcoder08/Administracion',
    description: 'Administrative flows and operational tooling for complex environments.',
  },
  {
    name: 'pseint-learning-interface',
    href: 'https://github.com/dreamcoder08/pseint-web',
    description: 'Educational web product exploration for logic and programming foundations.',
  },
];

const additionalPublicRepos: PublicRepoItem[] = [
  {
    name: 'EdgeTraz-Agro',
    href: 'https://github.com/dreamcoder08/EdgeTraz-Agro',
    description: 'Offline-first traceability for agro-industrial environments.',
  },
  {
    name: 'DreamFolio',
    href: 'https://github.com/dreamcoder08/DreamFolio',
    description: 'Technical portfolio system built with Astro and React.',
  },
  {
    name: 'Dream_Arch_Wiki',
    href: 'https://github.com/dreamcoder08/Dream_Arch_Wiki',
    description: 'Knowledge base and reference system for Arch environments.',
  },
  {
    name: 'elect-validate',
    href: 'https://github.com/dreamcoder08/elect-validate',
    description: 'Electoral validation system with backend and UI layers.',
  },
  {
    name: 'watch-commerce-lab',
    href: 'https://github.com/dreamcoder08/Ecomerce_Relojs',
    description: 'Ecommerce experimentation and product presentation flows.',
  },
  {
    name: 'portfolio-v0-archive',
    href: 'https://github.com/dreamcoder08/v0-Portfolio',
    description: 'Previous iteration of the technical portfolio system.',
  },
  {
    name: 'dreamcoder08-profile',
    href: 'https://github.com/dreamcoder08/dreamcoder08',
    description: 'Public identity and profile repository.',
  },
];

interface RepoCardProps {
  item: PublicRepoItem;
  index: number;
}

const RepoCard: React.FC<RepoCardProps> = ({ item, index }) => (
  <motion.article
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    viewport={{ once: true }}
    className="group"
  >
    <Card variant="glass" className="transition-all duration-500 hover:border-primary/40 hover:shadow-elevated hover:-translate-y-2">
      <div className="p-8">
        <p className="text-[10px] font-code font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
          Public System Repo
        </p>
        <h3 className="font-display font-black text-2xl mb-4 group-hover:text-primary transition-colors break-all tracking-tight">
          {item.name}
        </h3>

        <p className="text-foreground/80 text-base leading-[1.7] mb-6 font-medium">
          {item.description}
        </p>

        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary transition-all hover:text-white group/link"
        >
          View Source Code
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" aria-hidden="true" />
        </a>
      </div>
    </Card>
  </motion.article>
);

/* --- Main Component --- */

const CollaborationSection: React.FC = () => {
  return (
    <section
      id="collaboration"
      className="py-24 sm:py-32 bg-transparent relative overflow-hidden"
      aria-labelledby="collaboration-heading"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" aria-hidden="true" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <Badge variant="primary" className="mb-6">
            <Code className="w-4 h-4" aria-hidden="true" />
            TECHNICAL COLLABORATION
          </Badge>
          <h2 id="collaboration-heading" className="text-4xl md:text-5xl lg:text-6xl font-display font-black mb-8 tracking-tighter">
            <span className="gradient-text-primary text-shadow-glow">Public Systems</span>{' '}
            <span>Infrastructure</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto font-medium leading-relaxed">
            13 public repositories are visible for technical review and architectural audit.
          </p>
        </motion.header>

        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-6 text-center">
            Priority Signals
          </p>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {featuredPublicRepos.map((item, index) => (
              <RepoCard key={item.name} item={item} index={index} />
            ))}
          </div>
        </div>

        <div className="mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-6 text-center">
            Additional Tracks
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {additionalPublicRepos.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border/30 bg-card/40 px-6 py-5 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.04] hover:-translate-y-1"
              >
                <p className="text-sm font-black text-white break-all group-hover:text-primary transition-colors">{item.name}</p>
                <p className="mt-2 text-xs text-foreground/70 leading-relaxed font-medium">{item.description}</p>
              </a>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <Card variant="glass" className="p-10 sm:p-14 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-primary/30 shadow-elevated">
            <h3 className="text-3xl sm:text-4xl font-display font-black mb-6 tracking-tighter text-foreground">
              Ready for technical collaboration?
            </h3>
            <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
              Available for builder programs, product systems, and applied AI collaborations with a clear technical scope.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <a
                href={withBase('/#contact')}
                className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-background transition-all hover:bg-accent hover:border-accent hover:shadow-glow hover:-translate-y-0.5"
              >
                <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                Contactar
              </a>
              <a
                href="https://github.com/dreamcoder08"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground transition-all hover:bg-white/15 hover:border-white/30 hover:-translate-y-0.5"
              >
                <Github className="w-4 h-4 mr-2" aria-hidden="true" />
                Ver perfil github
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CollaborationSection;
