---
project_name: 'minuteXminute2'
user_name: 'Derek'
date: '2026-02-17'
sections_completed: ['technology_stack']
existing_patterns_found: 12
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Backend
- .NET 9.0 / ASP.NET Core 9.0 Web API
- Entity Framework Core 9.0.0 + Npgsql 9.0.0
- C# with `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>`
- Always runs in Docker during development (`docker-compose up postgres backend`)

### Frontend
- Next.js 16.1.4 (App Router ONLY - never use /pages directory)
- React 19.2.3 (use React 19 patterns, not legacy or React 18 docs)
- TypeScript 5.x (strict mode enabled)
- Tailwind CSS 4.x (CSS-based config, no tailwind.config.js)
- shadcn/ui: new-york style, RSC enabled, lucide-react icons, CSS variables
- State: Zustand 5.0.10 (global) + React Query 5.90.19 (server)
- Forms: React Hook Form 7.71.1
- Canvas: react-konva 19.2.1 / Konva 10.2.0
- PWA: Serwist 9.5.0
- Auth: Supabase (auth only)
  - `@supabase/ssr` 0.8.0 → Server Components, API routes, middleware
  - `@supabase/supabase-js` 2.91.0 → Client Components (`'use client'`)

### Database
- PostgreSQL 17 (Docker: postgres:17-alpine)
- Database: sportsdb, User: postgres

### Development Ports
- Local dev: Frontend 3000, Backend 8080 (Docker)
- Pre-PR testing: Frontend 4200, Backend 8080 (all Docker)
- CORS allows both 3000 and 4200

### Version-Specific Syntax Rules
- Tailwind 4: Use `@import "tailwindcss"` in globals.css (not `@tailwind` directives)
- shadcn/ui: Install via `npx shadcn@latest add [component]` — never manually create
- React Query 5: Object syntax `{ queryKey: [...], queryFn }` — no positional args
- Zustand 5: Use `create<StateType>()((set) => ...)` with explicit type parameter
- EF Core + PostgreSQL: Prefer `DateTimeOffset` over `DateTime` for timestamps

### Data Fetching Strategy
- Use `fetch` (not axios) — React Query handles the pain points
- React Query for server state (caching, loading, refetch)
- Zustand for client-only global state
- SignalR: stretch goal for real-time features (live game, multi-user sync)

### API Architecture (TBD)
- Decision pending: Direct frontend→.NET vs BFF (Next.js API routes→.NET)
- Current lean: Start direct, add BFF layer if auth/aggregation pain emerges
- All business logic in .NET regardless of pattern

### Code Style Rules
- Use `@/` path alias for imports — never relative paths like `../../`
- Never use `any` type — use `unknown` with type narrowing, or define proper types

### Not Yet Configured
- Serwist (PWA): Package installed, service worker not set up
- Testing: Framework not selected yet (Jest/Vitest TBD)

