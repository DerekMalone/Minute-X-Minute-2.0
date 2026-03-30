# Story 3.1: Create a Drill

Status: ready-for-dev

## Story

As a coach,
I want to create a drill by entering its name and saving immediately,
So that I can build my library progressively without being blocked by required fields.

## Acceptance Criteria

1. **Immediate save on name entry:** Given I am a coach and navigate to the new drill page, When I enter a drill name and confirm (tap away from name field or press Enter), Then the drill is saved immediately to the database and appears in my library — no additional fields required.

2. **Progressive detail editing:** Given the drill is saved, When I remain on the drill detail page, Then I can optionally add description, category, difficulty, estimated duration, and position tags — all editable inline without a separate save action.

3. **Name validation:** Given I attempt to save a drill with an empty name, When the name field is blurred or Enter is pressed, Then validation shows "Drill name is required" and the drill is not saved.

4. **Library appearance:** Given I create a drill, When I return to the drill library, Then my new drill appears in the list with its name and any metadata I added.

## Tasks / Subtasks

- [ ] Task 1: Backend — Expand Drill model (AC: 1, 2)
  - [ ] Expand `backend/Models/Drill.cs` to add all optional fields: `Description` (string?), `Category` (string?), `Difficulty` (string?), `DurationMinutes` (int?), `PositionTags` (string[] stored as JSON/text[])
  - [ ] Keep `Name` as `required string` — it is the only non-nullable user-supplied field
  - [ ] **DO NOT** change `DeletedAt`, `CreatedAt`, `UpdatedAt` — already present and managed by `SetTimestamps()`

- [ ] Task 2: Backend — DTOs (AC: 1, 2, 3)
  - [ ] Create `backend/DTOs/Drills/DrillDto.cs` — response shape: `Id` (Guid), `TeamId` (Guid), `Name` (string), `Description` (string?), `Category` (string?), `Difficulty` (string?), `DurationMinutes` (int?), `PositionTags` (string[]), `CreatedAt` (DateTime), `UpdatedAt` (DateTime)
  - [ ] Create `backend/DTOs/Drills/CreateDrillRequest.cs` — `Name` (string, `[Required]`, `[MaxLength(200)]`), `Description` (string?, `[MaxLength(2000)]`), `Category` (string?, `[MaxLength(100)]`), `Difficulty` (string?, `[MaxLength(50)]`), `DurationMinutes` (int?, `[Range(1, 480)]`), `PositionTags` (string[]?, default empty array)

- [ ] Task 3: Backend — IDrillService + DrillService (AC: 1, 2, 3)
  - [ ] **Write tests FIRST (red) in Task 5 before implementing these methods**
  - [ ] Create `backend/Services/IDrillService.cs`:
    - `CreateDrillAsync(string userId, Guid teamId, CreateDrillRequest request, CancellationToken ct) → Task<DrillDto>`
    - `GetDrillsByTeamAsync(string userId, Guid teamId, CancellationToken ct) → Task<IReadOnlyList<DrillDto>>`
  - [ ] Create `backend/Services/DrillService.cs` — extends `BaseService`:
    - `CreateDrillAsync`: call `ValidateTeamAccess(userId, teamId, ct)` first; trim `Name`; throw `ArgumentException("Drill name is required.")` if empty after trim; create `Drill` entity; `SaveChangesAsync`; return `DrillDto`
    - `GetDrillsByTeamAsync`: call `ValidateTeamAccess(userId, teamId, ct)` first; query `_context.Drills.Where(d => d.TeamId == teamId).OrderByDescending(d => d.CreatedAt)`; project to `DrillDto`
  - [ ] Register `DrillService` in `Program.cs`: `builder.Services.AddScoped<IDrillService, DrillService>()`

- [ ] Task 4: Backend — DrillsController (AC: 1, 2, 3, 4)
  - [ ] Create `backend/Controllers/DrillsController.cs`:
    - Class: `[ApiController]`, `[Route("api/[controller]")]`, `[Authorize]`
    - `POST /api/drills?teamId={teamId}` — extract `userId` via dual-claim pattern; call `CreateDrillAsync`; return 201 Created with `DrillDto`; catch `ArgumentException` → `BadRequest`; catch `UnauthorizedAccessException` → `Forbid()`
    - `GET /api/drills?teamId={teamId}` — extract `userId`; call `GetDrillsByTeamAsync`; return 200 + list; catch `UnauthorizedAccessException` → `Forbid()`
  - [ ] Pass `teamId` as query param `[FromQuery] Guid teamId` on both endpoints

