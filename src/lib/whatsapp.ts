/** wa.me click-to-chat URL builder. Pure (no Astro env), so it is
 *  unit-testable under plain Node; `whatsapp()` in site.ts binds it to the
 *  site's own number. */
export function buildWhatsAppUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) throw new Error("WhatsApp number must contain digits");
  const base = `https://wa.me/${digits}`;
  const message = text?.trim();
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
