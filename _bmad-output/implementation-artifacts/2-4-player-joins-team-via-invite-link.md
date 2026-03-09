# Story 2.4: Player Joins Team via Invite Link

Status: done

## Story

As a player,
I want to join a team by tapping an invite link,
So that I can access my team's practice plans and drill library.

## Acceptance Criteria

1. **Valid link — pre-auth info display:** Given I tap a valid invite link and I do not have an account, When the `/join/[token]` page loads, Then I see the team name before signing up and am prompted to create an account or sign in.

2. **Join on auth:** Given I complete account creation or sign-in after tapping a valid invite link, When authentication completes and I return to `/join/[token]`, Then I am added to the team as a Player and redirected to `/player/home`.

3. **Expired or revoked link:** Given I tap an expired or revoked invite link, When the `/join/[token]` page loads, Then I see "This invite link has expired or is no longer valid" and no team join occurs.

4. **Already a member — idempotency:** Given I am already a member of the team and tap the invite link again, When authentication completes, Then I am redirected to `/player/home` without a duplicate membership being created.

## Tasks / Subtasks

- [x] Task 1: Backend — New DTOs (AC: 1, 2, 3)
  - [x] Create `backend/DTOs/Invites/ValidateInviteDto.cs` — `TeamId` (Guid), `TeamName` (string)
  - [x] Create `backend/DTOs/Invites/RedeemInviteRequest.cs` — `Token` (string, `[Required]`)

- [x] Task 2: Backend — Extend IInviteService + InviteService (AC: 1, 2, 3, 4)
  - [x] **Write tests FIRST (red) in Task 4 before implementing these methods**
  - [x] Add `ValidateInviteAsync(string token, CancellationToken ct) → Task<ValidateInviteDto>` to `IInviteService` interface
  - [x] Add `RedeemInviteAsync(string userId, string token, CancellationToken ct) → Task<Guid>` to `IInviteService` interface
  - [x] Implement `ValidateInviteAsync` in `InviteService`: load `Invite` with `.Include(i => i.Team)` where `Token == token && RevokedAt == null && ExpiresAt > DateTime.UtcNow`; throw `KeyNotFoundException("Invite not found or expired.")` if null; return `ValidateInviteDto { TeamId, TeamName = invite.Team.Name }`
  - [x] Implement `RedeemInviteAsync` in `InviteService`: (1) find active invite by token (`RevokedAt == null && ExpiresAt > DateTime.UtcNow`) — throw `InvalidOperationException("Invite is invalid or has expired.")` if not found; (2) check idempotency — `AnyAsync(tm => tm.UserId == userId && tm.TeamId == invite.TeamId)` — if already member, return `invite.TeamId` without adding; (3) create `TeamMember { Id = Guid.NewGuid(), TeamId = invite.TeamId, UserId = userId, Role = MemberRole.Player }`; (4) `SaveChangesAsync`; (5) return `invite.TeamId`
  - [x] **IMPORTANT**: Do NOT call `ValidateTeamAccess` in `RedeemInviteAsync` — the user is not a member yet; that is the point of this method

- [x] Task 3: Backend — Extend InvitesController (AC: 1, 2, 3, 4)
  - [x] Add `GET /api/invites/validate?token={token}` → `[AllowAnonymous]` (overrides class-level `[Authorize]`); extract `token` from `[FromQuery] string token`; null/empty check → `BadRequest()`; call `ValidateInviteAsync`; return 200 + `ValidateInviteDto`; catch `KeyNotFoundException` → `NotFound()`
  - [x] Add `POST /api/invites/redeem` → inherits class-level `[Authorize]`; extract `userId` via dual-claim pattern; null-check → `Unauthorized()`; call `RedeemInviteAsync(userId, request.Token)`; return `Ok(new { teamId = result })`; catch `InvalidOperationException` → `Conflict("Invite is no longer valid.")`