- [ ] Task 5: Backend — EF Migration (AC: 1, 2)
  - [ ] Run migration to add new columns to `drills` table:
    ```bash
    docker exec -it sports-backend dotnet ef migrations add AddDrillMetadataFields
    docker exec -it sports-backend dotnet ef database update
    ```
  - [ ] Migration adds: `description` (text, nullable), `category` (varchar(100), nullable), `difficulty` (varchar(50), nullable), `duration_minutes` (int, nullable), `position_tags` (text[], nullable, default `{}`)

- [ ] Task 6: Backend — xUnit tests (AC: 1, 2, 3)
  - [ ] **Write ALL test cases FIRST (red phase) before implementing Task 3 service methods**
  - [ ] Create `backend.Tests/Services/DrillServiceTests.cs` using same `CreateContext` + seeding helpers as `TeamServiceTests.cs` and `InviteServiceTests.cs`
  - [ ] Seed helper: `SeedTeamWithHeadCoach(AppDbContext ctx, string userId = "coach-1")` → seeds a `Team` and `TeamMember` (HeadCoach role), returns `(team, member)`. Copy this exact pattern from `backend.Tests/Services/InviteServiceTests.cs` line 19 — same signature, same structure, paste directly into `DrillServiceTests.cs` as a local static method.
  - [ ] Test: `CreateDrillAsync_CreatesDrill_WhenValidRequest` — seed team+coach; call with valid name; assert `Drill` row exists, `DrillDto.Name` matches, `TeamId` matches
  - [ ] Test: `CreateDrillAsync_ThrowsArgumentException_WhenNameEmpty` — call with empty string; assert `ArgumentException`
  - [ ] Test: `CreateDrillAsync_ThrowsArgumentException_WhenNameWhitespace` — call with `"   "`; assert `ArgumentException`
  - [ ] Test: `CreateDrillAsync_ThrowsUnauthorized_WhenNotTeamMember` — call with userId not in TeamMembers; assert `UnauthorizedAccessException`
  - [ ] Test: `CreateDrillAsync_TrimsName_WhenLeadingTrailingSpaces` — call with `"  Box Drill  "`; assert saved name is `"Box Drill"`
  - [ ] Test: `GetDrillsByTeamAsync_ReturnsEmpty_WhenNoDrills` — seed team+coach, no drills; assert empty list
  - [ ] Test: `GetDrillsByTeamAsync_ReturnsDrills_OrderedByCreatedAtDesc` — seed 2 drills; assert count 2, correct order
  - [ ] Test: `GetDrillsByTeamAsync_ThrowsUnauthorized_WhenNotTeamMember` — assert `UnauthorizedAccessException`
  - [ ] Test: `GetDrillsByTeamAsync_ExcludesSoftDeletedDrills` — seed one active + one deleted drill (`DeletedAt` set); assert only 1 returned (EF global filter validates itself)
  - [ ] Run tests: `dotnet test backend.Tests/`

- [ ] Task 7: Frontend — Types (AC: 1, 2, 4)
  - [ ] Create `frontend/src/features/drill-library/types.ts`:
    ```typescript
    export interface DrillDto {
      id: string
      teamId: string
      name: string
      description: string | null
      category: string | null
      difficulty: string | null
      durationMinutes: number | null
      positionTags: string[]
      createdAt: string
      updatedAt: string
    }

    export interface CreateDrillRequest {
      name: string
      description?: string
      category?: string
      difficulty?: string
      durationMinutes?: number
      positionTags?: string[]
    }

    export const DRILL_CATEGORIES = ['Offense', 'Defense', 'Transition', 'Ground Balls', 'Conditioning', 'Goalie'] as const
    export type DrillCategory = typeof DRILL_CATEGORIES[number]

    export const DRILL_DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const
    export type DrillDifficulty = typeof DRILL_DIFFICULTIES[number]
    ```

- [ ] Task 8: Frontend — Hooks (AC: 1, 2, 4)
  - [ ] **Write tests FIRST (red) in Task 11 before implementing hook logic**
  - [ ] Create `frontend/src/features/drill-library/hooks/useDrills.ts`:
    - `useDrills(teamId: string | undefined)` — React Query `useQuery`, key `['drills', teamId]`; calls `apiFetch<DrillDto[]>('/api/drills?teamId=' + teamId)`; `enabled: !!teamId`; returns drills array
  - [ ] Create `frontend/src/features/drill-library/hooks/useCreateDrill.ts`:
    - `useCreateDrill(teamId: string)` — `useMutation`; calls `apiFetch<DrillDto>('/api/drills?teamId=' + teamId, { method: 'POST', body: JSON.stringify(request) })`; `onSuccess`: invalidate `['drills', teamId]` (query refetch is acceptable for 3.1 — true optimistic UI with `onMutate` is deferred to 3.4 when the library view is complete); `onError`: do NOT navigate away — stay on `/coach/drills/new` and surface an inline error (e.g., "Failed to save drill. Try again."); returns mutation object

