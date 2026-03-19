# Story 2.5: Roster Management

Status: ready-for-dev

> **Infra Note:** `infra-1-cloud-hosting-migration` is in progress and must be completed before beta. If this story introduces any new backend or frontend environment variables, document them in that ticket's Task 3/4 env var lists.

## Story

As a coach,
I want to view and manage my team roster,
So that I can see who is on my team, their roles, and remove members when needed.

## Acceptance Criteria

1. **View roster:** Given I navigate to the team page, When the page loads and I have a team, Then I see a list of all team members showing their email, role (Head Coach / Player), and join date.

2. **Remove player with confirmation:** Given I select a player from the roster and click Remove, When I confirm the removal in a confirmation dialog, Then the player's TeamMember record is hard-deleted and they no longer appear in the roster list.

3. **Cannot remove Head Coach:** Given I am the Head Coach, When I attempt to trigger removal on a Head Coach member (myself), Then the action is blocked — the Remove button is not shown for the Head Coach row.

## Tasks / Subtasks

- [ ] Task 1: Backend — Prerequisites: Email column + join patch (AC: 1)
  - [ ] **⚠️ RESOLVE BEFORE CODING: Verify whether `TeamMember.JoinedAt` maps to `joined_at` or `created_at` in `AppDbContext` before writing any service code — see Dev Notes**
  - [ ] Add `Email` (string, non-nullable) column to `TeamMember` model (`backend/Models/TeamMember.cs`)
  - [ ] Create EF migration: `dotnet ef migrations add AddEmailToTeamMember` (run inside Docker container)
  - [ ] Patch Story 2.4 join flow: in `InviteService` (or wherever `TeamMember` is created on join), populate `Email` from the authenticated user's Supabase JWT claim (`email` claim) at the time of joining
  - [ ] Create `backend/DTOs/Teams/RosterMemberDto.cs` — `Id` (Guid), `Email` (string), `Role` (string), `JoinedAt` (DateTime)

- [ ] Task 2: Backend — xUnit tests FIRST — red phase (AC: 1, 2, 3)
  - [ ] **Write ALL test cases before implementing Task 3 service methods — run tests to confirm they fail**
  - [ ] Add to `backend.Tests/Services/TeamServiceTests.cs` (reuse existing `CreateContext` helper and `CreateTeamAsync` for seeding; seed `TeamMember.Email` with a test email string):
  - [ ] Test: `GetRosterAsync_ReturnsAllMembers_WhenCoachHasTeam` — seed team via `CreateTeamAsync`; add a Player `TeamMember` directly; call `GetRosterAsync`; assert count == 2 (coach + player), roles and emails correct
  - [ ] Test: `GetRosterAsync_ThrowsUnauthorized_WhenUserNotTeamMember` — seed team; call `GetRosterAsync` with a userId NOT in the team; assert `UnauthorizedAccessException`
  - [ ] Test: `RemoveMemberAsync_RemovesPlayer_WhenCallerIsHeadCoach` — seed team + player; call `RemoveMemberAsync(coachId, teamId, playerMemberId)`; assert `TeamMembers.CountAsync() == 1` (only coach remains)
  - [ ] Test: `RemoveMemberAsync_ThrowsInvalidOp_WhenRemovingHeadCoach` — seed team; try to remove the HeadCoach's own memberId; assert `InvalidOperationException`
  - [ ] Test: `RemoveMemberAsync_ThrowsUnauthorized_WhenCallerIsNotHeadCoach` — seed team + player; call `RemoveMemberAsync(playerId, teamId, anyMemberId)`; assert `UnauthorizedAccessException`
  - [ ] Test: `RemoveMemberAsync_ThrowsKeyNotFound_WhenMemberDoesNotExist` — seed team; call with non-existent memberId (Guid.NewGuid()); assert `KeyNotFoundException`

- [ ] Task 3: Backend — Extend ITeamService + TeamService (AC: 1, 2, 3)
  - [ ] Add `GetRosterAsync(string userId, Guid teamId, CancellationToken ct) → Task<List<RosterMemberDto>>` to `ITeamService`
  - [ ] Add `RemoveMemberAsync(string coachId, Guid teamId, Guid memberId, CancellationToken ct) → Task` to `ITeamService`
  - [ ] Implement `GetRosterAsync` in `TeamService`: call `ValidateTeamAccess(userId, teamId, ct)` first; query `_context.TeamMembers.Where(tm => tm.TeamId == teamId)`; project to `RosterMemberDto { Id, Email, Role = tm.Role.ToString(), JoinedAt = tm.JoinedAt }`; return as list
  - [ ] Implement `RemoveMemberAsync` in `TeamService`: (1) verify caller is HeadCoach for teamId — `AnyAsync(tm => tm.UserId == coachId && tm.TeamId == teamId && tm.Role == MemberRole.HeadCoach)` — throw `UnauthorizedAccessException` if not; (2) load `TeamMember` by memberId + teamId — throw `KeyNotFoundException` if not found; (3) if `member.Role == MemberRole.HeadCoach` → throw `InvalidOperationException("You cannot remove yourself as Head Coach")`; (4) `_context.TeamMembers.Remove(member)`; (5) `SaveChangesAsync`

