---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-27'
inputDocuments:
  - "_bmad-output/project-context.md"
  - "_bmad-output/planning-artifacts/product-brief-minuteXminute2-2026-02-24.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/prd-validation-report.md"
workflowType: 'architecture'
project_name: 'minuteXminute2'
user_name: 'Derek'
date: '2026-02-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
53 FRs across 9 categories: Identity & Access (FR1–FR10), Team Management (FR11–FR16), Drill Library (FR17–FR22), Canvas & Whiteboard (FR23–FR27), Practice Planning (FR28–FR35), Player Experience (FR36–FR39), plus Phase 2 FRs for Engagement, Social Hub, Scheduling, Offline, and Compliance. Multi-role access model (head coach, player; assistant coach in Phase 1.5) with RBAC enforced strictly server-side touches every data-modifying endpoint.

**Non-Functional Requirements:**
22 NFRs across Performance, Security, Scalability, Accessibility, Integration. Driving constraints: canvas ≤16ms frame time on mid-range Android (NFR1), Lighthouse ≥85 with canvas lazy-loaded (NFR5–6), server-side RBAC (NFR12), additive-only schema changes for Phase 2 (NFR15), PWA service worker installed but dormant — must not conflict with Phase 2 activation (NFR22).

**Scale & Complexity:**
- Primary domain: Full-stack PWA, canvas-heavy feature
- Complexity level: Medium — no regulated data at scale, 5–25 concurrent users for MVP, no horizontal scaling required
- Brownfield context: auth scaffolding, backend, and DB schema already exist; this architecture builds the feature layer on top of the existing foundation

### Technical Constraints & Dependencies

- Next.js 16 App Router (local dev) + .NET 9 ASP.NET Core (Docker) + PostgreSQL 17
- Supabase Auth only — JWT issued by Supabase, validated by .NET on every protected request; no session state in Next.js
- react-konva for canvas — serializes to JSON natively; canvas performance is the highest-risk technical component
- Tailwind CSS 4.x (CSS-based config), shadcn/ui (new-york style), Zustand 5 + React Query 5, React Hook Form 7

### Secrets & Key Management (Architectural Constraint)

- JWT secret: environment variable only — never in `appsettings.json` or any committed file
- Supabase service role key: server-side only — never in client-side code or `NEXT_PUBLIC_*` variables
- Supabase anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): intentionally public by design; Supabase RLS policies are the enforcement layer and must be configured correctly
- Database connection string: environment variable only
- All third-party API keys: environment variables only, never committed
- `.env.local` must be in `.gitignore` — verified before first commit
- `appsettings.json` used for non-sensitive config only

### Cross-Cutting Concerns Identified

- **Auth/RBAC:** Spans every endpoint. Controller-level role gate `[Authorize(Roles)]` + service-layer team ownership validation `ValidateTeamAccess(userId, teamId)` via base service method — not ad-hoc per endpoint. Player-role filtering at query layer, not presentation layer (pre-mortem: hidden drill leakage risk).
- **Team data ownership:** All drills, plans, and roster data scoped to a team. Every data access pattern must verify team membership before returning data.
- **drill_slides schema:** JSON blob in JSONB column. `schema_version` field mandatory in every payload from day 1. Renderer must check version before parsing. Enables animation keyframe additions (v2+) and format pivots without destructive DB migrations.
- **Canvas performance isolation:** react-konva must be dynamically imported (`next/dynamic`). Player-facing paths must never load Konva. Hard code-split boundary between canvas editor and all read-only views.
- **Practice planner time state:** Derived client-side from React Query cache. Drill duration mutations must explicitly invalidate all practice plan queries for that team — not optional.
- **Invite token lifecycle:** Invite tokens require `expires_at` and revocation mechanism from day 1. Applies to both player and assistant coach invites.
- **React Query cache invalidation:** Treat invalidation rules as architectural constraints, not implementation details. Document which mutations invalidate which queries during design.

### Architecture Decision Records (Pre-decided)

| ADR | Decision | Key Constraint |
|---|---|---|
| API routing | Direct frontend→.NET | BFF trigger: >2 aggregation endpoints |
| Canvas state | Local state + debounced autosave ≤2s | Save indicator required in UI |
| RBAC enforcement | Controller role gate + service ownership gate | `ValidateTeamAccess` base method required |
| `drill_slides` storage | JSON blob (JSONB) | `schema_version` field mandatory from day 1 |
| Practice time state | Client-derived from React Query cache | Drill mutations must invalidate plan queries |