- [x] Task 4: Backend — xUnit tests (AC: 1, 2, 3, 4)
  - [x] **Write ALL test cases first (red phase) before implementing Task 2 service methods**
  - [x] Add to `backend.Tests/Services/InviteServiceTests.cs` (reuse `CreateContext` + `SeedTeamWithHeadCoach` helpers):
  - [x] Test: `ValidateInviteAsync_ReturnsDto_WhenTokenValid` — seed active invite with Include-able Team; assert `TeamId` and `TeamName` correct
  - [x] Test: `ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenExpired` — seed invite with `ExpiresAt` in past; assert `KeyNotFoundException`
  - [x] Test: `ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenRevoked` — seed invite with `RevokedAt` set; assert `KeyNotFoundException`
  - [x] Test: `ValidateInviteAsync_ThrowsKeyNotFound_WhenTokenNotFound` — call with nonexistent token; assert `KeyNotFoundException`
  - [x] Test: `RedeemInviteAsync_AddsPlayerMembership_WhenValidToken` — seed head coach + active invite; call redeem with new `userId`; assert `TeamMember` record exists with `Role == MemberRole.Player`
  - [x] Test: `RedeemInviteAsync_IsIdempotent_WhenAlreadyMember` — seed head coach + active invite + existing Player TeamMember for same `userId`; call redeem; assert no duplicate TeamMember created; assert returns correct `teamId`
  - [x] Test: `RedeemInviteAsync_ThrowsInvalidOp_WhenTokenExpired` — seed invite with past `ExpiresAt`; assert `InvalidOperationException`
  - [x] Test: `RedeemInviteAsync_ThrowsInvalidOp_WhenTokenRevoked` — seed invite with `RevokedAt` set; assert `InvalidOperationException`
  - [x] InMemory DB caveat: EF Core InMemory does NOT enforce FK constraints — test Team seeding still needed for `ValidateInviteAsync` because `.Include(i => i.Team)` must be able to resolve the navigation property. Seed the Team entity in the context before seeding the Invite.

