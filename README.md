# Sports Team Manager - Minimal Setup

C#/.NET Core + Entity Framework Core + Angular 19 + PostgreSQL running on Docker.

## Project Structure

```
.
├── backend/                    # ASP.NET Core 9.0 Web API
│   ├── Controllers/
│   │   └── HealthController.cs # Test endpoint
│   ├── Data/
│   │   └── AppDbContext.cs     # EF Core DbContext
│   ├── Backend.csproj
│   ├── Program.cs
│   ├── appsettings.json
│   └── Dockerfile
├── frontend/                   # Angular 19
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts
│   │   │   ├── app.component.html
│   │   │   ├── app.component.css
│   │   │   └── app.config.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── package.json
│   ├── angular.json
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml          # Orchestrates all services

```

## What This Does

**Backend:** Single test endpoint at `/api/health/test` that verifies PostgreSQL connection.

**Frontend:** Landing page with "Hello World" and "Connected" status (only shows when backend + DB are running).

**Database:** PostgreSQL 17 with basic setup.

## How to Run

### Prerequisites
- Docker Desktop with WSL 2 integration enabled

### Start All Services

```bash
docker-compose up --build
```

This will:
1. Start PostgreSQL on port 5432
2. Build and start the backend on port 8080
3. Build and start the frontend on port 4200

### Access the Application

Open your browser to: `http://localhost:4200`

You should see:
- "Hello World" heading
- "Connected" status (green box) - indicates backend and DB are running

### Test the Backend Directly

```bash
curl http://localhost:8080/api/health/test
```

Expected response:
```json
{
  "status": "connected",
  "message": "Backend and database are running successfully",
  "timestamp": "2024-12-03T..."
}
```

### Stop All Services

```bash
docker-compose down
```

### Clean Up (Remove Volumes)

```bash
docker-compose down -v
```

## API Endpoint

**GET** `/api/health/test`

Response:
- `status`: "connected" or "error"
- `message`: Description
- `timestamp`: UTC timestamp

## Technology Stack

- **Backend:** ASP.NET Core 9.0, Entity Framework Core 9.0
- **Database:** PostgreSQL 17
- **Frontend:** Angular 19 (standalone components)
- **Container:** Docker + Docker Compose

## Troubleshooting

**Frontend shows "Not connected":**
- Check backend logs: `docker logs sports-backend`
- Verify DB is healthy: `docker ps` (should show healthy status)

**Backend fails to start:**
- PostgreSQL might not be ready. Docker Compose uses health checks to wait for DB.
- Check logs: `docker logs sports-postgres`

**Port conflicts:**
- Ports 4200, 8080, 5432 must be available
- Change ports in `docker-compose.yml` if needed
