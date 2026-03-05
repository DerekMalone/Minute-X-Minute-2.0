# Story 2.2: Team Creation and Deletion

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a head coach,
I want to create a team and, when needed, delete it,
So that I have full control over my team's lifecycle on the platform.

## Acceptance Criteria

1. **Team creation:** Given I am a signed-in coach and navigate to team creation, When I enter a team name and submit, Then a new team record is created with me as the head coach and I am redirected to the team page showing my team

2. **Name validation:** Given I submit a team name that is empty or whitespace only, When the form is submitted, Then validation prevents submission and shows "Team name is required"

3. **Team displayed on dashboard:** Given my team is created, When I view the team page (`/coach/team`), Then my team name is displayed and I am identified as Head Coach

4. **Team deletion:** Given I am a head coach on the team settings screen, When I choose to delete my team and confirm the deletion dialog, Then the team and all associated data (roster, drills) are permanently deleted and I am redirected to `/coach/team` which shows the team creation form

## Tasks / Subtasks

- [x] Task 1: Backend — DTOs (AC: 1, 2, 3, 4)
  - [x] Create `backend/DTOs/Teams/` directory
  - [x] Create `backend/DTOs/Teams/CreateTeamRequest.cs` — `Name` (string, `[Required]`, `[MinLength(1)]`, `[MaxLength(100)]`); note: `[Required]` checks `IsNullOrEmpty` not `IsNullOrWhiteSpace` — whitespace-only enforcement is handled in `CreateTeamAsync` after trimming (see Task 2); also note `Team.cs` entity does not have `[MaxLength(100)]` (set in Story 2.1 migration — known gap, low risk at MVP scale)
  - [x] Create `backend/DTOs/Teams/TeamDto.cs` — `Id` (Guid), `Name` (string), `Sport` (string), `Role` (string — "HeadCoach" or "Player"), `CreatedAt` (DateTime)

- [x] Task 2: Backend — ITeamService + TeamService (AC: 1, 3, 4)
  - [x] Create `backend/Services/ITeamService.cs` interface with methods: `CreateTeamAsync`, `GetMyTeamAsync`, `DeleteTeamAsync`
  - [x] Create `backend/Services/TeamService.cs` extending `BaseService`, implementing `ITeamService`
  - [x] Implement `CreateTeamAsync(string userId, string name, CancellationToken ct)`: (1) trim `name` — if empty/whitespace after trim, throw `ArgumentException("Team name is required.")` (backend enforcement of AC2, since `[Required]` on DTO does not catch whitespace-only strings); (2) check if user already has `Role == MemberRole.HeadCoach` in any `TeamMembers` row — if so, throw `InvalidOperationException("Coach already has a team.")` (prevents multiple-team creation); (3) create `Team` (Sport = "lacrosse", CreatedBy = userId); create `TeamMember` (Role = HeadCoach); save both in a single `SaveChangesAsync` call; return `TeamDto`.
  - [x] Implement `GetMyTeamAsync(string userId, CancellationToken ct)`: query `Teams` joined with `TeamMembers` where `UserId == userId`; return first match as `TeamDto` or `null` if none
  - [x] Implement `DeleteTeamAsync(string userId, Guid teamId, CancellationToken ct)`: (1) single query — `AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId && tm.Role == MemberRole.HeadCoach)` — if false, throw `UnauthorizedAccessException("Only the head coach can delete a team.")` (this subsumes `ValidateTeamAccess` — do NOT call it separately, that would be a redundant round trip); (2) delete all drills using `IgnoreQueryFilters()` (catches soft-deleted records); (3) delete Team (EF cascade removes TeamMembers); save

- [x] Task 3: Backend — TeamsController (AC: 1, 2, 3, 4)
  - [x] Create `backend/Controllers/TeamsController.cs` with `[Authorize]`
  - [x] `POST /api/teams` → `CreateTeam([FromBody] CreateTeamRequest request)`: extract userId via `User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")`; null-check — return `Unauthorized()` if null; call `_teamService.CreateTeamAsync`; return `CreatedAtAction` 201; catch `UnauthorizedAccessException` → `Forbid()`; catch `InvalidOperationException` → `Conflict()` (coach already has a team)
  - [x] `GET /api/teams/my` → `GetMyTeam()`: extract userId (same dual-claim pattern); null-check — return `Unauthorized()` if null; call `_teamService.GetMyTeamAsync`; return 200 + TeamDto or 404 if null
  - [x] `DELETE /api/teams/{teamId}` → `DeleteTeam(Guid teamId)`: extract userId (same dual-claim pattern); null-check — return `Unauthorized()` if null; call `_teamService.DeleteTeamAsync`; return 204 No Content; catch `UnauthorizedAccessException` → `Forbid()`

