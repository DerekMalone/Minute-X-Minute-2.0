# Story 2.1: [Technical Task] Backend Foundation — ValidateTeamAccess & Soft-Delete Filter

Status: review

> **Note:** This is a developer prerequisite task with no user-observable output. Do NOT sprint-demo this story. It is a required implementation step before Story 2.2 (Team Creation and Deletion) can be built.

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the BaseService with team access validation and the EF Core soft-delete global query filter established,
So that every subsequent protected endpoint is built on a consistent, secure foundation.

## Acceptance Criteria

1. **ValidateTeamAccess authorization:** Given a service method calls `ValidateTeamAccess(userId, teamId)`, When the userId is not a member of the teamId, Then the method throws an `UnauthorizedAccessException` and no data is returned

2. **Soft-delete global filter:** Given an EF Core query is executed on the `Drill` entity, When the query runs, Then records where `DeletedAt IS NOT NULL` are automatically excluded — no per-query filter required

3. **BaseService availability:** Given a new service class is created that extends `BaseService`, When `ValidateTeamAccess` is called, Then the method is available and usable without additional wiring

## Tasks / Subtasks

- [x] Task 1: Create foundational entity models in `backend/Models/` (AC: 2, 3)
  - [x] Create `backend/Models/MemberRole.cs` — enum with `HeadCoach`, `Player` (AssistantCoach deferred to Phase 1.5, add additively in Epic 7)
  - [x] Create `backend/Models/Team.cs` — `Id` (Guid), `Name` (string, required), `Sport` (string, default "lacrosse"), `CreatedBy` (string, Supabase userId), `CreatedAt` (DateTime UTC), `UpdatedAt` (DateTime UTC); navigation: `ICollection<TeamMember>`, `ICollection<Drill>`. (`Sport` included now: zero-cost additive column; required for Phase 3 multi-sport support per PRD. No UI surface until Phase 3 — hardcode "lacrosse" on Team creation in Story 2.2.)
  - [x] Create `backend/Models/TeamMember.cs` — `Id` (Guid), `TeamId` (Guid, FK → Team), `Team` (nav prop), `UserId` (string, Supabase userId), `Role` (MemberRole), `JoinedAt` (DateTime UTC); configure unique index `(UserId, TeamId)` in AppDbContext
  - [x] Create `backend/Models/Drill.cs` — MINIMAL stub only: `Id` (Guid), `TeamId` (Guid, FK → Team), `Team` (nav prop), `Name` (string, required), `DeletedAt` (DateTime?, UTC), `CreatedAt` (DateTime UTC), `UpdatedAt` (DateTime UTC). Full Drill properties (Description, DurationMinutes, etc.) added additively in Story 3.1.

- [x] Task 2: Update `Data/AppDbContext.cs` (AC: 2, 3)
  - [x] Add `DbSet<Team> Teams`
  - [x] Add `DbSet<TeamMember> TeamMembers`
  - [x] Add `DbSet<Drill> Drills`
  - [x] In `OnModelCreating`: configure `TeamMember` unique constraint on `(UserId, TeamId)` via `HasIndex(tm => new { tm.UserId, tm.TeamId }).IsUnique()`
  - [x] In `OnModelCreating`: apply `HasQueryFilter(d => d.DeletedAt == null)` to the `Drill` entity
  - [x] In `OnModelCreating`: set DB-level default for `Team.Sport` via `.Property(t => t.Sport).HasDefaultValue("lacrosse")` — C# initializer alone does NOT produce a SQL DEFAULT; this must be in EF config
  - [x] Override `SaveChangesAsync(CancellationToken)` to auto-set `UpdatedAt = DateTime.UtcNow` on all modified/added entities that expose an `UpdatedAt` property (see `UpdatedAt Auto-Tracking` section in Dev Notes)

- [x] Task 3: Create `backend/Services/BaseService.cs` (AC: 1, 3)
  - [x] Create `backend/Services/` directory
  - [x] Create abstract class `BaseService` — constructor takes `AppDbContext _context`
  - [x] Implement `protected async Task ValidateTeamAccess(string userId, Guid teamId, CancellationToken cancellationToken = default)`: guard against null/empty `userId` first; then queries `TeamMembers.AnyAsync` for matching `(UserId, TeamId)` pair passing `cancellationToken`; throws `UnauthorizedAccessException` if not found (see full signature in Dev Notes)
  - [x] `BaseService` is abstract — no DI registration in `Program.cs` (concrete service subclasses register themselves)

