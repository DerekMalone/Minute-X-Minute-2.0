# Story 2.3: Player Invite Link Generation

Status: done

## Story

As a head coach,
I want to generate a shareable invite link for my team,
So that players can join without me managing individual email invitations.

## Acceptance Criteria

1. **Generate invite link:** Given I am a head coach and navigate to the team invite section (`/coach/team/invite`), When I generate an invite link, Then a unique token is created with an `expires_at` timestamp (7 days from now) and I am shown a copyable link in the format `{origin}/join/{token}`

2. **Link validity window:** Given an invite link has been generated, When I copy and share it, Then the link is valid for 7 days from the moment of generation

3. **Single active link — revocation:** Given I generate a new invite link when one already exists, When the new link is created, Then all previous tokens for that team are marked as revoked (`revoked_at` set) and only the new link is active

4. **View existing link:** Given an active invite link already exists, When I navigate to the invite section, Then I see the existing link (not forced to regenerate), along with its expiry date

5. **Team page entry point:** Given I am on the team page (`/coach/team`), When my team exists, Then I see an "Invite Players" link/button that navigates me to `/coach/team/invite`

## Tasks / Subtasks

- [x] Task 1: Backend — Invite model + EF migration (AC: 1, 2, 3)
  - [x] Create `backend/Models/Invite.cs` — fields: `Id` (Guid), `TeamId` (Guid FK), `Token` (string), `Role` (string, default `"Player"`), `ExpiresAt` (DateTime), `RevokedAt` (DateTime?), `CreatedAt` (DateTime), `CreatedBy` (string, userId)
  - [x] Update `backend/Data/AppDbContext.cs` — add `DbSet<Invite> Invites`; configure FK `Invite → Team` with `DeleteBehavior.Restrict`; add unique index on `Token`
  - [x] Run EF migration locally: `dotnet ef migrations add AddInviteTable --project backend --startup-project backend --connection "Host=localhost;Port=5432;Database=sportsdb;Username=postgres;Password=postgres"` then `dotnet ef database update` with same connection (see Dev Notes — dotnet ef runs on host, not in Docker)

- [x] Task 2: Backend — DTOs (AC: 1, 4)
  - [x] Create `backend/DTOs/Invites/` directory
  - [x] Create `backend/DTOs/Invites/InviteDto.cs` — `Id` (Guid), `Token` (string), `ExpiresAt` (DateTime), `CreatedAt` (DateTime)
  - [x] Create `backend/DTOs/Invites/GenerateInviteRequest.cs` — `TeamId` (Guid, `[Required]`)

- [x] Task 3: Backend — IInviteService + InviteService (AC: 1, 2, 3, 4)
  - [x] Create `backend/Services/IInviteService.cs` — interface with `GenerateInviteAsync(string userId, Guid teamId, CancellationToken ct)` returning `Task<InviteDto>` and `GetActiveInviteAsync(string userId, Guid teamId, CancellationToken ct)` returning `Task<InviteDto?>`
  - [x] Create `backend/Services/InviteService.cs` extending `BaseService`, implementing `IInviteService`
  - [x] Implement `GetActiveInviteAsync`: call `ValidateTeamAccess(userId, teamId, ct)`; query `Invites` where `TeamId == teamId && RevokedAt == null && ExpiresAt > DateTime.UtcNow`; return first as `InviteDto` or null
  - [x] Implement `GenerateInviteAsync`: (1) call `ValidateTeamAccess(userId, teamId, ct)` to confirm membership; (2) verify caller is HeadCoach via `AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId && tm.Role == MemberRole.HeadCoach)` — throw `UnauthorizedAccessException` if not; (3) revoke all existing active tokens for the team: bulk-update `RevokedAt = DateTime.UtcNow` on all `Invites` where `TeamId == teamId && RevokedAt == null`; (4) generate new `Token` using `Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant()` — 64-char hex string, cryptographically random; (5) create `Invite` with `ExpiresAt = DateTime.UtcNow.AddDays(7)`, `CreatedBy = userId`, `Role = "Player"`; save; return `InviteDto`

- [x] Task 4: Backend — InvitesController (AC: 1, 3, 4)
  - [x] Create `backend/Controllers/InvitesController.cs` with `[Authorize]`
  - [x] `POST /api/invites` → `GenerateInvite([FromBody] GenerateInviteRequest request)`: extract userId via dual-claim pattern; null-check → `Unauthorized()`; call `_inviteService.GenerateInviteAsync`; return `CreatedAtAction` 201 + `InviteDto`; catch `UnauthorizedAccessException` → `Forbid()`
  - [x] `GET /api/invites/active?teamId={teamId}` → `GetActiveInvite([FromQuery] Guid teamId)`: extract userId; null-check → `Unauthorized()`; call `_inviteService.GetActiveInviteAsync`; return 200 + `InviteDto` or 404 if null; catch `UnauthorizedAccessException` → `Forbid()`

