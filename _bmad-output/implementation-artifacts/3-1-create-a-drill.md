# Story 3.1: Create a Drill

Status: ready-for-dev

## Story

As a coach,
I want to create a drill by entering its name and saving immediately,
So that I can build my library progressively without being blocked by required fields.

## Acceptance Criteria

1. **Name-only save:** Given I am a coach and navigate to the new drill page, When I enter a drill name and confirm (tap away or press Enter), Then the drill is saved immediately to the database and I am redirected to the drill detail page — no additional fields required.

2. **Optional fields on detail page:** Given the drill is saved, When I remain on the drill detail page, Then I can optionally add description, category, difficulty, estimated duration, and position tags — all editable inline (save on blur) without a separate save action.

3. **Empty name validation:** Given I attempt to save a drill with an empty name, When the name field is blurred or the form is submitted, Then validation shows "Drill name is required" and the drill is not saved.

4. **Drill appears in library:** Given I create a drill, When I return to the drill library, Then my new drill appears in the list with its name and any metadata I added.

## Tasks / Subtasks

### Backend

- [ ] Task 1: Expand Drill model and create migration (AC: 1, 2, 4)
  - [ ] Add `Description`, `Category`, `DifficultyLevel`, `DurationMinutes`, `PositionTags` fields to `backend/Models/Drill.cs`
  - [ ] Run migration on HOST (WSL2): `dotnet ef migrations add AddDrillMetadataFields --project backend` then `dotnet ef database update --project backend` (backend must be running in Docker for DB connectivity)
  - [ ] Verify migration applied: `docker exec -it sports-postgres psql -U postgres -d sportsdb -c "\d drills"`

- [ ] Task 2: Create Drill DTOs (AC: 1, 2, 4)
  - [ ] Create `backend/DTOs/Drills/DrillDto.cs`
  - [ ] Create `backend/DTOs/Drills/CreateDrillRequest.cs` — `Name` required, `TeamId` required
  - [ ] Create `backend/DTOs/Drills/UpdateDrillRequest.cs` — all fields optional (PATCH semantics)

- [ ] Task 3: Create DrillService (AC: 1, 2, 3, 4)
  - [ ] **Write xUnit tests FIRST (red) in Task 5 before implementing service methods**
  - [ ] Create `backend/Services/IDrillService.cs` interface
  - [ ] Create `backend/Services/DrillService.cs` (extends `BaseService`)
  - [ ] Implement `CreateDrillAsync(string userId, CreateDrillRequest request, CancellationToken ct) → Task<DrillDto>` — validate team access, verify user has Coach/HeadCoach role, create drill, return DTO
  - [ ] Implement `GetDrillsAsync(string userId, Guid teamId, CancellationToken ct) → Task<List<DrillDto>>` — validate team access, return all non-deleted drills for team (global filter handles soft delete automatically)
  - [ ] Implement `GetDrillAsync(string userId, Guid teamId, Guid drillId, CancellationToken ct) → Task<DrillDto>` — validate team access, return single drill
  - [ ] Implement `UpdateDrillAsync(string userId, Guid teamId, Guid drillId, UpdateDrillRequest request, CancellationToken ct) → Task<DrillDto>` — validate team access, verify Coach/HeadCoach role, patch only non-null fields

- [ ] Task 4: Create DrillsController and register DI (AC: 1, 2, 3, 4)
  - [ ] Create `backend/Controllers/DrillsController.cs`
  - [ ] `POST /api/drills` — `[Authorize]` — create drill; extract userId via dual-claim pattern; return 201 + DrillDto
  - [ ] `GET /api/drills?teamId={id}` — `[Authorize]` — list drills; return DrillDto[]
  - [ ] `GET /api/drills/{id}?teamId={id}` — `[Authorize]` — get single drill; return DrillDto; 404 if not found
  - [ ] `PATCH /api/drills/{id}` — `[Authorize]` — update optional fields; return DrillDto
  - [ ] Register in `Program.cs`: `builder.Services.AddScoped<IDrillService, DrillService>()`

