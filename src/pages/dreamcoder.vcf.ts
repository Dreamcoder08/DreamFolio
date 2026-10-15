import type { APIRoute } from "astro";
import { siteConfig, withBase } from "../lib/site";
import { buildVCard } from "../lib/vcard";

// "Guardar contacto" in #connect: one tap adds name, WhatsApp number,
// email and site to the visitor's address book.
export const GET: APIRoute = ({ site }) => {
  const body = buildVCard({
    name: "Dreamcoder",
    title: "Software, IA & sistemas",
    email: siteConfig.contact.email,
    phone: siteConfig.contact.whatsappDisplay,
    url: new URL(withBase("/"), site ?? siteConfig.url).toString(),
    note: siteConfig.description,
  });
  return new Response(body, {
    headers: { "Content-Type": "text/vcard; charset=utf-8" },
  });
};