- [ ] Task 4: Backend — Extend TeamsController (AC: 1, 2, 3)
  - [ ] Add `GET /api/teams/{teamId:guid}/members` → inherits class-level `[Authorize]`; extract userId via dual-claim pattern; null-check → `Unauthorized()`; call `GetRosterAsync(userId, teamId)`; return `Ok(roster)`; catch `UnauthorizedAccessException` → `Forbid()`
  - [ ] Add `DELETE /api/teams/{teamId:guid}/members/{memberId:guid}` → inherits `[Authorize]`; extract userId; null-check → `Unauthorized()`; call `RemoveMemberAsync(userId, teamId, memberId)`; return `NoContent()`; catch `UnauthorizedAccessException` → `Forbid()`; catch `KeyNotFoundException` → `NotFound()`; catch `InvalidOperationException ex` → `Conflict(new { detail = ex.Message })`

- [ ] Task 5: Frontend — Types + new hooks (AC: 1, 2, 3)
  - [ ] **Write tests FIRST (red phase in Task 7) before implementing hook/component logic**
  - [ ] Add to `frontend/src/features/team-management/types.ts` — `RosterMemberDto: { id: string; email: string; role: string; joinedAt: string }`
  - [ ] Add to `frontend/src/features/team-management/hooks/useTeam.ts`:
    - `useRoster(teamId: string | null)` — React Query `useQuery`, key `['roster', teamId]`; calls `apiFetch<RosterMemberDto[]>('/api/teams/' + teamId + '/members')`; `enabled: !!teamId`; `retry: false`
    - `useRemoveMember()` — `useMutation`; calls `apiFetch('/api/teams/' + teamId + '/members/' + memberId, { method: 'DELETE' })`; `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roster', teamId] })`; mutationFn accepts `{ teamId: string; memberId: string }`

