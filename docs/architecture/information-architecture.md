# VERNIQ Information Architecture

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline Specification  
> **Scope:** Complete Route Hierarchy, Access Policies, and Navigational Topology  

---

## 1. Navigational Philosophy

VERNIQ structures knowledge and workflows with clear separation across three operational zones:
1. **Public Zone:** Frictionless discovery, curriculum previews, platform transparency, and conversion without dark patterns.
2. **Authenticated Zone:** Distraction-free, goal-oriented engineering workspace engineered for sustained focus, practice, and measurable skill progression.
3. **Admin Zone:** High-density, audit-logged operations management console for curriculum curation, problem authoring, moderation, and infrastructure observability.

---

## 2. Global Route Architecture Matrix

### 2.1 Public Zone (Unauthenticated / Guest Accessible)

| Route Path | View / Layout | Access Level | Purpose & Core Content |
|---|---|---|---|
| `/` | `PublicLayout` | Public | Platform introduction, value proposition, pedagogy overview, and product previews. |
| `/features` | `PublicLayout` | Public | Deep dive into technical features (Isolated Judge, Socratic AI Mentor, Active Revision). |
| `/roadmaps` | `PublicLayout` | Public | Directory of published engineering roadmaps (Backend, Frontend, Distributed Systems, DSA). |
| `/roadmaps/:roadmapSlug` | `PublicLayout` | Public | Interactive roadmap view with public topic previews and milestone requirements. |
| `/problems` | `PublicLayout` | Public | Browseable algorithmic problem directory with difficulty filters, tags, and acceptance rates. |
| `/problems/:problemSlug` | `WorkspaceLayout` | Public (Read-Only) | Problem statement, sample test cases, and login prompt to run/submit solutions. |
| `/courses` | `PublicLayout` | Public | Catalog of structured masterclasses and system engineering curricula. |
| `/companies` | `PublicLayout` | Public | Company-specific hiring tracks and question tag directory. |
| `/pricing` | `PublicLayout` | Public | Transparent tier comparison, student discounts, and institutional licensing. |
| `/about` | `PublicLayout` | Public | Mission, engineering pedagogy, team, and open technical standards. |
| `/login` | `AuthLayout` | Guest Only | Email/password, Magic Link, and OAuth (GitHub/Google) authentication. |
| `/signup` | `AuthLayout` | Guest Only | New student onboarding and account creation. |
| `/forgot-password` | `AuthLayout` | Guest Only | Password reset request and recovery flow. |
| `/auth/callback` | `AuthLayout` | Public | Supabase OAuth & Magic Link callback exchange handler. |

---

### 2.2 Authenticated Student Zone (`/app`)

All authenticated routes require a verified Supabase session and are governed by `DashboardLayout` or `WorkspaceLayout`.

| Route Path | Primary Layout | Functional Responsibility |
|---|---|---|
| `/app/dashboard` | `DashboardLayout` | Central mission control: Daily learning objective, active streak, continue-learning shortcuts, and revision queue. |
| `/app/learn` | `DashboardLayout` | Active curriculum roadmaps and enrolled masterclasses. |
| `/app/learn/:courseSlug/:lessonId` | `LessonLayout` | Deep-focus lesson reader, video player, markdown content, and quiz/code exercises. |
| `/app/practice` | `DashboardLayout` | DSA practice hub with categorized problem lists, progress badges, and bookmarking. |
| `/app/practice/:problemSlug` | `WorkspaceLayout` | Dual-pane split-screen: Problem specification, Monaco code editor, test-case runner, submission panel, and AI Mentor drawer. |
| `/app/plan` | `DashboardLayout` | Dynamic learning scheduler, target company milestones, and daily study capacity. |
| `/app/progress` | `DashboardLayout` | Detailed skill radar, category breakdown, submission velocity, and topic mastery metrics. |
| `/app/revision` | `DashboardLayout` | Spaced-repetition engine: questions due for review based on forgetting-curve intervals (1, 3, 7, 21 days). |
| `/app/contests` | `DashboardLayout` | Weekly engineering challenges, virtual contests, live timers, and global rating leaderboards. |
| `/app/contests/:contestId` | `ContestLayout` | Active contest interface with live submissions, countdown timers, and problem switching. |
| `/app/interviews` | `DashboardLayout` | Company-specific mock interview simulations, timer-based assessments, and rubrics. |
| `/app/projects` | `DashboardLayout` | Real-world portfolio projects (e.g., custom HTTP server, distributed cache, Raft consensus) with automated grading. |
| `/app/community` | `DashboardLayout` | Engineering discussion forums, solution walkthrough critiques, and study circles. |
| `/app/ai-mentor` | `DashboardLayout` | Persistent Socratic AI dialogue interface for conceptual explanations and interview prep. |
| `/app/profile` | `DashboardLayout` | Public portfolio view, verified skill badges, submission history, and GitHub-style contribution graph. |
| `/app/settings` | `DashboardLayout` | Account settings, appearance (light/dark mode), notification preferences, code editor preferences (keybindings, font size), and subscriptions. |

