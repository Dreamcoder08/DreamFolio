import React, { useState } from 'react';
import { Mail, Github, Copy, Check, Terminal, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

const CONTACT_EMAIL = 'albertagurtofarfanalbert@gmail.com';
const TARGET_DOMAINS = ['Fiscal Compliance', 'AI Infrastructure', 'Product Architecture', 'Builder Programs'] as const;
type SubmitStatus = 'idle' | 'sent' | 'error';
type FormErrors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>;

/**
 * Technical Intake section component for serious collaborations.
 * Keeps validation local to avoid shipping schema/form libraries for a mailto form.
 */
export const TechnicalIntake: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedSubject, setSelectedSubject] = useState<(typeof TARGET_DOMAINS)[number]>('Fiscal Compliance');

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };



  const validate = (data: FormData): FormErrors => {
    const nextErrors: FormErrors = {};
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (name.length < 2) nextErrors.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Please enter a valid email address';
    if (selectedSubject.length < 5) nextErrors.subject = 'Choose a target domain';
    if (message.length < 10) nextErrors.message = 'Message must be at least 10 characters';

    return nextErrors;
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const data = new FormData(event.currentTarget);
      const nextErrors = validate(data);
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        setSubmitStatus('error');
        return;
      }

      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      const subject = encodeURIComponent(selectedSubject);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nDomain: ${selectedSubject}\n\n${message}`);

      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setSubmitStatus('sent');
      event.currentTarget.reset();
      setSelectedSubject('Fiscal Compliance');
      setErrors({});
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
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
              Section 09 // Handshake
            </p>
            <h2
              id="contact-heading"
              className="text-5xl md:text-7xl font-display font-black text-foreground leading-[0.95] tracking-tighter italic"
            >
              Initiate <br />
              <span className="text-accent underline underline-offset-[12px] decoration-white/10">Handshake.</span>
            </h2>
            <p className="max-w-md text-lg md:text-xl leading-relaxed text-muted-text font-medium">
              Share the domain, constraints, and risk model. I respond best to serious technical problems with clear stakes.
            </p>
          </div>

          <div className="space-y-10">
            {/* Email Copier */}
            <button
              type="button"
              className="group cursor-pointer text-left w-full"
              onClick={handleCopyEmail}
            >
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-text font-black">
                Direct Channel
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
                  name="name"
                  autoComplete="name"
                  label="Identify / Lead"
                  placeholder="Lead name or Organization"
                  error={errors.name}
                  className="bg-background-deep/40 border-white/10 focus:border-primary/50 text-base"
                />
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  label="Secure Node (Email)"
                  placeholder="professional@node.com"
                  error={errors.email}
                  className="bg-background-deep/40 border-white/10 focus:border-primary/50 text-base"
                />
              </div>

              <fieldset className="space-y-4">
                <legend className="font-mono text-[10px] font-black text-muted-text uppercase tracking-widest block">
                  Target Domain
                </legend>
                <div className="flex flex-wrap gap-3">
                  {TARGET_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setSelectedSubject(domain)}
                      aria-pressed={selectedSubject === domain}
                      className={cn(
                        "px-5 py-2 rounded-full border font-mono text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                        selectedSubject === domain
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-white/10 bg-white/5 text-muted-text hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
                {errors.subject && (
                  <p className="text-xs text-danger" role="alert">{errors.subject}</p>
                )}
              </fieldset>

              <Textarea
                name="message"
                autoComplete="off"
                label="Architectural Constraints & Context"
                rows={5}
                placeholder="Describe the domain, constraints, risk model, and evidence requirements..."
                error={errors.message}
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
                <div
                  className="rounded-2xl border border-primary/20 bg-primary/10 p-6 text-sm font-mono text-foreground font-bold shadow-inner"
                  role="status"
                  aria-live="polite"
                >
                  &gt; Handshake protocol initialized. Reviewing draft in mail client.
                </div>
              )}

              {submitStatus === 'error' && (
                <div
                  className="rounded-2xl border border-danger/20 bg-danger/10 p-6 text-sm font-mono text-danger font-bold shadow-inner"
                  role="alert"
                >
                  &gt; Handshake failed. Use the direct communication channel.
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};
