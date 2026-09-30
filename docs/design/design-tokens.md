# VERNIQ Design Tokens

> **Document Version:** 1.0.0  
> **Status:** Canonical Specification  
> **Implementation:** CSS Custom Properties (`apps/web/src/styles/tokens.css`) + Tailwind CSS theme extension  

---

## 1. Rationale and Token Architecture

VERNIQ design tokens are structured in a two-tier hierarchy:
1. **Global / Primitive Scales:** Mathematical raw values (e.g. `slate-900`, `blue-600`, `space-4`).
2. **Semantic / Alias Tokens:** Intent-driven variables (e.g. `--color-background`, `--color-surface`, `--color-border-focus`).

**Why this palette was chosen:**
- **Engineering Authenticity:** We avoid muddy pure-black (`#000000`) which produces high contrast strain when staring at code for hours. Instead, we use an engineered deep-slate (`#0B0F17`) with cool undertones for dark mode, and an ultra-crisp technical porcelain (`#F8FAFC`) for light mode.
- **Precision Primary Blue:** A calibrated technical sapphire (`#2563EB` in light mode, `#3B82F6` in dark mode) chosen for authoritative contrast and international legibility. It conveys focus and reliability.
- **Distinctive Semantic Status & Difficulty:**
  - `Easy`: Natural emerald green (`#10B981`) representing stability.
  - `Medium`: Amber ochre (`#F59E0B`) representing required attention.
  - `Hard`: Precision crimson red (`#EF4444`) representing algorithmic complexity.

---

## 2. Color System Tokens

### 2.1 Surfaces & Backgrounds

| Token Name | Light Mode Value | Dark Mode Value | Usage Description |
|---|---|---|---|
| `--color-background` | `#F8FAFC` (Slate 50) | `#0B0F17` (Obsidian Slate) | Root viewport background |
| `--color-surface` | `#FFFFFF` (Pure White) | `#111827` (Gray 900) | Default card, panel, and sidebar surface |
| `--color-surface-elevated`| `#F1F5F9` (Slate 100) | `#1E293B` (Slate 800) | Popovers, dropdown menus, modals, tooltips |
| `--color-surface-subtle` | `#E2E8F0` (Slate 200) | `#172033` (Slate 900) | Active list selection, table hover rows |
| `--color-surface-sunken` | `#E2E8F0` (Slate 200) | `#080C14` (Deep Void) | Monaco editor gutter, shell terminal |

### 2.2 Text & Typography

| Token Name | Light Mode Value | Dark Mode Value | Usage Description |
|---|---|---|---|
| `--color-text-primary` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | High-emphasis body text, headings |
| `--color-text-secondary`| `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Secondary descriptions, metadata, labels |
| `--color-text-muted` | `#64748B` (Slate 500) | `#64748B` (Slate 500) | Timestamps, disabled states, placeholders |
| `--color-text-inverse` | `#FFFFFF` | `#0F172A` | Text on solid contrasting primary buttons |

### 2.3 Borders & Dividers

| Token Name | Light Mode Value | Dark Mode Value | Usage Description |
|---|---|---|---|
| `--color-border` | `#E2E8F0` (Slate 200) | `#1E293B` (Slate 800) | Structural card borders, dividers, rows |
| `--color-border-strong` | `#CBD5E1` (Slate 300) | `#334155` (Slate 700) | Form input borders, active panel outlines |
| `--color-border-focus` | `#2563EB` (Blue 600) | `#60A5FA` (Blue 400) | Keyboard focus ring (`outline: 2px solid`) |

### 2.4 Brand & Semantic Accents

| Token Name | Light Mode Value | Dark Mode Value | Usage Description |
|---|---|---|---|
| `--color-primary` | `#2563EB` (Blue 600) | `#3B82F6` (Blue 500) | Primary call to action, active navigation |
| `--color-primary-hover` | `#1D4ED8` (Blue 700) | `#2563EB` (Blue 600) | Primary button hover state |
| `--color-primary-subtle`| `#EFF6FF` (Blue 50) | `#1E2A4A` (Alpha Blue) | Primary highlighted badges, selections |
| `--color-success` | `#10B981` (Emerald 500)| `#10B981` (Emerald 500)| Accepted solutions, passing test suites |
| `--color-warning` | `#F59E0B` (Amber 500) | `#F59E0B` (Amber 500) | Time-limit warnings, deprecation notices |
| `--color-error` | `#EF4444` (Red 500) | `#EF4444` (Red 500) | Wrong answer, runtime error, invalid input |

### 2.5 Difficulty & Progress Tokens

| Token Name | Value | Background Light | Background Dark |
|---|---|---|---|
| `--difficulty-easy` | `#059669` (Emerald 600) | `#ECFDF5` | `#064E3B` |
| `--difficulty-medium` | `#D97706` (Amber 600) | `#FFFBEB` | `#78350F` |
| `--difficulty-hard` | `#DC2626` (Red 600) | `#FEF2F2` | `#7F1D1D` |
| `--progress-complete` | `#10B981` (Emerald 500)| `#D1FAE5` | `#064E3B` |
| `--progress-active` | `#2563EB` (Blue 600) | `#DBEAFE` | `#1E3A8A` |
| `--progress-pending` | `#94A3B8` (Slate 400) | `#F1F5F9` | `#1E293B` |

---

## 3. Spacing Scale