### Pre-mortem Risk Constraints

| Risk | Architectural Constraint |
|---|---|
| Canvas bundle size | Dynamic import mandatory; player paths never load Konva |
| `drill_slides` schema lock-in | `schema_version` in JSON payload from day 1 |
| RBAC leakage | Player-role filtering at query layer, not presentation |
| JWT secret fragility | Env-variable-driven; auth failure rate monitored |
| Time state desync | Single source of truth; RQ invalidation cascades |
| Invite token permanence | `expires_at` + revocation on invite records |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack PWA: Next.js 16 (App Router) frontend + .NET 9 ASP.NET Core backend.

### Starter Assessment

Not applicable. minuteXminute2 is a brownfield project — the repository, stack, and foundation are already initialized. All technology decisions are pre-established in the project context file. No new project initialization is required.

### Established Foundation

- **Frontend:** Next.js 16 App Router, TypeScript strict mode, Tailwind CSS 4.x, shadcn/ui (new-york style)
- **State:** Zustand 5 (global) + React Query 5 (server state)
- **Forms:** React Hook Form 7
- **Canvas:** react-konva 19 / Konva 10
- **Auth:** Supabase (`@supabase/ssr` 0.8 for server, `@supabase/supabase-js` 2.91 for client)
- **PWA:** Serwist 9.5 installed, service worker not yet configured
- **Backend:** .NET 9 ASP.NET Core Web API, EF Core 9, Npgsql 9
- **Database:** PostgreSQL 17 (Docker: postgres:17-alpine)
- **Infrastructure:** Docker + Docker Compose

All implementation work builds on this existing foundation. No new dependencies should be introduced without explicit architectural review.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data validation: both layers (React Hook Form + .NET data annotations)
- RBAC: controller role gate + service layer ownership gate
- `drill_slides` `schema_version` field: mandatory from day 1
- Canvas code-split boundary: dynamic import, player paths never load Konva

**Important Decisions (Shape Architecture):**
- Drill deletion: soft delete with 7-day auto-purge
- API error format: ASP.NET Problem Details (RFC 7807)
- Frontend structure: hybrid feature-based
- Testing: Vitest
- Deployment: Railway

**Deferred Decisions (Post-MVP):**
- E2E testing framework (Playwright vs Cypress) — Phase 2
- BFF layer — trigger: >2 aggregation endpoints
- Serwist service worker activation — Phase 2
- CI/CD pipeline — post-pilot

### Data Architecture

- **ORM:** EF Core 9 with Npgsql 9; migrations run via Docker (`docker exec -it sports-backend dotnet ef ...`)
- **Soft delete:** `deleted_at` timestamp on drills (and any future deletable entities). EF Core global query filter `HasQueryFilter(d => d.DeletedAt == null)` applied at model configuration — enforced automatically, not per-query.
- **Auto-purge:** .NET `BackgroundService` runs on a schedule and hard deletes records where `deleted_at < now() - 7 days`. No external scheduler dependency.
- **drill_slides storage:** JSONB column with mandatory `schema_version` field in every payload from day 1.
- **Validation:** React Hook Form for UX-layer validation; .NET data annotations on DTOs for server-side enforcement. Frontend validation is convenience; backend validation is law.
- **Caching:** No server-side caching for MVP (5–25 users); React Query handles client-side caching.

### Authentication & Security

- **Auth provider:** Supabase (JWT issuance, OAuth, email verification). .NET validates JWT on every protected request using JWT secret from environment variables only — never from `appsettings.json`.
- **RBAC:** `[Authorize(Roles)]` at controller (role gate) + `ValidateTeamAccess(userId, teamId)` base service method (team ownership gate). Both layers required on every data-modifying endpoint.
- **Player-role filtering:** Applied at query layer (EF Core), not presentation layer. Hidden drills (FR34) never returned in player-scoped API responses.
- **Secrets:** All secrets (JWT secret, DB connection string, Supabase service role key) in environment variables only. `.env.local` in `.gitignore` — verified before first commit. Supabase anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is intentionally public; Supabase RLS is the enforcement layer.

