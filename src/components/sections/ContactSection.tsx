import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Github, Copy, Check, Terminal, Sparkles } from 'lucide-react';
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
      className="relative overflow-hidden border-t border-border/20 bg-transparent py-24 sm:py-32"
      aria-labelledby="contact-heading"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute right-0 top-0 hidden p-12 opacity-[0.06] md:block" aria-hidden="true">
        <Terminal size={320} strokeWidth={0.5} className="text-primary" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-5 lg:gap-24">

          {/* Left Column (40%) */}
          <div className="space-y-10 pt-0 sm:space-y-12 lg:col-span-2 lg:pt-8">
            <div className="space-y-8">
              <p className="font-code text-[11px] uppercase tracking-[0.25em] text-primary font-black">
                Technical Intake
              </p>
              <h2
                id="contact-heading"
                className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-foreground leading-[1.1] tracking-tighter"
              >
                Start a
                <br />
                <span className="gradient-text-primary">technical</span> collaboration.
              </h2>
              <p className="max-w-sm text-lg leading-relaxed text-foreground/80 font-medium">
                For serious programs, product systems, applied AI, or audit-first infrastructure work.
              </p>
            </div>

            {/* Email Copier */}
            <button
              className="group cursor-pointer text-left w-full"
              onClick={handleCopyEmail}
              aria-label={copied ? 'Email copied to clipboard' : 'Copy email address to clipboard'}
            >
              <div className="mb-3 font-code text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                Direct Communication
              </div>
              <div className="flex items-start gap-4 text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground transition-colors duration-300 group-hover:text-primary tracking-tight">
                <span className="break-all">{CONTACT_EMAIL}</span>
                <span className={cn(
                  "mt-1 shrink-0 rounded-full border border-border/40 bg-white/5 p-2.5 transition-all duration-300 transform shadow-soft",
                  copied ? "opacity-100 scale-100 bg-primary/20 border-primary/40 text-primary" : "opacity-100 sm:opacity-0 group-hover:opacity-100 scale-100 sm:scale-90 sm:group-hover:scale-100"
                )}>
                  {copied ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
                </span>
              </div>
            </button>

            {/* Social Links */}
            <nav aria-label="External contact links">
              <ul className="flex gap-6 sm:gap-8">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-block text-zinc-500 transition-all duration-300 transform hover:-translate-y-1 hover:text-primary"
                    >
                      <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Right Column (60%) - Clean Glass Form */}
          <div className="lg:col-span-3">
            <Card variant="glass" className="p-8 sm:p-10 md:p-14 shadow-elevated border-primary/20">
              {/* Form Background Accent */}
              <div
                className="pointer-events-none absolute -mr-20 -mt-20 right-0 top-0 h-44 w-44 rounded-full bg-primary/[0.08] blur-[80px] sm:h-72 sm:w-72"
                aria-hidden="true"
              />

              <div className="relative z-10 mb-10 flex items-center justify-between border-b border-border/20 pb-8">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    Project Request
                  </h3>
                  <p className="mt-2 text-sm text-foreground/70 font-medium">
                    Please provide technical context and expected outcomes.
                  </p>
                </div>
                <div className="rounded-2xl border border-accent/20 bg-accent/10 p-3 text-accent">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="relative z-10 space-y-8">
                <div className="grid gap-6 sm:gap-10 md:grid-cols-2">
                  <Input
                    {...register('name')}
                    label="Program / Team Lead"
                    placeholder="Tu nombre y organizacion"
                    error={errors.name?.message}
                    className="bg-white/5 border-border/30 focus:border-primary/50"
                  />
                  <Input
                    {...register('email')}
                    type="email"
                    label="Professional Email"
                    placeholder="nombre@empresa.com"
                    error={errors.email?.message}
                    className="bg-white/5 border-border/30 focus:border-primary/50"
                  />
                </div>

                <Input
                  {...register('subject')}
                  label="Technical Scope"
                  placeholder="Ej: AI Infrastructure, Audit-first System, etc."
                  error={errors.subject?.message}
                  className="bg-white/5 border-border/30 focus:border-primary/50"
                />

                <Textarea
                  {...register('message')}
                  label="Context and Constraints"
                  rows={5}
                  placeholder="Describe the use case, technical constraints, and desired architecture..."
                  error={errors.message?.message}
                  className="bg-white/5 border-border/30 focus:border-primary/50"
                />

                <div className="pt-4">
                  <Button type="submit" loading={isSubmitting} size="lg" className="w-full sm:w-auto shadow-elevated font-black uppercase tracking-[0.2em] px-10">
                    {isSubmitting ? 'Processing...' : 'Open Conversation'}
                    {!isSubmitting && <Mail size={18} className="ml-2" aria-hidden="true" />}
                  </Button>
                </div>

                {submitStatus === 'sent' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-primary/20 bg-primary/10 p-5 text-sm font-code text-foreground font-bold"
                    role="status"
                    aria-live="polite"
                  >
                    &gt; Draft prepared. Opening your mail client for review.
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-sm font-code text-destructive font-bold"
                    role="alert"
                    aria-live="assertive"
                  >
                    &gt; Transmission error. Please use direct email.
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
