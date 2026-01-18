# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MinuteXMinute 2.0** - Sports team management Progressive Web App (PWA) for coaches and players. Built with C#/.NET Core backend, Next.js frontend, PostgreSQL database. Docker used for database and pre-deployment testing. Target sport is lacrosse with future multi-sport support.

## Technology Stack

- **Backend:** ASP.NET Core 9.0 Web API + Entity Framework Core 9.0 + Npgsql
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **State Management:** Zustand (global state) + React Query (server state)
- **Forms:** React Hook Form
- **Canvas/Whiteboard:** react-konva
- **Authentication:** Supabase Auth (email/password + OAuth providers)
- **PWA:** Serwist
- **Database:** PostgreSQL 17
- **Infrastructure:** Docker + Docker Compose (database + integration testing)

## Architecture

### Three-Tier Architecture (Local Development + Docker for Testing)

1. **Backend API** (`backend/`) - RESTful API following Controller pattern
   - `Program.cs`: Application entry point, DI container configuration, CORS setup, JWT authentication
   - `Controllers/`: API endpoint controllers (ApiController attribute, route: `/api/[controller]`)
   - `Data/`: EF Core DbContext and database layer
   - **Development:** Runs locally via `dotnet run` on `http://localhost:8080`
   - **Production/Testing:** Runs in Docker container
   - Connection string uses environment variable for flexibility:
     - Local dev: `localhost:5432` (postgres container port exposed)
     - Docker: `postgres:5432` (container-to-container networking)
   - CORS configured for `http://localhost:3000` (Next.js dev server)

