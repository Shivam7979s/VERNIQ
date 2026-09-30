# VERNIQ

> **Production-grade engineering learning and career platform.**

VERNIQ is designed to bridge the gap between theoretical computer science education, practical software engineering competence, and technical interview readiness. It combines structured curriculum roadmaps, rigorous algorithmic practice, an isolated online code judge, progressive revision schedules, and AI-assisted mentoring within an architecturally sound, high-precision environment.

---

## Product Philosophy

VERNIQ is **not** a copy of existing platforms (such as TakeUForward, LeetCode, or Coursera). It possesses its own distinctive visual identity, proprietary pedagogy, and engineering-first principles:

1. **Information hierarchy before decoration**: Every pixel and byte serves learning comprehension.
2. **Function before visual effects**: No generic SaaS fluff, unnecessary gradients, or gimmick animations.
3. **Engineered reliability**: Clear boundaries between client interface, backend state, untrusted code execution, and AI orchestration.
4. **Data integrity and security**: PostgreSQL Row Level Security (RLS) enforcement, normalized schemas, and zero frontend secret leakage.

---

## Repository Structure

VERNIQ is structured as a modular monorepo:

```
verniq/
├── frontend/                 # Primary React + TypeScript + Vite web application
├── backend/                  # Backend services and data layer
│   ├── ai/                   # FastAPI microservice for LLM orchestration & RAG
│   ├── judge/                # Isolated code execution sandbox and judge gateway
│   └── supabase/             # PostgreSQL migrations, Edge Functions, and seed data
├── packages/                 # Shared TypeScript utilities, types, and configs
├── docs/                     # Comprehensive architectural and design specifications
│   ├── architecture/         # System, Information, Repository, and Supabase docs
│   ├── design/               # Design philosophy, tokens, typography, UX, and a11y
│   ├── database/             # Database conventions and schema governance
│   └── development/          # Coding standards, review criteria, and git workflow
├── docker/                   # Docker compose and container definitions
├── .env.example              # Environment variables template (no secrets)
└── README.md
```

---

## Phase 0 Foundation Deliverables

Phase 0 establishes the engineering and product baseline before implementing feature logic:

- [x] **0.1 Product Architecture**: High-level topology, security boundaries, and scalability plan ([docs/architecture/system-architecture.md](docs/architecture/system-architecture.md)).
- [x] **0.2 Information Architecture**: Route hierarchy across Public, Authenticated, and Admin spaces ([docs/architecture/information-architecture.md](docs/architecture/information-architecture.md)).
- [x] **0.3 Design Philosophy**: 14 non-negotiable principles preventing "vibe coded" aesthetics ([docs/design/design-philosophy.md](docs/design/design-philosophy.md)).
- [x] **0.4 Design Tokens**: Centralized CSS variables for surfaces, text, difficulty, and states ([docs/design/design-tokens.md](docs/design/design-tokens.md)).
- [x] **0.5 Typography**: Precision typographic scale across marketing, dashboard, code, and tables ([docs/design/typography.md](docs/design/typography.md)).
- [x] **0.6 Color System**: WCAG 2.2 AA compliant palette with dark/light mode architecture ([docs/design/color-system.md](docs/design/color-system.md)).
- [x] **0.7 Component System**: Reusable primitives for layout, navigation, feedback, and learning ([docs/design/component-system.md](docs/design/component-system.md)).
- [x] **0.8 Accessibility**: Keyboard navigation, focus states, ARIA, and contrast rules ([docs/design/accessibility.md](docs/design/accessibility.md)).
- [x] **0.9 Responsive Design**: Mobile-first breakpoint behavior and layout rules ([docs/design/responsive-design.md](docs/design/responsive-design.md)).
- [x] **0.10 UX Patterns**: Standardized states (loading, empty, error, confirmation, learning flows) ([docs/design/ux-patterns.md](docs/design/ux-patterns.md)).
- [x] **0.11 Repository Architecture**: Module boundaries and package management ([docs/architecture/repository-structure.md](docs/architecture/repository-structure.md)).
- [x] **0.12 Supabase Architecture**: Auth, PostgreSQL, Storage, Edge Functions, and RLS security model ([docs/architecture/supabase-architecture.md](docs/architecture/supabase-architecture.md)).
- [x] **0.13 Database Conventions**: Schema standards, UUID strategy, foreign keys, and audit fields ([docs/database/database-conventions.md](docs/database/database-conventions.md)).
- [x] **0.14 Coding Conventions**: TypeScript, React, SQL, and Git guidelines ([docs/development/coding-conventions.md](docs/development/coding-conventions.md)).

---

## Quick Start (Development)

### Prerequisites

- Node.js `>= 20.0.0`
- npm `>= 10.0.0`
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/verniq.git
cd verniq

# Install dependencies across all monorepo workspaces
npm install

# Start the web application in development mode
npm run dev
```

Visit `http://localhost:5173` to explore the design foundation, token verification, and component system preview.
