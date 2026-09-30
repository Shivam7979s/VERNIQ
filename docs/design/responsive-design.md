# VERNIQ Responsive Design Architecture

> **Document Version:** 1.0.0  
> **Status:** Canonical Specification  
> **Methodology:** Mobile-First Responsive Layout Strategy  

---

## 1. Breakpoint Grid Matrix

VERNIQ structures layouts across five standard hardware-aligned breakpoints:

| Breakpoint | Minimum Width | Hardware Archetypes | Primary Navigation Model |
|---|---|---|---|
| **Mobile (`sm`)** | `< 640px` | Phones (iPhone, Pixel, Galaxy) | Bottom navigation bar / Slide-over drawer |
| **Tablet (`md`)** | `640px – 1023px` | iPad, Surface Go, Tablets | Collapsed icon-only rail / Sheet drawer |
| **Laptop (`lg`)** | `1024px – 1279px`| MacBook Air, ThinkPad 13"/14" | Persistent slim sidebar |
| **Desktop (`xl`)** | `1280px – 1535px`| 24" Monitors, MacBook Pro 16" | Full sidebar + dual split-pane workspaces |
| **Wide (`2xl`)** | `1536px+` | 27"+ 4K Monitors, Ultra-wides | Multi-pane workspace + pinned AI Assistant |

---

## 2. Layout Transformation by Viewport Tier

### 2.1 Problem Solving Workspace (Coding Editor & Problem Statement)

The code practice workspace requires distinct paradigms depending on screen real estate:

```
DESKTOP (>= 1280px): Dual Split-Screen
┌───────────────────────────┬───────────────────────────┐
│ Problem Statement & Specs │ Monaco Code Editor        │
│ Examples, Constraints     │ Language Selector, Reset  │
│ [Test Cases] [Submissions]│ [Run Code] [Submit]       │
└───────────────────────────┴───────────────────────────┘

TABLET (768px - 1023px): Stacked Resizable Vertical Split
┌───────────────────────────────────────────────────────┐
│ Problem Statement (Collapsible / 40% height)          │
├───────────────────────────────────────────────────────┤
│ Monaco Code Editor & Test Controls (60% height)       │
└───────────────────────────────────────────────────────┘

MOBILE (< 768px): Tabbed Swipeable Views
┌───────────────────────────────────────────────────────┐
│ [ Problem ]   [ Code ]   [ Console ]   [ AI Mentor ]  │
├───────────────────────────────────────────────────────┤
│ (Active View occupies 100% viewport width)           │
│ Fixed Bottom Action Bar: [Run] [Submit Solution]      │
└───────────────────────────────────────────────────────┘
```

- **Desktop (`>= 1280px`):** Dual-pane horizontal split with draggable divider. Left pane contains problem description and markdown specs; right pane contains Monaco Editor and bottom dockable test console.
- **Tablet (`768px – 1023px`):** Vertical split with problem description on top (resizable or collapsible) and editor below, or a toggleable secondary panel.
- **Mobile (`< 768px`):** Tab-switched paradigm (`Problem`, `Code`, `Results`, `Mentor`). Engineers can read the problem without distraction, switch to code with a mobile-optimized keyboard accessory strip (containing brackets `{`, `}`, `(`, `)`, `;`, `tab`), and switch to console to review test execution results.

---

### 2.2 Navigation and Sidebar Behavior

- **Desktop (`>= 1024px`):** Persistent left sidebar (`w-60` or `w-64`) with clear grouping labels, active indicator, and bottom user profile card.
- **Tablet (`768px – 1023px`):** Collapsed icon-only rail (`w-16`) with hover tooltips and flyout menus for child links.
- **Mobile (`< 768px`):** Persistent top bar with hamburger trigger opening a full-height accessible slide-over drawer, accompanied by a quick-action bottom navigation bar for high-frequency routes (`Dashboard`, `Practice`, `Revision`, `Profile`).

---

### 2.3 Roadmaps and Curriculum Graphs

- **Desktop:** Interactive 2D Directed Acyclic Graph (DAG) with zoom, pan, and prerequisite connecting lines.
- **Tablet & Mobile:** Automatically linearizes into a sequential vertical milestone timeline with expandable topic accordions, preventing complex canvas scrolling issues on small touch screens.

---

### 2.4 Data Tables and Leaderboards

- **Desktop:** Full multi-column table displaying `Problem Name`, `Difficulty`, `Acceptance Rate`, `Tags`, `Last Attempt`, and `Action`.
- **Tablet:** Drops non-essential columns (`Tags`, `Last Attempt`), keeping primary metrics visible.
- **Mobile:** Converts from table rows into high-density card units:
  ```
  ┌──────────────────────────────────────────────────┐
  │ Two Sum                           [Easy] [Solve] │
  │ Arrays & Hashing • Acceptance: 54.2%             │
  └──────────────────────────────────────────────────┘
  ```

---

### 2.5 Dashboards & Metric Grids

- **Desktop:** 4-column metric grid (`grid-cols-4`) followed by 2-column analytics cards (`2/3` progress chart + `1/3` revision queue).
- **Tablet:** 2-column metric grid (`grid-cols-2`) with stacked analytics cards.
- **Mobile:** 1-column stack (`grid-cols-1`) with high-priority metrics on top and horizontal swipeable metric carousels.
