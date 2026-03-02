---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# minuteXminute2 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for minuteXminute2, decomposing the requirements from the PRD, UX Design, and Architecture documents into implementable stories.

## Requirements Inventory

### Functional Requirements

**Identity & Access**

FR1: Visitors can create an account using email and password
FR2: Visitors can create an account using an OAuth provider (Google)
FR3: Users can sign in using email and password
FR4: Users can sign in using an OAuth provider
FR5: Users must confirm they are 13 or older before completing account creation
FR6: Users can sign out of their account
FR7: Head coaches can invite assistant coaches to their team by email *(Phase 1.5)*
FR8: Invited assistant coaches can accept an invite and join a team with assistant-level permissions *(Phase 1.5)*
FR9: Head coaches can remove an assistant coach from their team *(Phase 1.5)*
FR10: Head coaches have exclusive authority to create and delete teams; assistant coaches can create and edit drills and practice plans but cannot create, configure, or delete the team *(Phase 1.5)*

**Team Management**

FR11: Coaches can create a team
FR12: Head coaches can delete their team
FR13: Coaches can generate a shareable invite link to add players to their team
FR14: Players can join a team via an invite link, either creating a new account or signing into an existing one
FR15: Coaches can view and manage the team roster — view all members, see roles, and remove members
FR16: Coaches can assign position tags to players on the roster

**Drill Library**

FR17: Coaches can create a drill with name, description, category, difficulty, estimated duration, and position tags
FR18: Coaches can edit any attribute of an existing drill
FR19: Coaches can delete a drill from their library
FR20: Coaches can view their complete drill library with filtering by category, difficulty, duration, and position tag
FR21: Coaches can search their drill library by name or keyword
FR22: Assistant coaches can create and edit drills in the team library *(Phase 1.5)*

**Canvas & Whiteboard**

FR23: Coaches can add a multi-slide whiteboard canvas to any drill
FR24: Coaches can draw, add shapes, place text, and erase content on a canvas slide
FR25: Coaches can add, remove, and reorder slides within a drill's canvas
FR26: Coaches can retrieve previously saved canvas content for any drill
FR27: Players can view all canvas slides for any drill in read-only mode

**Practice Planning**

FR28: Coaches can create a practice plan by selecting and ordering drills from their library
FR29: Coaches can set a total practice duration and assign a time allocation to each drill in the plan
FR30: Coaches can see remaining available practice time updated in real time as drills are added, removed, or adjusted
FR31: Coaches can reorder drills within a practice plan
FR32: Coaches can edit or delete an existing practice plan
FR33: Coaches can designate a practice plan as the active upcoming plan visible to players
FR34: Coaches can mark individual drills within a practice plan as hidden from player view
FR35: Assistant coaches can edit practice plans, including adding, removing, and reordering drills *(Phase 1.5)*

**Player Experience**

FR36: Players can view the team's active practice plan in read-only mode
FR37: Players can browse the complete team drill library in read-only mode
FR38: Players can open any drill and view its full detail, including all canvas slides, in read-only mode
FR39: Players can access practice plan and drill library views on mobile devices with all interactive elements operable via touch navigation

**Compliance & Platform**

FR50: The marketing and landing page is publicly accessible and indexed by search engines
FR51: All authenticated application pages are excluded from search engine indexing
FR52: Users can navigate all interactive UI components using keyboard alone and access all content via screen reader (WCAG 2.1 AA)
FR53: Each canvas whiteboard slide exposes a text alternative describing the drill name and slide number for assistive technologies (e.g., "Whiteboard diagram for Box Drill, slide 1 of 3")

**Phase 2 FRs (out of scope for MVP epics — captured for awareness)**

FR40–FR42: Home practice assignment and engagement visibility (Phase 2)
FR43–FR46: Social Hub / public drill discovery (Phase 2)
FR47–FR48: Calendar / scheduling (Phase 2)
FR49: Offline read access via Serwist (Phase 2)

---

### NonFunctional Requirements

**Performance**

NFR1: Canvas interactions (draw, move, erase, resize) render at ≤16ms frame time (60fps) during active drawing, validated on mid-range Android with Chrome
NFR2: Largest Contentful Paint (LCP) ≤2.5s on mid-range Android over 4G
NFR3: Time to Interactive (TTI) ≤3.5s on initial page load
NFR4: In-app navigation (subsequent page transitions after initial load) responds in ≤1s
NFR5: Lighthouse performance score ≥85 on both desktop and mobile audits
NFR6: The canvas library is loaded on demand and does not degrade the Lighthouse performance score below the NFR5 threshold (≥85)

**Security**

NFR7: All data is transmitted exclusively over HTTPS in every environment (dev, Docker, production)
NFR8: All protected API requests are validated server-side — no client-side-only authorization is permitted
NFR9: User credentials are managed exclusively by the authentication provider; the application backend stores no passwords, session tokens, or OAuth credentials
NFR10: PII collected is limited to what is necessary for platform function (name, email, position tag, team assignment)
NFR11: All endpoints that create, modify, or delete data require a valid, authenticated session token
NFR12: Role-based access (coach vs. player; head coach vs. assistant coach) is enforced server-side — player-scoped sessions cannot reach coach-scoped endpoints

**Scalability**

NFR13: System supports the MVP pilot load of 5–25 concurrent users (3–5 coaches plus rosters) without performance degradation
NFR14: No horizontal scaling infrastructure is required for MVP; a single-server deployment supports the pilot load defined in NFR13
NFR15: The data schema and API design must support Phase 2 feature additions via additive changes — no destructive schema migrations required for planned growth features

**Accessibility**

NFR16: All interactive UI components meet WCAG 2.1 AA standards — keyboard navigation, focus management, and screen reader compatibility provided by the baseline component library must not be overridden
NFR17: Brand accent colors (desaturated green and muted teal) achieve a minimum 4.5:1 contrast ratio against background surface colors in both light and dark modes
NFR18: Canvas whiteboard surfaces are exempt from interactive accessibility requirements; each canvas surface exposes a text alternative describing the drill name and current slide context
NFR19: All public and authenticated surfaces use semantic HTML — correct heading hierarchy, landmark regions, and labeled form inputs throughout

**Integration**

NFR20: The authentication system successfully handles both email/password and OAuth provider flows; the application backend validates authentication tokens locally per request without requiring additional network calls to the authentication provider
NFR21: API routing resolves correctly in both local development and containerized environments using environment-variable configuration — no code changes required between environments
NFR22: The PWA service worker is installed but not activated for MVP; the PWA architecture must not conflict with Phase 2 service worker activation for offline caching

---

### Additional Requirements

**From Architecture — Implementation Sequence Constraints**

