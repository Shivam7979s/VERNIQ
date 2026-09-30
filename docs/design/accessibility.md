# VERNIQ Accessibility (a11y) Architecture

> **Document Version:** 1.0.0  
> **Status:** Mandatory Engineering Standard  
> **Compliance Target:** WCAG 2.2 Level AA Standard  

---

## 1. Foundational Accessibility Principles

1. **Semantic HTML First:** Use native elements (`<button>`, `<nav>`, `<main>`, `<dialog>`, `<table>`) before considering custom `<div>` implementations. Native browser accessibility trees outperform artificial ARIA configurations.
2. **Never Communicate Through Color Alone:** Every state that conveys information (problem difficulty, test execution verdict, form error) must pair color with text, an icon, or an explicit screen-reader label.
3. **Full Keyboard Parity:** Every feature accessible via mouse or touch must be 100% operable using keyboard navigation alone (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys).

---

## 2. Accessibility Engineering Rules

### 2.1 Keyboard Navigation and Focus Visibility
- **Focus Rings:** All interactive elements must exhibit a high-contrast focus indicator (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus`).
- **Never Suppress Outline Without Replacement:** The CSS rule `outline: none` is strictly prohibited unless accompanied by an explicit replacement focus ring on `:focus-visible`.
- **Skip Links:** The application root provides a hidden skip link:
  ```html
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-toast focus:p-3 focus:bg-surface focus:border focus:border-primary">
    Skip to main content
  </a>
  ```
- **Tab Trapping:** Modals, dialogs, and slide-over drawers must trap focus within the container while active, cycling between the first and last focusable elements. Pressing `Escape` must immediately close the dialog and restore focus to the trigger element.

### 2.2 Touch Targets & Mobile Ergonomics
- All interactive controls (buttons, links, icon buttons, checkboxes) must satisfy a minimum touch target area of **44 × 44 CSS pixels** on mobile and touch devices.
- On desktop, small dense icon triggers must maintain an invisible tap padding pseudo-element (`::after` inset `-8px`) to ensure effortless cursor and touch targeting.

### 2.3 Form Fields, Labels, and Error Handling
- **Explicit Label Binding:** Every `<input>`, `<textarea>`, and `<select>` must have an associated `<label>` connected via `htmlFor` matching the control's `id`.
- **Descriptive Error Messaging:** Form errors must be linked to the corresponding input via `aria-describedby="[input-id]-error"` and flagged with `aria-invalid="true"`.
- **Live Announcements:** Form submission errors and async network validation errors must be announced to assistive tech using `aria-live="polite"`.

### 2.4 Tables and Dense Data Grids
- Tabular data must utilize semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` elements.
- Column headers must include `scope="col"`, and row headers (if applicable) must include `scope="row"`.
- Sortable column headers must announce sort direction via `aria-sort="ascending" | "descending" | "none"`.

### 2.5 Code Editor & Split-Pane Ergonomics (Monaco Accessibility)
- Monaco Editor introduces complex keyboard interactions (e.g. Tab inserting indents).
- To preserve keyboard operability:
  1. The editor toolbar must provide a visible shortcut reminder: `Ctrl+M` / `Cmd+M` toggles Tab key focus trapping.
  2. Clear keyboard shortcuts must allow engineers to jump focus out of the editor to the test runner (`Cmd+Enter` to run code, `Cmd+Option+S` to submit).
  3. Code execution logs and diff views must have `role="region"` and `aria-label="Execution Output"`.

### 2.6 Motion and Vestibular Safety (`prefers-reduced-motion`)
All CSS transitions, modal slides, and pulse animations must honor the user's operating system reduced-motion preference:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 2.7 Screen Reader Text & Non-Visual Assets
- All decorative icons must be marked `aria-hidden="true"`.
- Icon-only buttons must provide an explicit `aria-label` (e.g. `<IconButton aria-label="Toggle dark mode" icon={<SunIcon />} />`).
- Informative diagrams and charts must provide a text summary fallback or `aria-describedby` reference.