- [ ] Task 6: Frontend — RosterList + MemberRow components (AC: 1, 2, 3)
  - [ ] Create `frontend/src/features/team-management/components/member-row.tsx` — `'use client'`; props: `{ member: RosterMemberDto; currentUserEmail: string; teamId: string }`; renders one row: `member.email` with "You" badge if `member.email === currentUserEmail`, role badge (`Head Coach` / `Player`), formatted joinedAt date; if `member.role !== 'HeadCoach'` render a Remove button that opens a shadcn `Dialog` confirm; on confirm call `useRemoveMember().mutate({ teamId, memberId: member.id })`; use `Button variant="destructive"` for the confirm action (same pattern as `TeamHeader`)
  - [ ] Create `frontend/src/features/team-management/components/roster-list.tsx` — `'use client'`; props: `{ teamId: string }`; uses `useRoster(teamId)` and Supabase `createClient().auth.getSession()` in a `useEffect` to get `currentUserEmail` (`session?.user?.email`); renders loading skeleton while `isPending`; renders list of `<MemberRow />` for each member; no empty state expected (coach always exists)
  - [ ] **Confirmation dialog pattern**: use shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button` — identical to `team-header.tsx` pattern

- [ ] Task 7: Frontend — Vitest tests FIRST — red phase (AC: 1, 2, 3)
  - [ ] **Write ALL tests before implementing Task 6 components — run tests to confirm they fail**
  - [ ] Create `frontend/src/features/team-management/components/roster-list.test.tsx`
    - [ ] Test: renders loading skeleton while `useRoster` is pending
    - [ ] Test: renders a row for each member returned by `useRoster`
    - [ ] Test: renders "Head Coach" role label for coach member
    - [ ] Test: renders "Player" role label for player member
    - [ ] Test: Remove button NOT rendered for the Head Coach row
    - [ ] Test: Remove button IS rendered for Player rows
  - [ ] Create `frontend/src/features/team-management/components/member-row.test.tsx`
    - [ ] Test: renders member email
    - [ ] Test: renders "You" badge when `member.email === currentUserEmail`
    - [ ] Test: renders role badge ("Head Coach" / "Player")
    - [ ] Test: Remove button not rendered when `member.role === 'HeadCoach'`
    - [ ] Test: clicking Remove opens the confirmation dialog
    - [ ] Test: confirming removal calls `useRemoveMember().mutate` with correct `{ teamId, memberId }`
    - [ ] Test: clicking Cancel closes the dialog without calling mutate

- [ ] Task 8: Frontend — Update team page and exports (AC: all)
  - [ ] Update `frontend/src/app/(coach)/coach/team/page.tsx` — import `RosterList`; below `<InviteLinkManager>` (or below the existing team content block), render `<RosterList teamId={team.id} />` only when `team` exists
  - [ ] Update `frontend/src/features/team-management/index.ts` — export `RosterList`, `MemberRow`, `useRoster`, `useRemoveMember`, `RosterMemberDto`

## Dev Notes

### CRITICAL: Tests Before Code (Red-Green-Refactor)

Tests must be written before implementation, per project standard:
1. Write test file with all test cases (red — they fail)
2. Run tests to confirm failure
3. Implement minimal code to make them pass (green)
4. Refactor while keeping tests green

Backend: add new `TeamServiceTests` cases BEFORE implementing `GetRosterAsync`/`RemoveMemberAsync`.
Frontend: write `roster-list.test.tsx` BEFORE implementing `roster-list.tsx`.

### Backend — Email Stored at Join Time (MVP Identifier)

`TeamMember` is extended with an `Email` column populated from the player's Supabase JWT `email` claim when they join via invite link (Story 2.4 patch in Task 1). This is the displayed identifier for roster members.

`RosterMemberDto` returns `Email` as the member identifier. On the frontend:
- If `member.email === currentUserEmail` (the logged-in coach), display their email with a "You" badge.
- For players, display their email directly.

> **⚠️ Future Story Flag — Player Name Onboarding**
> Email is the MVP identifier. The preferred long-term solution is to collect first and last name as part of the onboarding flow immediately after account creation (before the player lands in the app). This requires a dedicated onboarding step — a new story scoped to Epic 1 or Epic 2. Jersey number should also be captured here or assigned by the coach. This flag should be converted to a backlog story before Epic 2 retrospective.

### Backend — RemoveMemberAsync Is a Hard Delete

`TeamMember` has no `deleted_at` column — it is not a soft-delete entity. Use `_context.TeamMembers.Remove(member)` directly. No `IgnoreQueryFilters()` needed.

```csharp
var member = await _context.TeamMembers
    .FirstOrDefaultAsync(tm => tm.Id == memberId && tm.TeamId == teamId, ct);
if (member == null)
    throw new KeyNotFoundException("Team member not found.");
if (member.Role == MemberRole.HeadCoach)
    throw new InvalidOperationException("You cannot remove yourself as Head Coach");
_context.TeamMembers.Remove(member);
await _context.SaveChangesAsync(ct);
```

### Backend — ValidateTeamAccess in GetRosterAsync

`GetRosterAsync` must call `ValidateTeamAccess` even though it's a read operation. Any team member (coach or player) who passes team access validation could theoretically call this. For MVP, the frontend only exposes this to coaches, but the service layer enforces the access check.

### Backend — RosterMemberDto JoinedAt Field

> **⚠️ RESOLVE BEFORE WRITING ANY CODE:** `SetTimestamps()` auto-sets `CreatedAt` but `TeamMember` also has a `JoinedAt` property. Verify in `AppDbContext` and `TeamMember.cs` whether the DB column is `joined_at` or `created_at` and that the EF mapping is correct. Getting this wrong silently returns null or default DateTime. Check this first — it takes 30 seconds to confirm.

```csharp
public class RosterMemberDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}
```

### Backend — UserId Extraction Pattern (unchanged from 2.2–2.4)

```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
if (userId == null) return Unauthorized();
```

### Backend — No New EF Migration Required

`TeamMember` table already exists from Story 2.2. `GetRosterAsync` is a read; `RemoveMemberAsync` is a hard delete. No schema changes.

### Backend — Running Tests

```bash
dotnet test backend.Tests/
```

Runs on HOST (WSL2), not inside Docker. This is the established pattern.

### Frontend — useRemoveMember Mutation Shape

The mutation needs both `teamId` and `memberId` to build the URL. Pass them as an object:

```typescript
export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      apiFetch(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['roster', teamId] })
    },
  })
}
```

### Frontend — React Query Key Convention

```typescript
['roster', teamId]  // useRoster
```

### Frontend — Getting currentUserEmail in RosterList

Use Supabase client-side session in a `useEffect` to get the logged-in user's email. This avoids passing it as a prop through the page tree:

```typescript
const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
useEffect(() => {
  const supabase = createClient()
  supabase.auth.getSession().then(({ data: { session } }) => {
    setCurrentUserEmail(session?.user?.email ?? null)
  })
}, [])
```

### Frontend — Confirmation Dialog Pattern

Follow the same pattern as `team-header.tsx` (already implemented):
- Local `useState` for `isConfirmOpen`
- shadcn `Dialog` / `DialogContent` / `DialogHeader` / `DialogFooter`
- `Button variant="destructive"` for the confirm action
- `Button variant="ghost"` for Cancel

Per-row state: each `MemberRow` manages its own `isConfirmOpen` state. Do not hoist to `RosterList`.

### Frontend — No New npm Dependencies

All needed packages already installed. No `npm install` needed.

### Frontend — Vitest Mocking Pattern

Mock `useRoster` and `useRemoveMember` using `vi.hoisted` + `vi.mock` pattern established in Story 2.4:

```typescript
const mockUseRoster = vi.hoisted(() => vi.fn())
const mockUseRemoveMember = vi.hoisted(() => vi.fn())