### API & Communication Patterns

- **Style:** RESTful, Controller pattern (`/api/[controller]`)
- **Error format:** ASP.NET Problem Details (RFC 7807) via `AddProblemDetails()` — standardized, zero extra code.
- **Routing:** Next.js rewrites proxy `/api/*` to .NET. Local dev → `localhost:8080`; Docker → `backend:8080`. Environment-variable-driven, no code changes between environments.
- **Versioning:** None for MVP. Add `/api/v2/` prefix if breaking changes required post-pilot.
- **Rate limiting:** Not required for MVP (5–25 users).

### Frontend Architecture

- **Component organization (hybrid):**
  - `src/features/[feature]/` — feature-specific components, hooks, and types colocated (e.g., `features/drill-library/`, `features/practice-planner/`, `features/whiteboard/`)
  - `src/components/ui/` — shadcn/ui components (copy-paste, never manually created)
  - `src/components/shared/` — cross-feature shared components
  - `src/hooks/` — shared hooks
  - `src/stores/` — Zustand stores (global state only)
  - `src/lib/` — utilities, API client, Supabase clients
- **Canvas isolation:** react-konva dynamically imported via `next/dynamic`. Player-facing routes never load Konva. Hard code-split boundary enforced.
- **Canvas state:** Local component state + debounced autosave mutation (≤2s debounce). Save state indicator required in UI ("Saving..." / "Saved").
- **Server vs client components:** Server components by default; `'use client'` only for interactivity (canvas, forms, Zustand, Supabase client-side calls).
- **Practice time state:** Derived client-side from React Query cache. Drill duration mutations must invalidate practice plan queries for that team.

### Infrastructure & Deployment

- **Development:** Frontend local (`npm run dev`, port 3000); backend + PostgreSQL in Docker (`docker-compose up postgres backend`, ports 8080/5432).
- **Pre-PR testing:** Full stack in Docker (`docker-compose up --build`; frontend port 4200).
- **Target deployment:** Railway (Docker-native, lowest friction for pilot scale). Pricing: $5 one-time trial credit (30 days); Hobby plan thereafter, realistic 3-service cost $8–18/month depending on RAM allocation. No persistent free tier.
- **Swap cost:** 2/10 — fully containerized; reconfigure environment variables, migrate DB via `pg_dump`/restore, update DNS and CORS origins. Zero code changes required.
- **Testing framework:** Vitest (unit + component tests). API identical to Jest; patterns transfer directly. E2E framework deferred to Phase 2.
- **Monitoring/logging:** Not configured for MVP. Supabase dashboard handles auth issues; direct DB access handles data issues (per PRD Journey 4).
- **CI/CD:** Not configured for MVP. Add GitHub Actions post-pilot.

### Decision Impact Analysis

**Implementation Sequence (order matters):**
1. End-to-end auth validation (Supabase → .NET JWT) — validate before anything else is built
2. EF Core global query filter for soft delete — establish before any entity is used in a query
3. `ValidateTeamAccess` base service method — establish before any protected endpoint is built
4. Canvas dynamic import boundary — establish before react-konva is used anywhere
5. React Query invalidation rules — document per-mutation before practice planner is built

**Cross-Component Dependencies:**
- Soft delete filter affects every EF Core query on drills — must be in model config, not queries
- Canvas code-split boundary affects routing structure — player routes and coach routes must be architected separately
- React Query cache invalidation rules cascade: drill edits → practice plan cache → time state display

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (PostgreSQL):**
- Tables: `snake_case` plural (`drills`, `drill_slides`, `practice_plans`, `team_members`)
- Columns: `snake_case` (`team_id`, `deleted_at`, `created_at`)
- Foreign keys: `{referenced_table_singular}_id` (`team_id`, `drill_id`)
- Indexes: `idx_{table}_{column}` (`idx_drills_team_id`)
- Boolean columns: `is_` or `has_` prefix (`is_public`, `has_canvas`)

**API Endpoints (.NET):**
- Resources: plural kebab-case (`/api/drills`, `/api/practice-plans`, `/api/team-members`)
- Route params: `{id}` format (`/api/drills/{id}`)
- Query params: camelCase (`?teamId=...`, `?includeDeleted=false`)
- Never expose DB column names directly in route structure

