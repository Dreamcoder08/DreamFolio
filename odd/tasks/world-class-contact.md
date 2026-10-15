# Feature: World-class portfolio, round 2 — WhatsApp contact and conversion

## Objective

Make it effortless for a recruiter or client to reach Dreamcoder from any page, on any device, in the channel they actually use in LATAM (WhatsApp), without giving back any of the 10/10 quality already measured in `quality-10-of-10.md`.

## Why

User request (2026-10-15): "Crea ODD para que mi portafolio web profesional sea como los mejores del mundo y funcional 10/10", with the WhatsApp number 926 437 404. The previous ODD round closed the technical gaps (Lighthouse mobile 96/100/100/100, size allowlist empty, CI green). What the site still lacked was a direct, low-friction contact path: the only ways to write in were email (mailto, the MU-TH-UR terminal) and two social links.

## Scope

- WhatsApp click-to-chat, number `+51 926 437 404`. The country code is an assumption: the site already states "PERÚ · UTC−5", so Peru (+51) is the default. Change `siteConfig.contact.whatsapp` in `src/lib/site.ts` if that is wrong.
- Floating WhatsApp button on every page, WhatsApp as the primary CTA in `#connect`, a WhatsApp command in the ⌘K console.
- Visible contact details (number and email) in `#connect`, Instagram link (it was already in `siteConfig` but never rendered).
- Structured data that search engines can use to show the contact (`Person.telephone`, `contactPoint`, full `sameAs`).

## Constraints

- Zero client JS added: the button and CTAs are plain links. No third-party widget, so the CSP needs no change and no visitor data leaves the page until they click.
- Keep every existing contract green: transition contract (`var(--motion-…)` only), token/contrast tests, file-size budgets, the HUD rail geometry test.
- Accessibility: 44px+ touch target, an accessible name that includes the number, visible focus ring, `forced-colors` border, reduced motion respected (no pulse), hidden while the modal console is open, hidden in print.
- Contrast: ink `#062a14` on WhatsApp green `#25d366` is 7.85:1 (hover `#2ee874` 9.57:1), AAA for the label.

## Checklist

- [x] T1 `buildWhatsAppUrl` pure helper (`src/lib/whatsapp.ts`) + `whatsapp()` bound to the site number in `site.ts`; unit tests in `tests/unit/whatsapp-link.test.ts` (digits only, encoded `text`, blank message, invalid number).
- [x] T2 `WhatsAppButton.astro` mounted once in `BaseLayout`; styles in `src/styles/components/whatsapp.css`. Icon-only circle below 900px, labelled pill above. Safe-area insets for notched phones.
- [x] T3 HUD rail stops above the button (`--rail-bottom-clearance`), so the rail line and its % readout never run under it on desktop.
- [x] T4 `#connect`: WhatsApp primary + email outlined secondary, stacked full-width on mobile; contact list with the number and email as real links; Instagram added; social links carry `rel="me"`.
- [x] T5 ⌘K console: "Escribir por WhatsApp" in Acciones (keywords whatsapp, wsp, chat, celular…); registry test updated.
- [x] T6 SEO: JSON-LD `Person` gains `email`, `telephone`, `address.addressCountry: PE`, `contactPoint` (WhatsApp URL, es/en), `sameAs` GitHub + X + Instagram; `og:locale es_PE`.
- [x] T7 E2E `tests/home/whatsapp.spec.ts`: button on `/`, `/projects/` and the 404 page with the right href/target/rel and accessible name; contact CTA order; inside the viewport with a 44px+ target at 320/390/1280px and no horizontal overflow; hidden while the console is open.
- [x] T9 "Guardar contacto (.vcf)" in `#connect`: build-time vCard 3.0 (`src/lib/vcard.ts`, RFC 6350 escaping, CRLF) served at `/dreamcoder.vcf`; unit + e2e tested.
- [x] T10 Web app manifest (`/manifest.webmanifest`) with 192/512 and maskable icons plus `apple-touch-icon`, so "add to home screen" shows the real mark instead of a screenshot; e2e checks every listed icon loads.
- [x] T11 og:image tags describe the real file: `fiscal-workspace.jpg` is a PNG, so the old extension guess announced `image/jpeg`. `src/lib/image-meta.ts` reads type and size from the header (PNG/JPEG/WebP) and the layout now emits `og:image:type/width/height`; image alt text is Spanish on Spanish pages. JSON-LD and image helpers moved to `src/lib/seo.ts` to keep `BaseLayout` in budget.
- [ ] T8 User-only: send yourself a message from the live site on a phone and on desktop (WhatsApp Web) and confirm the pre-filled text arrives.

## Next round (proposed, not started — needs content only the owner has)

These are what separates a very good portfolio from the best ones; none can be invented by an agent:

1. Testimonials or quotes from clients/colleagues (name, role, one sentence).
2. Measurable outcomes per project in `src/data/projects.json` ("cut processing time 60%", users, uptime).
3. A downloadable CV (PDF) linked from the hero and `#connect`.
4. A custom domain instead of `*.vercel.app` / `*.github.io`.
5. Availability line ("Disponible para proyectos desde …") next to the WhatsApp CTA.
6. An English version of the home page (`lang="en"`, `hreflang`), since many remote roles are in English.

## Verification evidence

- `pnpm test:unit`: all passing, including 5 new WhatsApp link tests and the updated console registry test.
- `pnpm run check` (astro sync + tsc), `pnpm run build`, `pnpm check:size`: green.
- Playwright: `tests/home/whatsapp.spec.ts` 8/8 locally; the full suite runs in CI on the PR.
- Visual check at 390px and 1440px in both themes: button clears the content edge, CTAs stack on mobile.