- [ ] Task 5: xUnit tests for DrillService (AC: 1, 2, 3, 4)
  - [ ] **Write ALL test cases first (red phase) — implement Task 3 service methods after**
  - [ ] Create `backend.Tests/Services/DrillServiceTests.cs` — reuse `CreateContext` + seeding helper pattern from `InviteServiceTests.cs`
  - [ ] Test: `CreateDrillAsync_CreatesDrill_WhenUserIsCoach` — seed team + coach TeamMember; call CreateDrill; assert drill persisted with correct Name and TeamId
  - [ ] Test: `CreateDrillAsync_ThrowsUnauthorized_WhenUserIsNotMember` — call CreateDrill with userId not in team; assert `UnauthorizedAccessException`
  - [ ] Test: `CreateDrillAsync_ThrowsUnauthorized_WhenUserIsPlayer` — seed player TeamMember; call CreateDrill; assert `UnauthorizedAccessException`
  - [ ] Test: `GetDrillsAsync_ReturnsOnlyTeamDrills` — seed 2 drills for team A, 1 drill for team B; assert only 2 returned for team A
  - [ ] Test: `GetDrillsAsync_ExcludesSoftDeletedDrills` — seed 1 active + 1 soft-deleted drill; assert only 1 returned (EF Core global filter handles this)
  - [ ] Test: `UpdateDrillAsync_UpdatesOnlyNonNullFields` — create drill with Name "X"; PATCH with Description "Y", Name null; assert Name still "X", Description now "Y"
  - [ ] Test: `UpdateDrillAsync_ThrowsUnauthorized_WhenUserIsPlayer` — seed player; attempt PATCH; assert `UnauthorizedAccessException`

### Frontend

- [ ] Task 6: Create drill-library feature types and hooks (AC: 1, 2, 4)
  - [ ] **Write Vitest tests FIRST (red) in Task 9 before implementing components**
  - [ ] Create `frontend/src/features/drill-library/types.ts`
  - [ ] Create `frontend/src/features/drill-library/hooks/useCreateDrill.ts` — mutation; on success invalidate `['drills', teamId]`; return drill id for redirect
  - [ ] Create `frontend/src/features/drill-library/hooks/useDrills.ts` — query key `['drills', teamId]`; enabled when teamId present
  - [ ] Create `frontend/src/features/drill-library/hooks/useUpdateDrill.ts` — mutation; on success invalidate `['drill', drillId]` AND `['drills', teamId]`
  - [ ] Create `frontend/src/features/drill-library/hooks/useDrill.ts` — query key `['drill', drillId]`; fetches single drill
  - [ ] Create `frontend/src/features/drill-library/index.ts` — re-export public API

- [ ] Task 7: Create drill-form component and new drill page (AC: 1, 3)
  - [ ] Create `frontend/src/features/drill-library/components/drill-form.tsx` — name-only React Hook Form; submit on Enter or blur; shows "Drill name is required" validation error
  - [ ] Create `frontend/src/app/(coach)/drills/new/page.tsx` — renders drill-form; on success redirects to `/coach/drills/[newId]`

