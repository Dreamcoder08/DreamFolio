# Feature: Mobile-first redesign — the portfolio as a native-feeling app

## Objective

Make the phone experience feel like a well-made mobile app rather than a desktop page squeezed to 390px, taking cues from the Claude and ChatGPT mobile apps and current award-winning sites, without changing the desktop design or giving back any measured quality.

## Why

User request (2026-10-19): improve the design everywhere, especially on mobile, inspired by Claude Mobile, ChatGPT Mobile and recent avant-garde, award-winning work. The audit at 390px showed a 9,765px-long home page, a full-bleed header with three outlined buttons, and the only way to navigate was a top-right hamburger, out of thumb reach.

## Design principles taken from the references

- Navigation in the thumb zone (Claude/ChatGPT keep the composer and actions at the bottom).
- One primary action at the end of the bar, like a composer's send button: here, WhatsApp.
- Floating, rounded glass surfaces instead of edge-to-edge slabs.
- Horizontal, snap-aligned rails with a peeking next card for collections.
- Immediate touch feedback on every tappable surface; no grey tap flash.

## Scope (≤720px only; desktop untouched)

- [x] T1 `MobileDock.astro` + `components/mobile-dock.css`: glass tab bar with Inicio / Proyectos / Sobre mí / Contacto and a green WhatsApp send button; safe-area aware; `aria-current` follows the section being read (IntersectionObserver, no-JS falls back to plain links); hides while the menu or console is open or a contact field has focus (keyboard up). The floating WhatsApp button is hidden on phones, since the dock carries it.
- [x] T2 Floating header pill (`portfolio/23-mobile-app.css`): inset, rounded, blurred; the menu opens as a sheet inside it.
- [x] T3 Swipe rails: projects and both principle lists become `scroll-snap` rails at 86% card width with the next card peeking; page dots via CSS scroll markers where supported. View-timeline reveals are disabled inside rails (a block-axis view() has nothing to track there).
- [x] T4 Touch: press scale on cards, buttons and dock, `touch-action: manipulation`, no tap highlight; all motion behind `prefers-reduced-motion: no-preference`.
- [x] T5 Tests: `tests/home/mobile-dock.spec.ts` (tabs, 44px targets, active tab, no footer overlap, hiding rules, rails scroll on phones and not on desktop); `whatsapp.spec.ts` checks the dock control on phones and the floating button on desktop.

## Constraints kept

Zero new dependencies; radii and motion use tokens (A10 contract); transition contract green; size budgets green.

## Verification evidence

- Unit 199/199; `pnpm check`; build; `check:size`; `prettier --check`.
- Playwright full suite locally: 157 passed; the one failure (`HOME-CONVERGENCE-003`) is the sandbox being unable to reach `cloud.umami.is`, same as before this change.
- Before/after screenshots at 390px (dark and light) and 1440px desktop reviewed: desktop unchanged.

## Next (needs the owner)

Real project photography for every rail card, short screen recordings for the lead project, and a decision on whether the dock should also appear on tablets.