vi.mock('@/features/team-management/hooks/useTeam', () => ({
  useRoster: mockUseRoster,
  useRemoveMember: mockUseRemoveMember,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { email: 'coach@example.com' } } } }) },
  }),
}))
```

Set up per-test return values via `mockUseRoster.mockReturnValue({ data: [...], isPending: false })`.

For `member-row.test.tsx`, pass props directly — no hook mocking needed for email/role/joinedAt rendering tests. Mock `useRemoveMember` only for the remove/confirm tests.

### Project Structure Notes

New files:
```
backend/
└── DTOs/
    └── Teams/
        └── RosterMemberDto.cs          ← NEW

backend/Services/
├── ITeamService.cs                     ← MODIFIED (add GetRosterAsync, RemoveMemberAsync)
└── TeamService.cs                      ← MODIFIED (implement new methods)

backend/Controllers/
└── TeamsController.cs                  ← MODIFIED (add GET /members, DELETE /members/{memberId})

backend.Tests/Services/
└── TeamServiceTests.cs                 ← MODIFIED (add 6 new test cases)

frontend/src/features/team-management/
├── types.ts                            ← MODIFIED (add RosterMemberDto)
├── index.ts                            ← MODIFIED (export new components, hooks, type)
├── hooks/
│   └── useTeam.ts                      ← MODIFIED (add useRoster, useRemoveMember)
└── components/
    ├── roster-list.tsx                 ← NEW
    ├── roster-list.test.tsx            ← NEW
    ├── member-row.tsx                  ← NEW
    └── member-row.test.tsx             ← NEW

frontend/src/app/(coach)/coach/team/
└── page.tsx                            ← MODIFIED (add <RosterList teamId={team.id} />)
```

No changes to: `BaseService.cs`, `AppDbContext.cs`, `InviteService.cs`, `InvitesController.cs`, EF migrations, existing tests, `join-team-page.tsx`, player routes, middleware.

### Alignment with Architecture

- Route `src/app/(coach)/coach/team/page.tsx` is specified in architecture as "Roster management (FR15–FR16)" — already the target page. No new route needed.
- Components `roster-list.tsx` and `member-row.tsx` are explicitly named in the architecture's project structure (`features/team-management/components/`).
- API endpoints use nested resource pattern: `/api/teams/{teamId}/members` — consistent with architecture's RESTful conventions.
- `ValidateTeamAccess` called in every service method — required by architecture enforcement guidelines.
- Test files co-located with source — required by architecture.

### References

- [Source: architecture.md#Project-Structure] — `roster-list.tsx`, `member-row.tsx` named; route `(coach)/team/page.tsx` is FR15-FR16
- [Source: architecture.md#API-Naming] — nested resource: `/api/teams/{teamId}/members`
- [Source: architecture.md#Enforcement-Guidelines] — `ValidateTeamAccess` required; `apiFetch` mandatory; co-locate tests
- [Source: architecture.md#Data-Boundaries] — hard delete for TeamMember (no soft delete on this entity)
- [Source: epics.md#Story-2.5] — Acceptance criteria; email used as MVP identifier; player name onboarding flagged for future story
- [Source: 2-4-player-joins-team-via-invite-link.md#Dev-Notes] — xUnit InMemory test patterns; Vitest vi.hoisted mock pattern; MemberRole enum values; dual-claim userId extraction
- [Source: backend/Models/TeamMember.cs] — `Id`, `UserId`, `Role`, `JoinedAt` fields confirmed
- [Source: backend/Services/TeamService.cs] — existing service patterns to follow
- [Source: backend/Controllers/TeamsController.cs] — existing controller patterns to follow
- [Source: frontend/src/features/team-management/components/team-header.tsx] — confirmation dialog pattern (Dialog + destructive Button)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
