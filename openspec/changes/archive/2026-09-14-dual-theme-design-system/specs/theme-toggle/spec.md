# Theme Toggle Specification

## Purpose

The `data-theme="dark"|"light"` attribute mechanism that activates design tokens: no-flash pre-paint initialization, a persisted Navbar toggle control, `theme-color` meta sync, and the Tailwind 4 `@custom-variant dark` wiring so existing `dark:` utilities track the attribute instead of `prefers-color-scheme`.

## Requirements

### Requirement: Theme Attribute Mechanism
The system MUST expose the active theme as `data-theme="dark"` or `data-theme="light"` on the root `<html>` element. All theme-dependent styling MUST key off this attribute, not off `prefers-color-scheme` directly.

#### Scenario: Attribute reflects active theme
- GIVEN the user has selected or been assigned a theme
- WHEN the page is inspected
- THEN `<html data-theme="dark">` or `<html data-theme="light">` is present and matches the active theme

### Requirement: No-Flash Pre-Paint Initialization
The system MUST determine and apply the theme attribute before first paint, via an inline synchronous script in `BaseLayout.astro`'s `<head>`. Resolution order MUST be: stored `localStorage` preference first, then `prefers-color-scheme`, defaulting to `dark` if neither is available.

#### Scenario: Stored preference wins on reload
- GIVEN `localStorage` holds an explicit theme preference of `light`
- WHEN the page loads, regardless of OS color-scheme setting
- THEN `data-theme="light"` is set before first paint with no flash of the wrong theme

#### Scenario: OS preference used when nothing is stored
- GIVEN no stored preference exists and the OS is set to dark color scheme
- WHEN the page loads
- THEN `data-theme="dark"` is set before first paint with no flash of the wrong theme

#### Scenario: Default fallback when neither signal exists
- GIVEN no stored preference and no resolvable OS color-scheme signal
- WHEN the page loads
- THEN `data-theme="dark"` is set before first paint

### Requirement: Persisted User Toggle Control
`Navbar.tsx` MUST provide a control that lets the user switch themes explicitly. On activation, the system MUST update the `data-theme` attribute immediately and persist the explicit choice to `localStorage` so it survives reload and takes priority over OS preference.

#### Scenario: Toggle switches theme and persists choice
- GIVEN the current theme is `dark`
- WHEN the user activates the Navbar toggle
- THEN `data-theme` becomes `light` immediately, and the choice is written to `localStorage`

#### Scenario: Persisted choice survives reload
- GIVEN the user has toggled to `light` and the choice was persisted
- WHEN the page is reloaded
- THEN the page loads with `data-theme="light"` regardless of OS color-scheme setting

### Requirement: Theme-Color Meta Sync
The system MUST keep the `<meta name="theme-color">` tag synchronized with the active theme for both dark and light modes, updating it whenever the theme changes.

#### Scenario: Meta tag matches active theme
- GIVEN the theme is toggled from dark to light
- WHEN the `theme-color` meta tag is inspected after the toggle
- THEN its `content` value matches the light theme's designated color, not the dark theme's

### Requirement: Tailwind Dark Variant Tracks Attribute
The system MUST wire `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` in `global.css` so existing `dark:` utility classes apply based on the `data-theme` attribute rather than `prefers-color-scheme`.

#### Scenario: dark: utilities respond to attribute, not OS preference
- GIVEN the OS color-scheme is set to light and `data-theme="dark"` is explicitly set (e.g. via persisted user choice)
- WHEN an element using a `dark:` utility class is rendered
- THEN the `dark:` styling is applied, because the variant tracks `data-theme`, not the OS setting

#### Scenario: dark: utilities are inert when data-theme is light
- GIVEN `data-theme="light"` is set
- WHEN an element using a `dark:` utility class is rendered
- THEN the `dark:` styling is NOT applied
