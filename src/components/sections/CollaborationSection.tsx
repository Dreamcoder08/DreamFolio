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
    description: 'Infraestructura digital civica y arquitectura para servicios publicos.',
  },
  {
    name: 'Dreamcoder_dots',
    href: 'https://github.com/dreamcoder08/Dreamcoder_dots',
    description: 'Workstation Arch Linux y stack de ingenieria para terminal.',
  },
  {
    name: 'landyng-page-Electoral-Peru',
    href: 'https://github.com/dreamcoder08/landyng-page-Electoral-Peru',
    description: 'Landing electoral e interfaz publica de informacion.',
  },
  {
    name: 'CleanSweep',
    href: 'https://github.com/dreamcoder08/CleanSweep',
    description: 'Gestor de dotfiles AI-first construido en Rust.',
  },
  {
    name: 'Administracion',
    href: 'https://github.com/dreamcoder08/Administracion',
    description: 'Flujos administrativos y herramientas operativas.',
  },
  {
    name: 'pseint-web',
    href: 'https://github.com/dreamcoder08/pseint-web',
    description: 'Exploracion de producto web educativo.',
  },
];

const additionalPublicRepos: PublicRepoItem[] = [
  {
    name: 'EdgeTraz-Agro',
    href: 'https://github.com/dreamcoder08/EdgeTraz-Agro',
    description: 'Trazabilidad offline-first para entorno agroindustrial.',
  },
  {
    name: 'DreamFolio',
    href: 'https://github.com/dreamcoder08/DreamFolio',
    description: 'Portafolio tecnico en Astro + React.',
  },
  {
    name: 'Dream_Arch_Wiki',
    href: 'https://github.com/dreamcoder08/Dream_Arch_Wiki',
    description: 'Documentacion y guias sobre entorno Arch.',
  },
  {
    name: 'elect-validate',
    href: 'https://github.com/dreamcoder08/elect-validate',
    description: 'Validacion electoral con backend y UI.',
  },
  {
    name: 'Ecomerce_Relojs',
    href: 'https://github.com/dreamcoder08/Ecomerce_Relojs',
    description: 'E-commerce y experiencia de compra.',
  },
  {
    name: 'v0-Portfolio',
    href: 'https://github.com/dreamcoder08/v0-Portfolio',
    description: 'Iteracion previa de portafolio.',
  },
  {
    name: 'dreamcoder08',
    href: 'https://github.com/dreamcoder08/dreamcoder08',
    description: 'Repositorio de perfil.',
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
    <Card variant="glass" className="transition-all duration-500 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02]">
      <div className="p-6">
        <p className="text-[10px] font-code uppercase tracking-[0.18em] text-zinc-500 mb-2">
          Repositorio publico
        </p>
        <h3 className="font-display text-xl mb-3 group-hover:text-primary transition-colors break-all">
          {item.name}
        </h3>

        <p className="text-muted-foreground text-base leading-relaxed mb-4">
          {item.description}
        </p>

        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-code uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-primary"
        >
          Ver repositorio
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
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
      className="py-20 sm:py-24 bg-gradient-to-br from-background via-muted/5 to-background relative overflow-hidden"
      aria-labelledby="collaboration-heading"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">
            <Code className="w-4 h-4" aria-hidden="true" />
            COLABORACION
          </Badge>
          <h2 id="collaboration-heading" className="text-4xl md:text-5xl font-display font-bold mb-6">
            <span className="gradient-text-cyber">Repositorios</span>{' '}
            <span className="gradient-text-financial">Publicos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-tech">
            Los 13 repos publicos estan visibles para revision tecnica.
          </p>
        </motion.header>

        <div className="mb-10">
          <p className="text-xs font-code uppercase tracking-[0.18em] text-zinc-500 mb-4 text-center">
            6 prioritarios
          </p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredPublicRepos.map((item, index) => (
              <RepoCard key={item.name} item={item} index={index} />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-code uppercase tracking-[0.18em] text-zinc-500 mb-4 text-center">
            7 adicionales
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {additionalPublicRepos.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition-colors hover:border-primary/25 hover:bg-primary/[0.04]"
              >
                <p className="text-sm font-semibold text-white break-all">{item.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
              </a>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Card variant="glass" className="p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
            <h3 className="text-2xl font-display font-bold mb-4 gradient-text-cyber">
              Listo para colaborar?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Disponible para programas de builders y colaboraciones de IA con alcance tecnico claro.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={withBase('/#contact')}
                className="inline-flex items-center rounded-full border border-primary/25 bg-primary/[0.08] px-5 py-3 text-[11px] font-code uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary/35 hover:bg-primary/[0.14] hover:text-white"
              >
                <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                Contactar
              </a>
              <a
                href="https://github.com/dreamcoder08"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-[11px] font-code uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
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