- [x] Task 4: Backend — DI registration + xUnit test project (AC: 1, 2, 3, 4)
  - [x] Register `TeamService` in `Program.cs`: `builder.Services.AddScoped<ITeamService, TeamService>()`
  - [x] Create `backend.Tests/` directory (sibling to `backend/`)
  - [x] Create `backend.Tests/backend.Tests.csproj` — target `net9.0`, reference `xunit`, `xunit.runner.visualstudio`, `Microsoft.EntityFrameworkCore.InMemory`, `Microsoft.NET.Test.Sdk`, and project-reference to `../backend/Backend.csproj`
  - [x] Create `backend.Tests/Services/TeamServiceTests.cs` — test: CreateTeamAsync creates Team + HeadCoach TeamMember; GetMyTeamAsync returns null when no team; GetMyTeamAsync returns TeamDto when team exists; DeleteTeamAsync throws UnauthorizedAccessException when user is not HeadCoach; DeleteTeamAsync successfully deletes team + members + drills

- [x] Task 5: Frontend — Setup Vitest + types + store (AC: 1, 3)
  - [x] Install vitest testing dependencies: `npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
  - [x] Create `frontend/vitest.config.ts` — configure jsdom environment, include `@testing-library/jest-dom` setup (see Dev Notes for exact config)
  - [x] Create `frontend/src/features/team-management/types.ts` — export `TeamDto` TypeScript type matching backend DTO (id, name, sport, role, createdAt)
  - [x] Create `frontend/src/stores/useTeamStore.ts` — Zustand store with `teamId`, `teamName`, `role`; actions `setTeam(id, name, role)` + `clearTeam()` (see Dev Notes pattern)

- [x] Task 6: Frontend — React Query hooks (AC: 1, 3, 4)
  - [x] Create `frontend/src/features/team-management/hooks/useTeam.ts`
  - [x] `useMyTeam()` — React Query `useQuery` key `['team', 'my']`; calls `apiFetch<TeamDto>('/api/teams/my')`; `retry: false`; treat 404 as "no team" (return null, don't throw)
  - [x] `useCreateTeam()` — React Query `useMutation`; calls `apiFetch<TeamDto>('/api/teams', { method: 'POST', body: JSON.stringify({ name }) })`; `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['team'] })` + `setTeam()` in store (no `router.push` — user is already on `/coach/team`; cache invalidation triggers re-render showing the new team)
  - [x] `useDeleteTeam()` — React Query `useMutation`; calls `apiFetch('/api/teams/${teamId}', { method: 'DELETE' })`; `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['team'] })` + `clearTeam()` in store + `router.push('/coach/team')`

- [x] Task 7: Frontend — UI components + team page (AC: 1, 2, 3, 4)
  - [x] Install shadcn Dialog component: `npx shadcn@latest add dialog` (needed for delete confirmation)
  - [x] Create `frontend/src/features/team-management/components/team-create-form.tsx` — React Hook Form with `name` field; inline `rules={{ required: 'Team name is required', validate: v => v.trim().length > 0 || 'Team name is required' }}`; submit calls `createTeam.mutate`; loading state on button; server error display
  - [x] Create `frontend/src/features/team-management/components/team-header.tsx` — displays team name, sport, head coach badge ("Head Coach"); includes "Delete team" button triggering delete confirmation Dialog
  - [x] Update `frontend/src/app/(coach)/coach/team/page.tsx` — `'use client'`; `useMyTeam()` to load team; if `isPending` → skeleton; if team exists → `<TeamHeader />`; if no team → `<TeamCreateForm />`
  - [x] Create `frontend/src/features/team-management/index.ts` — public exports

- [x] Task 8: Frontend — Vitest tests (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/features/team-management/components/team-create-form.test.tsx`
  - [x] Test: renders team name input; test: shows "Team name is required" when submitted empty; test: calls `createTeam.mutate` with trimmed name on valid submit; test: shows loading state while submitting

