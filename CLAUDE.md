# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MinuteXMinute 2.0** - Sports team management Progressive Web App (PWA) for coaches and players. Built with C#/.NET Core backend, Angular 19 frontend, PostgreSQL database, all running in Docker. Target sport is lacrosse with future multi-sport support.

## Technology Stack

- **Backend:** ASP.NET Core 9.0 Web API + Entity Framework Core 9.0 + Npgsql
- **Frontend:** Angular 19 (standalone components) + Tailwind CSS 3.4.17 + RxJS
- **Database:** PostgreSQL 17
- **Infrastructure:** Docker + Docker Compose + Nginx (production frontend serving)

## Architecture

### Three-Tier Containerized Architecture

1. **Backend API** (`backend/`) - RESTful API following Controller pattern
   - `Program.cs`: Application entry point, DI container configuration, CORS setup
   - `Controllers/`: API endpoint controllers (ApiController attribute, route: `/api/[controller]`)
   - `Data/`: EF Core DbContext and database layer
   - Connection string points to `postgres:5432` (Docker service name)
   - CORS configured for `http://localhost:4200` (Angular dev server)

2. **Frontend SPA** (`frontend/`) - Angular standalone component architecture
   - `src/app/app.config.ts`: Application-level providers (HttpClient, etc.)
   - Standalone components (no NgModules)
   - **Styling:** Tailwind CSS 3.4.17 utility classes (no component CSS files)
   - `tailwind.config.js`: Content paths configured for `src/**/*.{html,ts}`
   - `src/styles.css`: Tailwind directives only (`@tailwind base/components/utilities`)
   - API calls routed through Nginx proxy in production (`/api` -> `backend:8080`)
   - Production build served via Nginx on port 80

3. **Database** - PostgreSQL with health checks
   - Database name: `sportsdb`
   - Default credentials: `postgres/postgres` (see `appsettings.json`)
   - Docker Compose health check ensures DB ready before backend starts

### Key Design Decisions

- **No .NET installed locally**: All development happens in Docker containers
- **Tailwind CSS utility-first**: No component-level CSS files, all styling via Tailwind utility classes in templates
- **Frontend API calls**: Use relative path `/api/*` (Nginx proxies to backend in production)
- **Backend runs on port 8080** inside container (ASPNETCORE_URLS configured)
- **Frontend production**: Multi-stage Docker build (node build → nginx serve)

## Development Commands

### Start Full Stack
```bash
docker-compose up --build
```
- Backend: http://localhost:8080
- Frontend: http://localhost:4200
- PostgreSQL: localhost:5432

### Stop Services
```bash
docker-compose down
```

### Clean Up (Remove Volumes)
```bash
docker-compose down -v
```

### View Logs
```bash
docker logs sports-backend
docker logs sports-frontend
docker logs sports-postgres
```

### Rebuild Single Service
```bash
docker-compose up --build backend
docker-compose up --build frontend
```

### Access PostgreSQL
```bash
docker exec -it sports-postgres psql -U postgres -d sportsdb
```

## Database Migrations (Future)

When adding EF Core migrations:
```bash
# Run inside backend container
docker exec -it sports-backend dotnet ef migrations add MigrationName
docker exec -it sports-backend dotnet ef database update
```

Or install dotnet-ef tool in Dockerfile for migration support.

## Future Architecture (From Initialization Docs)

Reference `/Initialization/` for comprehensive architecture plans:
- **backend.md**: Clean Architecture with CQRS, role-based access, SignalR for real-time
- **frontend.md**: PWA setup, Fabric.js for whiteboard, offline support, Supabase auth
- **database.md**: Full ERD with teams, coaches, players, drills, practices

Current MVP is foundation only. Future expansion includes:
- Supabase authentication (Google OAuth + email/password)
- Whiteboard drill creation (Fabric.js canvas)
- Role-based permissions (Coach vs Player)
- Push notifications
- Offline PWA capabilities

## Critical Implementation Details

### Backend CORS
CORS policy `AllowFrontend` is hardcoded to `http://localhost:4200`. Update for production deployment.

### Frontend API Base URL
Production uses Nginx proxy (`/api` routes to backend). Development directly calls `http://localhost:8080` only if needed - current setup uses relative paths.

### Docker Networking
All services on `sports-network` bridge. Services reference each other by container name:
- Backend -> Postgres: `postgres:5432`
- Frontend (Nginx) -> Backend: `backend:8080`

### Health Check Dependency
Backend waits for Postgres health check before starting (`depends_on: postgres: condition: service_healthy`).

## Reference Documentation

- `/Initialization/frontend.md` - Complete frontend architecture guide (PWA, auth, whiteboard)
- `/Initialization/backend.md` - Backend architecture guide (C#/.NET, EF Core, deployment)
- `/Initialization/database.md` - ERD and database schema design
- `README.md` - Quick start and troubleshooting

These files contain detailed architecture decisions, technology comparisons with difficulty ratings, and future roadmap.