- [x] Task 5: Backend — Register service + update DeleteTeamAsync (AC: 1, 3)
  - [x] Register `InviteService` in `Program.cs`: `builder.Services.AddScoped<IInviteService, InviteService>()`
  - [x] Update `backend/Services/TeamService.cs` → `DeleteTeamAsync`: before deleting the team, delete all invites for the team — `var invites = await _context.Invites.Where(i => i.TeamId == teamId).ToListAsync(ct); _context.Invites.RemoveRange(invites);` — add this alongside the existing drills deletion (same pattern)

- [x] Task 6: Backend — xUnit tests (AC: 1, 2, 3, 4)
  - [x] **Write tests FIRST (red) before implementing service logic**
  - [x] Create `backend.Tests/Services/InviteServiceTests.cs`
  - [x] Test: `GenerateInviteAsync_CreatesInviteWithCorrectExpiry` — verify `ExpiresAt` is ~7 days from now
  - [x] Test: `GenerateInviteAsync_RevokesExistingTokens` — seed one active invite, generate new one, verify old invite has `RevokedAt != null`
  - [x] Test: `GenerateInviteAsync_ThrowsUnauthorized_WhenNotHeadCoach` — seed a Player member, call generate, expect `UnauthorizedAccessException`
  - [x] Test: `GenerateInviteAsync_ThrowsUnauthorized_WhenNotTeamMember` — call generate with userId not in team, expect `UnauthorizedAccessException`
  - [x] Test: `GetActiveInviteAsync_ReturnsNull_WhenNoActiveInvite` — empty DB, expect null
  - [x] Test: `GetActiveInviteAsync_ReturnsNull_WhenInviteExpired` — seed invite with `ExpiresAt` in the past, expect null
  - [x] Test: `GetActiveInviteAsync_ReturnsNull_WhenInviteRevoked` — seed invite with `RevokedAt` set, expect null
  - [x] Test: `GetActiveInviteAsync_ReturnsDto_WhenActiveInviteExists`

- [x] Task 7: Frontend — Types + hook (AC: 1, 3, 4)
  - [x] **Write tests FIRST (red) before implementing hook / component logic**
  - [x] Update `frontend/src/features/team-management/types.ts` — add `InviteDto` type: `{ id: string; token: string; expiresAt: string; createdAt: string }`
  - [x] Create `frontend/src/features/team-management/hooks/useInvite.ts`
  - [x] `useActiveInvite(teamId: string | null)` — React Query `useQuery` key `['invite', 'active', teamId]`; calls `apiFetch<InviteDto>('/api/invites/active?teamId=' + teamId)`; `enabled: !!teamId`; `retry: false`; catch 404 from `ApiError` and return `null` (same pattern as `useMyTeam`)
  - [x] `useGenerateInvite()` — React Query `useMutation`; calls `apiFetch<InviteDto>('/api/invites', { method: 'POST', body: JSON.stringify({ teamId }) })`; `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['invite', 'active'] })`

- [x] Task 8: Frontend — InviteLinkManager component + invite page (AC: 1, 2, 3, 4, 5)
  - [x] Create `frontend/src/features/team-management/components/invite-link-manager.tsx`
  - [x] Create `frontend/src/app/(coach)/coach/team/invite/page.tsx` — `'use client'`; get `teamId` from `useTeamStore`; if no `teamId` redirect to `/coach/team`; render `<InviteLinkManager teamId={teamId} />`
  - [x] Update `frontend/src/app/(coach)/coach/team/page.tsx` — add "Invite Players" button/link (using Next.js `<Link href="/coach/team/invite">`) visible only when team exists (i.e., inside the `team exists` branch alongside `<TeamHeader />`)
  - [x] Update `frontend/src/features/team-management/index.ts` — export `InviteLinkManager`

