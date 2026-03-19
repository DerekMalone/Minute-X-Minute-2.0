# Infra 1: Cloud Hosting Migration (Beta)

Status: ready-for-dev

## Story

As a developer,
I want the app deployed to cloud hosting (Vercel + Railway + Supabase Postgres),
So that beta testers can access the app without a local Docker setup.

## Acceptance Criteria

1. **Frontend on Vercel:** Given the Next.js app is deployed to Vercel, When a user visits the Vercel URL, Then the frontend loads and API calls route correctly to the Railway backend.

2. **Backend on Railway:** Given the .NET backend is deployed to Railway using the existing Dockerfile, When the Railway service starts, Then it connects to Supabase Postgres, validates Supabase JWTs, and returns healthy responses.

3. **Database on Supabase Postgres:** Given EF Core migrations are run against Supabase's direct connection string, When the backend starts, Then the schema is current and all queries succeed.

4. **CORS allows Vercel domain:** Given CORS origins are read from an environment variable, When a request arrives from the Vercel production URL, Then it is not blocked by CORS.

5. **No secrets in source code:** Given all credentials are set as environment variables in each platform's dashboard, Then no connection strings, JWT secrets, or API keys appear in committed code.

## Tasks / Subtasks

- [ ] Task 1: Backend — CORS via environment variable (AC: 4, 5)
  - [ ] In `backend/Program.cs`, replace the hardcoded origin array in `WithOrigins(...)` with a comma-separated env var: read `CORS_ALLOWED_ORIGINS` via `builder.Configuration["CORS_ALLOWED_ORIGINS"]`, split on `,`, and pass the resulting array to `WithOrigins()`
  - [ ] Keep `http://localhost:3000` and `http://localhost:4200` as fallback defaults when the env var is absent (so local dev is unaffected)
  - [ ] Add `CORS_ALLOWED_ORIGINS` to `docker-compose.yml` environment block (set to empty/commented — only needed in production)

- [ ] Task 2: Infrastructure — Supabase Postgres setup (AC: 3)
  - [ ] In Supabase dashboard → Settings → Database, copy the **direct connection string** (port 5432, not the pooler on port 6543)
  - [ ] Run EF Core migrations against Supabase Postgres: `docker exec -it sports-backend dotnet ef database update` with `ConnectionStrings__DefaultConnection` temporarily pointing to the Supabase direct connection string
  - [ ] Verify migration history table exists in Supabase Postgres via the Supabase SQL editor

- [ ] Task 3: Infrastructure — Railway backend deployment (AC: 2, 4, 5)
  - [ ] Create a new Railway project, connect the GitHub repo, set root directory to `backend/`
  - [ ] Railway will detect the `Dockerfile` automatically
  - [ ] Set the following environment variables in Railway dashboard:
    - `ASPNETCORE_URLS=http://+:8080`
    - `ASPNETCORE_ENVIRONMENT=Production`
    - `ConnectionStrings__DefaultConnection` → Supabase **transaction pooler** connection string (port 6543)
    - `SUPABASE_URL` → same value as `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_JWT_SECRET` → from Supabase dashboard (unused for ES256 but keep for reference)
    - `CORS_ALLOWED_ORIGINS` → Vercel production URL (add after Vercel deploy in Task 4)
  - [ ] Confirm Railway deploy succeeds and `/health` endpoint responds

- [ ] Task 4: Infrastructure — Vercel frontend deployment (AC: 1, 5)
  - [ ] Connect GitHub repo to Vercel, set root directory to `frontend/`
  - [ ] Set the following environment variables in Vercel dashboard:
    - `NEXT_PUBLIC_SUPABASE_URL` → Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase anon key
    - `NEXT_PUBLIC_API_URL` → Railway backend public URL (e.g. `https://your-app.railway.app`)
  - [ ] Trigger a Vercel deploy and verify the frontend loads
  - [ ] Copy the Vercel production URL and update `CORS_ALLOWED_ORIGINS` in Railway
  - [ ] In Supabase dashboard → Authentication → URL Configuration, add the Vercel production URL to **Site URL** and **Redirect URLs** — required for password reset emails and any future OAuth callbacks to work in production

- [ ] Task 5: Smoke test (AC: 1, 2, 3, 4)
  - [ ] Sign up with email/password → verify account created in Supabase Auth
  - [ ] Create a team → verify row appears in Supabase Postgres via SQL editor
  - [ ] Generate invite link → open it in an incognito tab → join as a new player
  - [ ] View roster as coach → confirm both members appear

## Dev Notes

- **Supabase connection strings:** Use the **direct connection** (port 5432) for migrations only. Use the **transaction pooler** (port 6543) for the running backend. EF Core migrations require a session-mode connection; the pooler's transaction mode will fail during `database update`.
- **CORS timing:** You need the Vercel URL before you can set `CORS_ALLOWED_ORIGINS` in Railway. Deploy Vercel first (Task 4 before Task 3 step 4), then update Railway env and redeploy.
- **No schema changes in this ticket:** This ticket is purely infrastructure config. If any story requires a migration, that migration is applied as part of Task 2 or the story's own ticket.
- **Local dev unaffected:** Docker Compose continues to use the local Postgres container. The Supabase Postgres is only used by the cloud deployment.
- **Future tickets:** Any story that adds a new environment variable to the backend or frontend must also document the variable in this ticket's Task 3/4 env var lists (or in its own ticket's dev notes) so Railway/Vercel dashboards stay in sync.