## Dev Notes

### Architecture Mandate — ValidateTeamAccess + 403 Error Pattern

Every service method touching team-scoped data MUST call `ValidateTeamAccess(userId, teamId, ct)` before any DB read or write. This is the standing enforcement rule from Story 2.1. **Exception:** `DeleteTeamAsync` in this story — the HeadCoach query subsumes `ValidateTeamAccess` (see `TeamService — Delete` section below).

Every controller action calling a service that extends `BaseService` MUST catch `UnauthorizedAccessException` and return `Forbid()` (HTTP 403). This was established in Story 2.1 and applies to ALL subsequent controllers:

```csharp
catch (UnauthorizedAccessException)
{
    return Forbid(); // HTTP 403 — Problem Details applied automatically by AddProblemDetails()
}
```

`CreateTeam` additionally catches `InvalidOperationException` (coach already has a team) and returns `Conflict()` (HTTP 409):

```csharp
catch (InvalidOperationException ex)
{
    return Conflict(new { detail = ex.Message }); // HTTP 409
}
```

### UserId Extraction Pattern

Consistent with existing `AuthController.cs`:
```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
             ?? User.FindFirstValue("sub");
```

Always null-check userId before calling services. Return `Unauthorized()` if null.

### TeamService — Create + HeadCoach in One Transaction

Before any inserts: (1) trim and validate name is non-empty (whitespace bypass), (2) verify no existing HeadCoach membership. Both `Team` and `TeamMember` are then saved in a single `SaveChangesAsync` call for atomicity:

```csharp
public async Task<TeamDto> CreateTeamAsync(string userId, string name, CancellationToken ct = default)
{
    // H1: [Required] on DTO does not catch whitespace-only strings — enforce here
    var trimmedName = name.Trim();
    if (string.IsNullOrEmpty(trimmedName))
        throw new ArgumentException("Team name is required.");

    // H2: Prevent a coach from creating multiple teams
    var alreadyHasTeam = await _context.TeamMembers
        .AnyAsync(tm => tm.UserId == userId && tm.Role == MemberRole.HeadCoach, ct);
    if (alreadyHasTeam)
        throw new InvalidOperationException("Coach already has a team.");

    var team = new Team
    {
        Id = Guid.NewGuid(),
        Name = trimmedName,
        Sport = "lacrosse",   // Hardcoded per architecture decision — multi-sport Phase 3
        CreatedBy = userId
        // CreatedAt + UpdatedAt set by AppDbContext.SetTimestamps()
    };
    _context.Teams.Add(team);

    var member = new TeamMember
    {
        Id = Guid.NewGuid(),
        TeamId = team.Id,
        UserId = userId,
        Role = MemberRole.HeadCoach
        // JoinedAt set by AppDbContext.SetTimestamps()
    };
    _context.TeamMembers.Add(member);

    await _context.SaveChangesAsync(ct);

    return new TeamDto
    {
        Id = team.Id,
        Name = team.Name,
        Sport = team.Sport,
        Role = "HeadCoach",
        CreatedAt = team.CreatedAt
    };
}
```

### TeamService — Delete with Restrict FK Workaround

`Drill → Team` FK is `DeleteBehavior.Restrict` (set in Story 2.1). You MUST delete all drills (including soft-deleted) before deleting the team, or EF will throw a constraint violation. `TeamMembers → Team` defaults to CASCADE — they are removed automatically when the Team is deleted.

**Do NOT call `ValidateTeamAccess` in `DeleteTeamAsync`.** The HeadCoach membership check is strictly stronger than `ValidateTeamAccess` (which only checks membership, not role). Calling both is a redundant DB round trip — a single `AnyAsync` with the HeadCoach filter is sufficient.