- The project is brownfield — foundation (auth scaffolding, backend, frontend, DB schema) already exists; no starter template initialization required
- Implementation must proceed in this order to avoid cascade failures: (1) end-to-end auth validation (Supabase → .NET JWT), (2) EF Core soft delete global query filter + ValidateTeamAccess base service method, (3) canvas dynamic import boundary, (4) React Query cache invalidation rules per mutation
- Dual RBAC enforcement is mandatory on every data-modifying endpoint: [Authorize(Roles)] at controller layer + ValidateTeamAccess(userId, teamId) at service layer — neither alone is sufficient
- is_hidden drill filtering uses role-conditional service methods (GetPlanForCoach vs GetPlanForPlayer); a global EF Core query filter is explicitly forbidden for this field
- Drills use soft delete (deleted_at timestamp) with EF Core global query filter; a BackgroundService runs 7-day auto-purge of hard deletes
- drill_slides JSONB column requires schema_version field in every write payload from day 1; renderer must check version before parsing
- Invite tokens require expires_at and revocation (revoked_at) fields from day 1 for both player and assistant coach invites
- All secrets (JWT secret, DB connection string, Supabase service role key) in environment variables only — never in committed files
- React Query cache invalidation: drill duration mutations must also invalidate practice plan queries — treat as architectural constraint, not implementation detail
- API error format: ASP.NET Problem Details (RFC 7807) via AddProblemDetails()
- Canvas state: local component state + debounced autosave mutation (≤2s debounce); save state indicator required in UI
- Target deployment: Railway (Docker containers)
- Testing: Vitest for unit and component tests; test files co-located with source files

**From UX — Design and Interaction Requirements**

- Shell switches at 1024px breakpoint: MobileShell (D2/D5 — bottom nav, single column, FAB) below 1024px; DesktopShell (D1 — left sidebar, split panel) at 1024px and above
- Server-side UA detection via Next.js headers() renders the correct shell without layout flash; mobile is the safe default for ambiguous UA
- All interactions designed touch-first; drag-and-drop implemented with dnd-kit (supports mouse and touch without separate implementations)
- touch-action: none applied to Konva stage container div in edit mode only — scoped to preserve view mode scrolling
- Optimistic UI for all mutations: drill added to plan appears immediately; counter decrements before server confirms; rollback silently on failure
- Progressive save: drill is created on name entry alone (name is the only required field); practice plan requires total duration only — all other fields addable after creation
- Pre-loaded lacrosse drill templates eliminate cold-start empty state at first account creation
- Auto-save with ≤2s debounce on canvas; save indicator shows "Saving..." / "Saved" / "Failed to save"
- PracticeTimeCounter color logic: green (--mx-green) when time remaining; teal (--mx-teal) when fully allocated; amber (--mx-amber) when over budget; uses aria-live="polite"
- Minimum 44×44px touch target on all interactive elements (Tailwind: min-h-11 min-w-11)
- DM Sans typeface loaded via next/font; monospace variant for time values to prevent layout shift
- Whiteboard tool active state uses color + shape differentiation — never color alone; aria-pressed="true" on active tool
- All custom components use --mx-* CSS token layer; dark mode is the primary design surface; light mode is a token swap only
- Destructive actions require Dialog confirmation with exactly two buttons: "Cancel" (ghost) and "Delete [Thing]" (destructive)
- Search uses Command component with 300ms debounce; filters are additive (AND logic); no "Search" button required
- shadcn components installed only via npx shadcn@latest add — never manually created

---

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Email/password account creation |
| FR2 | Epic 1 | OAuth (Google) account creation |
| FR3 | Epic 1 | Email/password sign-in |
| FR4 | Epic 1 | OAuth sign-in |
| FR5 | Epic 1 | Age gate (13+) at signup |
| FR6 | Epic 1 | Sign out |
| FR7 | Epic 7 | Assistant coach invite by head coach (Phase 1.5) |
| FR8 | Epic 7 | Assistant coach invite acceptance (Phase 1.5) |
| FR9 | Epic 7 | Assistant coach removal (Phase 1.5) |
| FR10 | Epic 7 | Head coach vs. assistant coach permission scopes (Phase 1.5) |
| FR11 | Epic 2 | Team creation |
| FR12 | Epic 2 | Team deletion (head coach only) |
| FR13 | Epic 2 | Player invite link generation |
| FR14 | Epic 2 | Player joins via invite link |
| FR15 | Epic 2 | Roster management (view, remove members) |
| FR16 | Epic 2 | Position tag assignment to players |
| FR17 | Epic 3 | Create drill with full metadata |
| FR18 | Epic 3 | Edit drill attributes |
| FR19 | Epic 3 | Delete drill (soft delete) |
| FR20 | Epic 3 | Library view with filtering |
| FR21 | Epic 3 | Library search |
| FR22 | Epic 7 | Assistant coach drill create/edit (Phase 1.5) |
| FR23 | Epic 4 | Multi-slide canvas on drill |
| FR24 | Epic 4 | Draw, shapes, text, erase on canvas slide |
| FR25 | Epic 4 | Add, remove, reorder slides |
| FR26 | Epic 4 | Retrieve saved canvas content |
| FR27 | Epic 4 | Player read-only canvas view |
| FR28 | Epic 5 | Create plan from drill library |
| FR29 | Epic 5 | Total duration + per-drill time allocation |
| FR30 | Epic 5 | Live available-time counter |
| FR31 | Epic 5 | Reorder drills (drag-and-drop) |
| FR32 | Epic 5 | Edit or delete practice plan |
| FR33 | Epic 5 | Designate active plan visible to players |
| FR34 | Epic 5 | Hide individual drills from player view |
| FR35 | Epic 7 | Assistant coach practice plan editing (Phase 1.5) |
| FR36 | Epic 6 | Player: view active practice plan (read-only) |
| FR37 | Epic 6 | Player: browse drill library (read-only) |
| FR38 | Epic 6 | Player: drill detail + canvas slides (read-only) |
| FR39 | Epic 6 | Player: mobile touch navigation |
| FR-PW | Epic 1 | Password reset / forgot password (Story 1.7 — implicit platform requirement, no FR number in PRD) |
| FR50 | Epic 1 | Landing page publicly indexed (SEO) |
| FR51 | Epic 1 | Authenticated app pages excluded from indexing |
| FR52 | Definition of Done (all epics) | WCAG 2.1 AA keyboard navigation + screen reader — verified per epic, not a single-epic story |
| FR53 | Epic 4 | Canvas text alternative per slide (aria-label) |

## Epic List

