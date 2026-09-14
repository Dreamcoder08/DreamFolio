# Verification: task 6.3, performed against the deployed site

Task 6.3 was the only one left open in this change, and the reason recorded for it was environmental
rather than a property of the change: *"Not performed — no connected browser available in this
session."* A browser was available on 2026-09-14, so the check was performed against the deployed site
instead of being deferred a second time.

The task named a DevTools throttled paint check. It ran with CDP-emulated network conditions — 400 ms
latency, 50 KB/s down, cache disabled — which applies the same stress programmatically.

| Claim | Measurement |
| --- | --- |
| Toggle switches theme | `data-theme` light→dark; `aria-pressed` `true`→`false`; `aria-label` "Cambiar a tema oscuro"→"Cambiar a tema claro"; `theme-color` `#f3eadc`→`#000000` |
| Persists across reload | `dark` written to `localStorage['dreamfolio-theme']` and still applied after reload |

**No FOUC, structurally.** In the served document, `theme-init.js` is head child **25**, ahead of the
stylesheet links at 27, 28 and 35. Nothing can paint before the theme is decided.

**No FOUC, by timing.** `data-theme` applied versus first paint, on three load conditions:

| Load | theme applied | first paint | margin |
| --- | --- | --- | --- |
| cold, stored `light` | 620.5 ms | 1152 ms | 531 ms |
| warm | 30.5 ms (script response end) | 108 ms | 78 ms |
| throttled, no cache | 881 ms | 2636 ms | 1755 ms |

The margin *grows* under throttling, and that is the property worth recording: a blocking head script
delays the paint, so a slower network makes the theme earlier relative to paint, never later. It is what
`public/theme-init.js` was written for, and that file's own comment explains why it is a separate file
rather than an inline script — Astro does not hash `is:inline` scripts for its CSP, so an inline version
is silently blocked and the theme flashes without the page failing.

Nothing here changes code, specs or delta specs. It records a verification that was owed, and closes the
one item in the parked set that no policy decision was gating.