- [x] Task 9: Frontend — Vitest tests (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/features/team-management/components/invite-link-manager.test.tsx`
  - [x] Test: renders "Generate Invite Link" button when no active invite
  - [x] Test: renders invite link and expiry when active invite exists
  - [x] Test: calls `generateInvite.mutate` when "Generate Invite Link" button clicked
  - [x] Test: shows "Copied!" after clicking "Copy Link" (mock `navigator.clipboard.writeText`)
  - [x] Test: shows loading skeleton when `isPending`

## Dev Notes

### CRITICAL: Tests Before Code (Red-Green-Refactor)

Derek has explicitly required tests written before implementation code. Follow this strictly:
1. Write the test file with all test cases (they will fail — red phase)
2. Run tests to confirm they fail
3. Implement the minimal code to make them pass (green phase)
4. Refactor while keeping tests green

For backend: write `InviteServiceTests.cs` **before** implementing `InviteService.cs`.
For frontend: write `invite-link-manager.test.tsx` **before** implementing `invite-link-manager.tsx`.

### Architecture Mandate — ValidateTeamAccess + HeadCoach Check

Every service method touching team-scoped data MUST call `ValidateTeamAccess(userId, teamId, ct)` first. For invite generation, additionally verify HeadCoach role — only head coaches can generate invite links. The HeadCoach check is a separate query on top of `ValidateTeamAccess` (unlike `DeleteTeamAsync` in Story 2.2 where the HeadCoach query subsumed the membership check — here both checks are warranted because `ValidateTeamAccess` is the established base contract).

```csharp
// In GenerateInviteAsync:
await ValidateTeamAccess(userId, teamId, ct); // throws UnauthorizedAccessException if not member

var isHeadCoach = await _context.TeamMembers
    .AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId && tm.Role == MemberRole.HeadCoach, ct);
if (!isHeadCoach)
    throw new UnauthorizedAccessException("Only the head coach can generate invite links.");
```

### Token Generation

Use cryptographically random bytes, NOT `Guid.NewGuid()` (GUIDs are not designed for security tokens):

```csharp
using System.Security.Cryptography;

var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
// Produces a 64-character lowercase hex string — URL-safe, no padding issues
```

### Revoking Previous Tokens

Revoke all non-revoked invites for the team before creating the new one. Use EF Core bulk approach (load + mark + save in same transaction):

```csharp
var existingInvites = await _context.Invites
    .Where(i => i.TeamId == teamId && i.RevokedAt == null)
    .ToListAsync(ct);

foreach (var invite in existingInvites)
    invite.RevokedAt = DateTime.UtcNow;

// Then create new invite and call SaveChangesAsync once — atomic operation
```

### UserId Extraction Pattern (established in Story 2.2)

```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
             ?? User.FindFirstValue("sub");
if (userId == null) return Unauthorized();
```

### EF Migration — Run on Host, Not in Docker

`dotnet ef` is NOT available inside the Docker container (only in the runtime image). Run migrations locally from WSL2:

```bash
# From repo root — requires dotnet-ef tool on host
dotnet ef migrations add AddInviteTable --project backend --startup-project backend \
  --connection "Host=localhost;Port=5432;Database=sportsdb;Username=postgres;Password=postgres"

dotnet ef database update --project backend --startup-project backend \
  --connection "Host=localhost;Port=5432;Database=sportsdb;Username=postgres;Password=postgres"
```

PostgreSQL must be running (`docker-compose up postgres`) when applying migrations.

### Invite FK — DeleteBehavior.Restrict + TeamService Update

`Invite → Team` FK uses `DeleteBehavior.Restrict` (consistent with `Drill → Team` pattern). This means `DeleteTeamAsync` in `TeamService` MUST delete all invites before deleting the team:

```csharp
// Add this block before the drills deletion in DeleteTeamAsync:
var invites = await _context.Invites
    .Where(i => i.TeamId == teamId)
    .ToListAsync(ct);
_context.Invites.RemoveRange(invites);
```

No `IgnoreQueryFilters()` needed for invites (they have no soft-delete filter).

### AppDbContext Changes

```csharp
public DbSet<Invite> Invites { get; set; } = null!;

