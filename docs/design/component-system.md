# VERNIQ Component System Architecture

> **Document Version:** 1.0.0  
> **Status:** Foundational Component Specification  
> **Implementation Directory:** `apps/web/src/components/`  

---

## 1. Architectural Principles

All VERNIQ components follow these strict development rules:
1. **Zero Ad-Hoc Styling:** Components must consume semantic CSS variables and design tokens (`bg-surface`, `text-text-primary`, `border-border`, etc.). Never write raw hex colors or arbitrary pixel margins inside JSX.
2. **Strict TypeScript Typing:** Every component exports its prop interface with comprehensive JSDoc comments.
3. **Compound & Atomic Structure:** Complex patterns (e.g. `FormField`, `Tabs`, `Table`) use compound composition rather than monolithic prop bags.
4. **Accessible by Default:** All interactive components include appropriate ARIA attributes, keyboard listeners, and focus-visible indicators.

---

## 2. Component Categorization Matrix

```
components/
├── ui/                  # Atomic & foundational primitives (Zero domain logic)
│   ├── layout/          # AppShell, PublicLayout, DashboardLayout, Sidebar, Header, Footer, Container
│   ├── navigation/      # NavItem, Breadcrumbs, Tabs, Pagination
│   ├── actions/         # Button, IconButton, Dropdown, CommandPalette
│   ├── forms/           # Input, Textarea, Select, Checkbox, Radio, Switch, FormField
│   ├── feedback/        # Alert, Toast, Modal, Tooltip, Skeleton, EmptyState, ErrorState
│   └── data/            # Card, Table, Badge, Progress, Stat, ChartContainer
└── learning/            # Domain-specific pedagogical primitives
    ├── TopicCard.tsx
    ├── RoadmapNode.tsx
    ├── ProblemCard.tsx
    ├── DifficultyBadge.tsx
    └── CompletionIndicator.tsx
```

---

## 3. Foundational Component Specifications

### 3.1 Layout Primitives
- **`AppShell`**: Top-level root provider orchestrating Theme, Toast notifications, and global keyboard shortcuts (Command Palette `Cmd+K`).
- **`PublicLayout`**: Outer container for public pages featuring a slim marketing navigation header, containerized main body, and multi-column technical footer.
- **`DashboardLayout`**: The student workspace shell. Houses the collapsible primary sidebar, contextual breadcrumb topbar, user profile avatar menu, and scroll-isolated main content.
- **`Sidebar`**: Left-anchored persistent rail supporting collapsed (icon-only, 64px) and expanded (240px) states with active route indicators.
- **`Container`**: Max-width wrapper (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1440px`) with standardized responsive horizontal gutters.

### 3.2 Navigation Primitives
- **`NavItem`**: Single navigation anchor supporting `active`, `disabled`, and `badge` counts.
- **`Breadcrumbs`**: Contextual path indicator with automated chevron separators and microdata schema.
- **`Tabs`**: Accessible tabbed container (`role="tablist"`, `role="tab"`, `role="tabpanel"`) with arrow key navigation.
- **`Pagination`**: Page index navigator with previous/next triggers and ellipsis handling for large sets.

### 3.3 Action Primitives
- **`Button`**: Core interactive element with variants:
  - `primary`: High-contrast filled sapphire button.
  - `secondary`: Subtle surface background with 1px border.
  - `outline`: Transparent background with border.
  - `ghost`: Transparent until hover.
  - `danger`: High-visibility crimson action.
  - Supports `size` (`sm`, `md`, `lg`), `isLoading` (with spinner), and `leftIcon` / `rightIcon`.
- **`IconButton`**: Accessible square trigger for icon-only actions with mandatory `aria-label`.

### 3.4 Form Primitives
- **`FormField`**: Wrapper providing label, required indicator, helper description, and accessible error message linked via `aria-describedby`.
- **`Input`**: Text input with support for leading/trailing adornments, clear button, and error state styling.
- **`Textarea`**: Multi-line editor with configurable auto-resize and monospace toggle.
- **`Select`**: Native-styled or accessible dropdown selector.
- **`Checkbox`, `Radio`, `Switch`**: High-contrast, keyboard-focusable Boolean toggles.

### 3.5 Feedback Primitives
- **`Alert`**: Inline message banner with semantic variants (`info`, `success`, `warning`, `error`).
- **`Toast` & `ToastProvider`**: Floating notification system with auto-dismiss timers and pause-on-hover.
- **`Modal` / `Dialog`**: Trapped-focus accessible overlay (`role="dialog"`, `aria-modal="true"`) dismissible by Escape key or backdrop click.
- **`Tooltip`**: Micro-information popover triggered by hover and focus with configurable delays.
- **`Skeleton`**: Animated placeholder shimmer matching exact target dimensions to prevent layout shifts.
- **`EmptyState`**: Structured fallback featuring an icon, clear explanatory title, contextual body copy, and a primary call to action.
- **`ErrorState`**: Technical failure view with diagnostic error code, retry button, and issue reporting link.

### 3.6 Data Display Primitives
- **`Card`**: Elevated structural panel with optional `Header`, `Body`, and `Footer` sub-components.
- **`Table`**: High-density tabular grid with sticky header, zebra row options, and `tabular-nums` support.
- **`Badge`**: Compact status chip with semantic colors (`neutral`, `primary`, `success`, `warning`, `error`).
- **`Progress`**: Linear progress bar with percentage indicator and indeterminate animation state.
- **`Stat`**: Metric tile featuring a numerical value, comparison delta (e.g. `+12% this week`), and subtitle.

### 3.7 Learning Domain Primitives
- **`DifficultyBadge`**: Specialized badge rendering `Easy`, `Medium`, or `Hard` with official VERNIQ colors.
- **`CompletionIndicator`**: Circular or icon checkmark depicting `pending`, `in_progress`, or `completed`.
- **`ProblemCard`**: Algorithmic problem list row presenting title, difficulty badge, acceptance rate, tags, and user status.
- **`RoadmapNode`**: Directed roadmap graph milestone item displaying prerequisite connection lines, title, status, and estimated duration.