- [ ] Task 9: Frontend — teamId source (AC: 1)
  - [ ] `useTeamStore` already exists at `frontend/src/stores/useTeamStore.ts` — do NOT recreate it. It has `teamId: string | null`, `teamName`, `role`, `setTeam`, `clearTeam`. However, Zustand state resets on page reload (not persisted), so `useTeamStore.teamId` may be `null` on fresh load.
  - [ ] Use `useMyTeam()` from `frontend/src/features/team-management/hooks/useTeam.ts` (already exists) as the source of truth for `teamId`. It calls `GET /api/teams/my` and returns `TeamDto | null`. Access teamId via `const { data: myTeam } = useMyTeam()` → `teamId = myTeam?.id`.
  - [ ] Handle `teamId === null` or `myTeam === null` by showing an empty state: "Create a team first to start building your drill library." Do NOT call drill endpoints if teamId is unavailable.

- [ ] Task 10: Frontend — CreateDrillPage + DrillDetailPage (AC: 1, 2, 3)
  - [ ] Create `frontend/src/features/drill-library/components/create-drill-form.tsx` — `'use client'`; renders a controlled name input (auto-focused); on blur OR Enter keypress: if name non-empty, call `createDrill.mutate({ name: trimmedName })`; on success, navigate to `/coach/drills/[newDrillId]`; on mutation error, stay on the page and show "Failed to save drill. Try again." (do NOT navigate away); if name empty, show inline error "Drill name is required" without submitting; use `react-hook-form` for validation
  - [ ] Create `frontend/src/app/(coach)/coach/drills/new/page.tsx` — minimal server component wrapper rendering `<CreateDrillPage />` client component
  - [ ] Create `frontend/src/features/drill-library/components/drill-detail-page.tsx` — `'use client'`; accepts `drillId: string` prop; shows drill name (editable inline — Story 3.2 will add full editing; for this story, name is display-only after creation); shows category, difficulty, duration, position tags as read-only placeholders with "Edit" affordance (stub — not wired in 3.1); shows "Back to library" link
  - [ ] Create `frontend/src/app/(coach)/coach/drills/[id]/page.tsx` — server component wrapper; passes `params.id` to `<DrillDetailPage drillId={id} />`
  - [ ] Create `frontend/src/features/drill-library/components/drill-card.tsx` — minimal stub; accepts `drill: DrillDto` prop; renders a shadcn `Card` showing `drill.name` and `drill.category` (if set); full anatomy (duration chip, difficulty badge, role-specific slots) deferred to Story 3.4 — do NOT over-engineer
  - [ ] Create `frontend/src/features/drill-library/components/drill-list.tsx` — `'use client'`; accepts `drills: DrillDto[]` prop; renders a list using `<DrillCard>` for each item; shows empty state "Your drill library is empty" with "Create your first drill" CTA if array is empty; each card links to `/coach/drills/[id]`
  - [ ] Update `frontend/src/app/(coach)/coach/drills/page.tsx` — replace stub with `<DrillLibraryPage />` component that gets `teamId` via `useMyTeam()`, passes it to `useDrills`, and renders `<DrillList drills={drills} />`; include "New Drill" FAB/button that navigates to `/coach/drills/new`

- [ ] Task 11: Frontend — Vitest tests (AC: 1, 2, 3)
  - [ ] **Write ALL tests FIRST (red phase) before implementing Task 10 components**
  - [ ] Create `frontend/src/features/drill-library/components/create-drill-form.test.tsx`
  - [ ] Test: renders name input with autofocus
  - [ ] Test: shows "Drill name is required" inline error when name field is blurred with empty value — drill not submitted
  - [ ] Test: calls `createDrill.mutate` with trimmed name when name entered and Enter pressed
  - [ ] Test: calls `createDrill.mutate` with trimmed name when name entered and input blurred
  - [ ] Test: navigates to `/coach/drills/[id]` on mutation success
  - [ ] Test: does NOT call mutate when name is whitespace-only
  - [ ] Mock `useCreateDrill` using `vi.mock` hoisting pattern (same as `join-team-page.test.tsx`)
  - [ ] Mock `next/navigation` for `useRouter`