- [ ] Task 8: Create drill detail page with inline optional field editing (AC: 2)
  - [ ] Create `frontend/src/app/(coach)/drills/[id]/page.tsx` — fetches drill via `useDrill`; shows name as text (not editable in 3.1 — that's story 3.2); each optional field is an inline input/select that calls `useUpdateDrill` on blur
  - [ ] Optional field inputs: Description (textarea), Category (select from predefined list), DifficultyLevel (select: beginner/intermediate/advanced), DurationMinutes (number input), PositionTags (multi-select or checkbox group)
  - [ ] Show brief "Saving..." state on each field while mutation is pending; restore previous value on error

- [ ] Task 9: Create minimal drill library page and DrillCard component (AC: 4)
  - [ ] Create `frontend/src/features/drill-library/components/drill-card.tsx` — shows name, duration chip, category tag, difficulty badge
  - [ ] Create `frontend/src/features/drill-library/components/drill-card.test.tsx` — tests for render states
  - [ ] Create `frontend/src/app/(coach)/drills/page.tsx` — lists all drills via `useDrills`; empty state "Your drill library is empty" + "Create your first drill" CTA button linking to `/coach/drills/new`; loading skeleton while `isPending`

## Dev Notes

### Drill Model Expansion

`backend/Models/Drill.cs` is currently a stub. Add these properties:

```csharp
public string? Description { get; set; }
public string? Category { get; set; }
public string? DifficultyLevel { get; set; }  // "beginner" | "intermediate" | "advanced" | null
public int? DurationMinutes { get; set; }
public List<string> PositionTags { get; set; } = [];
```

`PositionTags` as `List<string>` maps to PostgreSQL `text[]` natively via Npgsql — no extra EF Core configuration required. The `UseSnakeCaseNamingConvention()` global setting will snake_case all column names automatically (`position_tags`, `difficulty_level`, etc.).

`SetTimestamps()` in `AppDbContext.cs` auto-sets `CreatedAt` and `UpdatedAt` — do NOT set these manually in service code.

### Migration

Run on HOST (WSL2), not inside Docker container (confirmed in story 2.4 notes — `dotnet ef` CLI runs on host):
```bash
# From repo root
dotnet ef migrations add AddDrillMetadataFields --project backend
dotnet ef database update --project backend
```
Docker Postgres must be running (`docker-compose up postgres`) for `database update` to connect.

### DTOs

**`CreateDrillRequest.cs`:**
```csharp
public class CreateDrillRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "Drill name is required")]
    public required string Name { get; set; }
    public Guid TeamId { get; set; }
}
```

**`UpdateDrillRequest.cs`** — PATCH semantics; only update non-null fields:
```csharp
public class UpdateDrillRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? DifficultyLevel { get; set; }
    public int? DurationMinutes { get; set; }
    public List<string>? PositionTags { get; set; }
}
```

**`DrillDto.cs`:**
```csharp
public class DrillDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? DifficultyLevel { get; set; }
    public int? DurationMinutes { get; set; }
    public List<string> PositionTags { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### API Endpoints

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | `/api/drills` | `[Authorize]` | Body: `CreateDrillRequest`; returns 201 + `DrillDto` |
| GET | `/api/drills?teamId={id}` | `[Authorize]` | Returns `DrillDto[]` |
| GET | `/api/drills/{id}?teamId={id}` | `[Authorize]` | Returns `DrillDto`; 404 if not found |
| PATCH | `/api/drills/{id}` | `[Authorize]` | Body: `UpdateDrillRequest`; returns `DrillDto` |

All endpoints use `[Authorize]` (not role-specific) — the Supabase JWT role claim is "authenticated" for all users, not "coach". Coach-only enforcement is handled inside the service layer by checking `TeamMember.Role`.

### UserId Extraction (same pattern as TeamsController and InvitesController)

```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
if (userId == null) return Unauthorized();
```

### DrillService — Coach Role Verification

`ValidateTeamAccess` only checks membership (coach OR player). For coach-only operations (create, update), also verify the member's role:

```csharp
protected async Task ValidateCoachAccess(string userId, Guid teamId, CancellationToken ct)
{
    await ValidateTeamAccess(userId, teamId, ct); // checks membership
    var member = await _context.TeamMembers
        .FirstOrDefaultAsync(tm => tm.UserId == userId && tm.TeamId == teamId, ct);
    if (member?.Role == MemberRole.Player)
        throw new UnauthorizedAccessException("Only coaches can perform this action.");
}
```

Call `ValidateCoachAccess` instead of `ValidateTeamAccess` in `CreateDrillAsync` and `UpdateDrillAsync`. Call plain `ValidateTeamAccess` in read methods (coaches and players can both read drills).

**Note on `MemberRole` enum values:** `MemberRole.HeadCoach = 0`, `MemberRole.Player = 1` — stored as int in DB. Both HeadCoach should pass the coach access check.

### DrillService — PATCH Update Pattern

Only update fields that are non-null in the request (do NOT overwrite existing values with null):

```csharp
if (request.Name != null) drill.Name = request.Name;
if (request.Description != null) drill.Description = request.Description;
if (request.Category != null) drill.Category = request.Category;
if (request.DifficultyLevel != null) drill.DifficultyLevel = request.DifficultyLevel;
if (request.DurationMinutes != null) drill.DurationMinutes = request.DurationMinutes;
if (request.PositionTags != null) drill.PositionTags = request.PositionTags;
await _context.SaveChangesAsync(ct);
```

### Soft Delete — Already Handled

The global query filter `HasQueryFilter(d => d.DeletedAt == null)` is already configured in `AppDbContext.cs`. Do NOT add `WHERE deleted_at IS NULL` to any query — it is applied automatically. This is confirmed in `AppDbContext.cs`.

### Error Handling Pattern (from TeamsController / InvitesController)

Use `try/catch` blocks per controller method (no global handler yet):
```csharp
catch (UnauthorizedAccessException) { return Forbid(); }
catch (KeyNotFoundException) { return NotFound(); }
```

### Frontend Types

```typescript
// features/drill-library/types.ts
export interface DrillDto {
  id: string
  teamId: string
  name: string
  description: string | null
  category: string | null
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | null
  durationMinutes: number | null
  positionTags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateDrillRequest {
  name: string
  teamId: string
}

export interface UpdateDrillRequest {
  name?: string
  description?: string
  category?: string
  difficultyLevel?: string
  durationMinutes?: number
  positionTags?: string[]
}
```

Predefined category options (frontend constants):
```typescript
export const DRILL_CATEGORIES = ['Attack', 'Defense', 'Midfield', 'Goalie', 'Team', 'Conditioning'] as const
export const DRILL_DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export const POSITION_TAGS = ['Attack', 'Midfield', 'Defense', 'Goalie'] as const
```

### React Query Keys and Cache Invalidation

```typescript
['drills', teamId]    // list for team — invalidate on create
['drill', drillId]    // single drill — invalidate on update
```

`useCreateDrill`: on success → invalidate `['drills', teamId]` → redirect to `/coach/drills/${newDrill.id}` via `router.push`.

`useUpdateDrill`: on success → invalidate both `['drill', drillId]` and `['drills', teamId]`.

### TeamId from Zustand Store

```typescript
import { useTeamStore } from '@/stores/useTeamStore'
const { teamId } = useTeamStore()
```

All drill API calls must include `teamId`. Queries should be `enabled: !!teamId` to prevent firing before team context loads. Check `useTeamStore.ts` for the exact shape — follow the same pattern used in team-management hooks.

### Inline Editing UX (Drill Detail Page — optional fields only)

The detail page shows the drill name as plain text (name editing is story 3.2). Each optional field is an input/select that:
1. Displays current value (or empty placeholder if null)
2. On focus → becomes editable
3. On blur → calls `updateDrill.mutate(...)` with only that field
4. Show brief `isPending` indicator while mutation runs
5. On error → restore previous value (use local state copy)

No debouncing needed — save on blur is the right pattern here (unlike canvas autosave which has 2s debounce).

### New Drill Page Flow

```
/coach/drills/new
  → DrillForm (name input)
  → On valid submit → POST /api/drills
  → On success → router.push(`/coach/drills/${drill.id}`)
  → DrillDetail page → optional fields inline editing
```

Navigation: coach taps "Create drill" button from library page → lands on `/coach/drills/new`. After save, lands on detail page. No `router.back()` — always push to detail page.

### Nav Config

`frontend/src/features/coach/config/nav.ts` already has:
```typescript
{ label: 'Drill Library', href: '/coach/drills', icon: Dumbbell }
```
**No changes needed to nav.ts.**

### xUnit Test Setup Pattern (from InviteServiceTests.cs)

Reuse the `CreateContext()` in-memory helper and seeding pattern established in previous stories. For `GetDrillsAsync_ExcludesSoftDeletedDrills`: the EF Core InMemory provider DOES support global query filters (`HasQueryFilter`) — seed a drill with `DeletedAt = DateTime.UtcNow` and verify it is excluded.

Run tests:
```bash
dotnet test backend.Tests/
```

### Vitest Frontend Test Pattern

Follow the `vi.mock` hoisting pattern from `join-team-page.test.tsx`. Mock `useTeamStore` to return a fixed `teamId`. Mock `useCreateDrill`, `useDrills`, etc. Mock `next/navigation` for `useRouter`.

Run tests:
```bash
cd frontend && npx vitest run
```

### No New Environment Variables

No changes to `docker-compose.yml`, `.env.local`, or `appsettings.json`. This story adds no new external dependencies.

### Project Structure Notes

New and modified files this story creates:

```
backend/
  Models/Drill.cs                              MODIFY — add metadata fields
  Data/Migrations/                             ADD — AddDrillMetadataFields migration
  DTOs/Drills/
    DrillDto.cs                                ADD
    CreateDrillRequest.cs                      ADD
    UpdateDrillRequest.cs                      ADD
  Services/
    IDrillService.cs                           ADD
    DrillService.cs                            ADD
  Controllers/
    DrillsController.cs                        ADD
  Program.cs                                   MODIFY — register IDrillService → DrillService

backend.Tests/Services/
  DrillServiceTests.cs                         ADD

frontend/src/
  features/drill-library/
    types.ts                                   ADD
    index.ts                                   ADD
    components/
      drill-card.tsx                           ADD
      drill-card.test.tsx                      ADD
      drill-form.tsx                           ADD
    hooks/
      useDrills.ts                             ADD
      useDrill.ts                              ADD
      useCreateDrill.ts                        ADD
      useUpdateDrill.ts                        ADD
  app/(coach)/drills/
    page.tsx                                   ADD — minimal list + empty state
    new/page.tsx                               ADD — create form
    [id]/page.tsx                              ADD — detail + inline optional field editing
```

No changes to: `nav.ts`, `AppDbContext.cs`, `BaseService.cs`, `middleware.ts`, `docker-compose.yml`.

### References

- [Source: `backend/Models/Drill.cs`] — stub to expand
- [Source: `backend/Data/AppDbContext.cs`] — soft-delete global filter confirmed; `UseSnakeCaseNamingConvention` global
- [Source: `backend/Services/BaseService.cs`] — `ValidateTeamAccess` pattern
- [Source: `backend/Controllers/TeamsController.cs`] — `[Authorize]` + userId extraction pattern
- [Source: `_bmad-output/implementation-artifacts/2-4-player-joins-team-via-invite-link.md#Dev-Notes`] — dotnet ef runs on HOST, not Docker; `MemberRole.HeadCoach = 0, Player = 1`; xUnit InMemory DB setup
- [Source: `_bmad-output/planning-artifacts/architecture.md#Implementation-Patterns`] — naming conventions, `apiFetch`, EF Core patterns, anti-patterns
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`] — feature folder structure, React Query conventions
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Guidelines`] — `apiFetch` mandatory, `ValidateTeamAccess` required, no `deleted_at IS NULL` in queries
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.1`] — acceptance criteria
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`] — progressive disclosure (name-only required), drill card components, empty state copy
- [Source: `frontend/src/features/coach/config/nav.ts`] — Drill Library nav entry already exists

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