```csharp
public async Task DeleteTeamAsync(string userId, Guid teamId, CancellationToken ct = default)
{
    // Single query: HeadCoach check subsumes membership check — no need for ValidateTeamAccess()
    var isHeadCoach = await _context.TeamMembers
        .AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId && tm.Role == MemberRole.HeadCoach, ct);
    if (!isHeadCoach)
        throw new UnauthorizedAccessException("Only the head coach can delete a team.");

    // Delete all drills (bypass soft-delete filter to catch soft-deleted records too)
    var drills = await _context.Drills
        .IgnoreQueryFilters()
        .Where(d => d.TeamId == teamId)
        .ToListAsync(ct);
    _context.Drills.RemoveRange(drills);

    var team = await _context.Teams.FindAsync([teamId], ct);
    if (team != null)
        _context.Teams.Remove(team);  // TeamMembers cascade delete automatically

    await _context.SaveChangesAsync(ct);
}
```

> **Note for future stories:** When `PracticePlan` (Epic 5) and `Invite` (Story 2.3) entities are added, `DeleteTeamAsync` must be updated to also delete those before deleting the team. This is the architectural contract.

### TeamService — GetMyTeam

For MVP, coaches have one team. Return the first team where the user is a member:

```csharp
public async Task<TeamDto?> GetMyTeamAsync(string userId, CancellationToken ct = default)
{
    var result = await _context.TeamMembers
        .Where(tm => tm.UserId == userId)
        .Include(tm => tm.Team)
        .Select(tm => new TeamDto
        {
            Id = tm.Team.Id,
            Name = tm.Team.Name,
            Sport = tm.Team.Sport,
            Role = tm.Role.ToString(),
            CreatedAt = tm.Team.CreatedAt
        })
        .FirstOrDefaultAsync(ct);

    return result;
}
```

### Backend xUnit Test Project Setup

Create a separate xUnit project at `backend.Tests/backend.Tests.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="9.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../backend/Backend.csproj" />
  </ItemGroup>
</Project>
```

Use EF Core InMemory for unit tests (no mock/interface needed):

```csharp
private static AppDbContext CreateContext(string dbName)
{
    var options = new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(dbName)
        .Options;
    return new AppDbContext(options);
}
```

> **InMemory limitation:** EF Core InMemory does NOT enforce `DeleteBehavior.Restrict` — cascades and constraint violations behave differently than PostgreSQL. Tests for delete cascade are integration-level concerns. For unit tests, focus on service logic: correct TeamDto returned, UnauthorizedAccessException thrown for non-members, etc.

Run backend tests from the repo root (or inside container if needed):
```bash
dotnet test backend.Tests/
```

### Frontend — Vitest Config

Vitest is not yet configured in the frontend. Install and configure as part of Task 5:

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```
<!-- Note: @testing-library/jest-dom is required by src/test/setup.ts — do not omit it -->

`frontend/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

`frontend/src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add test script to `frontend/package.json`:
```json
"test": "vitest"
```

### Frontend — Zustand Store Pattern

Follow the architecture's store conventions (flat shape, `use{Concern}Store` naming):

```typescript
// src/stores/useTeamStore.ts
import { create } from 'zustand'

interface TeamState {
  teamId: string | null
  teamName: string | null
  role: string | null
  setTeam: (id: string, name: string, role: string) => void
  clearTeam: () => void
}

export const useTeamStore = create<TeamState>((set) => ({
  teamId: null,
  teamName: null,
  role: null,
  setTeam: (id, name, role) => set({ teamId: id, teamName: name, role }),
  clearTeam: () => set({ teamId: null, teamName: null, role: null }),
}))
```

### Frontend — useMyTeam 404 Handling

`GET /api/teams/my` returns 404 when the coach has no team. `apiFetch` throws `ApiError` on non-OK responses. The hook should intercept 404 and return `null` instead of propagating the error:

```typescript
// src/features/team-management/hooks/useTeam.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/api'
import { useTeamStore } from '@/stores/useTeamStore'
import type { TeamDto } from '@/features/team-management/types'