- [x] Task 12: Frontend — index.ts exports (AC: all)
  - [x] ~~Barrel export — removed by design decision; direct imports preferred over index.ts abstraction~~

## Dev Notes

### CRITICAL: Tests Before Code (Red-Green-Refactor)

Derek requires tests written before implementation. Follow strictly:
1. Write test file with all test cases first (red phase — they fail)
2. Run tests to confirm failure
3. Implement minimal code to make them pass (green)
4. Refactor while keeping tests green

For backend: write `DrillServiceTests.cs` BEFORE implementing `DrillService` methods.
For frontend: write `create-drill-form.test.tsx` BEFORE implementing `create-drill-form.tsx`.

### Backend — Drill Model Expansion

The `backend/Models/Drill.cs` is explicitly marked as a stub waiting for Story 3.1:
```csharp
// Minimal stub — full Drill properties (Description, DurationMinutes, etc.) added in Story 3.1
```
Add all optional fields directly to this model. `DeletedAt`, `CreatedAt`, `UpdatedAt` are already there — do not duplicate.

`PositionTags` should be stored as a PostgreSQL `text[]` array. In EF Core with Npgsql, this maps natively:
```csharp
public string[] PositionTags { get; set; } = [];
```
No special configuration needed — Npgsql handles `text[]` automatically.

### Backend — Soft Delete Global Query Filter Already in Place

`AppDbContext.cs` already has:
```csharp
modelBuilder.Entity<Drill>()
    .HasQueryFilter(d => d.DeletedAt == null);
```
This means ALL queries on `_context.Drills` automatically exclude soft-deleted drills. **Never add `Where(d => d.DeletedAt == null)` to queries** — it is redundant and violates architecture rules. Use `IgnoreQueryFilters()` only when intentionally querying deleted records (e.g., purge jobs, `TeamService.DeleteTeamAsync` already does this correctly).

### Backend — Drills are Coach-Owned, NOT Team-Owned

From architecture and UX spec: **Drills are coach-owned, not team-owned.** However, the current `Drill` model has `TeamId` as a foreign key. Per the epics, drills are scoped to a team in the data model but conceptually belong to the coach's library within that team context. This story stays with the team-scoped model as designed. Do NOT change the data model to user-scoped — that is a future architectural decision.

### Backend — ValidateTeamAccess Pattern

Every service method that accesses team data MUST call `ValidateTeamAccess` first:
```csharp
await ValidateTeamAccess(userId, teamId, ct);
```
This is defined in `BaseService.cs` and checks `TeamMembers` table. `DrillService` must extend `BaseService`. See `TeamService.cs` for the exact pattern.

### Backend — userId Extraction (Unchanged from Epic 2)

```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
if (userId == null) return Unauthorized();
```
This dual-claim pattern handles both Supabase JWT (`sub` claim) and standard JWT (`nameidentifier` claim). Already proven in `TeamsController` and `InvitesController`.

### Backend — DTO Naming Convention

Follow established DTOs pattern in `backend/DTOs/Teams/`:
- Response: `DrillDto.cs` in `backend/DTOs/Drills/`
- Create request: `CreateDrillRequest.cs` in `backend/DTOs/Drills/`
- Update request: defer to Story 3.2

### Backend — No BackgroundService in This Story

`DrillPurgeService.cs` (the 7-day auto-purge background service) is in the architecture plan but is **deferred to Story 3.3 (Delete a Drill)** where soft delete is the primary story concern. Do NOT implement it here.

### Backend — EF Migration Commands

Both migration commands run inside the Docker container using `docker exec` — this is the correct approach for this project per CLAUDE.md:

```bash
docker exec -it sports-backend dotnet ef migrations add AddDrillMetadataFields
docker exec -it sports-backend dotnet ef database update
```

The backend container connects to the PostgreSQL container via Docker networking (`Host=postgres`), so `database update` reaches the correct DB automatically.

`UseSnakeCaseNamingConvention()` is already configured globally in `Program.cs` — all C# property names auto-convert to snake_case in the DB. `DurationMinutes` → `duration_minutes`, `PositionTags` → `position_tags`, etc. Do NOT add any manual column name attributes.

### Backend — SetTimestamps Auto-Management

