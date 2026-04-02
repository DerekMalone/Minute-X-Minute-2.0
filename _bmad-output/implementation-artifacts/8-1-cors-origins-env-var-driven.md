# Story 8.1: CORS Origins Environment-Variable Driven

Status: ready-for-dev

## Story

As a DevOps engineer,
I want the backend CORS allowed origins read from an environment variable,
So that the API accepts requests from the Vercel production domain without a code change.

## Acceptance Criteria

1. **Given** the `ALLOWED_ORIGINS` environment variable is set to the Vercel domain **When** a preflight or credentialed request arrives with a matching `Origin` header **Then** the response includes the correct `Access-Control-Allow-Origin` header and the request is not rejected.

2. **Given** `ALLOWED_ORIGINS` is not set **When** the application starts **Then** it falls back to `http://localhost:3000,http://localhost:4200` so local development is unaffected.

3. **Given** the Cloud Run service has `ALLOWED_ORIGINS` set to the Vercel production URL **When** the Vercel frontend makes any API call **Then** CORS does not block the response end-to-end.

## Tasks / Subtasks

- [ ] Task 1: Update `backend/Program.cs` CORS policy (AC: 1, 2, 3)
  - [ ] Locate the hardcoded `.WithOrigins("http://localhost:3000", "http://localhost:4200")` at line 27
  - [ ] Replace with env-var driven logic:
    ```csharp
    var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"]
        ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        ?? ["http://localhost:3000", "http://localhost:4200"];
    ```
  - [ ] Pass `allowedOrigins` to `.WithOrigins(allowedOrigins)` in the CORS policy
  - [ ] No other changes to `Program.cs` — keep policy name `"AllowFrontend"`, keep `AllowAnyHeader()` and `AllowAnyMethod()`

- [ ] Task 2: Update `docker-compose.yml` backend environment block (AC: 2)
  - [ ] Add `ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:4200}` to the `backend` service `environment:` section (after line 29)
  - [ ] The `:-` syntax means: use env var value if set, else fall back to the hardcoded default — local dev continues to work with no `.env` entry required

- [ ] Task 3: Add `ALLOWED_ORIGINS` to root `.env` (AC: 2)
  - [ ] Append `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200` to root `.env`
  - [ ] This is optional for local dev (docker-compose has a fallback default) but documents the variable and allows easy override

- [ ] Task 4: Manual verification (AC: 1, 2)
  - [ ] Run `docker-compose up postgres backend` (without setting `ALLOWED_ORIGINS` in `.env`) — confirm the backend starts with no errors
  - [ ] Confirm CORS still allows `http://localhost:3000` by running the frontend (`npm run dev`) and making a request — no CORS errors in DevTools
  - [ ] Optional: set `ALLOWED_ORIGINS=http://example.com` in `.env`, restart backend, confirm `http://localhost:3000` is now rejected (returns no `Access-Control-Allow-Origin` header or 403 preflight)

## Dev Notes

### Current State (What to Change)

`backend/Program.cs` lines 23–30 currently have CORS hardcoded:

```csharp
// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:4200")  // ← CHANGE THIS LINE
              .AllowAnyHeader()
              .AllowAnyMethod());
});
```

This is the **only** line that changes. The policy name `"AllowFrontend"` and `app.UseCors("AllowFrontend")` at line 51 stay exactly as-is.

### Target Implementation

```csharp
// Add CORS
var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:3000", "http://localhost:4200"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});
```

`builder.Configuration["ALLOWED_ORIGINS"]` reads from environment variables automatically — ASP.NET Core's configuration system maps env vars to config keys natively. No `IConfiguration` injection, no `appsettings.json` change required.

`StringSplitOptions.TrimEntries` handles spaces around commas in the env var value (e.g., `"http://localhost:3000, http://localhost:4200"` works correctly).

### Docker Compose Change

Add one line to the backend `environment:` block:

```yaml
environment:
  ASPNETCORE_URLS: http://+:8080
  ASPNETCORE_ENVIRONMENT: Development
  SUPABASE_JWT_SECRET: ${SUPABASE_JWT_SECRET}
  SUPABASE_URL: ${SUPABASE_URL}
  ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}"
  ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:4200}  # ← ADD THIS
```

The `${VAR:-default}` syntax is Docker Compose variable substitution — if `ALLOWED_ORIGINS` is absent from `.env`, the literal default string is used. The container receives the final resolved value.

### Root `.env` Change

Append to the existing root `.env`:

```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
```

This value is already the fallback default, so local dev behaviour is unchanged. When deploying to Cloud Run, this env var is overridden with the Vercel production URL (e.g., `https://minutexminute.vercel.app`).

### No Tests Needed

This is a pure configuration wiring change with no business logic. The only risk is a misconfiguration (wrong split character, missing env var). The manual verification in Task 4 is sufficient. Do NOT add xUnit or Vitest tests for this story.

### Scope Guardrails

**Do NOT touch:**
- `app.UseCors("AllowFrontend")` — stays unchanged
- Policy name `"AllowFrontend"` — stays unchanged
- `AllowAnyHeader()` / `AllowAnyMethod()` — stays unchanged
- `appsettings.json` — no changes needed; env vars override config automatically
- Any controller, service, DTO, migration, or frontend file
- `backend/.env` — not used by Docker (only root `.env` is loaded by `docker-compose`)

### Production Deployment Note (Context for Story 8.6)

When deploying to Cloud Run (Story 8.6), set `ALLOWED_ORIGINS` as a Cloud Run environment variable with the Vercel domain. Example:
```
ALLOWED_ORIGINS=https://minutexminute.vercel.app
```
Do NOT set this in Cloud Run secrets (not a secret — just a URL). Story 8.5 handles secrets; this is plain config.

### Cross-Story Context

- **Story 8.2** follows immediately — Cloud Run `PORT` env var support. Same pattern: env var replaces hardcoded value.
- **Story 8.6** (Cloud Run Deployment) is where `ALLOWED_ORIGINS` is first set to the real production domain.
- **Story 8.7** (Vercel Deployment) — Vercel frontend URL must match the exact origin set in `ALLOWED_ORIGINS` on Cloud Run.

### Project Structure Notes

Modified files only (no new files):
```
backend/Program.cs     ← MODIFIED (CORS section only, ~3 line change)
docker-compose.yml     ← MODIFIED (add ALLOWED_ORIGINS to backend environment)
.env                   ← MODIFIED (append ALLOWED_ORIGINS entry)
```

No new files. No migrations. No frontend changes.

### References

- [Source: epics.md#Story-8.1] — Acceptance criteria, user story statement
- [Source: epics.md#Epic-8] — Epic objectives, deployment sequencing (after 3.1, before 5.1)
- [Source: CLAUDE.md#Backend-CORS] — "Use environment variable in production for actual domain"
- [Source: backend/Program.cs#L23-30] — Current hardcoded CORS policy
- [Source: docker-compose.yml#L26-31] — Current backend environment block
- [Source: .env] — Root env file structure

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