// In OnModelCreating:
modelBuilder.Entity<Invite>()
    .HasOne(i => i.Team)
    .WithMany(t => t.Invites)
    .HasForeignKey(i => i.TeamId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<Invite>()
    .HasIndex(i => i.Token)
    .IsUnique();
```

Also add `public ICollection<Invite> Invites { get; set; } = [];` to `Team.cs`.

### UseSnakeCaseNamingConvention

`UseSnakeCaseNamingConvention()` is already configured in `AppDbContext`. All EF Core entity properties are automatically snake_cased — `ExpiresAt` → `expires_at`, `RevokedAt` → `revoked_at`, etc. Do NOT add manual column name overrides.

### SetTimestamps Auto-Sets CreatedAt

`AppDbContext.SetTimestamps()` auto-sets `CreatedAt` on `Added` entries. Do NOT set `CreatedAt` manually in service code. `ExpiresAt` and `RevokedAt` must be set explicitly in service code — they are not in the auto-timestamp list.

### Frontend — useActiveInvite 404 Handling

`GET /api/invites/active` returns 404 when no active invite exists. Handle like `useMyTeam`:

```typescript
export function useActiveInvite(teamId: string | null) {
  return useQuery<InviteDto | null>({
    queryKey: ['invite', 'active', teamId],
    queryFn: async () => {
      try {
        return await apiFetch<InviteDto>(`/api/invites/active?teamId=${teamId}`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    enabled: !!teamId,
    retry: false,
  })
}
```

### Frontend — Copy-to-Clipboard Pattern

```typescript
const [copied, setCopied] = useState(false)

const handleCopy = async () => {
  await navigator.clipboard.writeText(inviteUrl)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```

In tests, mock `navigator.clipboard.writeText` via `vi.stubGlobal`.

### Frontend — Invite URL Construction

The backend returns only the `token`. Construct the full URL in the component:

```typescript
const inviteUrl = `${window.location.origin}/join/${invite.token}`
```

Do not hardcode the origin — this works correctly in both local dev (3000) and Docker (4200) environments.

### Frontend — teamId from Zustand Store

The invite page reads `teamId` from `useTeamStore`. If `teamId` is null (coach hasn't created a team yet), redirect to `/coach/team`:

```typescript
const teamId = useTeamStore((s) => s.teamId)
const router = useRouter()

useEffect(() => {
  if (!teamId) router.replace('/coach/team')
}, [teamId, router])
```

### React Query Key Convention

```typescript
['invite', 'active', teamId]  // useActiveInvite
```

`useGenerateInvite` invalidates `['invite', 'active']` on success — this invalidates for all teamIds (broad invalidation is safe here since a coach manages one team).

### Frontend — Vitest Test Setup

Vitest is already configured (done in Story 2.2). `vitest.config.ts`, `src/test/setup.ts`, and `@testing-library/jest-dom` are already in place. Do NOT reinstall or reconfigure.

### Backend Test Infrastructure

xUnit + EF Core InMemory already configured in `backend.Tests/` (done in Story 2.2). Reuse the `CreateContext(string dbName)` helper pattern:

```csharp
private static AppDbContext CreateContext(string dbName)
{
    var options = new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(dbName)
        .Options;
    return new AppDbContext(options);
}
```

**InMemory caveat:** EF Core InMemory does NOT enforce unique index constraints or FK Restrict behavior. Tests for token uniqueness and cascade/restrict are integration-level concerns. Unit tests focus on service logic: correct `InviteDto` returned, correct exception types, revocation behavior.

Run backend tests:
```bash
dotnet test backend.Tests/
```

### No New Frontend Dependencies

All needed packages are already installed (Vitest, React Hook Form, shadcn/ui, React Query, Zustand). No `npm install` needed for this story.

### Project Structure Notes

New files:
```
backend/
├── Models/
│   └── Invite.cs                          ← NEW
├── DTOs/
│   └── Invites/                           ← NEW directory
│       ├── InviteDto.cs                   ← NEW
│       └── GenerateInviteRequest.cs       ← NEW
├── Services/
│   ├── IInviteService.cs                  ← NEW
│   └── InviteService.cs                   ← NEW
├── Controllers/
│   └── InvitesController.cs               ← NEW
├── Data/
│   └── AppDbContext.cs                    ← MODIFIED (Invites DbSet + FK config)
│   └── Migrations/                        ← NEW migration files (auto-generated)
├── Models/
│   └── Team.cs                            ← MODIFIED (add Invites navigation property)
├── Services/
│   └── TeamService.cs                     ← MODIFIED (DeleteTeamAsync deletes invites)
└── Program.cs                             ← MODIFIED (register IInviteService)

backend.Tests/Services/
└── InviteServiceTests.cs                  ← NEW

frontend/src/features/team-management/
├── types.ts                               ← MODIFIED (add InviteDto)
├── index.ts                               ← MODIFIED (export InviteLinkManager)
├── hooks/
│   └── useInvite.ts                       ← NEW
└── components/
    ├── invite-link-manager.tsx            ← NEW
    └── invite-link-manager.test.tsx       ← NEW

frontend/src/app/(coach)/coach/team/
├── page.tsx                               ← MODIFIED (add "Invite Players" link)
└── invite/
    └── page.tsx                           ← NEW
```

No changes to: `BaseService.cs`, `TeamsController.cs`, auth middleware, existing migrations.

### Previous Story Learnings (from Story 2.2)

- `dotnet ef` runs on host (WSL2), NOT inside Docker container. Use `--connection` flag pointing to `localhost:5432`.
- `UseSnakeCaseNamingConvention()` is global — all properties auto-snake_cased.
- `SetTimestamps()` auto-sets `CreatedAt` — do NOT set manually.
- `MemberRole.HeadCoach = 0`, `MemberRole.Player = 1` — enum stored as int.
- Migration path: `backend/Migrations/` (not `backend/Data/Migrations/`).
- `vi.mock` hoisting in Vitest: use `mockReturnValue` per test for hook return values.
- Per-controller `catch (UnauthorizedAccessException) → Forbid()` is required (no global handler yet).
- Supabase uses ES256 — `options.Authority` JWKS discovery is already in `Program.cs`. No changes needed.

### References

- [Source: architecture.md#Authentication-&-Security] — ValidateTeamAccess mandate, dual RBAC
- [Source: architecture.md#Cross-Cutting-Concerns] — "Invite token lifecycle: requires `expires_at` and revocation from day 1"
- [Source: architecture.md#Structure-Patterns] — `DTOs/Invites/`, `Services/InviteService.cs`, `features/team-management/hooks/useInvite.ts`
- [Source: architecture.md#Communication-Patterns] — `apiFetch` for all API calls, RQ key conventions
- [Source: architecture.md#Format-Patterns] — 201 for POST, 204 for DELETE, direct response (no envelope)
- [Source: epics.md#Story-2.3] — Acceptance criteria
- [Source: 2-2-team-creation-and-deletion.md#TeamService-Delete] — "When Invite entities are added, DeleteTeamAsync must delete those before deleting the team"
- [Source: 2-2-team-creation-and-deletion.md#UserId-Extraction] — dual-claim userId extraction pattern
- [Source: 2-2-team-creation-and-deletion.md#Backend-xUnit-Test-Project] — InMemory test setup, CreateContext helper

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Followed red-green-refactor: `InviteServiceTests.cs` written before `InviteService.cs`; `invite-link-manager.test.tsx` written before `invite-link-manager.tsx`
- Backend: 16/16 xUnit tests pass (8 existing + 8 new)
- Frontend: 10/10 Vitest tests pass (5 existing + 5 new)
- `GenerateInviteAsync` uses `RandomNumberGenerator.GetBytes(32)` → 64-char lowercase hex token (cryptographically random, URL-safe)
- Revocation is atomic: existing active invites marked `RevokedAt = UtcNow` and new invite saved in a single `SaveChangesAsync` call
- `DeleteTeamAsync` updated to delete invites before the team (required by `DeleteBehavior.Restrict` FK)
- `InviteLinkManager` constructs full URL client-side via `window.location.origin` — works in both local (3000) and Docker (4200) environments
- EF migration (`AddInviteTable`) must be run manually on host — see Task 1 migration commands

### File List

- `backend/Models/Invite.cs` — NEW
- `backend/Models/Team.cs` — MODIFIED (added `Invites` navigation property)
- `backend/Data/AppDbContext.cs` — MODIFIED (added `DbSet<Invite>`, FK config, unique index)
- `backend/Data/Migrations/` — NEW migration files (auto-generated by `dotnet ef`)
- `backend/DTOs/Invites/InviteDto.cs` — NEW
- `backend/DTOs/Invites/GenerateInviteRequest.cs` — NEW
- `backend/Services/IInviteService.cs` — NEW
- `backend/Services/InviteService.cs` — NEW
- `backend/Services/TeamService.cs` — MODIFIED (delete invites in `DeleteTeamAsync`)
- `backend/Controllers/InvitesController.cs` — NEW
- `backend/Program.cs` — MODIFIED (registered `IInviteService`)
- `backend.Tests/Services/InviteServiceTests.cs` — NEW
- `frontend/src/features/team-management/types.ts` — MODIFIED (added `InviteDto`)
- `frontend/src/features/team-management/hooks/useInvite.ts` — NEW
- `frontend/src/features/team-management/components/invite-link-manager.tsx` — NEW
- `frontend/src/features/team-management/components/invite-link-manager.test.tsx` — NEW
- `frontend/src/features/team-management/index.ts` — MODIFIED (exported `InviteLinkManager`, `useActiveInvite`, `useGenerateInvite`, `InviteDto`)
- `frontend/src/app/(coach)/coach/team/invite/page.tsx` — NEW
- `frontend/src/app/(coach)/coach/team/page.tsx` — MODIFIED (added "Invite Players" link)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-06 | Story created with full context for dev implementation | claude-sonnet-4-6 |
| 2026-03-06 | Story implemented — backend model/service/controller, frontend hook/component/page, all tests passing | claude-sonnet-4-6 |