`AppDbContext.SetTimestamps()` automatically sets `CreatedAt` and `UpdatedAt` on `Added` state, and `UpdatedAt` on `Modified` state. **Do NOT set these manually** in `DrillService`. Just `_context.Drills.Add(drill)` then `SaveChangesAsync` — timestamps are handled.

### Backend — Problem Details Error Format

Architecture mandates RFC 7807 Problem Details via `AddProblemDetails()` (already configured in `Program.cs`). When returning errors, use the standard pattern:
- `BadRequest(new { detail = "..." })` for validation errors
- `Forbid()` for authorization failures (auto-formatted by ASP.NET Core)

### Frontend — Feature Folder Location

The drill library feature lives at `frontend/src/features/drill-library/` per the architecture document. The `drill-library` folder does NOT yet exist — this story creates it. Follow the exact structure from architecture:

```
frontend/src/features/drill-library/
├── components/
│   ├── create-drill-form.tsx        ← NEW (this story)
│   ├── create-drill-form.test.tsx   ← NEW (this story)
│   ├── drill-card.tsx               ← STUB (will be built out in 3.4)
│   ├── drill-detail-page.tsx        ← NEW (this story, partial)
│   └── drill-list.tsx               ← NEW (this story, basic)
├── hooks/
│   ├── useDrills.ts                 ← NEW (this story)
│   └── useCreateDrill.ts            ← NEW (this story)
├── types.ts                         ← NEW (this story)
└── index.ts                         ← NEW (this story)
```

### Frontend — App Router Page Locations

Architecture specifies these exact paths:
```
frontend/src/app/(coach)/coach/drills/
├── page.tsx           ← EXISTS (stub) — replace with drill library list
├── new/page.tsx       ← NEW — create drill page
└── [id]/
    └── page.tsx       ← NEW — drill detail page
```

The `(coach)` route group is protected by middleware (`/coach/:path*` matcher in `middleware.ts`). No changes to middleware needed.

### Frontend — teamId Availability

The coach's `teamId` must be obtained before making drill API calls. Check if `useTeamStore` already exists in `frontend/src/stores/`. If it does, use it. If not, use `useMyTeam` from `features/team-management` (which calls `GET /api/teams/my` — already built in Story 2.2). The `TeamDto` returned includes `id` (the teamId).

A coach with no team should see an empty state and a prompt to create a team before creating drills. Handle `teamId === null` gracefully — show "Create a team first to start building your drill library."

### Frontend — Progressive Save UX (Critical UX Requirement)

From UX spec Journey 2 and design principles:
- **Name is the ONLY required field** — drill is saved immediately on name entry
- Save trigger: name field blur OR Enter keypress (NOT a separate "Save" button)
- After save succeeds, navigate to drill detail page at `/coach/drills/[id]`
- On the detail page, all other fields (description, category, difficulty, duration, position tags) are displayed as placeholders — **Story 3.2 will wire their editing**; for this story they are read-only display or empty with an "Edit" stub

Do NOT build a traditional "fill in all fields then submit" form pattern. This violates the progressive disclosure architecture.

### Frontend — `react-hook-form` for Name Validation

`react-hook-form` is already installed (confirmed in architecture). Use it for the name field validation:
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<{ name: string }>()
```
Register the name field with `required: 'Drill name is required'` and `validate: (v) => v.trim().length > 0 || 'Drill name is required'`.

### Frontend — React Query Key Convention

From architecture communication patterns:
```typescript
['drills', teamId]   // useDrills list query
['drill', drillId]   // single drill query (for detail page — add in this story if detail page needs it, or defer)
```
`useCreateDrill` mutation: on success, invalidate `['drills', teamId]`.

### Frontend — apiFetch Usage

All API calls MUST use `apiFetch<T>` from `@/lib/api.ts`. Never use raw `fetch`. Never put auth token logic in queryFn directly — `apiFetch` handles it.

```typescript
// Correct:
import { apiFetch } from '@/lib/api'
const drills = await apiFetch<DrillDto[]>(`/api/drills?teamId=${teamId}`)