**JSON (API responses):**
- Field names: camelCase (`drillId`, `teamId`, `deletedAt`, `createdAt`)
- Dates: ISO 8601 strings (`"2026-02-27T14:30:00Z"`) — never Unix timestamps
- Booleans: `true`/`false` — never `1`/`0`
- Nulls: explicit `null` — never omit nullable fields from response

**.NET Code:**
- Classes, methods, properties: PascalCase (`DrillService`, `GetDrillById`, `TeamId`)
- Local variables, parameters: camelCase (`drillId`, `teamId`)
- Private fields: `_camelCase` (`_context`, `_logger`)
- Interfaces: `I` prefix (`IDrillService`, `ITeamRepository`)
- DTOs: `{Entity}Dto`, `Create{Entity}Request`, `Update{Entity}Request`

**TypeScript/React:**
- Components: PascalCase (`DrillCard`, `PracticeTimerBar`)
- Files: kebab-case (`drill-card.tsx`, `practice-timer-bar.tsx`)
- Hooks: `use` prefix camelCase (`useDrills`, `usePracticePlan`)
- Stores: `use{Concern}Store` (`useUIStore`, `useTeamStore`)
- Types/interfaces: PascalCase (`DrillDto`, `PracticePlanDto`)
- Constants: `SCREAMING_SNAKE_CASE` (`MAX_SLIDES`, `AUTOSAVE_DELAY_MS`)

### Structure Patterns

**Frontend (`src/`):**
- `src/app/` — Next.js App Router pages and layouts
  - `(auth)/` — Auth route group (login, signup)
  - `(app)/` — Protected app route group
- `src/features/[feature]/` — Feature-specific code colocated
  - `components/` — Feature components
  - `hooks/` — Feature-specific hooks
  - `types.ts` — Feature-specific types
  - `index.ts` — Public exports only
- `src/components/ui/` — shadcn/ui components (never manually created)
- `src/components/shared/` — Cross-feature shared components
- `src/hooks/` — Shared hooks
- `src/stores/` — Zustand stores (one per concern)
- `src/lib/api.ts` — `apiFetch` wrapper — all API calls go here
- `src/lib/supabase/client.ts` — Browser client (`'use client'`)
- `src/lib/supabase/server.ts` — Server client (server components)
- `src/types/` — Shared global types

**Test file location:** Co-located with source files
- `features/drill-library/components/DrillCard.tsx`
- `features/drill-library/components/DrillCard.test.tsx`

**Backend (`backend/`):**
- `Controllers/` — API endpoints only; no business logic
- `Services/` — Business logic; implements `IService` interfaces
- `Data/AppDbContext.cs` — EF Core context + global query filters
- `Data/Migrations/` — EF Core migrations
- `Models/` — EF Core entities
- `DTOs/` — Request/response shapes
- `Middleware/` — Custom middleware
- `BackgroundServices/` — `IHostedService` implementations (e.g., purge job)

### Format Patterns

**API Responses:**
- Success: direct response — no wrapper envelope for MVP
  - `GET /api/drills` → `[{...}, {...}]`
  - `GET /api/drills/{id}` → `{...}`
  - `POST /api/drills` → `{...}` (201 Created)
  - `DELETE /api/drills/{id}` → 204 No Content
- Errors: ASP.NET Problem Details (RFC 7807) `{ type, title, status, detail }`
- Pagination envelope deferred to Phase 2 via API versioning

**drill_slides JSON payload (mandatory structure):**
```json
{
  "schema_version": 1,
  "slides": [
    { "id": "slide-uuid", "order": 0, "nodes": [] }
  ]
}
```
`schema_version` required on every write. Renderer checks version before parsing.

### Communication Patterns

**API Client:**
- All frontend API calls use `apiFetch<T>(url, options?)` from `src/lib/api.ts`
- Handles: Authorization header, base URL, error parsing, Problem Details throwing
- Never call `fetch('/api/...')` directly in components or hooks
- Never put auth token logic in individual `queryFn` implementations

**React Query conventions:**
- Query keys: `['resource', id?, filters?]` — e.g., `['drills', teamId]`, `['drill', drillId]`
- Mutations invalidate explicitly in `onSuccess` — never assumed
- Drill duration mutations MUST also invalidate `['practice-plan', ...]`

