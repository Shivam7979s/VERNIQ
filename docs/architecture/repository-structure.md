# VERNIQ Repository Architecture

> **Document Version:** 1.0.0  
> **Status:** Canonical Repository Standard  
> **Monorepo Strategy:** Modular Multi-Service Architecture with npm workspaces  

---

## 1. Directory Tree & Boundaries

```
verniq/
│
├── apps/
│   └── web/                      # Primary Frontend Single Page Application
│       ├── public/               # Static assets, favicon, manifest
│       ├── src/
│       │   ├── assets/           # Bundled SVG icons, illustrations
│       │   ├── components/       # Component primitives & domain UI
│       │   │   ├── ui/           # Atomic design primitives (layout, forms, data, feedback)
│       │   │   └── learning/     # Pedagogical primitives (ProblemCard, RoadmapNode, etc.)
│       │   ├── hooks/            # Custom reusable React hooks (theme, media query, debounce)
│       │   ├── lib/              # Client utilities, Supabase client initialization, helpers
│       │   ├── routes/           # React Router route definitions and layouts
│       │   ├── styles/           # CSS tokens, Tailwind base configurations
│       │   └── types/            # Frontend TypeScript models and interfaces
│       ├── index.html            # Main HTML document entry point
│       ├── package.json          # Web application dependencies & scripts
│       ├── tsconfig.json         # Strict TypeScript configuration
│       ├── vite.config.ts        # Vite build tool configuration
│       └── tailwind.config.js    # Tailwind CSS configuration with design tokens
│
├── services/
│   ├── ai/                       # Standalone Python / FastAPI AI Microservice
│   │   ├── src/                  # RAG pipelines, prompt templates, router endpoints
│   │   ├── Dockerfile            # Container specification for AI microservice
│   │   ├── requirements.txt      # Python dependencies (FastAPI, LangChain, Pydantic)
│   │   └── README.md             # Service documentation and API contracts
│   │
│   └── judge/                    # Isolated Sandboxed Online Code Judge
│       ├── src/                  # Execution queue listener & container orchestrator
│       ├── sandboxes/            # Docker / gVisor isolated execution profiles
│       ├── Dockerfile            # Worker container specification
│       └── README.md             # Execution security guarantees & worker architecture
│
├── supabase/
│   ├── migrations/               # Immutable version-controlled SQL migrations
│   ├── functions/                # Supabase Edge Functions (Deno / TypeScript)
│   ├── seed/                     # Development seed scripts for roadmaps & problems
│   └── config.toml               # Supabase CLI local development configuration
│
├── packages/                     # Shared monorepo packages (configs, types, shared utils)
│
├── docs/                         # Canonical Architectural & Design Specifications
│   ├── architecture/             # System, Information, Repository, and Supabase docs
│   ├── design/                   # Philosophy, Tokens, Typography, UX, A11y, Colors
│   ├── database/                 # Database schema conventions and RLS policies
│   └── development/              # Coding standards, review checklists, and git rules
│
├── docker/                       # Local development orchestration (docker-compose.yml)
│
├── .gitignore                    # Monorepo git ignore rules
├── .env.example                  # Environment variables template (No secrets)
├── package.json                  # Root monorepo workspace configuration
└── README.md                     # Monorepo onboarding and project overview
```

---

## 2. Directory Responsibilities and Isolation Guarantees

### 2.1 `apps/web` (The Presentation Tier)
- **Responsibility:** Contains the browser-delivered user interface. Handles user interaction, state management, and route presentation.
- **Isolation Constraint:** Never import from `services/` or directly connect to private internal networks. Communicates solely via HTTP/WebSocket with Supabase or public API gateways.

### 2.2 `services/ai` (Intelligent Mentorship Microservice)
- **Responsibility:** Houses all AI orchestration logic. Manages vector retrieval, prompt templates for the Socratic mentor, code review analysis, and mock interview conversational states.
- **Isolation Constraint:** Completely decoupled from the frontend build. Exposes a strictly authenticated REST/SSE API protected by Supabase JWT validation.

### 2.3 `services/judge` (Online Judge Execution Sandbox)
- **Responsibility:** Compiles and executes untrusted code submissions within hardened Docker sandboxes using gVisor/seccomp profiles.
- **Isolation Constraint:** Has zero direct access to the main database and zero outbound internet access during evaluation. Receives jobs via a message queue and reports execution metrics back via authenticated webhooks.

### 2.4 `supabase/` (Data & State Management)
- **Responsibility:** Contains all declarative database migrations, Deno Edge Functions, and seed datasets.
- **Isolation Constraint:** Serves as the single source of truth for the database schema. No manual production changes are permitted outside version-controlled migrations.

### 2.5 `docs/` (System Documentation)
- **Responsibility:** Serves as the technical contract for the team. All architectural decisions, design tokens, and coding conventions must be documented here prior to production implementation.