// WRONG:
const res = await fetch(`/api/drills?teamId=${teamId}`, { headers: { Authorization: ... } })
```

### Frontend — Vitest Mock Pattern

Follow the same `vi.mock` hoisting pattern established in Story 2.4's `join-team-page.test.tsx`:
```typescript
const mockMutate = vi.hoisted(() => vi.fn())
vi.mock('@/features/drill-library/hooks/useCreateDrill', () => ({
  useCreateDrill: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))
```
Mock `next/navigation` for `useRouter`:
```typescript
const mockPush = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))
```

### Frontend — shadcn Components to Install

These shadcn components are needed for this story and may not be installed yet. Install via:
```bash
npx shadcn@latest add input button card skeleton badge
```
**Never hand-write shadcn primitives.** Check `frontend/src/components/ui/` to see what is already installed before running installs.

### Frontend — DrillCard (Stub for This Story)

`DrillCard` is a custom component defined in architecture (extends shadcn `Card`). For Story 3.1, a minimal implementation showing `name` and `category` is sufficient. Full anatomy (duration chip, difficulty badge, role-specific slots) is built out in Story 3.4. Do not over-engineer it now.

### Frontend — Next.js 16 Async Params Pattern

From Story 2.4 completion notes: Next.js 16 uses async params for dynamic routes. For `[id]/page.tsx`:
```tsx
// Next.js 16 App Router pattern:
export default async function DrillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DrillDetailPage drillId={id} />
}
```

### Cross-Story Context

- **Story 3.2** (Edit a Drill) will add inline editing of all metadata fields on the drill detail page. Story 3.1 only needs to display those fields — no edit wiring required now.
- **Story 3.3** (Delete a Drill) adds soft-delete, the purge background service, and the delete confirmation dialog.
- **Story 3.4** (View Drill Library with Filtering) fully builds out `DrillCard` and `DrillLibraryPanel`.
- **Story 4.2** (Add Canvas to Drill) adds the whiteboard to the drill detail page — no canvas in Story 3.1.
- **Epic 8** (Deployment) begins only after Story 3.1 is marked done — this story is the beta-launch gate trigger.

### Project Structure Notes

New files:
```
backend/
├── Models/
│   └── Drill.cs                       ← MODIFIED (add optional fields)
├── DTOs/
│   └── Drills/
│       ├── DrillDto.cs                ← NEW
│       └── CreateDrillRequest.cs      ← NEW
├── Services/
│   ├── IDrillService.cs               ← NEW
│   └── DrillService.cs                ← NEW
└── Controllers/
    └── DrillsController.cs            ← NEW

backend.Tests/Services/
└── DrillServiceTests.cs               ← NEW

frontend/src/features/drill-library/
├── types.ts                           ← NEW
├── index.ts                           ← NEW
├── hooks/
│   ├── useDrills.ts                   ← NEW
│   └── useCreateDrill.ts              ← NEW
└── components/
    ├── create-drill-form.tsx          ← NEW
    ├── create-drill-form.test.tsx     ← NEW
    ├── drill-detail-page.tsx          ← NEW
    └── drill-list.tsx                 ← NEW

frontend/src/app/(coach)/coach/drills/
├── page.tsx                           ← MODIFIED (replace stub)
├── new/page.tsx                       ← NEW
└── [id]/
    └── page.tsx                       ← NEW
```

Modified (non-breaking):
- `backend/Program.cs` — register `DrillService` DI
- `backend/Data/AppDbContext.cs` — no changes needed; `Drills` DbSet already exists; `HasQueryFilter` already set

No changes to: `BaseService.cs` (already has `ValidateTeamAccess`), `middleware.ts`, existing coach routes, auth flows.

### References

- [Source: epics.md#Story-3.1] — Acceptance criteria, user story statement
- [Source: epics.md#Epic-3] — Epic objectives, FR17 (create drill with full metadata)
- [Source: architecture.md#Data-Architecture] — Soft delete global query filter, EF Core patterns
- [Source: architecture.md#Project-Structure] — Feature folder locations, controller/service/DTO structure
- [Source: architecture.md#Communication-Patterns] — `apiFetch`, React Query key conventions, mutation invalidation
- [Source: architecture.md#Enforcement-Guidelines] — ValidateTeamAccess requirement, no raw fetch, soft delete filter rule
- [Source: architecture.md#Naming-Patterns] — DTO naming, endpoint routes, TypeScript conventions
- [Source: ux-design-specification.md#Journey-2] — Drill creation flow: name-only save, progressive disclosure
- [Source: ux-design-specification.md#Component-Strategy] — DrillCard anatomy, TagBadge, shadcn install rule
- [Source: ux-design-specification.md#Journey-Patterns] — Progressive Disclosure Pattern, Never-lose-work principle
- [Source: 2-4-player-joins-team-via-invite-link.md#Dev-Notes] — vi.mock hoisting, Next.js 16 async params, SetTimestamps, UseSnakeCaseNamingConvention

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