**Zustand stores:**
- Only for client-only global state React Query cannot handle
- `useUIStore` — UI state (sidebar, modals)
- `useTeamStore` — active team context
- Store shape: flat where possible; avoid nested objects

### Process Patterns

**Error Handling:**
- API errors: `apiFetch` parses Problem Details and throws typed `ApiError`
- React Error Boundary at route/feature level — not individual component level
- User-facing messages: derived from Problem Details `detail` field
- No `console.log` in committed code

**Loading States:**
- React Query `isPending` for data fetching — not custom `isLoading` booleans
- Skeleton components for initial page load; spinner for mutations
- Canvas autosave: "Saving..." while debounce pending → "Saved" on success → "Failed to save" with retry on error

**Authentication Flow:**
- Supabase client handles token refresh automatically
- `apiFetch` reads current session via `supabase.auth.getSession()` on every call
- Protected routes: middleware checks session server-side, redirects to `/login`
- .NET receives `Authorization: Bearer {jwt}` on every protected request

### Enforcement Guidelines

**All agents MUST:**
- Use `apiFetch` for all frontend API calls — never raw `fetch`
- Use `HasQueryFilter` on EF Core entities with soft delete — never add `deleted_at IS NULL` to individual queries
- Call `ValidateTeamAccess(userId, teamId)` in service methods before returning or modifying team-scoped data
- Include `schema_version` in every `drill_slides` write operation
- Use `next/dynamic` for any component that imports react-konva
- Co-locate test files with source files (`Component.test.tsx`)
- Use `@/` path alias — never relative paths like `../../`
- Never use `any` type — use `unknown` with type narrowing

**Anti-patterns (never do these):**
- `fetch('/api/...')` directly in a component or hook
- Role/permission checks only in the frontend
- `drill_slides` payload without `schema_version`
- `import { Stage } from 'react-konva'` in a player-facing route
- `console.log` in committed code
- `deleted_at IS NULL` in a query (use EF Core global filter instead)
- Secrets or API keys in any committed file

## Project Structure & Boundaries

### Complete Project Directory Structure

**Root:**
```
minuteXminute2/
├── docker-compose.yml
├── .env.example                    # Template — never commit .env files
├── CLAUDE.md
├── README.md
├── backend/
└── frontend/
```

**Backend (`backend/`):**
```
backend/
├── Backend.csproj
├── Dockerfile
├── Program.cs                      # DI, middleware, CORS, JWT config
├── appsettings.json                # Non-sensitive config only
├── Controllers/
│   ├── HealthController.cs         # EXISTS
│   ├── AuthController.cs           # FR1–FR6: signup/signin validation
│   ├── TeamsController.cs          # FR11–FR16: team + roster management
│   ├── DrillsController.cs         # FR17–FR27: drills + canvas slides
│   ├── PracticePlansController.cs  # FR28–FR35: practice plan CRUD
│   └── InvitesController.cs        # FR13–FR14: invite link gen + redemption
├── Services/
│   ├── BaseService.cs              # ValidateTeamAccess(userId, teamId)
│   ├── DrillService.cs / IDrillService.cs
│   ├── TeamService.cs / ITeamService.cs
│   ├── PracticePlanService.cs / IPracticePlanService.cs
│   └── InviteService.cs / IInviteService.cs
├── BackgroundServices/
│   └── DrillPurgeService.cs        # Hard deletes records where deleted_at < now()-7d
├── Models/
│   ├── Team.cs
│   ├── TeamMember.cs               # Polymorphic: coach or player role
│   ├── Drill.cs                    # Includes deleted_at for soft delete
│   ├── DrillSlide.cs               # JSONB canvas_data + schema_version
│   ├── PracticePlan.cs
│   ├── PracticePlanDrill.cs        # Junction: plan ↔ drill + order + duration + is_hidden
│   └── Invite.cs                   # token, expires_at, revoked_at, team_id, role
├── DTOs/
│   ├── Drills/
│   │   ├── DrillDto.cs
│   │   ├── CreateDrillRequest.cs
│   │   └── UpdateDrillRequest.cs
│   ├── PracticePlans/
│   ├── Teams/
│   └── Invites/
├── Data/
│   ├── AppDbContext.cs             # Global query filters (soft delete)
│   └── Migrations/
└── Middleware/
    └── (placeholder for future custom middleware)
```