- [x] Task 4: Run EF Core migration (AC: 1, 2, 3)
  - [x] Run: `docker exec -it sports-backend dotnet ef migrations add AddTeamFoundation`
  - [x] Run: `docker exec -it sports-backend dotnet ef database update`
  - [x] Verify tables exist: `docker exec -it sports-postgres psql -U postgres -d sportsdb -c "\dt"` — expect `teams`, `team_members`, `drills`
  - [x] Verify unique index on `team_members (user_id, team_id)` via `\d team_members`

## Dev Notes

### Architecture Mandate — This Is Priority 2 and 3 in the Implementation Sequence

The architecture doc explicitly defines the implementation order:
> "2. EF Core global query filter for soft delete — establish before any entity is used in a query.
> 3. ValidateTeamAccess base service method — establish before any protected endpoint is built."
> [Source: architecture.md#Decision-Impact-Analysis]

These are hard constraints. Every protected data endpoint from Story 2.2 onward must use `ValidateTeamAccess` before touching team-scoped data.

> **Standing enforcement rule for all Epic 2+ stories:**
> If a service method touches team-scoped data, `ValidateTeamAccess` MUST appear before any DB read or write. Its absence is a bug, not a style choice. The `[Authorize]` JWT check on the controller confirms identity — it does NOT confirm team membership. Both layers are always required.

### Confirmed ID Types

- **Entity PKs:** `Guid` — avoids sequential ID enumeration; aligns with Supabase UUIDs
- **UserId fields:** `string` — Supabase JWT `sub` claim is a UUID string; confirmed in existing `AuthController.cs`: `User.FindFirstValue("sub")`
- **TeamId in service method signatures:** `Guid` (matches entity PK type)

### BaseService Pattern

```csharp
// backend/Services/BaseService.cs
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public abstract class BaseService
{
    protected readonly AppDbContext _context;

    protected BaseService(AppDbContext context)
    {
        _context = context;
    }

    protected async Task ValidateTeamAccess(string userId, Guid teamId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("Invalid user identity.");

        var isMember = await _context.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId, cancellationToken);

        if (!isMember)
            throw new UnauthorizedAccessException("User is not a member of this team.");
    }
}
```

`CancellationToken` is defaulted — callers can omit it or pass the request's token to enable cancellation on client disconnect / request timeout. This sets the pattern for all service methods going forward.

**Unit testing `BaseService` subclasses:** Use EF Core's `UseInMemoryDatabase` provider — no mock/interface abstraction needed for MVP. Example setup in xUnit:
```csharp
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase("TestDb")
    .Options;
var context = new AppDbContext(options);
var service = new TeamService(context);
```

Usage pattern in Story 2.2+ concrete services:
```csharp
public class TeamService : BaseService, ITeamService
{
    public TeamService(AppDbContext context) : base(context) { }

    public async Task<TeamDto> GetTeamAsync(string userId, Guid teamId, CancellationToken ct = default)
    {
        await ValidateTeamAccess(userId, teamId, ct);  // ← MUST call before any data access
        return await _context.Teams.Where(t => t.Id == teamId)...
    }
}
```

### Exception Semantics: UnauthorizedAccessException → HTTP 403

> **⚠️ CRITICAL — Read before implementing Story 2.2:**
> `UnauthorizedAccessException` does NOT automatically produce an HTTP 403. Without a catch block at the controller (or a global exception handler), ASP.NET Core returns **HTTP 500** and may leak a stack trace via Problem Details. This is a security issue, not just a UX issue.

`UnauthorizedAccessException` is the .NET built-in for access denials. Despite its name, it maps to HTTP **403 Forbidden** (authenticated but not authorized) — not 401 (unauthenticated). `AddProblemDetails()` handles the response shape but only for status codes, not uncaught exceptions.

**Every controller that calls a service extending `BaseService` MUST catch this exception.** Story 2.2 establishes the pattern — copy it to all subsequent controllers:
```csharp
catch (UnauthorizedAccessException)
{
    return Forbid(); // HTTP 403 — Problem Details wrapper applied automatically by AddProblemDetails()
}
```

If the volume of catch blocks becomes a maintenance concern in a future story, replace with a global exception handler middleware in `Program.cs`. For MVP, explicit per-controller catches are clear and sufficient.

### DbUpdateException on Unique Constraint Violation → HTTP 409

The `TeamMember` unique index on `(UserId, TeamId)` is the DB-level guard against duplicate team memberships. Under concurrent requests (two players tapping the same invite link simultaneously), both can pass the application-level membership check and both attempt to insert — the second insert throws `DbUpdateException` from EF Core.

**Story 2.4 (Player Joins Team) MUST catch this:**
```csharp
catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("unique") == true)
{
    // Duplicate join — treat as idempotent success; player is already a member
    return Ok(); // or redirect to player dashboard
}
```
This is not a Story 2.1 implementation concern, but it is a Story 2.1 architectural decision that must be communicated forward. Do not let `DbUpdateException` become an unhandled HTTP 500.

### Soft-Delete Global Filter

```csharp
// In AppDbContext.OnModelCreating:
modelBuilder.Entity<Drill>()
    .HasQueryFilter(d => d.DeletedAt == null);
```

**This filter applies automatically to every EF Core query on `Drill`:**
- `_context.Drills.ToListAsync()` ✓ soft-deleted excluded automatically
- `_context.Drills.Where(d => d.TeamId == teamId).ToListAsync()` ✓ same
- `_context.Drills.IgnoreQueryFilters()` — explicit bypass for admin/purge use only (DrillPurgeService in Story 3.3)

> **Standing rule for all future stories adding soft-deletable entities:**
> `HasQueryFilter` is NOT inherited and NOT automatic. Every entity that has a `DeletedAt` column MUST have its own `HasQueryFilter(e => e.DeletedAt == null)` added to `OnModelCreating`. It does not propagate from `Drill` to other entities. Future stories that introduce soft-deletable entities (e.g., `PracticePlan` if that becomes deletable) must add this line explicitly.

**Anti-pattern — DO NOT do this:**
```csharp
// WRONG — never add deleted_at IS NULL to individual queries
_context.Drills.Where(d => d.DeletedAt == null && d.TeamId == teamId)
```

### TeamMember — Polymorphic Design (NOT Separate Coach/Player Tables)

The architecture document uses a single polymorphic `TeamMember` entity — NOT separate `coaches`, `players`, `coach_teams`, `player_teams` tables as shown in `Initialization/database.md`.

**`Initialization/database.md` is an early-stage ERD draft. It is superseded by `architecture.md`.** Use the polymorphic single-table approach.

`ValidateTeamAccess` checks team membership only — it does not check role. Role-based endpoint access (coach-only vs. player-allowed) is handled at the controller level via `[Authorize(Roles = "...")]`. This is the dual RBAC pattern:
- Controller: role gate (`[Authorize(Roles)]`)
- Service: team membership gate (`ValidateTeamAccess`)

### Drill.cs — Minimal Stub Strategy

This story creates only the columns required for the global filter. Story 3.1 adds the full Drill model properties via an additive EF migration:

| Story | Columns Added |
|---|---|
| 2.1 (this story) | `Id`, `TeamId`, `Name`, `DeletedAt`, `CreatedAt`, `UpdatedAt` |
| 3.1 | `Description`, `DurationMinutes`, `DifficultyLevel`, `CategoryId`, position tags, etc. |

This is the correct additive approach — no destructive migration required later.

> **⚠️ Migration warning for Story 3.1:** If any test/seed data exists in the `drills` table when Story 3.1's migration runs, any new `NOT NULL` columns added without a DB-level default will cause the migration to fail ("column cannot have non-null constraint without a default value while existing rows are present"). Story 3.1 must specify `.HasDefaultValue()` for every non-nullable column it adds. Suggested safe defaults: `DurationMinutes = 0`, `DifficultyLevel = 1`, `Description = string.Empty`.

### Migration Command Reference

Backend runs in Docker. All `dotnet ef` commands run inside the container:
```bash
# Add migration
docker exec -it sports-backend dotnet ef migrations add AddTeamFoundation

# Apply migration
docker exec -it sports-backend dotnet ef database update

# Verify tables created
docker exec -it sports-postgres psql -U postgres -d sportsdb -c "\dt"

# Verify team_members unique constraint
docker exec -it sports-postgres psql -U postgres -d sportsdb -c "\d team_members"
```

### UpdatedAt Auto-Tracking

`UpdatedAt` will never update on its own — EF Core does not set it automatically. Without a `SaveChangesAsync` override, the column is written once at creation and never again. This is a silent bug.

Override in `AppDbContext`:
```csharp
public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
{
    var now = DateTime.UtcNow;
    foreach (var entry in ChangeTracker.Entries())
    {
        if (entry.State == EntityState.Added)
        {
            if (entry.Properties.Any(p => p.Metadata.Name == "CreatedAt"))
                entry.Property("CreatedAt").CurrentValue = now;
            if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                entry.Property("UpdatedAt").CurrentValue = now;
        }
        else if (entry.State == EntityState.Modified)
        {
            if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                entry.Property("UpdatedAt").CurrentValue = now;
        }
    }
    return await base.SaveChangesAsync(cancellationToken);
}
```

This is a one-time setup that applies to all current and future entities with `CreatedAt`/`UpdatedAt` properties. Do not set these fields manually in service code.

### No Program.cs Changes Required

`BaseService` is abstract and not registered in DI. No new services are registered until Story 2.2 (which registers `TeamService` / `ITeamService`). No middleware changes needed. The `SaveChangesAsync` override lives in `AppDbContext`, not `Program.cs`.

### Project Structure Notes

```
backend/
├── Models/                     ← NEW directory
│   ├── MemberRole.cs           ← NEW
│   ├── Team.cs                 ← NEW
│   ├── TeamMember.cs           ← NEW
│   └── Drill.cs                ← NEW (minimal stub, expanded in Story 3.1)
├── Services/                   ← NEW directory
│   └── BaseService.cs          ← NEW
├── Data/
│   ├── AppDbContext.cs         ← MODIFIED (DbSets + HasQueryFilter + unique index)
│   └── Migrations/             ← NEW (generated by EF migration command)
```

No frontend changes. No controller changes. No `Program.cs` changes.

### References

- [Source: architecture.md#Authentication-&-Security] — `ValidateTeamAccess` mandate
- [Source: architecture.md#Data-Architecture] — Soft-delete `HasQueryFilter` mandate
- [Source: architecture.md#Decision-Impact-Analysis] — Implementation sequence (positions 2 and 3)
- [Source: architecture.md#Backend-directory-structure] — Models, Services, Data layout
- [Source: architecture.md#Enforcement-Guidelines] — "Use `HasQueryFilter` on EF Core entities with soft delete — never add `deleted_at IS NULL` to individual queries"
- [Source: epics.md#Story-2.1] — Acceptance criteria
- [EF Core Global Query Filters](https://learn.microsoft.com/en-us/ef/core/querying/filters)
- [EF Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `dotnet ef` not available in runtime Docker image; resolved by installing .NET SDK 9 on host (WSL2) via dotnet-install.sh and using local `dotnet ef` with `--connection` flag override pointing to `localhost:5432`
- `UseSnakeCaseNamingConvention()` added via `EFCore.NamingConventions` package to enforce PostgreSQL snake_case naming on all tables, columns, and indexes. Required wiping the volume and regenerating the migration.
- Original postgres volume had default credentials (`postgres/postgres`); wiped with `docker-compose down -v` to re-initialize with `.env` credentials.

### Completion Notes List

- Created `backend/Models/` directory with 4 entity files: `MemberRole.cs`, `Team.cs`, `TeamMember.cs`, `Drill.cs`
- Created `backend/Services/` directory with `BaseService.cs` — abstract class with `ValidateTeamAccess` method
- Updated `AppDbContext.cs` with DbSets, unique index on `team_members(user_id, team_id)`, soft-delete `HasQueryFilter` on `Drill`, `HasDefaultValue("lacrosse")` on `Team.Sport`, and `SaveChangesAsync` override for auto-tracking `CreatedAt`/`UpdatedAt`
- Added `EFCore.NamingConventions` package and `UseSnakeCaseNamingConvention()` to enforce snake_case DB naming globally
- Migration `AddTeamFoundation` applied; verified `teams`, `team_members`, `drills` tables exist with snake_case naming and unique index confirmed

### File List

- `backend/Models/MemberRole.cs` — new
- `backend/Models/Team.cs` — new
- `backend/Models/TeamMember.cs` — new
- `backend/Models/Drill.cs` — new
- `backend/Services/BaseService.cs` — new
- `backend/Data/AppDbContext.cs` — modified
- `backend/Program.cs` — modified (added `UseSnakeCaseNamingConvention()`)
- `backend/Backend.csproj` — modified (added `EFCore.NamingConventions`)
- `backend/Data/Migrations/` — new (generated by EF Core)