---

### 2.3 Administration & CMS Zone (`/admin`)

Requires `role = 'admin'` verified via Supabase custom claims and server-side RLS enforcement.

| Route Path | Functional Responsibility |
|---|---|
| `/admin` | Operational overview: Active users, execution queue throughput, judge latency, system alerts. |
| `/admin/users` | User management: Search, role assignment, verification status, and audit logs. |
| `/admin/problems` | Problem authoring: Markdown problem statement editor, hidden test case manager, memory/time limits, and reference solutions. |
| `/admin/roadmaps` | Visual DAG (Directed Acyclic Graph) editor for curriculum dependencies and prerequisite chains. |
| `/admin/courses` | Course and module authoring, video hosting associations, and resource asset uploads. |
| `/admin/resources` | Centralized technical asset manager (diagrams, cheatsheets, downloadable templates). |
| `/admin/companies` | Company profiles, hiring timeline metadata, and associated question mappings. |
| `/admin/contests` | Contest scheduler, rating recalculation triggers, and problem pool allocation. |
| `/admin/community` | Moderation queue: Flagged posts, spam detection, solution plagiarism reports, and ban enforcement. |
| `/admin/analytics` | Macro-level retention curves, problem drop-off rates, and platform engagement metrics. |
| `/admin/cms` | Marketing page copy management, changelog editor, and announcement banner broadcasts. |
| `/admin/system` | Platform configuration: Feature flag toggles, judge worker status, AI model routing, and rate limits. |

---

## 3. Navigational Hierarchies

### 3.1 Primary Navigation (Public)
```
[VERNIQ Logo]  Roadmaps  Problems  Courses  Companies  Pricing  About  |  [Sign In]  [Get Started]
```

### 3.2 Authenticated Workspace Sidebar
```
[VERNIQ Logo]
── CORE WORKSPACE ──
• Dashboard
• Learn (Roadmaps & Courses)
• Practice (Problems)
• Revision (Spaced Repetition Due)
• Study Plan

── PREPARATION ──
• Contests
• Mock Interviews
• Projects
• AI Mentor

── COMMUNITY & STATS ──
• Community
• Progress & Analytics

── FOOTER ──
• Profile
• Settings
• Theme Toggle (Dark / Light)
```

---

## 4. Route Protection and Access Guard Rules

1. **Guest Guards:** Routes like `/login` and `/signup` automatically redirect authenticated users to `/app/dashboard`.
2. **Auth Guards:** All `/app/*` routes automatically redirect unauthenticated guests to `/login?returnTo={current_path}`.
3. **Admin Guards:** All `/admin/*` routes strictly evaluate `auth.jwt() -> app_metadata -> role == 'admin'`. Unauthorized users receive an immediate HTTP 404/403 and are logged in security audit logs.
4. **Offline Resilience:** Critical static documentation and previously loaded problem statements support offline caching via Service Worker strategies.