**Frontend (`frontend/src/`):**
```
frontend/
├── components.json                 # shadcn/ui config
├── next.config.ts                  # API rewrites
├── middleware.ts                   # Auth protection; matchers: ['/coach/:path*', '/player/:path*']
├── vitest.config.ts
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx              # Root layout + providers
    │   ├── providers.tsx           # React Query + client providers
    │   ├── page.tsx                # Landing page (public, SEO); must implement generateMetadata() for Open Graph + structured data (FR50)
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx     # Includes age gate (FR5)
    │   ├── (coach)/                # Coach route group
    │   │   ├── layout.tsx          # Bottom nav, auth guard; export metadata = { robots: { index: false } }
    │   │   ├── dashboard/page.tsx
    │   │   ├── drills/
    │   │   │   ├── page.tsx        # Drill library (FR20–FR21)
    │   │   │   ├── new/page.tsx    # Create drill (FR17)
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx    # Drill detail + edit (FR18)
    │   │   │       └── canvas/page.tsx  # Whiteboard editor (FR23–FR26)
    │   │   ├── practice-plans/
    │   │   │   ├── page.tsx        # Plans list
    │   │   │   ├── new/page.tsx    # Create plan (FR28–FR30)
    │   │   │   └── [id]/page.tsx   # Edit plan (FR31–FR34)
    │   │   └── team/
    │   │       ├── page.tsx        # Roster management (FR15–FR16)
    │   │       └── invite/page.tsx # Manage invite links (FR13)
    │   ├── (player)/               # Player route group
    │   │   ├── layout.tsx          # Simplified top nav, auth guard; export metadata = { robots: { index: false } }
    │   │   ├── plan/page.tsx       # Active practice plan read-only (FR36)
    │   │   ├── drills/
    │   │   │   ├── page.tsx        # Drill library read-only (FR37)
    │   │   │   └── [id]/page.tsx   # Drill detail + canvas read-only (FR38)
    │   │   └── home/page.tsx       # Player home / dashboard
    │   └── join/
    │       └── [token]/page.tsx    # Invite link redemption (FR14) — public route
    ├── features/
    │   ├── auth/
    │   │   ├── components/
    │   │   │   ├── login-form.tsx
    │   │   │   ├── signup-form.tsx
    │   │   │   └── age-gate-checkbox.tsx
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts
    │   │   └── types.ts
    │   ├── drill-library/
    │   │   ├── components/
    │   │   │   ├── drill-card.tsx
    │   │   │   ├── drill-card.test.tsx
    │   │   │   ├── drill-form.tsx          # Coach only
    │   │   │   ├── drill-filters.tsx
    │   │   │   └── drill-list.tsx
    │   │   ├── hooks/
    │   │   │   ├── useDrills.ts
    │   │   │   ├── useCreateDrill.ts
    │   │   │   ├── useUpdateDrill.ts
    │   │   │   └── useDeleteDrill.ts       # Soft delete mutation
    │   │   └── types.ts
    │   ├── whiteboard/
    │   │   ├── components/
    │   │   │   ├── canvas-editor.tsx       # Dynamic import wrapper (coach only)
    │   │   │   ├── canvas-editor.test.tsx
    │   │   │   ├── canvas-viewer.tsx       # Read-only (player) — no Konva import
    │   │   │   ├── slide-manager.tsx
    │   │   │   └── save-indicator.tsx      # "Saving..." / "Saved" / "Failed to save"
    │   │   ├── hooks/
    │   │   │   ├── useCanvasAutosave.ts    # Debounced save mutation (≤2s)
    │   │   │   └── useSlides.ts
    │   │   └── types.ts                    # DrillSlidesPayload with schema_version
    │   ├── practice-planner/
    │   │   ├── components/
    │   │   │   ├── plan-composer.tsx       # Coach: build plan from library
    │   │   │   ├── plan-composer.test.tsx
    │   │   │   ├── plan-drill-item.tsx     # Drill row: time + hide toggle
    │   │   │   ├── time-tracker.tsx        # "Available time left" display
    │   │   │   └── plan-viewer.tsx         # Player: read-only plan view
    │   │   ├── hooks/
    │   │   │   ├── usePracticePlans.ts
    │   │   │   ├── useCreatePlan.ts
    │   │   │   └── useAvailableTime.ts     # Derived from RQ cache
    │   │   └── types.ts
    │   └── team-management/
    │       ├── components/
    │       │   ├── roster-list.tsx
    │       │   ├── invite-link-manager.tsx
    │       │   └── member-row.tsx
    │       ├── hooks/
    │       │   ├── useTeam.ts
    │       │   └── useInvite.ts
    │       └── types.ts
    ├── components/
    │   ├── ui/                     # shadcn/ui only — never manually created
    │   └── shared/
    │       ├── page-header.tsx
    │       ├── empty-state.tsx
    │       ├── error-boundary.tsx
    │       └── loading-skeleton.tsx
    ├── hooks/
    │   └── useTeamContext.ts
    ├── stores/
    │   ├── useTeamStore.ts         # Active team ID + team data
    │   └── useUIStore.ts           # Sidebar, modal state
    ├── lib/
    │   ├── api.ts                  # apiFetch<T> — all API calls go here
    │   ├── supabase/
    │   │   ├── client.ts           # Browser Supabase client
    │   │   └── server.ts           # Server Supabase client
    │   └── utils.ts
    └── types/
        └── index.ts                # Shared global types
```