- [x] Task 5: Frontend — Types + new hooks (AC: 1, 2, 3, 4)
  - [x] **Write tests FIRST (red) in Task 8 before implementing component/hook logic**
  - [x] Update `frontend/src/features/team-management/types.ts` — add `ValidateInviteDto: { teamId: string; teamName: string }` and `RedeemInviteResponse: { teamId: string }`
  - [x] Add to `frontend/src/features/team-management/hooks/useInvite.ts`:
    - `useValidateInvite(token: string | null)` — React Query `useQuery`, key `['invite', 'validate', token]`; calls `apiFetch<ValidateInviteDto>('/api/invites/validate?token=' + token)`; `enabled: !!token`; `retry: false`; catch 404 from `ApiError` and return `null` (token invalid/expired)
    - `useRedeemInvite()` — `useMutation`; calls `apiFetch<RedeemInviteResponse>('/api/invites/redeem', { method: 'POST', body: JSON.stringify({ token }) })`; no cache invalidation needed (player joining doesn't invalidate coach invite queries)

- [x] Task 6: Frontend — JoinTeamPage component + routes (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/features/team-management/components/join-team-page.tsx` — `'use client'`; accepts `token: string` prop; uses `useValidateInvite`, `useRedeemInvite`, Supabase `getSession()` to check auth state
  - [x] Auth-detection logic in `useEffect`: call `supabase.auth.getSession()` on mount; if session exists AND validate query returns valid invite → call `redeemInvite.mutate(token)` → on success redirect to `/player/home`; if already member (success from idempotent redeem) → redirect to `/player/home`
  - [x] Unauthenticated display: show team name, "Sign in" button (`href="/login?returnTo=/join/{token}"`), "Create account" button (`href="/signup?returnTo=/join/{token}"`); use `Link` from `next/link`
  - [x] Error display: when `validateInvite.data === null` (404) → show "This invite link has expired or is no longer valid"
  - [x] Loading state: show skeleton or loading text while `validateInvite.isPending`
  - [x] Create `frontend/src/app/join/[token]/page.tsx` — minimal server component wrapper that renders `<JoinTeamPage token={params.token} />`; this page is NOT in coach/player route groups; it is NOT in the middleware matcher; it is a public route
  - [x] Create `frontend/src/app/(player)/player/home/page.tsx` — minimal placeholder (`'use client'`; renders "Player dashboard coming soon." text); Story 6.1 will build out the full player dashboard

- [x] Task 7: Frontend — Auth returnTo for signup (AC: 2)
  - [x] Update `useAuth.signUp(email, password, returnTo?: string)` in `frontend/src/features/auth/hooks/useAuth.ts` — add optional `returnTo` param; after successful signup with session, `router.push(returnTo || '/coach/dashboard')`
  - [x] Update `frontend/src/features/auth/components/signup-form.tsx` — read `returnTo` from `useSearchParams()`; pass it to `signUp` call; wrapped in `<Suspense>` for SSR compatibility

- [x] Task 8: Frontend — Vitest tests (AC: 1, 2, 3, 4)
  - [x] **Write ALL tests FIRST (red phase) before implementing Task 6 component**
  - [x] Create `frontend/src/features/team-management/components/join-team-page.test.tsx`
  - [x] Test: renders loading skeleton while `useValidateInvite` is loading
  - [x] Test: renders error message "This invite link has expired or is no longer valid" when validate returns null
  - [x] Test: renders team name and auth buttons when validate returns valid `ValidateInviteDto`
  - [x] Test: "Sign in" link points to `/login?returnTo=/join/{token}`
  - [x] Test: "Create account" link points to `/signup?returnTo=/join/{token}`
  - [x] Test: calls `redeemInvite.mutate` and redirects to `/player/home` when user is already authenticated and invite is valid

- [x] Task 9: Update exports (AC: all)
  - [x] Update `frontend/src/features/team-management/index.ts` — export `JoinTeamPage`, `useValidateInvite`, `useRedeemInvite`, `ValidateInviteDto`, `RedeemInviteResponse`

## Dev Notes

### CRITICAL: Tests Before Code (Red-Green-Refactor)

Derek requires tests written before implementation. Follow strictly:
1. Write test file with all test cases (red phase — they fail)
2. Run tests to confirm failure
3. Implement minimal code to make them pass (green)
4. Refactor while keeping tests green

For backend: write new `InviteServiceTests` cases BEFORE implementing `ValidateInviteAsync`/`RedeemInviteAsync`.
For frontend: write `join-team-page.test.tsx` BEFORE implementing `join-team-page.tsx`.

### Backend — ValidateInviteAsync MUST Use Include

The `ValidateInviteAsync` method must eager-load the `Team` navigation property to return `TeamName`. The InMemory test database DOES support `.Include()` if the related entity is tracked in the same context — seed the `Team` entity in the test context before seeding the `Invite`.

```csharp
var invite = await _context.Invites
    .Include(i => i.Team)
    .Where(i => i.Token == token && i.RevokedAt == null && i.ExpiresAt > DateTime.UtcNow)
    .FirstOrDefaultAsync(ct);
```

### Backend — RedeemInviteAsync Does NOT Call ValidateTeamAccess

This is the ONE service method that deliberately skips `ValidateTeamAccess`. The user is not yet a team member — joining IS the operation. Calling `ValidateTeamAccess` first would always throw `UnauthorizedAccessException` and prevent any player from ever joining.

```csharp
// CORRECT — manual token lookup, no ValidateTeamAccess
var invite = await _context.Invites
    .Where(i => i.Token == token && i.RevokedAt == null && i.ExpiresAt > DateTime.UtcNow)
    .FirstOrDefaultAsync(ct);

if (invite == null)
    throw new InvalidOperationException("Invite is invalid or has expired.");
```

### Backend — AllowAnonymous Override on Controller with [Authorize]

The `InvitesController` class has `[Authorize]`. The new validate endpoint must explicitly override this:

```csharp
[HttpGet("validate")]
[AllowAnonymous]
public async Task<IActionResult> ValidateInvite([FromQuery] string token, CancellationToken ct)
```

`[AllowAnonymous]` takes precedence over class-level `[Authorize]` in ASP.NET Core. The redeem endpoint needs NO attribute — it inherits `[Authorize]` from the class.

### Backend — Coach Name Not Available

The `Team` model stores `CreatedBy` as a userId string (Supabase UUID), not a display name. Coach's display name lives in Supabase Auth, not in the .NET database. `ValidateInviteDto` returns `TeamName` only — do NOT attempt to call the Supabase Admin API from the backend. The acceptance criteria mention "coach name" but for MVP, team name is sufficient context. This is a known limitation documented here.

### Backend — No New EF Migration Required

`Invite` and `TeamMember` tables already exist from Stories 2.2 and 2.3. `RedeemInviteAsync` inserts a new `TeamMember` row using the existing schema. No schema changes.

### Backend — UserId Extraction Pattern (unchanged from 2.2/2.3)

```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
if (userId == null) return Unauthorized();
```

### Backend — Redeem Response Shape

Return an anonymous object so the frontend can navigate to the team:

```csharp
return Ok(new { teamId = result }); // result is a Guid
```

Frontend deserializes as `{ teamId: string }` — matches `RedeemInviteResponse` type.

### Frontend — /join/[token] Is a Public Route

The middleware (`proxy.ts`) matcher is `['/coach/:path*', '/player/:path*', '/login', '/signup']`. The `/join/*` path is NOT in the matcher, so the middleware never runs for it. No changes to `proxy.ts` needed. The page is naturally public.

```
// proxy.ts — matcher already excludes /join/* — no changes needed
export const config = {
  matcher: ['/coach/:path*', '/player/:path*', '/login', '/signup'],
}
```

### Frontend — Auth Detection on Join Page

On page load, check if the user is already authenticated using Supabase client:

```typescript
import { createClient } from '@/lib/supabase/client'

// In useEffect (runs client-side only):
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
if (session && validateData) {
  redeemInvite.mutate(token)
}
```

Trigger redeem in `useEffect` when BOTH conditions are met: `session !== null` AND `validateData !== null` (invite is still valid). Watch both as dependencies so the effect re-runs when `validateData` loads.

### Frontend — returnTo Flow for Sign In and Sign Up

The `SigninForm` already supports `returnTo`:
```typescript
// SigninForm already does this — no changes needed:
const returnTo = searchParams.get('returnTo') ?? undefined
await signIn(values.email, values.password, returnTo)
```

The `SignupForm` does NOT currently support `returnTo`. Task 7 adds this support. The `useAuth.signUp` signature change is additive — existing `SignupForm` callers without `returnTo` are unaffected (optional param).

### Frontend — useValidateInvite 404 Handling

Returns `null` when token is expired/revoked/not-found (same pattern as `useActiveInvite` from Story 2.3):

```typescript
export function useValidateInvite(token: string | null) {
  return useQuery<ValidateInviteDto | null>({
    queryKey: ['invite', 'validate', token],
    queryFn: async () => {
      try {
        return await apiFetch<ValidateInviteDto>(`/api/invites/validate?token=${token}`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    enabled: !!token,
    retry: false,
  })
}
```

### Frontend — JoinTeamPage Component Skeleton

```tsx
'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useValidateInvite, useRedeemInvite } from '@/features/team-management'

export function JoinTeamPage({ token }: { token: string }) {
  const router = useRouter()
  const { data: invite, isPending } = useValidateInvite(token)
  const redeemInvite = useRedeemInvite()

  useEffect(() => {
    const checkAndRedeem = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session && invite) {
        redeemInvite.mutate(token, {
          onSuccess: () => router.replace('/player/home'),
        })
      }
    }
    checkAndRedeem()
  }, [invite, token]) // re-runs when invite data loads

  if (isPending) return <div>Loading...</div>
  if (!invite) return <p>This invite link has expired or is no longer valid</p>

  return (
    <div>
      <h1>Join {invite.teamName}</h1>
      <Link href={`/login?returnTo=/join/${token}`}>Sign in</Link>
      <Link href={`/signup?returnTo=/join/${token}`}>Create account</Link>
    </div>
  )
}
```

Style with shadcn/ui + Tailwind. The skeleton above is logic-only — apply the project's design tokens.

### Frontend — app/join/[token]/page.tsx Structure

```tsx
// This is a server component (no 'use client') — just passes params to the client component
import { JoinTeamPage } from '@/features/team-management'

export default function JoinPage({ params }: { params: { token: string } }) {
  return <JoinTeamPage token={params.token} />
}
```

Next.js 16 App Router: `params` is passed from the server to the page component. The `JoinTeamPage` client component handles all client-side logic.

### Frontend — Player Home Placeholder

Create a minimal placeholder for `/player/home` so the redirect target exists. Story 6.1 will replace it with the full dashboard:

```tsx
// app/(player)/player/home/page.tsx
'use client'

export default function PlayerHomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-mx-text">Player dashboard coming soon.</p>
    </div>
  )
}
```

The `(player)` route group layout exists and has `robots: { index: false }`. The player home page is protected by the middleware (matcher includes `/player/:path*`) — after joining, the user is authenticated so the middleware allows access.

### Frontend — Vitest Test Mocking Pattern

Mock both `useValidateInvite` and `useRedeemInvite` (same `vi.mock` hoisting pattern as Story 2.3's `invite-link-manager.test.tsx`). Mock `next/navigation` for `useRouter`. Mock Supabase client for `getSession`:

```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  }),
}))
```

For the "authenticated + valid invite → auto-redeem" test, override the mock to return a non-null session.

### Frontend — No New npm Dependencies

All needed packages are already installed. No `npm install` needed.

### React Query Key Convention

```typescript
['invite', 'validate', token]  // useValidateInvite
```

Redeem mutation has no query key (it's a mutation, not a query).

### Backend — Running Tests

```bash
dotnet test backend.Tests/
```

### Project Structure Notes

New files:
```
backend/
├── DTOs/
│   └── Invites/
│       ├── ValidateInviteDto.cs       ← NEW
│       └── RedeemInviteRequest.cs     ← NEW
├── Services/
│   ├── IInviteService.cs              ← MODIFIED (add ValidateInviteAsync, RedeemInviteAsync)
│   └── InviteService.cs               ← MODIFIED (implement new methods)
└── Controllers/
    └── InvitesController.cs           ← MODIFIED (add validate + redeem endpoints)

backend.Tests/Services/
└── InviteServiceTests.cs              ← MODIFIED (add 8 new test cases)

frontend/src/features/team-management/
├── types.ts                           ← MODIFIED (add ValidateInviteDto, RedeemInviteResponse)
├── index.ts                           ← MODIFIED (export new types + hooks + component)
├── hooks/
│   └── useInvite.ts                   ← MODIFIED (add useValidateInvite, useRedeemInvite)
└── components/
    ├── join-team-page.tsx             ← NEW
    └── join-team-page.test.tsx        ← NEW

frontend/src/app/
├── join/
│   └── [token]/
│       └── page.tsx                   ← NEW (public route, not in middleware matcher)
└── (player)/
    └── player/
        └── home/
            └── page.tsx               ← NEW (placeholder for Story 6.1)

frontend/src/features/auth/
├── hooks/
│   └── useAuth.ts                     ← MODIFIED (signUp accepts optional returnTo)
└── components/
    └── signup-form.tsx                ← MODIFIED (reads returnTo from searchParams)
```

No changes to: `BaseService.cs`, `AppDbContext.cs`, `TeamService.cs`, `proxy.ts`, EF migrations, existing coach routes.

### Previous Story Learnings (from Stories 2.2 + 2.3)

- `dotnet ef` runs on HOST (WSL2), not in Docker. No migration needed for this story.
- `UseSnakeCaseNamingConvention()` is global — all properties auto-snake_cased.
- `SetTimestamps()` auto-sets `CreatedAt` — do NOT set manually. `JoinedAt` on `TeamMember` is auto-set (it maps to `CreatedAt` in the base timestamp logic — verify in AppDbContext if `JoinedAt` is named `joined_at` or `created_at` in DB).
- `MemberRole.HeadCoach = 0`, `MemberRole.Player = 1` — enum stored as int.
- `vi.mock` hoisting in Vitest: use `mockReturnValue` per test for hook return values.
- `[AllowAnonymous]` overrides class-level `[Authorize]` in ASP.NET Core — confirmed pattern.
- Per-controller `catch` blocks for exception types (no global handler yet).
- Supabase ES256 JWKS auth is already in `Program.cs` — no changes needed.
- `apiFetch` safely omits auth header when no session — works for anonymous endpoints.

### References

- [Source: architecture.md#Cross-Cutting-Concerns] — Invite token lifecycle, `expires_at` + revocation required
- [Source: architecture.md#Enforcement-Guidelines] — `apiFetch` mandatory; `[AllowAnonymous]` override pattern
- [Source: architecture.md#Project-Structure] — `/join/[token]/page.tsx` is a public route; `(player)/home/page.tsx` is the player dashboard target
- [Source: architecture.md#Architectural-Boundaries] — Public routes: `/, /join/[token], /(auth)/*`
- [Source: architecture.md#Communication-Patterns] — `apiFetch`, RQ key conventions
- [Source: epics.md#Story-2.4] — Acceptance criteria
- [Source: 2-3-player-invite-link-generation.md#Dev-Notes] — Token format, InviteService patterns, useActiveInvite 404 handling, xUnit InMemory test setup

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was straightforward; followed existing patterns from stories 2.2/2.3.

### Completion Notes List

- Implemented `ValidateInviteAsync` with `.Include(i => i.Team)` for TeamName resolution; returns `KeyNotFoundException` for expired/revoked/not-found tokens.
- Implemented `RedeemInviteAsync` without `ValidateTeamAccess` (deliberate — user is not yet a member). Idempotent: returns `teamId` without duplicate insert if already a member.
- Added `GET /api/invites/validate` with `[AllowAnonymous]` override and `POST /api/invites/redeem` with inherited `[Authorize]`.
- `JoinTeamPage` uses a `useEffect` watching `[invite, token]` to auto-redeem when session + valid invite are both present.
- `signup-form.tsx` refactored to `SignupFormInner` + `SignupForm` wrapper with `<Suspense>` for `useSearchParams()` SSR safety.
- Next.js 16 async params pattern used for `join/[token]/page.tsx`.
- All 24 backend tests pass. All 16 frontend tests pass.

### File List

backend/DTOs/Invites/ValidateInviteDto.cs (new)
backend/DTOs/Invites/RedeemInviteRequest.cs (new)
backend/Services/IInviteService.cs (modified)
backend/Services/InviteService.cs (modified)
backend/Controllers/InvitesController.cs (modified)
backend.Tests/Services/InviteServiceTests.cs (modified)
frontend/src/features/team-management/types.ts (modified)
frontend/src/features/team-management/hooks/useInvite.ts (modified)
frontend/src/features/team-management/index.ts (modified)
frontend/src/features/team-management/components/join-team-page.tsx (new)
frontend/src/features/team-management/components/join-team-page.test.tsx (new)
frontend/src/app/join/[token]/page.tsx (new)
frontend/src/app/(player)/player/home/page.tsx (new)
frontend/src/features/auth/hooks/useAuth.ts (modified)
frontend/src/features/auth/components/signup-form.tsx (modified)

## Change Log

- 2026-03-06: Story 2.4 implemented — player join via invite link. Added validate/redeem backend endpoints, JoinTeamPage frontend component, /join/[token] public route, /player/home placeholder, and signup returnTo support.
- 2026-03-06: Code review fixes — added `onError` handler to redeem mutate call; added `isPending`/`isSuccess` guard to prevent duplicate mutations; documented ESLint dep-array suppression; fixed `vi.mock` inside test body (replaced with `vi.hoisted` + `mockResolvedValueOnce`); added error state test; added `backend.Tests/bin/` and `backend.Tests/obj/` to `.gitignore`.
