import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Github, Copy, Check, Terminal } from 'lucide-react';
import { useContactForm } from '../../hooks/useContactForm';
import { Button, Input, Textarea, Card } from '../ui';
import { cn } from '../../lib/utils';

const CONTACT_EMAIL = 'albertagurtofarfanalbert@gmail.com';

/**
 * Contact section component with form and social links.
 * Uses extracted hook for logic separation and atomic UI components.
 */
const ContactSection: React.FC = () => {
  const { register, errors, isSubmitting, submitStatus, handleFormSubmit } = useContactForm();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    { href: 'https://github.com/dreamcoder08', icon: Github, label: 'Perfil de GitHub' },
    { href: `mailto:${CONTACT_EMAIL}`, icon: Mail, label: 'Enviar correo a Dreamcoder08' },
  ];

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-white/6 bg-black/30 py-20 sm:py-24 lg:py-28"
      aria-labelledby="contact-heading"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute right-0 top-0 hidden p-12 opacity-[0.04] md:block" aria-hidden="true">
        <Terminal size={320} strokeWidth={0.5} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-5 lg:gap-24">

          {/* Left Column (40%) */}
          <div className="space-y-8 pt-0 sm:space-y-10 lg:col-span-2 lg:pt-8">
            <div className="space-y-6">
              <p className="font-code text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                Contacto
              </p>
              <h2
                id="contact-heading"
                className="text-3xl sm:text-5xl md:text-6xl font-display font-bold bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-tight tracking-[-0.04em]"
              >
                Inicia una
                <br />
                colaboracion tecnica.
              </h2>
              <p className="max-w-sm text-base leading-relaxed text-zinc-400 sm:text-lg">
                Si tienes un programa, proyecto o necesidad tecnica, comparte alcance y objetivo.
              </p>
            </div>

            {/* Email Copier */}
            <button
              className="group cursor-pointer text-left w-full"
              onClick={handleCopyEmail}
              aria-label={copied ? 'Email copied to clipboard' : 'Copy email address to clipboard'}
            >
              <div className="mb-2 font-code text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Correo directo
              </div>
              <div className="flex items-start gap-3 text-lg sm:text-2xl md:text-3xl font-light text-white transition-colors duration-300 group-hover:text-zinc-300">
                <span className="break-all">{CONTACT_EMAIL}</span>
                <span className={cn(
                  "mt-1 shrink-0 rounded-full border border-white/8 bg-white/[0.03] p-2 transition-all duration-300 transform",
                  copied ? "opacity-100 scale-100" : "opacity-100 sm:opacity-0 group-hover:opacity-100 scale-100 sm:scale-90 sm:group-hover:scale-100"
                )}>
                  {copied ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
                </span>
              </div>
            </button>

            {/* Social Links */}
            <nav aria-label="External contact links">
              <ul className="flex gap-5 sm:gap-6">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-block text-zinc-500 transition-colors duration-300 transform hover:-translate-y-1 hover:text-white"
                    >
                      <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Right Column (60%) - Clean Glass Form */}
          <div className="lg:col-span-3">
            <Card variant="glass" className="p-5 sm:p-8 md:p-12">
              {/* Form Background Accent */}
              <div
                className="pointer-events-none absolute -mr-16 -mt-16 right-0 top-0 h-44 w-44 rounded-full bg-white/[0.04] blur-[80px] sm:h-64 sm:w-64"
                aria-hidden="true"
              />

              <form onSubmit={handleFormSubmit} className="relative z-10 space-y-6 sm:space-y-8">
                <div className="grid gap-5 sm:gap-8 md:grid-cols-2">
                  <Input
                    {...register('name')}
                    label="Program / Team Lead"
                    placeholder="Tu nombre y organizacion"
                    error={errors.name?.message}
                  />
                  <Input
                    {...register('email')}
                    type="email"
                    label="Correo profesional"
                    placeholder="nombre@empresa.com"
                    error={errors.email?.message}
                  />
                </div>

                <Input
                  {...register('subject')}
                  label="Alcance del proyecto"
                  placeholder="Ej: Programa de builders, colaboracion IA aplicada"
                  error={errors.subject?.message}
                />

                <Textarea
                  {...register('message')}
                  label="Contexto tecnico"
                  rows={4}
                  placeholder="Describe caso de uso, restricciones, tiempos y resultado esperado..."
                  error={errors.message?.message}
                />

                <div className="pt-2 sm:pt-4">
                  <Button type="submit" loading={isSubmitting} size="lg" className="w-full sm:w-auto">
                    {isSubmitting ? 'Preparando...' : 'Abrir conversacion'}
                    {!isSubmitting && <Mail size={18} aria-hidden="true" />}
                  </Button>
                </div>

                {submitStatus === 'sent' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-code text-zinc-100"
                    role="status"
                    aria-live="polite"
                  >
                    &gt; Abriendo tu cliente de correo con borrador prellenado.
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-code text-red-300"
                    role="alert"
                    aria-live="assertive"
                  >
                    &gt; Error al enviar. Reintenta o usa el correo directo.
                  </motion.div>
                )}
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
