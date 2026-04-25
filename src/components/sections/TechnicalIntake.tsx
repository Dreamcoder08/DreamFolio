import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Github, Copy, Check, Terminal, Sparkles, Send } from 'lucide-react';
import { useContactForm } from '../../hooks/useContactForm';
import { Button, Input, Textarea, Card } from '../ui';
import { cn } from '../../lib/utils';

const CONTACT_EMAIL = 'albertagurtofarfanalbert@gmail.com';

/**
 * Technical Intake section component for serious collaborations.
 */
export const TechnicalIntake: React.FC = () => {
  const { register, errors, isSubmitting, submitStatus, handleFormSubmit } = useContactForm();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    { href: 'https://github.com/dreamcoder08', icon: Github, label: 'Technical Profile' },
    { href: `mailto:${CONTACT_EMAIL}`, icon: Mail, label: 'Direct Secure Mail' },
  ];

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-white/5 bg-background-deep py-32 sm:py-48"
      aria-labelledby="contact-heading"
    >
      <div className="layout-grid relative z-10">

        {/* Left Column: Context & Metadata */}
        <div className="col-span-4 md:col-span-8 lg:col-span-5 space-y-12 lg:pr-10">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-black text-primary uppercase tracking-[0.4em]">
              Section 05 // Handshake
            </p>
            <h2
              id="contact-heading"
              className="text-5xl md:text-7xl font-display font-black text-foreground leading-[0.95] tracking-tighter italic"
            >
              Technical <br />
              <span className="text-accent underline underline-offset-[12px] decoration-white/10">Intake.</span>
            </h2>
            <p className="max-w-md text-lg md:text-xl leading-relaxed text-muted-text font-medium">
              Reserved for programs and systems requiring high-integrity architecture. Share the constraints of your domain to initiate a handshake.
            </p>
          </div>

          <div className="space-y-10">
            {/* Email Copier */}
            <button
              className="group cursor-pointer text-left w-full"
              onClick={handleCopyEmail}
              aria-label={copied ? 'Email copied to clipboard' : 'Copy email address to clipboard'}
            >
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-text/40 font-black">
                Direct Communication Channel
              </div>
              <div className="flex items-start gap-4 text-2xl md:text-3xl font-display font-bold text-foreground transition-colors duration-300 group-hover:text-primary tracking-tight italic">
                <span className="break-all">{CONTACT_EMAIL}</span>
                <span className={cn(
                  "mt-1 shrink-0 rounded-full border border-white/10 bg-white/5 p-2 transition-all duration-300 transform",
                  copied ? "opacity-100 scale-100 bg-primary/20 text-primary" : "opacity-100 sm:opacity-0 group-hover:opacity-100 scale-100 sm:scale-90 sm:group-hover:scale-100"
                )}>
                  {copied ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
                </span>
              </div>
            </button>

            {/* Social Metadata */}
            <nav aria-label="External system nodes">
              <ul className="flex gap-8">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-block text-muted-text/60 transition-all duration-300 transform hover:-translate-y-1 hover:text-primary"
                    >
                      <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Right Column: Intake Form */}
        <div className="col-span-4 md:col-span-8 lg:col-span-7 mt-16 lg:mt-0">
          <Card variant="glass" className="p-8 md:p-14 shadow-elevated border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Terminal size={280} strokeWidth={0.5} className="text-primary" />
            </div>

            <form onSubmit={handleFormSubmit} className="relative z-10 space-y-10">
              <div className="grid gap-10 md:grid-cols-2">
                <Input
                  {...register('name')}
                  label="Identify / Lead"
                  placeholder="Lead name or Organization"
                  error={errors.name?.message}
                  className="bg-background-deep/40 border-white/10 focus:border-primary/50 text-base"
                />
                <Input
                  {...register('email')}
                  type="email"
                  label="Secure Node (Email)"
                  placeholder="professional@node.com"
                  error={errors.email?.message}
                  className="bg-background-deep/40 border-white/10 focus:border-primary/50 text-base"
                />
              </div>

              <div className="space-y-4">
                <label className="font-mono text-[10px] font-black text-muted-text/40 uppercase tracking-widest block">
                  Target Domain
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Autonomous Finance', 'Public Infra', 'AI Ops', 'Legal OS'].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      className="px-5 py-2 rounded-full border border-white/10 bg-white/5 font-mono text-[10px] font-black uppercase tracking-widest text-muted-text/70 hover:border-primary/40 hover:text-primary transition-all active:scale-95"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                {...register('message')}
                label="Architectural Constraints & Context"
                rows={5}
                placeholder="Describe case of use, operational restrictions, and expected reliability..."
                error={errors.message?.message}
                className="bg-background-deep/40 border-white/10 focus:border-primary/50 text-base resize-none"
              />

              <div className="pt-6">
                <Button 
                  type="submit" 
                  loading={isSubmitting} 
                  size="lg" 
                  className="w-full sm:w-auto h-[60px] px-12 bg-primary text-background font-black uppercase text-[11px] tracking-[0.3em] rounded-full shadow-clay hover:bg-accent transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? 'Handshaking...' : 'Initiate System Handshake'}
                  {!isSubmitting && <Send size={18} className="ml-3" aria-hidden="true" />}
                </Button>
              </div>

              {submitStatus === 'sent' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-primary/20 bg-primary/10 p-6 text-sm font-mono text-foreground font-bold shadow-inner"
                  role="status"
                  aria-live="polite"
                >
                  &gt; Handshake protocol initialized. Reviewing draft in mail client.
                </motion.div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};
