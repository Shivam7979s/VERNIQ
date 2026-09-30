# VERNIQ Coding Conventions & Engineering Standards

> **Document Version:** 1.0.0  
> **Status:** Canonical Engineering Standard  
> **Scope:** Multi-language Monorepo (TypeScript, React, Tailwind, SQL, Python, Git)  

---

## 1. TypeScript Standards

1. **Strict Type Safety:**
   - `"strict": true` is enforced across all `tsconfig.json` configurations.
   - The `any` type is strictly forbidden. Use `unknown` with type narrowing, generics, or discriminated unions.
2. **Explicit Interfaces over Inline Types:**
   - Define exported interfaces or types for all component props, API payloads, and state models.
   - Name component props as `[ComponentName]Props` (e.g. `ProblemCardProps`).
3. **Immutability:**
   - Prefer `readonly` arrays and properties where state should not be mutated in place.

---

## 2. React & Frontend Conventions

1. **Pure Functional Components:**
   - All components are declared using standard arrow or function declarations.
   - Class components are prohibited except for explicit `ErrorBoundary` implementations.
2. **Component Size & Focus:**
   - No component file should exceed 250 lines of code. If a component grows larger, extract sub-primitives or custom hooks.
   - Separate data fetching / state management from presentational rendering.
3. **Custom Hooks:**
   - Encapsulate reusable logic in hooks prefixed with `use` (e.g. `useTheme`, `useDebounce`, `useProblemFilter`).
   - Hooks must maintain pure side-effect boundaries and clean up subscriptions / event listeners.
4. **Composition over Prop Drilling:**
   - Use React composition (`children`, compound sub-components) rather than passing 10+ configuration props.

---

## 3. CSS & Tailwind Architecture

1. **Strict Design Token Usage:**
   - Apply semantic classes (e.g. `bg-surface`, `text-text-primary`, `border-border`, `bg-primary`) rather than arbitrary hex values (`bg-[#123456]`).
   - For custom sizing, adhere to the 4px spacing scale (`p-2`, `p-4`, `p-6`).
2. **Utility Organization:**
   - Order Tailwind classes predictably: Layout & Positioning -> Box Model (margin/padding) -> Typography -> Visuals (background, border) -> Interactive states (`hover:`, `focus-visible:`).
   - Use `clsx` and `tailwind-merge` via a standard `cn()` utility function for conditional class merging.

---

## 4. Supabase & SQL Conventions

1. **Client Initialization:**
   - Single initialized Supabase client instance exported from `@/lib/supabaseClient`.
   - Never instantiate multiple Supabase clients in components.
2. **Querying Standards:**
   - Always specify explicit columns in queries (`.select('id, title, difficulty')`) rather than wildcard `.select('*')`.
   - Always handle error objects returned by Supabase queries and map them to standard UX error states.
3. **Edge Functions (Deno):**
   - Written in TypeScript with explicit input validation using `zod`.
   - Include CORS headers and handle `OPTIONS` preflight requests cleanly.

---

## 5. Python / FastAPI (AI Microservice)

1. **Typing & Validation:**
   - All request and response models must use Pydantic v2 `BaseModel`.
   - Enforce Python 3.11+ type hints (`int | None`, `list[str]`).
2. **Async by Default:**
   - Use `async def` for all I/O bound endpoints, database vector lookups, and streaming LLM token generators.
3. **Code Formatting:**
   - Formatted with `black` and linted with `ruff`.

---

## 6. Testing Philosophy

1. **Unit & Component Testing:**
   - Test user-visible behavior and accessibility roles, not implementation details (using Vitest + React Testing Library).
2. **Database Integration Testing:**
   - Test RLS policies with simulated authenticated roles to guarantee unauthorized reads and writes fail.

---

## 7. Git Workflow & Conventional Commits

All commit messages must strictly conform to the **Conventional Commits 1.0.0** specification:

```
<type>(<optional scope>): <short description in present tense>

[optional body explaining rationale]

[optional footer(s)]
```

### 7.1 Allowed Types
- `feat`: A new user-facing feature or capability.
- `fix`: A bug fix.
- `docs`: Documentation updates only.
- `style`: Formatting, missing semicolons, no code changes.
- `refactor`: Code restructuring without changing functional behavior.
- `test`: Adding or correcting tests.
- `chore`: Build tasks, package updates, configuration adjustments.

### 7.2 Pull Request Standards
- Every phase must be independently reviewable.
- Never open massive monolithic pull requests. Keep diffs focused on single architectural domains.
- PRs must pass type checking, linting, and automated builds before merging.