### Architectural Boundaries

**API Boundaries:**
- `/api/*` — all requests proxied by Next.js rewrites to .NET backend
- .NET validates JWT on every protected request — no unauthenticated data access
- Supabase handles auth only — no data queries go to Supabase
- Public routes: `/` (landing), `/join/[token]` (invite redemption), `/(auth)/*`

**Component Boundaries:**
- `canvas-editor.tsx` — only file that imports react-konva (via `next/dynamic`)
- `canvas-viewer.tsx` — player-facing canvas display; never imports Konva
- `(coach)/` and `(player)/` route groups have separate layouts and nav
- `apiFetch` is the only entry point for all backend communication

**Data Boundaries:**
- EF Core global query filter on `Drill`: `deleted_at IS NULL` — automatic on all queries
- `ValidateTeamAccess(userId, teamId)` in every service method before data access
- `is_hidden` filtering is role-conditional — **cannot use EF Core global `HasQueryFilter()`**.
  Two distinct service methods required:
  - `GetPlanForCoach(planId, userId)` → returns all drills including hidden
  - `GetPlanForPlayer(planId, userId)` → filters `WHERE is_hidden = false`
  Controller routes to the correct method based on the role claim.
  Never apply `is_hidden` as a global filter — it would break coach visibility.

### Data Flow

```
User action
  → React component (feature)
  → React Query hook
  → apiFetch (src/lib/api.ts) — attaches JWT from Supabase session
  → Next.js rewrite (/api/*)
  → .NET Controller — [Authorize(Roles)] check
  → Service — ValidateTeamAccess check
  → EF Core — global soft-delete filter applied automatically
  → PostgreSQL
  → Response serialized as camelCase JSON
  → React Query cache updated → component re-renders
```

### External Integrations

- **Supabase Auth:** `@supabase/ssr` (server components) + `@supabase/supabase-js` (client components) for session management only. JWT validated cryptographically by .NET — no Supabase API call per request.
- **Railway:** Docker containers deployed directly. Environment variables in Railway dashboard. No code coupling to Railway APIs.

### Development Workflow

- `docker-compose up postgres backend` — backend + DB (ports 8080/5432)
- `npm run dev` (frontend/) — Next.js local dev on port 3000
- `docker-compose up --build` — full stack pre-PR test (frontend port 4200)
- `docker exec -it sports-backend dotnet ef migrations add Name` — run migrations

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology versions compatible and non-conflicting. react-konva isolation via `next/dynamic` resolves the only potential SSR conflict. BackgroundService uses .NET built-ins only.

**Pattern Consistency:** Naming conventions consistent across all layers. DB snake_case → ASP.NET camelCase serialization → TypeScript camelCase. No gaps or contradictions between layers.

**Structure Alignment:** Route groups `(coach)/` and `(player)/` correctly enforce separate layouts and nav. Canvas code-split boundary properly isolated in `features/whiteboard/`. All boundaries respected.