### Epic 1: Foundation & Authenticated Onboarding
Users can sign up with email/password or Google OAuth, pass the age gate (13+), sign in, and sign out. They land in the correct role-specific shell (coach or player). The landing page is publicly indexed for coach discovery; all authenticated app pages are excluded from indexing. The end-to-end auth chain (Supabase → .NET JWT) is validated before any other feature is built.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR50, FR51

### Epic 2: Team & Player Onboarding
Coaches can create a team, generate shareable invite links for players, and manage the roster (view all members, assign position tags, remove players). Players can join a team via invite link — creating or signing into an account. The coach-to-player connection is fully closed. Foundation Story 1 establishes ValidateTeamAccess base service method and EF Core soft-delete global query filter before any protected endpoints are built.
**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16

### Epic 3: Drill Library
Coaches can build, organize, and search their persistent drill library — the core "memory extension" value prop. Create drills with full metadata (name, description, category, difficulty, duration, position tags), edit any attribute, soft-delete, filter by multiple dimensions, and search by name or keyword.
**FRs covered:** FR17, FR18, FR19, FR20, FR21

### Epic 4: Whiteboard & Canvas
Coaches can attach multi-slide whiteboard canvases to any drill — draw freehand, add shapes, place text, erase, add/remove/reorder slides, and retrieve saved canvases. Players can view all slides in read-only mode. Canvas data stored as JSONB with mandatory schema versioning. Foundation Story 1 establishes the react-konva dynamic import boundary before any canvas features are built.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR53

### Epic 5: Practice Planning
Coaches can compose time-allocated practice plans from their drill library — add and reorder drills, set per-drill time allocations, track remaining time with the live PracticeTimeCounter (the hero interaction), designate an active plan visible to players, and hide specific drills from player view. Plans auto-save throughout with no explicit save action required.
**FRs covered:** FR28, FR29, FR30, FR31, FR32, FR33, FR34

### Epic 6: Player Experience
Players have a complete read-only experience: view the team's active practice plan, browse the full drill library, open any drill and view all canvas slides. All interactions are mobile-first and touch-navigable. Read-only state is visually unambiguous. Development sequencing (Epic 5 before Epic 6) handles the practice plan data dependency; dummy data used during development.
**FRs covered:** FR36, FR37, FR38, FR39

### Epic 7: Assistant Coach Access *(Phase 1.5 — post-pilot stabilization)*
Head coaches can invite assistant coaches by email and remove them. Invited assistant coaches can accept the invite and join with full drill creation/editing rights and practice plan editing access. Head coach retains exclusive authority to create, configure, and delete the team. All role-scoped permissions enforced server-side.
**FRs covered:** FR7, FR8, FR9, FR10, FR22, FR35

---

**Definition of Done (all epics):**
- FR52: All interactive UI components on completed stories are keyboard navigable and screen-reader accessible (WCAG 2.1 AA). shadcn/Radix ARIA attributes and focus management must not be overridden. Verified per story before marking complete.

---

## Epic 1: Foundation & Authenticated Onboarding

Users can sign up, sign in, and sign out. The full Supabase → .NET JWT auth chain is validated. Protected routes are guarded by middleware. The landing page is publicly indexed; all app pages are excluded from indexing.

### Story 1.1: Email/Password Account Registration

As a visitor,
I want to create an account with email, password, and age confirmation,
So that I can access MinuteXMinute as a coach or player.

**Acceptance Criteria:**

**Given** I am on /signup and enter a valid email, password (min 8 characters), and check the 13+ age gate checkbox
**When** I submit the form
**Then** my Supabase account is created and I am redirected to the coach dashboard

**Given** I submit the signup form without checking the age gate checkbox
**When** the form is submitted
**Then** the form shows "You must be 13 or older to create an account" and submission is blocked

**Given** I enter an email address already registered in the system
**When** I submit the form
**Then** an error message "Email already in use. Try signing in." is displayed and the account is not created