export function useMyTeam() {
  return useQuery<TeamDto | null>({
    queryKey: ['team', 'my'],
    queryFn: async () => {
      try {
        return await apiFetch<TeamDto>('/api/teams/my')
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    retry: false,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  const setTeam = useTeamStore((s) => s.setTeam)

  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<TeamDto>('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setTeam(team.id, team.name, team.role)
      // No router.push — user is already on /coach/team; cache invalidation re-renders the page
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const clearTeam = useTeamStore((s) => s.clearTeam)

  return useMutation({
    mutationFn: (teamId: string) =>
      apiFetch(`/api/teams/${teamId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      clearTeam()
      router.push('/coach/team')
    },
  })
}
```

### Frontend — Form Validation Pattern

Follow the existing auth form pattern — React Hook Form inline `rules`, NOT zod resolver (auth forms don't use zod resolver despite zod being installed):

```typescript
<FormField
  control={form.control}
  name="name"
  rules={{
    required: 'Team name is required',
    validate: (v) => v.trim().length > 0 || 'Team name is required',
  }}
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-mx-text">Team name</FormLabel>
      <FormControl>
        <Input
          placeholder="e.g. Lake Norman Lacrosse"
          className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-mx-teal"
          {...field}
        />
      </FormControl>
      <FormMessage className="text-mx-red" />
    </FormItem>
  )}
/>
```

### Frontend — Delete Confirmation Dialog

Use the shadcn `Dialog` component (must be installed via `npx shadcn@latest add dialog`). Two-button pattern from UX spec: "Cancel" (ghost) + "Delete Team" (destructive/red):

```tsx
<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete {teamName}?</DialogTitle>
      <DialogDescription>
        This will permanently delete your team, all players, and all drills. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
      <Button
        variant="destructive"
        disabled={deleteTeam.isPending}
        onClick={() => deleteTeam.mutate(teamId)}
      >
        {deleteTeam.isPending ? 'Deleting...' : 'Delete Team'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### No EF Migration Required

Story 2.1 already created the `teams` and `team_members` tables with the correct schema. No new migration is needed for Story 2.2.

### Project Structure Notes

New files to create:
```
backend/
├── Controllers/
│   └── TeamsController.cs          ← NEW
├── DTOs/
│   └── Teams/                      ← NEW directory
│       ├── CreateTeamRequest.cs    ← NEW
│       └── TeamDto.cs              ← NEW
├── Services/
│   ├── ITeamService.cs             ← NEW
│   └── TeamService.cs              ← NEW
├── Program.cs                      ← MODIFIED (register TeamService)

backend.Tests/                      ← NEW directory (sibling to backend/)
├── backend.Tests.csproj            ← NEW
└── Services/
    └── TeamServiceTests.cs         ← NEW

frontend/src/
├── features/team-management/       ← NEW directory
│   ├── types.ts                    ← NEW
│   ├── index.ts                    ← NEW
│   ├── hooks/
│   │   └── useTeam.ts              ← NEW
│   └── components/
│       ├── team-create-form.tsx    ← NEW
│       ├── team-create-form.test.tsx ← NEW
│       └── team-header.tsx         ← NEW
├── stores/
│   └── useTeamStore.ts             ← NEW
├── test/
│   └── setup.ts                    ← NEW
├── app/(coach)/coach/team/
│   └── page.tsx                    ← MODIFIED (stub → real)
├── components/ui/
│   └── dialog.tsx                  ← NEW (via shadcn add)
└── vitest.config.ts                ← NEW (root of frontend/)
```

No changes to: `AppDbContext.cs`, `BaseService.cs`, entity models, middleware, Migrations/.

### Previous Story Learnings (from Story 2.1)

- `dotnet ef` is NOT available in the Docker runtime image — it is installed on the host (WSL2) via dotnet-install.sh. Run `dotnet ef` locally with `--connection` flag pointing to `localhost:5432` (exposed port), not container networking.
- `UseSnakeCaseNamingConvention()` is already in `AppDbContext` — all EF Core entity properties are automatically snake_cased in the DB. No manual column name configuration needed.
- `SetTimestamps()` override in `AppDbContext` auto-sets `CreatedAt`, `JoinedAt`, `UpdatedAt` — DO NOT set these manually in service code.
- `MemberRole.HeadCoach = 0`, `MemberRole.Player = 1` — enum values are locked. Do not rely on string names for DB storage; stored as integer.
- Migration path is `backend/Migrations/` (not `backend/Data/Migrations/`).
- The existing auth guard is sufficient to confirm identity (`[Authorize]`). It does NOT confirm team membership — that is `ValidateTeamAccess`'s job.
- L3 deferred from 2.1: no global exception handler for `UnauthorizedAccessException → 403`. Per-controller catch blocks remain required for all controllers in this story and going forward until a global handler is added.

### References

- [Source: architecture.md#Authentication-&-Security] — `ValidateTeamAccess` mandate + dual RBAC
- [Source: architecture.md#API-&-Communication-Patterns] — Problem Details, 204 for DELETE, route naming `/api/teams`
- [Source: architecture.md#Structure-Patterns] — Backend `DTOs/Teams/`, `Services/`, `Controllers/`; Frontend `features/team-management/`, `stores/`
- [Source: architecture.md#Communication-Patterns] — `apiFetch` for all API calls, React Query key `['team', 'my']`
- [Source: architecture.md#Format-Patterns] — Direct response (no wrapper), camelCase JSON, 201 for POST with body
- [Source: epics.md#Story-2.2] — Acceptance criteria
- [Source: 2-1-backend-foundation.md#BaseService-Pattern] — `ValidateTeamAccess` usage pattern
- [Source: 2-1-backend-foundation.md#Exception-Semantics] — `UnauthorizedAccessException → Forbid()` per controller
- [Source: 2-1-backend-foundation.md#Soft-Delete-Global-Filter] — `IgnoreQueryFilters()` required in DeleteTeamAsync
- [EF Core InMemory Testing](https://learn.microsoft.com/en-us/ef/core/testing/testing-with-the-database)
- [React Query useMutation](https://tanstack.com/query/v5/docs/react/guides/mutations)
- [shadcn Dialog](https://ui.shadcn.com/docs/components/dialog)
- [Vitest](https://vitest.dev/config/)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Pre-implementation code review: 8 spec issues fixed (3 HIGH, 5 MEDIUM) before any code was written.
- `vi.mock` inside test body is hoisted in Vitest — use `mockReturnValue` per test to control hook return values, not nested `vi.mock` calls.
- Backend tests require explicit `using Xunit;` — `ImplicitUsings` does not include xunit namespaces.
- Supabase uses ES256 (asymmetric) signing — `SUPABASE_JWT_SECRET` cannot validate ES256 tokens. Fix: use `options.Authority = SUPABASE_URL + "/auth/v1"` in `AddJwtBearer`. The middleware auto-fetches EC public keys from the Supabase JWKS endpoint, caches them, and matches by `kid`. Requires `SUPABASE_URL` in `docker-compose.yml` + `.env`. `SUPABASE_JWT_SECRET` is no longer used for JWT validation. Apply to ALL future .NET projects using Supabase JWT auth.

### File List

- `backend/DTOs/Teams/CreateTeamRequest.cs` — NEW
- `backend/DTOs/Teams/TeamDto.cs` — NEW
- `backend/Services/ITeamService.cs` — NEW
- `backend/Services/TeamService.cs` — NEW
- `backend/Controllers/TeamsController.cs` — NEW
- `backend/Program.cs` — MODIFIED (ITeamService/TeamService DI registration)
- `backend.Tests/backend.Tests.csproj` — NEW
- `backend.Tests/Services/TeamServiceTests.cs` — NEW
- `frontend/vitest.config.ts` — NEW
- `frontend/package.json` — MODIFIED (added test script)
- `frontend/src/test/setup.ts` — NEW
- `frontend/src/features/team-management/types.ts` — NEW
- `frontend/src/features/team-management/index.ts` — NEW
- `frontend/src/features/team-management/hooks/useTeam.ts` — NEW
- `frontend/src/features/team-management/components/team-create-form.tsx` — NEW
- `frontend/src/features/team-management/components/team-create-form.test.tsx` — NEW
- `frontend/src/features/team-management/components/team-header.tsx` — NEW
- `frontend/src/stores/useTeamStore.ts` — NEW
- `frontend/src/app/(coach)/coach/team/page.tsx` — MODIFIED (stub → real implementation)
- `frontend/src/components/ui/dialog.tsx` — NEW (via shadcn add)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-02 | Pre-implementation code review: fixed whitespace bypass (H1), added single-team enforcement (H2), corrected userId extraction pattern (H3), fixed missing jest-dom in install command (M1), removed redundant ValidateTeamAccess double-query from DeleteTeamAsync (M2), removed redundant router.push from useCreateTeam (M3), added null-check for userId to all controller actions (M4), noted MaxLength DB gap (M5) | claude-sonnet-4-6 (review) |
| 2026-03-02 | Implementation complete: all 8 tasks done; 8 backend unit tests passing, 5 frontend Vitest tests passing | claude-sonnet-4-6 |
