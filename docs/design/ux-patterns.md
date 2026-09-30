# VERNIQ UX Interaction Patterns

> **Document Version:** 1.0.0  
> **Status:** Mandatory UX Specification  
> **Objective:** Absolute Consistency in State Transitions and Learning Workflows Across the Platform  

---

## 1. System State Patterns

### 1.1 Loading States
- **Skeleton Screens:** All initial page loads (Dashboard, Problem List, Roadmap) utilize layout-matched skeletons (`<Skeleton />`) to eliminate Cumulative Layout Shift (CLS). Skeletons must mirror the exact dimensions of incoming cards and table rows.
- **Button Loading Spinners:** During async mutations (e.g. submitting a solution, saving code, updating profile), the triggering button retains its exact width, displays an inline CSS spinner, disables user clicks, and keeps its text label visible (e.g. "Submitting...").
- **Optimistic UI Updates:** Toggle actions (bookmarking a question, marking a lesson complete) update the interface immediately while dispatching the background API request. If the request fails, the state reverts and a descriptive error toast is displayed.

### 1.2 Empty States
- Every screen or list that can lack content must render a dedicated `<EmptyState />` component consisting of:
  1. Semantic icon (e.g. `InboxIcon`, `BookOpenIcon`).
  2. Clear, informative headline (e.g. "No Revisions Due Today").
  3. Actionable body copy explaining how items appear in this state.
  4. Primary call-to-action button (e.g. "Explore Algorithmic Roadmaps").
- Never leave a blank, white, or empty panel.

### 1.3 Error States & Failure Recovery
- **Inline Field Errors:** Rendered immediately below the input with a distinct red alert icon and clear instructional copy.
- **Network / Service Failures:** If the Supabase database or backend API cannot be reached, show an `<ErrorState />` with a human-readable diagnosis, an error reference ID, and a "Retry Connection" button.
- **Judge Execution Failures:** If code fails to compile or crashes, show the exact compiler output, stderr trace, and line numbers in an accessible code-formatted card.

### 1.4 Confirmation & Destructive Action Dialogs
- Any irreversible action (deleting a custom study plan, revoking an API key, resetting progress) requires an explicit modal confirmation:
  - Destructive buttons use `--color-error` styling.
  - High-impact deletions require the user to type their username or the keyword `DELETE` to confirm.
  - Confirmation modals autofocus the "Cancel" button by default to prevent accidental `Enter` key execution.

### 1.5 Unsaved Changes Guard
- If a user modifies source code or markdown notes and attempts to navigate away, trigger the browser `beforeunload` event and show an in-app prompt: *"You have unsaved changes in your solution. Do you want to discard them or save draft?"*

---

## 2. Navigation, Filter, & Search Patterns

### 2.1 Filtering & Sorting
- **URL-Driven State:** All search terms, active tags, difficulty filters, and pagination offsets are mirrored in the browser URL query params (`/app/practice?difficulty=medium&tag=two-pointers&page=2`).
- **Immediate Response:** Search inputs debounce input by `250ms` before querying.
- **Multi-Filter Chips:** Active filters appear as dismissible chips above data lists with a "Clear all filters" trigger.

### 2.2 Global Command Palette (`Cmd + K` / `Ctrl + K`)
- Instant access to platform navigation, recent problems, curriculum roadmaps, and settings.
- Grouped search results: `Navigation`, `Problems`, `Roadmaps`, `Actions`.
- Fully navigable with Arrow keys, `Enter` to select, and `Escape` to close.

### 2.3 Keyboard Shortcut Registry
| Shortcut | Action |
|---|---|
| `Cmd + K` / `Ctrl + K` | Open Command Palette |
| `Cmd + Enter` / `Ctrl + Enter` | Run Code in Workspace |
| `Cmd + Option + S` / `Ctrl + Alt + S` | Submit Solution to Online Judge |
| `Ctrl + M` | Toggle Monaco Editor Tab Trapping |
| `?` | Display Keyboard Shortcuts Cheat Sheet |
| `Esc` | Close active modal, dialog, or drawer |

---

## 3. Learning & Educational Workflow Patterns

### 3.1 Continue Learning & Resume Lesson
- The Authenticated Dashboard features a prominent **"Next Active Step"** card. It displays the current curriculum path, exact module title, completion percentage, and a primary "Resume Lesson" button taking the student directly to their last read position.

### 3.2 Problem Solving Cycle
1. **Start Problem:** Opens the problem workspace, fetches the user's previous draft if available, and loads starter boilerplates in the user's preferred language.
2. **Run Test Cases:** Compiles and runs against sample test cases in `< 1.5s`. Returns diff visualizations for stdout vs expected output.
3. **Submit Solution:** Enqueues code to the isolated judge; displays a live status ticker (`Queued -> Compiling -> Running Test 4/45 -> Accepted`); awards completion checkmark upon success.

### 3.3 Spaced Repetition (Active Revision Due)
- Questions solved by the student enter an adaptive spaced-repetition queue:
  - Interval 1: 24 hours after initial solve.
  - Interval 2: 3 days after first review.
  - Interval 3: 7 days after second review.
  - Interval 4: 21 days after third review.
- The student's dashboard displays a **"Revision Due"** badge with count. Reviewing questions resets the memory decay curve.

### 3.4 Missed Tasks & Daily Study Capacity
- If a student misses a scheduled study plan day, VERNIQ **never shames the user** with aggressive guilt-inducing copy or broken red streaks.
- Instead, the system offers an intelligent "Rebalance Schedule" action that evenly redistributes remaining milestones across upcoming days.