All layout geometry strictly aligns to a 4px mathematical scale:

| Token | Pixels | Rem Equivalent | Primary Application |
|---|---|---|---|
| `--space-0` | `0px` | `0rem` | Reset |
| `--space-1` | `4px` | `0.25rem` | Micro-padding, badge vertical padding |
| `--space-2` | `8px` | `0.5rem` | Icon gaps, tight list items, button padding Y |
| `--space-3` | `12px` | `0.75rem` | Standard input padding Y, table row gaps |
| `--space-4` | `16px` | `1.0rem` | Default component internal padding |
| `--space-5` | `20px` | `1.25rem` | Moderate card padding |
| `--space-6` | `24px` | `1.5rem` | Section gutters, modal interior padding |
| `--space-8` | `32px` | `2.0rem` | Page margins, sidebar top spacing |
| `--space-10` | `40px` | `2.5rem` | Large section dividers |
| `--space-12` | `48px` | `3.0rem` | Major dashboard grid gaps |
| `--space-16` | `64px` | `4.0rem` | Hero block padding |

---

## 4. Typography Scale

Fonts:
- **Primary UI / Headings:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`
- **Code, Data & Metrics:** `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `monospace`

| Token | Size | Line Height | Weight | Letter Spacing |
|---|---|---|---|---|
| `--font-display` | `36px` (`2.25rem`) | `1.2` | 700 (Bold) | `-0.025em` |
| `--font-h1` | `28px` (`1.75rem`) | `1.25` | 700 (Bold) | `-0.02em` |
| `--font-h2` | `22px` (`1.375rem`)| `1.3` | 600 (Semibold) | `-0.015em` |
| `--font-h3` | `18px` (`1.125rem`)| `1.4` | 600 (Semibold) | `-0.01em` |
| `--font-h4` | `15px` (`0.9375rem`)| `1.4` | 600 (Semibold) | `0em` |
| `--font-body` | `14px` (`0.875rem`)| `1.5` | 400 (Regular) | `0em` |
| `--font-body-sm` | `13px` (`0.8125rem`)| `1.5` | 400 (Regular) | `0em` |
| `--font-caption` | `12px` (`0.75rem`) | `1.4` | 500 (Medium) | `0.01em` |
| `--font-label` | `11px` (`0.6875rem`)| `1.3` | 600 (Semibold) | `0.04em` (Uppercase) |
| `--font-code` | `13px` (`0.8125rem`)| `1.6` | 400 (Regular) | `0em` |

---

## 5. Border Radius & Borders

VERNIQ avoids bubbly or overly rounded corners to preserve a crisp, technical aesthetic:

| Token | Value | Applied To |
|---|---|---|
| `--radius-none` | `0px` | Split-screen panels, code editor gutters |
| `--radius-sm` | `3px` | Badges, tags, inline code chips |
| `--radius-md` | `6px` | Buttons, inputs, dropdown items, table rows |
| `--radius-lg` | `8px` | Cards, modals, drawers, dialog containers |
| `--radius-full` | `9999px` | Avatars, status pill indicators |

---

## 6. Elevation & Shadows

We avoid heavy, blurry shadows in favor of 1px structured borders reinforced by subtle diffuse shadows:

| Token | Box Shadow Specification | Intent |
|---|---|---|
| `--elevation-border` | `0 0 0 1px var(--color-border)` | Baseline structural plane separation |
| `--elevation-1` | `0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px var(--color-border)` | Cards, input fields |
| `--elevation-2` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--color-border)` | Dropdowns, hover states |
| `--elevation-3` | `0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--color-border-strong)` | Modals, command palette |

---

## 7. Motion & Transitions

All motion must adhere to `prefers-reduced-motion`:

| Token | Duration | Easing Function | Application |
|---|---|---|---|
| `--motion-fast` | `100ms` | `cubic-bezier(0, 0, 0.2, 1)` | Hover highlights, button presses |
| `--motion-base` | `150ms` | `cubic-bezier(0, 0, 0.2, 1)` | Dropdown open, tab slide, modal fade |
| `--motion-slow` | `250ms` | `cubic-bezier(0, 0, 0.2, 1)` | Drawer slide-in, accordion expansion |

---

## 8. Breakpoints & Viewport Boundaries

| Token | Value | Target Viewport |
|---|---|---|
| `--breakpoint-sm` | `640px` | Large Mobile / Phablet |
| `--breakpoint-md` | `768px` | Tablet (Portrait) |
| `--breakpoint-lg` | `1024px` | Tablet (Landscape) / Small Laptop |
| `--breakpoint-xl` | `1280px` | Standard Desktop Workstation |
| `--breakpoint-2xl`| `1536px` | Dual-Monitor / High-Resolution Displays |

---

## 9. Z-Index Layering

| Token | Value | Assigned Component |
|---|---|---|
| `--z-hide` | `-1` | Background watermarks |
| `--z-base` | `0` | Standard canvas flow |
| `--z-dock` | `10` | Sticky headers, editor toolbars |
| `--z-dropdown` | `100` | Dropdown menus, select options |
| `--z-sticky` | `200` | Floating workspace action bar |
| `--z-overlay` | `500` | Modal backdrops, drawer dimmers |
| `--z-modal` | `1000` | Modal dialogs, Command Palette |
| `--z-toast` | `2000` | System notifications, alerts |
| `--z-tooltip` | `3000` | Micro-tooltips |
