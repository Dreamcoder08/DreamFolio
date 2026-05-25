# TechnicalIntake

`src/components/sections/TechnicalIntake.tsx` is the contact/handshake island.

## Why React

- Copy email to clipboard.
- Select target domain.
- Validate minimal form input locally.
- Generate a `mailto:` draft.

## Hydration

`client:visible` because the section sits near the bottom of the landing.

## Rule

Do not reintroduce a heavy form stack for this flow. A backend/contact API only makes sense if the product needs persistence, spam protection, or CRM routing.