2. **Frontend SPA** (`frontend/`) - Next.js App Router architecture
   - `src/app/`: App Router pages and layouts (server components by default)
   - `src/app/providers.tsx`: Client component wrapper for React Query (Supabase doesn't need provider)
   - `src/lib/supabase/`: Supabase client utilities (browser and server clients)
   - `src/lib/`: Utility functions (API client with Supabase auth)
   - `src/stores/`: Zustand global state stores
   - `src/components/ui/`: shadcn/ui components (Tailwind-based)
   - **Styling:** Tailwind CSS utility classes + shadcn/ui components (no component CSS files)
   - **Development:** Runs locally via `npm run dev` on `http://localhost:3000`
   - **Production/Testing:** Runs in Docker container with built-in Next.js server (no Nginx needed)
   - API calls use `/api/*` prefix (Next.js rewrites to backend in all environments)

3. **Database** - PostgreSQL with health checks
   - Database name: `sportsdb`
   - Default credentials: `postgres/postgres` (see `appsettings.json`)
   - **Always runs in Docker** (via `docker-compose up postgres`)
   - Exposes port 5432 to host for local backend access
   - Docker Compose health check ensures DB ready before services start

### Key Design Decisions

- **Local-first development**: Backend and frontend run locally for fast iteration and debugging
- **Docker for database only**: PostgreSQL always in Docker (don't install locally)
- **Docker for integration testing**: Full stack runs in Docker before PRs via `docker-compose up --build`
- **Tailwind CSS utility-first**: No component-level CSS files, all styling via Tailwind utility classes
- **shadcn/ui components**: Copy-paste component library (not npm package) for full control
- **Supabase Auth + .NET JWT**: Supabase handles OAuth, user storage, email verification; .NET validates JWT tokens
- **Server + Client components**: Next.js App Router uses server components by default, client components (`'use client'`) only when needed for interactivity
- **react-konva for canvas**: React-friendly canvas library for whiteboard/drill creation

## Development Commands

### Daily Development Workflow (Local)

**1. Start PostgreSQL**
```bash
docker-compose up postgres
```
Runs in background. PostgreSQL available at `localhost:5432`.

**2. Start Backend (separate terminal)**
```bash
cd backend
dotnet run
```
Backend runs at `http://localhost:8080` with hot reload.

**3. Start Frontend (separate terminal)**
```bash
cd frontend
npm run dev
```
Frontend runs at `http://localhost:3000` with hot reload.

### Pre-PR Testing (Full Stack in Docker)

**Test complete containerized application:**
```bash
docker-compose up --build
```
Runs all three services in Docker:
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

### Stop Services
```bash
docker-compose down
```

### Clean Up (Remove Volumes - Fresh Database)
```bash
docker-compose down -v
```

### View Logs (Docker only)
```bash
docker logs sports-backend
docker logs sports-frontend
docker logs sports-postgres
```

### Access PostgreSQL
```bash
docker exec -it sports-postgres psql -U postgres -d sportsdb
```

## Database Migrations

**Local development (recommended):**
```bash
cd backend
dotnet ef migrations add MigrationName
dotnet ef database update
```

**In Docker (if needed):**
```bash
docker exec -it sports-backend dotnet ef migrations add MigrationName
docker exec -it sports-backend dotnet ef database update
```

## Future Architecture (From Initialization Docs)

Reference `/Initialization/` for comprehensive architecture plans:
- **backend.md**: Clean Architecture with CQRS, role-based access, SignalR for real-time
- **frontend.md**: PWA setup, canvas whiteboard, offline support, authentication
- **database.md**: Full ERD with teams, coaches, players, drills, practices

**Note:** Initial planning referenced Fabric.js, but we've decided on react-konva instead for better React integration. Authentication uses Supabase for simpler implementation (handles OAuth, user storage, email verification).

Current MVP is foundation only. Future expansion includes:
- Supabase authentication (Google OAuth + email/password, expandable to other providers)
- Whiteboard drill creation (react-konva canvas)
- Role-based permissions (Coach vs Player)
- Push notifications (via Serwist service worker)
- Offline PWA capabilities (via Serwist caching strategies)

## Critical Implementation Details

### Backend CORS
CORS policy `AllowFrontend` configured for `http://localhost:3000` (Next.js dev server). Use environment variable in production for actual domain.

### Backend Connection String
.NET doesn't support bash-style `${VAR:-default}` syntax natively. Use separate config files:
- `appsettings.json`: Local dev connection string (`Host=localhost;Port=5432;...`)
- `appsettings.Docker.json`: Docker connection string (`Host=postgres;Port=5432;...`)
- **Alternative:** Override via docker-compose environment variable:
  ```yaml
  environment:
    - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=sportsdb;Username=postgres;Password=postgres
  ```
  (Note: Double underscore `__` for nested config values)

### Supabase + .NET JWT Integration
- Supabase issues JWT tokens signed with JWT Secret (from Supabase dashboard)
- .NET backend validates JWT tokens using same secret
- Requires `Microsoft.AspNetCore.Authentication.JwtBearer` package
- JWT secret (different from Anon Key) must be in `.env.local` and `appsettings.json`
- Token contains user claims: `sub` (user ID), `email`, `role`
- No database needed for validation - cryptographic signature checking only

### Frontend API Routing
Next.js `next.config.mjs` rewrites `/api/*` requests:
- Local dev: Proxies to `http://localhost:8080/api/*` (local .NET process)
- Docker: Proxies to `http://backend:8080/api/*` (container networking)
- Use environment variable for flexibility

### Docker Networking (Testing Only)
All services on `sports-network` bridge. Services reference each other by container name:
- Backend -> Postgres: `postgres:5432`
- Frontend (Next.js) -> Backend: `backend:8080`

### Health Check Dependency
Backend waits for Postgres health check before starting (`depends_on: postgres: condition: service_healthy`).

### Next.js Server vs Client Components
- Server components (default): Can't use React hooks, state, or browser APIs
- Client components (`'use client'`): Required for React Query, Zustand, event handlers, Supabase client-side calls
- Use `providers.tsx` wrapper pattern for client-only providers in server component layouts
- Supabase can be used in BOTH server and client components (separate client utilities for each)

## Reference Documentation

- `/Initialization/frontend.md` - Complete frontend architecture guide (PWA, auth, whiteboard)
- `/Initialization/backend.md` - Backend architecture guide (C#/.NET, EF Core, deployment)
- `/Initialization/database.md` - ERD and database schema design
- `README.md` - Quick start and troubleshooting

These files contain detailed architecture decisions, technology comparisons with difficulty ratings, and future roadmap.