**Given** my account is created and I navigate any protected /api/* endpoint with my JWT
**When** the .NET backend receives the request
**Then** the JWT is validated against the Supabase JWT secret and the request returns a successful response — confirming the end-to-end auth chain (Supabase → .NET) is operational

---

### Story 1.2: Google OAuth Account Registration

As a visitor,
I want to create an account using my Google identity,
So that I can sign up without managing a separate password.

**Acceptance Criteria:**

**Given** I am on /signup, I have checked the age gate checkbox, and I click "Continue with Google"
**When** I complete the Google OAuth flow
**Then** my Supabase account is created and I am redirected to the dashboard

**Given** I click "Continue with Google" without first checking the age gate checkbox
**When** the button is activated
**Then** the OAuth redirect is blocked and the age gate validation error is displayed

**Given** I complete a Google OAuth flow for a Google identity already linked to an existing MxM account
**When** OAuth returns
**Then** I am signed in to my existing account rather than a duplicate being created

---

### Story 1.3: Sign-In and Sign-Out

As a registered user,
I want to sign in to my account and sign out when I am done,
So that my data is protected and I control my session.

**Acceptance Criteria:**

**Given** I am on /login and enter my registered email and correct password
**When** I submit the form
**Then** I am signed in and redirected to my dashboard

**Given** I enter incorrect credentials on /login
**When** I submit the form
**Then** I see "Invalid email or password" and remain on the sign-in page — no indication of which field is wrong

**Given** I am on /login and click "Continue with Google"
**When** I complete the OAuth flow with a Google identity linked to an existing account
**Then** I am signed in and redirected to my dashboard

**Given** I am signed in and click "Sign Out"
**When** the action is executed
**Then** my Supabase session is cleared, any local state is reset, and I am redirected to /login

**Given** I am signed in and my session token is approaching expiry
**When** I continue using the app
**Then** the Supabase client refreshes my token automatically with no interruption to my session

---

### Story 1.4: Protected Route Middleware & App Route Groups

As the platform,
I need all authenticated routes protected by middleware and excluded from search indexing,
So that unauthenticated users cannot access private data and app pages do not appear in search results.

**Acceptance Criteria:**

**Given** an unauthenticated visitor navigates to any route matching /coach/* or /player/*
**When** the request is processed by Next.js middleware
**Then** they are redirected to /login with the originally requested URL preserved for post-login redirect

**Given** an authenticated user navigates to any /coach/* or /player/* route
**When** the middleware validates their session
**Then** they proceed to the page without interruption

**Given** any page rendered within the (coach)/ or (player)/ route group layout
**When** a search engine crawler accesses the page
**Then** the HTTP response includes `<meta name="robots" content="noindex, nofollow">` preventing search indexing

**Given** an already-authenticated user navigates to /login or /signup
**When** the page loads
**Then** they are redirected to their appropriate dashboard

---

### Story 1.5: Public Landing Page with SEO

As a coach discovering MinuteXMinute through search,
I want to land on a descriptive, indexed marketing page,
So that I can understand the product's value before signing up.

**Acceptance Criteria:**

**Given** a search engine crawler visits /
**When** the page is rendered
**Then** the response includes a title tag, meta description, Open Graph tags (og:title, og:description, og:image), and canonical URL — all populated with meaningful MxM content

**Given** a visitor navigates to /
**When** the page renders
**Then** they see a marketing page with the product value proposition and a clear sign-up CTA

**Given** the landing page HTML is inspected
**When** structure is evaluated
**Then** it uses a single h1, correct heading hierarchy, semantic landmark regions (main, nav, footer), and labeled interactive elements — meeting NFR19 semantic HTML requirements

---

### Story 1.6: Coach App Shell & Navigation

As a coach,
I want a role-appropriate app shell with consistent navigation after signing in,
So that I can move between my core tools — practice plans, drill library, team, and profile — without friction.

**Acceptance Criteria:**

**Given** I am a signed-in coach on a mobile device (viewport < 1024px)
**When** the app loads
**Then** I see the mobile coach shell: bottom navigation bar with destinations — Practice Plans, Drill Library, Team, Profile

**Given** I am a signed-in coach on a desktop viewport (≥ 1024px)
**When** the app loads
**Then** I see the desktop coach shell: left sidebar always visible with the same four navigation destinations

**Given** the coach shell renders on any device
**When** the server processes my request
**Then** the correct shell (mobile or desktop) is rendered server-side via the same UA detection utility used by the player shell (`getShellContext()`) — no layout flash on load

**Given** I tap a navigation destination in the coach shell
**When** the navigation occurs
**Then** the active destination is visually indicated (filled icon + `--mx-green` accent) and I arrive at the correct page

**Given** I am a coach and the shell renders
**When** the page is inspected
**Then** no player-only navigation items or read-only indicators are present — the shell is role-specific

---

### Story 1.7: Password Reset (Forgot Password)

As a registered user,
I want to reset my password via email,
So that I can regain access to my account if I forget my password.

**Acceptance Criteria:**

**Given** I am on /login and click "Forgot password?"
**When** the link is activated
**Then** I am taken to /forgot-password where I can enter my email address

**Given** I enter a registered email address on /forgot-password and submit
**When** the form is submitted
**Then** Supabase sends a password reset email to that address and I see a confirmation message: "Check your email for a reset link"

**Given** I enter an email address that is not registered in the system
**When** the form is submitted
**Then** I see the same confirmation message "Check your email for a reset link" — no indication that the email is not registered

**Given** I click the password reset link in my email
**When** the /reset-password?token=[token] page loads
**Then** I am shown a form to enter and confirm a new password

**Given** I submit a valid new password (min 8 characters) on the reset page
**When** the reset is processed
**Then** my password is updated via Supabase and I am redirected to /login with a success message

**Given** I submit a password reset link that has expired or been used
**When** the page loads
**Then** I see an error message "This reset link has expired. Request a new one." with a link back to /forgot-password

---

## Epic 2: Team & Player Onboarding

Coaches can create a team, generate shareable invite links for players, and manage the roster. Players can join a team via invite link. The coach-to-player connection is fully closed. Foundation Story 1 establishes ValidateTeamAccess base service method and EF Core soft-delete global query filter before any protected endpoints are built.

### Story 2.1: [Technical Task] Backend Foundation — ValidateTeamAccess & Soft-Delete Filter

> **Note:** This is a developer prerequisite task, not a user story. It has no user-observable output and should not be sprint-demoed. It is a required implementation step before Story 2.2 can be built.

As a developer,
I want the BaseService with team access validation and the EF Core soft-delete global query filter established,
So that every subsequent protected endpoint is built on a consistent, secure foundation.

**Acceptance Criteria:**

**Given** a service method calls `ValidateTeamAccess(userId, teamId)`
**When** the userId is not a member of the teamId
**Then** the method throws an unauthorized exception and no data is returned

**Given** an EF Core query is executed on any entity with a `deleted_at` column
**When** the query runs
**Then** records where `deleted_at IS NOT NULL` are automatically excluded — no per-query filter required

**Given** a new protected endpoint is added to any controller
**When** it uses a service that extends BaseService
**Then** the `ValidateTeamAccess` method is available and must be called before any team-scoped data access

---

### Story 2.2: Team Creation and Deletion

As a head coach,
I want to create a team and, when needed, delete it,
So that I have full control over my team's lifecycle on the platform.

**Acceptance Criteria:**

**Given** I am a signed-in coach and navigate to team creation
**When** I enter a team name and submit
**Then** a new team record is created with me as the head coach and I am redirected to my team dashboard

**Given** I submit a team name that is empty or whitespace only
**When** the form is submitted
**Then** validation prevents submission and shows "Team name is required"

**Given** my team is created
**When** I view my coach dashboard
**Then** my team name is displayed and I am identified as Head Coach

**Given** I am a head coach and navigate to team settings
**When** I choose to delete my team and confirm the deletion dialog
**Then** the team and all associated data (roster, drills, plans) are permanently deleted and I am redirected to the onboarding screen

---

### Story 2.3: Player Invite Link Generation

As a coach,
I want to generate a shareable invite link for my team,
So that players can join without me managing individual email invitations.

**Acceptance Criteria:**

**Given** I am a head coach and navigate to the team invite section
**When** I generate an invite link
**Then** a unique token is created with an `expires_at` timestamp (7 days) and I am shown a copyable link in the format `/join/[token]`

**Given** an invite link is generated
**When** I copy and share it
**Then** the link is valid for 7 days from generation

**Given** I generate a new invite link when one already exists
**When** the new link is created
**Then** the previous token is revoked and only the new link is active

---

### Story 2.4: Player Joins Team via Invite Link

As a player,
I want to join a team by tapping an invite link,
So that I can access my team's practice plans and drill library.

**Acceptance Criteria:**

**Given** I tap a valid invite link and I do not have an account
**When** the /join/[token] page loads
**Then** I see the team name and coach name before signing up, and am prompted to create an account or sign in

**Given** I complete account creation or sign-in after tapping a valid invite link
**When** authentication completes
**Then** I am added to the team as a player and redirected to the player dashboard

**Given** I tap an expired or revoked invite link
**When** the /join/[token] page loads
**Then** I see "This invite link has expired or is no longer valid" and no team join occurs

**Given** I am already a member of the team and tap the invite link again
**When** authentication completes
**Then** I am redirected to the player dashboard without a duplicate membership being created

---

### Story 2.5: Roster Management

As a coach,
I want to view and manage my team roster,
So that I can see who is on my team, their roles, and remove members when needed.

**Acceptance Criteria:**

**Given** I navigate to the team roster page
**When** the page loads
**Then** I see a list of all team members showing their name, email, role (Head Coach / Player), and join date

**Given** I select a player from the roster and choose to remove them
**When** I confirm the removal in the confirmation dialog
**Then** the player's team membership is deleted and they no longer appear on the roster or have access to team data

**Given** I attempt to remove myself (Head Coach) from the roster
**When** the remove action is triggered
**Then** the action is blocked with a message "You cannot remove yourself as Head Coach"

---

### Story 2.6: Player Position Tag Assignment

As a coach,
I want to assign position tags to players on my roster,
So that I can filter drills and plans by player position when planning practice.

**Acceptance Criteria:**

**Given** I view a player's entry on the roster
**When** I assign one or more position tags (e.g., Attack, Midfield, Defense, Goalie)
**Then** the tags are saved to that player's team membership record and displayed on the roster

**Given** I assign a position tag to a player
**When** the save completes
**Then** the tag is immediately visible on the roster without a page reload

**Given** I remove a position tag from a player
**When** the save completes
**Then** the tag is removed from their record and no longer displayed

---

## Epic 3: Drill Library

Coaches can build, organize, and search their persistent drill library — the core "memory extension" value prop. Create drills with full metadata, edit any attribute, soft-delete, filter by multiple dimensions, and search by name or keyword.

### Story 3.1: Create a Drill

As a coach,
I want to create a drill by entering its name and saving immediately,
So that I can build my library progressively without being blocked by required fields.

**Acceptance Criteria:**

**Given** I am a coach and navigate to the new drill page
**When** I enter a drill name and confirm (tap away or press Enter)
**Then** the drill is saved immediately to the database and appears in my library — no additional fields required

**Given** the drill is saved
**When** I remain on the drill detail page
**Then** I can optionally add description, category, difficulty, estimated duration, and position tags — all editable inline without a separate save action

**Given** I attempt to save a drill with an empty name
**When** the name field is blurred or form is submitted
**Then** validation shows "Drill name is required" and the drill is not saved

**Given** I create a drill
**When** I return to the drill library
**Then** my new drill appears in the list with its name and any metadata I added

---

### Story 3.2: Edit a Drill

As a coach,
I want to edit any attribute of an existing drill,
So that I can refine my library as my coaching evolves.

**Acceptance Criteria:**

**Given** I open a drill from my library
**When** I tap any editable field (name, description, category, difficulty, duration, position tags)
**Then** the field becomes editable inline and I can update the value

**Given** I update a drill attribute and confirm the change
**When** the save completes
**Then** the updated value is persisted and visible immediately — no page reload required

**Given** I update a drill's estimated duration
**When** the save completes
**Then** any practice plans containing this drill reflect the updated duration in their time calculations

**Given** I attempt to save a drill with the name cleared to empty
**When** the field is confirmed
**Then** validation shows "Drill name is required" and the previous name is restored

---

### Story 3.3: Delete a Drill

As a coach,
I want to delete a drill from my library,
So that I can remove drills that are no longer relevant.

**Acceptance Criteria:**

**Given** I am viewing a drill and select the delete action
**When** the confirmation dialog appears
**Then** it shows "Delete [Drill Name]?" with a "Cancel" button and a "Delete Drill" destructive button

**Given** I confirm deletion
**When** the action completes
**Then** the drill's `deleted_at` timestamp is set (soft delete), the drill no longer appears in my library, and I am returned to the library view

**Given** a drill is soft-deleted
**When** any query for drills runs via EF Core
**Then** the deleted drill is automatically excluded by the global query filter — it is invisible to all library and plan queries

**Given** I cancel the deletion dialog
**When** the dialog is dismissed
**Then** the drill remains in my library unchanged

---

### Story 3.4: View Drill Library with Filtering

As a coach,
I want to view my complete drill library and filter it by category, difficulty, duration, and position tag,
So that I can quickly find the right drills when building a practice plan.

**Acceptance Criteria:**

**Given** I navigate to the drill library
**When** the page loads
**Then** I see all my drills as cards showing name, duration, category tag, and difficulty badge

**Given** I select one or more filter chips (category, difficulty, duration range, position tag)
**When** filters are applied
**Then** only drills matching ALL active filters are shown (AND logic) — results update without a search button

**Given** one or more filters are active
**When** I view the filter area
**Then** a "Clear filters" link is visible and removes all active filters when tapped

**Given** no drills match the active filters
**When** the filtered result is empty
**Then** I see "No drills match your filters" and the "Clear filters" option

**Given** I have no drills in my library
**When** the library page loads
**Then** I see an empty state: "Your drill library is empty" with a "Create your first drill" CTA

---

### Story 3.5: Search Drill Library

As a coach,
I want to search my drill library by name or keyword,
So that I can find a specific drill instantly without scrolling.

**Acceptance Criteria:**

**Given** I am on the drill library page and type in the search input
**When** 300ms have elapsed since my last keystroke
**Then** the drill list filters to show only drills whose name or description contains the search term (case-insensitive)

**Given** I have active filters and enter a search term
**When** results update
**Then** only drills matching BOTH the search term AND all active filters are shown

**Given** my search term matches no drills
**When** results update
**Then** I see "No drills match '[query]'" with a "Clear filters" ghost link

**Given** I clear the search input
**When** the field is empty
**Then** the full library (with any active filters still applied) is restored

---

### Story 3.6: Pre-Loaded Template Drills for Coach Cold-Start

As a new coach,
I want pre-loaded lacrosse drill templates in my library when I first sign up,
So that I can experience the full product loop immediately without building my library from scratch.

**Acceptance Criteria:**

**Given** I am a coach who has just created an account and have no drills in my library
**When** I navigate to the drill library for the first time
**Then** a set of pre-loaded lacrosse drill templates is present — I am never shown a truly empty library on first login

**Given** the template drills are pre-loaded
**When** I view them in the library
**Then** they appear as standard drill cards with name, category, difficulty, and duration populated — indistinguishable from drills I created myself

**Given** the template drills exist in my library
**When** I open the practice plan composer for the first time
**Then** the pre-populated plan template references these template drills — making the "add drills from library" interaction immediately demonstrable

**Given** I delete a template drill
**When** the deletion is confirmed
**Then** it is soft-deleted like any other drill — templates carry no special protection after the initial load

---

## Epic 4: Whiteboard & Canvas

Coaches can attach multi-slide whiteboard canvases to any drill — draw freehand, add shapes, place text, erase, add/remove/reorder slides, and retrieve saved canvases. Players can view all slides in read-only mode. Canvas data stored as JSONB with mandatory schema versioning. Foundation Story 1 establishes the react-konva dynamic import boundary before any canvas features are built.

### Story 4.1: [Technical Task] Canvas Code-Split Boundary

> **Note:** This is a developer prerequisite task, not a user story. It has no user-observable output and should not be sprint-demoed. It is a required implementation step before Story 4.2 can be built.

As a developer,
I want react-konva dynamically imported and isolated from all player-facing routes,
So that the canvas bundle never loads for players and the Lighthouse performance score is not degraded by the canvas library.

**Acceptance Criteria:**

**Given** any component in the codebase imports react-konva
**When** the import is written
**Then** it must use `next/dynamic` with `{ ssr: false }` — direct static imports of react-konva are forbidden

**Given** a player navigates to any /player/* route
**When** the page bundle is analyzed
**Then** the react-konva / Konva library is not included in any loaded chunk

**Given** a coach navigates to the canvas editor page
**When** the page loads
**Then** the Konva bundle loads on demand and the Lighthouse performance score remains ≥85 (NFR5/NFR6)

---

### Story 4.2: Add a Whiteboard Canvas to a Drill

As a coach,
I want to add a whiteboard canvas to a drill,
So that I can visually diagram the drill formation and give players a clear picture of what to run.

**Acceptance Criteria:**

**Given** I am viewing a drill in my library
**When** I tap "Add Whiteboard"
**Then** a canvas editor opens with Slide 1 already created and a lacrosse field template locked as the background layer

**Given** the canvas editor is open
**When** I view the toolbar
**Then** Draw, Shape, Text, and Erase tools are available and the active tool is visually unambiguous using both color and shape differentiation — never color alone

**Given** the canvas loads
**When** the field template layer renders
**Then** it is locked and cannot be moved, resized, or erased — only the drawing layer above it is editable

**Given** I make any mark on the canvas
**When** 2 seconds have elapsed since my last action
**Then** the canvas state is automatically saved (debounced autosave) and the save indicator shows "Saved"

**Given** autosave is in progress
**When** the save is pending
**Then** the save indicator shows "Saving..." until the save completes

**Given** an autosave fails
**When** the error is detected
**Then** the save indicator shows "Failed to save" with a manual retry option

---

### Story 4.3: Drawing Tools — Freehand, Shapes, Text, Erase

As a coach,
I want to draw freehand lines, add shapes, place text labels, and erase marks on a canvas slide,
So that I can diagram formations, movement paths, and player assignments clearly.

**Acceptance Criteria:**

**Given** I have the Draw tool active
**When** I drag across the canvas
**Then** a freehand line is drawn that follows my finger/cursor path

**Given** I have the Shape tool active
**When** I drag on the canvas
**Then** a shape (circle or rectangle) is placed at the drag location and is selectable/moveable after placement

**Given** I have the Text tool active
**When** I tap a location on the canvas
**Then** a text input appears at that location and my typed text is placed as a canvas element

**Given** I have the Erase tool active
**When** I drag over any drawing layer element
**Then** the element is removed from the canvas

**Given** I switch between tools
**When** a new tool is activated
**Then** the previously active tool deactivates immediately — no accidental marks from the prior tool

**Given** I am on a touch device in edit mode
**When** I touch the canvas
**Then** `touch-action: none` is applied to the Konva stage container so canvas drawing does not conflict with page scroll

---

### Story 4.4: Slide Management

As a coach,
I want to add, remove, and reorder slides within a drill's whiteboard,
So that I can show a drill's progression across multiple formation states.

**Acceptance Criteria:**

**Given** I am in the canvas editor
**When** I tap "Add Slide"
**Then** a new blank slide with the field template is created and becomes the active slide

**Given** I have multiple slides
**When** I view the slide manager (thumbnail strip)
**Then** all slides are shown as thumbnails with the currently active slide clearly indicated

**Given** I tap a slide thumbnail
**When** the selection is made
**Then** that slide's canvas content is loaded as the active editing surface

**Given** I select a slide and choose to delete it
**When** I confirm the deletion dialog
**Then** the slide is removed and the adjacent slide becomes active — the last remaining slide cannot be deleted

**Given** I reorder slides in the slide manager
**When** the reorder completes
**Then** the new slide order is saved and persisted

---

### Story 4.5: Retrieve and Display Saved Canvas

As a coach,
I want to retrieve my previously saved canvas content when I reopen a drill,
So that my whiteboard work is always preserved and ready to continue.

**Acceptance Criteria:**

**Given** I saved canvas content for a drill and later reopen that drill's canvas editor
**When** the editor loads
**Then** all previously saved slides and their drawing content are restored exactly as I left them

**Given** the canvas data is loaded from the database
**When** the `drill_slides` JSONB payload is parsed
**Then** the renderer checks `schema_version` before parsing — if the version is unrecognized, a safe fallback is shown rather than a crash

**Given** a drill has never had a canvas added
**When** I open the canvas editor
**Then** a fresh Slide 1 with the field template is shown and no error state is displayed

---

### Story 4.6: Player Read-Only Canvas View

As a player,
I want to view all canvas slides for any drill in read-only mode,
So that I can see my coach's formation diagrams to prepare for practice.

**Acceptance Criteria:**

**Given** I am a player and open a drill that has whiteboard slides
**When** the drill detail page loads
**Then** I see the canvas slides rendered as static images — no drawing tools, no edit affordances are visible

**Given** a drill has multiple slides
**When** I view the canvas section
**Then** I can swipe or tap through the slides and each slide's content is displayed correctly

**Given** the canvas view is rendered
**When** a screen reader accesses the element
**Then** each slide has `role="img"` and `aria-label="Whiteboard diagram for [Drill Name], slide [N] of [Total]"` (FR53)

**Given** I am a player and view a drill's canvas
**When** the page bundle is analyzed
**Then** react-konva / Konva is not loaded — the canvas view renders without the Konva library

---

## Epic 5: Practice Planning

Coaches can compose time-allocated practice plans from their drill library — add and reorder drills, set per-drill time allocations, track remaining time with the live PracticeTimeCounter (the hero interaction), designate an active plan visible to players, and hide specific drills from player view. Plans auto-save throughout with no explicit save action required.

### Story 5.1: Create a Practice Plan

As a coach,
I want to create a practice plan by setting a total duration,
So that I have a time-budgeted container to build my session around.

**Acceptance Criteria:**

**Given** I navigate to new practice plan
**When** I enter a total practice duration (e.g., 90 minutes) and confirm
**Then** a new practice plan is created, saved immediately, and I land on the plan composer with the available-time counter showing the full duration

**Given** a new plan is created
**When** the plan composer loads
**Then** a pre-populated template structure is present so I am editing rather than starting from a blank state

**Given** I attempt to create a plan without entering a duration
**When** the field is confirmed
**Then** validation shows "Practice duration is required" and the plan is not created

---

### Story 5.2: Add Drills to a Plan with Live Time Counter

As a coach,
I want to add drills from my library to a practice plan and see the available time update immediately,
So that I can budget my practice session in real time without mental math.

**Acceptance Criteria:**

**Given** I am in the plan composer
**When** I tap a drill in the drill library panel
**Then** the drill is added to the plan immediately (optimistic UI), the available-time counter decrements by the drill's duration, and the server syncs in the background

**Given** the counter has time remaining
**When** I view it
**Then** it displays in `--mx-green` (time remaining)

**Given** the counter reaches exactly zero (fully allocated)
**When** I view it
**Then** it displays in `--mx-teal` to signal a balanced, complete plan

**Given** the total allocated drill time exceeds the plan duration
**When** I view the counter
**Then** it displays in `--mx-amber` showing the over-budget amount

**Given** the counter changes state
**When** a screen reader is active
**Then** the counter announces the updated value via `aria-live="polite"`

---

### Story 5.3: Set Per-Drill Time Allocation

As a coach,
I want to set and adjust the time allocated to each drill in my plan,
So that I can control exactly how long each part of practice runs.

**Acceptance Criteria:**

**Given** a drill is in my practice plan
**When** I tap its duration chip
**Then** an inline number input opens for that drill's allocated time — no navigation away from the plan

**Given** I change a drill's allocated time
**When** I confirm the value
**Then** the available-time counter updates immediately to reflect the change

**Given** I enter a non-numeric or zero value for drill duration
**When** the field is confirmed
**Then** validation shows "Duration must be a positive number" and the previous value is restored

---

### Story 5.4: Reorder Drills in a Plan

As a coach,
I want to reorder drills in my practice plan by dragging them,
So that I can sequence the session exactly the way I want to run it.

**Acceptance Criteria:**

**Given** I have multiple drills in my practice plan
**When** I drag a drill row by its handle
**Then** the drill moves to the new position with snap feedback on release and the order is saved

**Given** I reorder a drill
**When** the drag completes
**Then** the new order persists — reloading the plan shows drills in the updated sequence

**Given** I am on a touch device
**When** I drag a drill row
**Then** dnd-kit handles the touch drag without conflicting with page scroll

**Given** I am on a keyboard
**When** I use arrow keys on a focused drag handle
**Then** the drill moves up or down in the list (keyboard fallback via dnd-kit KeyboardSensor)

---

### Story 5.5: Edit and Delete a Practice Plan

As a coach,
I want to edit an existing practice plan and delete plans I no longer need,
So that I can maintain a clean, current set of plans across my season.

**Acceptance Criteria:**

**Given** I open an existing practice plan
**When** the plan composer loads
**Then** all previously saved drills, time allocations, and order are restored and editable

**Given** all changes to a plan (drills added/removed, times adjusted, order changed) are made
**When** any change occurs
**Then** it is auto-saved — no explicit save button required and no work is lost on navigation

**Given** I choose to delete a practice plan
**When** the confirmation dialog appears
**Then** it shows "Delete [Plan Name]?" with "Cancel" and "Delete Plan" buttons

**Given** I confirm deletion
**When** the action completes
**Then** the plan is permanently deleted and I am returned to the plans list

---

### Story 5.6: Designate Active Plan & Hide Drills from Players

As a coach,
I want to mark one plan as the active upcoming plan and optionally hide specific drills from player view,
So that players see exactly what I want them to see before practice.

**Acceptance Criteria:**

**Given** I have one or more practice plans
**When** I mark a plan as active
**Then** it is designated as the team's active upcoming plan — only one plan can be active at a time; the previous active plan is deactivated

**Given** I am in a practice plan and toggle the hide option on a drill
**When** the toggle is saved
**Then** the `is_hidden` flag is set on that plan-drill record and the drill is marked visually in the coach view as hidden from players

**Given** a drill is marked hidden in a plan
**When** the player-facing API endpoint `GetPlanForPlayer` is called
**Then** the hidden drill is excluded from the response at the query layer — it is never sent to the client

**Given** a drill is marked hidden and I am a coach viewing the same plan
**When** the coach-facing API endpoint `GetPlanForCoach` is called
**Then** the hidden drill is included in the response — coaches always see all drills

---

### Story 5.7: Practice Plans List View

As a coach,
I want to view all my practice plans in one place,
So that I can open, manage, or create plans across my season.

**Acceptance Criteria:**

**Given** I navigate to the Practice Plans section
**When** the page loads
**Then** I see a list of all my practice plans, each showing the plan name, total duration, number of drills, and whether it is the active plan

**Given** I have an active plan set
**When** the plans list renders
**Then** the active plan is visually distinguished (e.g., "Active" badge) and appears first or prominently in the list

**Given** I tap a plan in the list
**When** the selection is made
**Then** I am taken to that plan's composer view with all existing drills and time allocations loaded

**Given** I tap "New Practice Plan"
**When** the action is triggered
**Then** I am taken to the plan creation flow (Story 5.1)

**Given** I have no practice plans
**When** the plans list loads
**Then** I see an empty state: "No practice plans yet" with a "Create your first plan" CTA

---

## Epic 6: Player Experience

Players have a complete read-only experience: view the team's active practice plan, browse the full drill library, open any drill and view all canvas slides. All interactions are mobile-first and touch-navigable. Read-only state is visually unambiguous. Development sequencing (Epic 5 before Epic 6) handles the practice plan data dependency; dummy data used during development.

### Story 6.1: Player Dashboard & Active Practice Plan View

As a player,
I want to see my team's active practice plan when I open the app,
So that I can quickly understand what's happening at the next practice.

**Acceptance Criteria:**

**Given** I am a signed-in player and my team has an active practice plan
**When** I navigate to my dashboard or practice plan page
**Then** I see the active plan displayed with drills listed in order, each showing drill name and allocated time

**Given** I view the active practice plan
**When** the page renders
**Then** the full session is scannable at a glance — all drills visible without excessive scrolling on a standard phone screen

**Given** my team has no active practice plan set
**When** I navigate to the practice plan page
**Then** I see "No practice plan set yet" with informational subtext — no editing affordances are shown

**Given** I am a player viewing the practice plan
**When** the page is inspected
**Then** there are zero editing affordances visible — no edit buttons, drag handles, or action menus anywhere on the page

---

### Story 6.2: Player Drill Library Browse

As a player,
I want to browse my team's complete drill library in read-only mode,
So that I can review drills and prepare for practice on my own time.

**Acceptance Criteria:**

**Given** I navigate to the drill library as a player
**When** the page loads
**Then** I see all team drills as cards showing name, duration, category, and difficulty — with no create, edit, or delete controls visible

**Given** I view the drill library
**When** the player-facing API endpoint is called
**Then** the response is scoped to my team's drills only — I cannot access drills from other teams

**Given** the drill library loads
**When** I interact with filter chips or the search input
**Then** filtering and search work identically to the coach view — same AND logic, same 300ms debounce

---

### Story 6.3: Player Drill Detail & Canvas View

As a player,
I want to open any drill and view its full details including all whiteboard slides,
So that I can understand exactly what a drill involves before stepping on the field.

**Acceptance Criteria:**

**Given** I tap a drill card in the library or practice plan
**When** the drill detail opens
**Then** I see the drill name, description, category, difficulty, duration, and position tags in read-only format

**Given** the drill has whiteboard slides
**When** I view the drill detail
**Then** the canvas slides are displayed as read-only images — no drawing tools or edit controls are present

**Given** a drill has multiple slides
**When** I view the canvas section
**Then** I can swipe through slides and a slide counter (e.g., "Slide 2 of 4") is visible

**Given** the drill has no whiteboard slides
**When** I view the drill detail
**Then** the canvas section is omitted cleanly — no empty canvas placeholder or error state

---

### Story 6.4: Mobile Touch Navigation & Player Shell

As a player,
I want a mobile-optimized interface with touch-friendly navigation,
So that I can use the app comfortably on my phone before and during practice.

**Acceptance Criteria:**

**Given** I am a player on a mobile device (viewport < 1024px)
**When** the app loads
**Then** I see the mobile player shell: simplified bottom navigation with exactly 2 destinations — Practice Plan and Drill Library

**Given** I interact with any element in the player shell
**When** I tap buttons, cards, or navigation items
**Then** all interactive elements have a minimum touch target of 44×44px

**Given** I navigate between Practice Plan and Drill Library
**When** the transition occurs
**Then** navigation responds in ≤1s (NFR4)

**Given** I am a player on a desktop viewport (≥ 1024px)
**When** the app loads
**Then** I see the desktop player shell with left sidebar navigation — the same 2 destinations, adapted for the larger screen

**Given** the player shell renders on any device
**When** the server processes my request
**Then** the correct shell (mobile or desktop) is rendered server-side via UA detection — no layout flash on load

---

## Epic 7: Assistant Coach Access *(Phase 1.5 — post-pilot stabilization)*

Head coaches can invite assistant coaches by email and remove them. Invited assistant coaches can accept the invite and join with full drill creation/editing rights and practice plan editing access. Head coach retains exclusive authority to create, configure, and delete the team. All role-scoped permissions enforced server-side.

### Story 7.0: [Technical Task] Transactional Email Service Integration

> **Note:** This is a developer prerequisite task. Story 7.1 cannot be completed without transactional email delivery working. Must be implemented before Story 7.1.

As a developer,
I want a transactional email service integrated into the backend,
So that assistant coach invitation emails can be reliably delivered.

**Acceptance Criteria:**

**Given** a transactional email provider is configured (e.g., Resend, SendGrid, or Supabase transactional email)
**When** the backend calls the email service with a recipient address, subject, and body
**Then** the email is delivered to the recipient's inbox

**Given** the email service credentials are configured
**When** the application starts
**Then** credentials are loaded from environment variables only — never from committed config files

**Given** the email service call fails (provider error or network issue)
**When** the error is caught
**Then** the failure is logged and a structured error response (RFC 7807 Problem Details) is returned — no silent failures

---

### Story 7.1: Assistant Coach Invite by Head Coach

As a head coach,
I want to invite an assistant coach to my team by email,
So that they can help build the drill library and plan practices.

**Acceptance Criteria:**

**Given** I am a head coach and navigate to the team management section
**When** I enter an email address and submit an assistant coach invite
**Then** an invite record is created with a unique token, `expires_at` (7 days), and `role: assistant_coach`, and an invitation email is sent to that address

**Given** the invite is sent to an email already associated with an existing MxM account
**When** the invite is accepted
**Then** that existing account is linked to the team as an assistant coach — no duplicate account is created

**Given** the invite is sent to an email with no existing MxM account
**When** the recipient opens the invite link
**Then** they are prompted to create an account, after which they are added to the team as an assistant coach

**Given** I attempt to invite a user who is already a member of my team
**When** the invite is submitted
**Then** an error "This person is already on your team" is shown and no duplicate invite is created

---

### Story 7.2: Assistant Coach Invite Acceptance

As an invited assistant coach,
I want to accept a team invite via the link in my email,
So that I can join the team and start contributing to drills and practice plans.

**Acceptance Criteria:**

**Given** I receive an invite email and click the invite link
**When** the /join/[token] page loads
**Then** I see the team name and head coach name, and I am prompted to sign in or create an account

**Given** I sign in or create an account after following a valid assistant coach invite link
**When** authentication completes
**Then** I am added to the team with the `assistant_coach` role and redirected to the coach dashboard with appropriate permissions

**Given** I follow an expired or revoked assistant coach invite link
**When** the page loads
**Then** I see "This invite link has expired or is no longer valid" and no team join occurs

---

### Story 7.3: Assistant Coach Removal

As a head coach,
I want to remove an assistant coach from my team,
So that I can manage who has coaching access as my staff changes.

**Acceptance Criteria:**

**Given** I navigate to the coach management section of my team settings
**When** I view the list
**Then** I see all assistant coaches with their name, email, and join date

**Given** I select an assistant coach and choose to remove them
**When** I confirm the removal dialog
**Then** their team membership is deleted, they lose all coaching access immediately, and they no longer appear in the coach list

**Given** a removed assistant coach attempts to access any team-scoped coach endpoint
**When** the request is processed
**Then** `ValidateTeamAccess` returns unauthorized and no data is returned

---

### Story 7.4: Role-Scoped Permissions — Head Coach vs Assistant Coach

As the platform,
I need head coach and assistant coach permissions enforced server-side,
So that assistant coaches cannot perform destructive team-level actions regardless of client-side state.

**Acceptance Criteria:**

**Given** I am an assistant coach and attempt to call the delete team endpoint
**When** the request reaches the controller
**Then** `[Authorize(Roles = "HeadCoach")]` rejects the request with 403 Forbidden

**Given** I am an assistant coach and attempt to call the delete team endpoint directly via API
**When** the request is processed
**Then** the server rejects it — there is no client-side workaround that grants this access

**Given** I am an assistant coach
**When** I use the application
**Then** team creation, team deletion, and team configuration actions are not available to me — neither in the UI nor via API

**Given** I am an assistant coach
**When** I create or edit a drill or edit a practice plan
**Then** the action succeeds — these are within my permitted scope (FR22, FR35)