### Requirements Coverage Validation ✅

**Functional Requirements:** All 53 FRs architecturally supported. Phase 1.5 (FR7–FR10, FR22, FR35) and Phase 2 (FR40–FR49) intentionally deferred; data model and RBAC foundation support additive implementation.

**Non-Functional Requirements:** All 22 NFRs addressed.
- Performance: canvas `next/dynamic`, server components default, RQ caching
- Security: dual RBAC layers, secrets in env vars, player filtering at query layer
- Scalability: single-server MVP, additive schema change path documented
- Accessibility: shadcn/ui baseline preserved, canvas aria-label required

### Gap Analysis & Resolutions ✅

All gaps identified and resolved in document:

**`is_hidden` filtering (resolved):** Explicitly documented as role-conditional service-layer pattern in Architectural Boundaries. Two service methods required; global EF Core filter explicitly forbidden with rationale.

**Route metadata (resolved):**
- `(coach)/layout.tsx` and `(player)/layout.tsx` both marked with `metadata = { robots: { index: false } }` in project structure
- `app/page.tsx` marked as requiring `generateMetadata()` for Open Graph + structured data (FR50)

**Middleware path matchers (resolved):** `middleware.ts` explicitly documents matchers `['/coach/:path*', '/player/:path*']` in project structure.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context analyzed (12 rules from project-context.md)
- [x] Scale and complexity assessed (Medium, 5–25 users MVP)
- [x] Technical constraints identified (canvas perf, brownfield)
- [x] Cross-cutting concerns mapped (RBAC, team ownership, cache invalidation)

**Architectural Decisions**
- [x] 5 ADRs documented with rationale
- [x] Technology stack fully specified with versions
- [x] Integration patterns defined (apiFetch, JWT flow, RQ cache)
- [x] Performance constraints addressed (canvas code-split, lazy load)
- [x] Security decisions documented (dual RBAC, secrets management)

**Implementation Patterns**
- [x] Naming conventions established (DB, API, .NET, TypeScript)
- [x] Structure patterns defined (hybrid feature-based)
- [x] Communication patterns specified (apiFetch, RQ conventions)
- [x] Process patterns documented (error handling, loading states, auth flow)
- [x] Anti-patterns explicitly listed

**Project Structure**
- [x] Complete directory structure defined (frontend + backend)
- [x] All FR categories mapped to specific files/directories
- [x] Component boundaries established (canvas isolation, route groups)
- [x] Integration points mapped (data flow diagram)
- [x] Middleware path matchers specified
- [x] `robots: { index: false }` on all protected route layouts
- [x] `generateMetadata()` required on landing page
- [x] `is_hidden` service-layer pattern explicitly documented

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Pre-mortem surfaced 6 architectural constraints before a line of code is written — highest-risk failure modes are pre-mitigated
- Brownfield foundation is solid; architecture builds on it, not against it
- Canvas isolation and `drill_slides` schema_version are hard constraints with clear, unambiguous implementation rules
- Dual RBAC (`[Authorize]` + `ValidateTeamAccess`) prevents the most common security gaps in multi-tenant apps
- `apiFetch` wrapper and EF Core global filter create chokepoints that prevent inconsistent implementation across agents
- `is_hidden` role-conditional pattern explicitly documented — prevents both the security hole (missing filter) and the logic bug (global filter)

**Areas for Future Enhancement:**
- Visual ERD (DB schema diagram)
- React Query key registry document
- API endpoint reference table
- E2E test strategy (Phase 2)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use `apiFetch` for all API calls — never raw `fetch`
- Apply `next/dynamic` to any component importing react-konva
- Apply `ValidateTeamAccess` before any team-scoped data access
- Use `GetPlanForCoach` vs `GetPlanForPlayer` — never a single method with conditional filtering; never a global EF Core filter for `is_hidden`
- Include `schema_version` in every `drill_slides` write
- All protected route layouts must export `robots: { index: false }`
- Landing page must implement `generateMetadata()` for SEO

**First Implementation Sequence:**
1. End-to-end auth validation (Supabase → .NET JWT)
2. EF Core global query filter (soft delete) + `ValidateTeamAccess` base method
3. Canvas dynamic import boundary
4. React Query invalidation rules per mutation
