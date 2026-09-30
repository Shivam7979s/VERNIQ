# VERNIQ Typography System

> **Document Version:** 1.0.0  
> **Status:** Canonical Typographic Standard  
> **Implementation:** Tailwind CSS font families + CSS semantic utility tokens  

---

## 1. Principles of Typographic Hierarchy

In VERNIQ, typography is the chief architectural vehicle for clarity. Code problem statements, algorithmic proofs, curriculum roadmaps, and data grids require distinct, unambiguous visual cadence.

### 1.1 Font Family Selection
We restrict the entire platform to **two strictly vetted font families**:

1. **Primary Interface Font:** `Inter` (with native fallback to system sans-serif: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
   - *Why:* Highly legible at small sizes (11px–14px), excellent x-height, neutral tone that does not distract from technical content, full support for OpenType features (`cv02`, `cv03`, `cv04`, `cv11`).
2. **Code & Tabular Font:** `JetBrains Mono` (with fallback to `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`).
   - *Why:* Designed specifically for developers; unambiguous glyphs (`0` vs `O`, `1` vs `l` vs `I`), clear operator proportions, balanced punctuation, and built-in tabular numbers for data grids.

---

## 2. Complete Typographic Hierarchy Specification

| Level | Size (px / rem) | Weight | Line Height | Letter Spacing | Target Usage Domain |
|---|---|---|---|---|---|
| **Display** | `36px` / `2.25rem` | 700 (Bold) | `1.2` (`44px`) | `-0.025em` | Marketing hero titles, major milestone headers |
| **H1** | `28px` / `1.75rem` | 700 (Bold) | `1.25` (`36px`) | `-0.02em` | Page titles, Roadmap name, Course title |
| **H2** | `22px` / `1.375rem` | 600 (Semibold)| `1.3` (`28px`) | `-0.015em` | Problem titles, Major dashboard sections |
| **H3** | `18px` / `1.125rem` | 600 (Semibold)| `1.4` (`25px`) | `-0.01em` | Panel titles, Modal titles, Lesson headings |
| **H4** | `15px` / `0.9375rem`| 600 (Semibold)| `1.4` (`21px`) | `0em` | Card titles, Grouping headers, Table section |
| **Body** | `14px` / `0.875rem` | 400 (Regular) | `1.5` (`21px`) | `0em` | Primary reading text, lesson content |
| **Body Small** | `13px` / `0.8125rem`| 400 (Regular) | `1.5` (`20px`) | `0em` | Metadata, sidebar items, description secondary |
| **Caption** | `12px` / `0.75rem` | 500 (Medium) | `1.4` (`17px`) | `0.01em` | Timestamps, badge text, helper hints |
| **Label** | `11px` / `0.6875rem`| 600 (Semibold)| `1.3` (`14px`) | `0.04em` (Uppercase)| Field labels, category tags, difficulty chips |
| **Button** | `13px` / `0.8125rem`| 600 (Semibold)| `1.0` (`13px`) | `0.01em` | Action triggers, buttons, segmented controls |
| **Code (Inline)** | `13px` / `0.8125rem`| 400 (Regular) | `1.4` (`18px`) | `0em` | Inline variable names, language keywords |
| **Code (Editor)** | `13px` / `0.8125rem`| 400 (Regular) | `1.6` (`21px`) | `0em` | Monaco editor source code, compilation traces |
| **Problem Statement** | `14px` / `0.875rem` | 400 (Regular) | `1.65` (`23px`)| `0em` | Algorithmic descriptions, constraints blocks |
| **Table Text** | `13px` / `0.8125rem`| 400 (Regular) | `1.4` (`18px`) | `0em` (`tabular-nums`)| Problem rows, submission runtimes, memory |

---

## 3. Domain-Specific Guidelines

### 3.1 Problem Statements & Algorithmic Proofs
- Problem statements utilize **`14px` font size with an elevated line-height of `1.65`** to prevent eye strain during 30+ minute analytical problem solving sessions.
- Mathematical constraints (e.g. `1 <= N <= 10^5`) must always be wrapped in inline code elements (`<code className="font-mono text-[13px] bg-surface-subtle px-1 py-0.5 rounded">`) with high-contrast text.

### 3.2 Code Editor & Execution Outputs
- Monaco editor and terminal outputs use `JetBrains Mono` at `13px` with `lineHeight: 21` and `letterSpacing: 0`.
- All output logs and test case diffs are rendered with monospace formatting to ensure column alignment in execution traces.

### 3.3 Tables and Data Grids
- All numeric data (acceptance rates, execution milliseconds, memory kilobytes, rank numbers) must apply the CSS utility `tabular-nums` (OpenType `tnum`). This guarantees that numbers line up vertically across table rows without jumping.

### 3.4 Responsive Typographic Behavior
- On mobile screens (`< 640px`), `Display` scales down from `36px` to `30px`, and `H1` scales down from `28px` to `24px`.
- `Body` and `Code` sizes **never drop below `13px`** on mobile devices to preserve accessibility and avoid user zoom triggers.
