---
name: Aviators
description: Internal knowledge and AI chat tool for presales and operations
colors:
  primary: "#2b5da3"
  primary-ring: "#2b5da3"
  text: "#16181d"
  muted: "#5f6368"
  danger: "#b3261e"
  surface: "#ffffff"
  surface-muted: "#f8fafc"
  border: "#e2e8f0"
  sky-accent: "#0ea5e9"
typography:
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  heading-page:
    fontFamily: "inherit"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  heading-section:
    fontFamily: "inherit"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
spacing:
  section: "1.5rem"
  stack: "1rem"
  inline: "0.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-danger-filled:
    backgroundColor: "#dc2626"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

## Overview

Aviators uses a **product register**: sidebar + content panel, cards only where they group a coherent task, sky/blue accent on slate neutrals. Typography is system stack; hierarchy via size and weight, not decorative type. Dark mode via `class="dark"` on `<html>`. Motion is subtle (loaders, drawer); respect `prefers-reduced-motion`.

## Colors

| Role | Token / class | Usage |
|------|---------------|--------|
| Primary | `--primary` / `aviators-primary` (#2b5da3) | CTAs, links, active nav, rings |
| Text | `--text` (#16181d) | Body and headings |
| Muted | `--muted` (#5f6368) | Secondary copy, hints |
| Danger | `--danger` (#b3261e) | Destructive outline actions, errors |
| Surface | white / slate-50–800 | Panels, cards, inputs |
| Accent | sky-500–950 | Hover states, batch bars, loaders |

**Contrast:** Body text on tinted backgrounds uses sky-950 / sky-100 hovers, not gray-on-sky-50.

## Typography

- **Page title:** `text-lg font-semibold` + lead `text-sm text-slate-600`
- **Section title:** `text-base font-semibold` + lead paragraph (i18n)
- **UI controls:** 15px inputs, `text-sm` tables and meta
- **Mono:** agent prompts / code blocks only

## Elevation

Flat product UI: **1px borders** (`border-slate-200`), light `shadow-sm` on main panels only. No nested card stacks. Modals: `shadow-xl` + backdrop `bg-slate-900/50`. Z-index scale: `dropdown` (50) → `backdrop` (40) → `modal` (100) → `blocking` (200) → `toast` (9999).

## Components

### Buttons

Combine **`.btn` + size + variant** (`gas/tailwind-input.css`):

| Variant | Classes | When |
|---------|---------|------|
| Primary | `btn btn-md btn-primary` | Save, sync, main CTA |
| Secondary | `btn btn-sm btn-secondary` | Export, neutral toolbar |
| Outline | `btn btn-md btn-outline` | Cancel, back, refresh |
| Outline danger | `btn btn-md btn-outline-danger` | Delete in forms |
| Danger filled | `btn btn-sm btn-danger` | Batch delete, high emphasis |

Every `<button>` with visible text includes a Font Awesome icon + `<span data-i18n>`.

### Sections

`<section aria-labelledby="…">` with **h2/h3 + lead `<p>`** before controls (see `gas-ui-sections-structure` rule).

### Modals

- **Confirm:** `#app-confirm-modal` via `A.confirmDialog()`
- **Blocking:** `#blocking-modal` for RPC writes
- **Agent delete:** dedicated modal (Globant + registry)

### Floating panels

Chat history and global search: `.app-floating-panel` + `A.showFloatingPanel()`.

## Do's and Don'ts

**Do**

- Use i18n keys for all visible strings.
- Show async feedback and disable re-entry during RPCs.
- Paginate long lists (`skip` / `limit` / `hasMore`).
- Compile Tailwind after class changes (`npm run build:css`).

**Don't**

- Nest bordered cards inside bordered cards.
- Use `window.confirm` or hardcoded UI strings.
- Arbitrary z-index (`z-[9999]` except toast token).
- Load Chart.js globally; lazy-load on Metrics only.
