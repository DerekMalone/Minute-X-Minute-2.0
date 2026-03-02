---
stepsCompleted: ["step-01-document-discovery", "step-02-prd-analysis", "step-03-epic-coverage-validation", "step-04-ux-alignment", "step-05-epic-quality-review", "step-06-final-assessment"]
documentsInventoried:
  prd: "_bmad-output/planning-artifacts/prd.md"
  architecture: "_bmad-output/planning-artifacts/architecture.md"
  epics: "_bmad-output/planning-artifacts/epics.md"
  ux_spec: "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Implementation Readiness Assessment Report

**Date:** 2026-02-28
**Project:** minuteXminute2

---

## PRD Analysis

### Functional Requirements

**Identity & Access (MVP Phase 1)**
- FR1: Visitors can create an account using email and password
- FR2: Visitors can create an account using an OAuth provider (Google)
- FR3: Users can sign in using email and password
- FR4: Users can sign in using an OAuth provider
- FR5: Users must confirm they are 13 or older before completing account creation
- FR6: Users can sign out of their account

**Identity & Access (Phase 1.5)**
- FR7: Head coaches can invite assistant coaches to their team by email
- FR8: Invited assistant coaches can accept an invite and join a team with assistant-level permissions
- FR9: Head coaches can remove an assistant coach from their team
- FR10: Head coaches have exclusive authority to create and delete teams; assistant coaches can create and edit drills and practice plans but cannot create, configure, or delete the team

**Team Management (MVP Phase 1)**
- FR11: Coaches can create a team
- FR12: Head coaches can delete their team
- FR13: Coaches can generate a shareable invite link to add players to their team
- FR14: Players can join a team via an invite link, either creating a new account or signing into an existing one
- FR15: Coaches can view and manage the team roster — view all members, see roles, and remove members
- FR16: Coaches can assign position tags to players on the roster

**Drill Library (MVP Phase 1)**
- FR17: Coaches can create a drill with name, description, category, difficulty, estimated duration, and position tags
- FR18: Coaches can edit any attribute of an existing drill
- FR19: Coaches can delete a drill from their library
- FR20: Coaches can view their complete drill library with filtering by category, difficulty, duration, and position tag
- FR21: Coaches can search their drill library by name or keyword

**Drill Library (Phase 1.5)**
- FR22: Assistant coaches can create and edit drills in the team library

**Canvas & Whiteboard (MVP Phase 1)**
- FR23: Coaches can add a multi-slide whiteboard canvas to any drill
- FR24: Coaches can draw, add shapes, place text, and erase content on a canvas slide
- FR25: Coaches can add, remove, and reorder slides within a drill's canvas
- FR26: Coaches can retrieve previously saved canvas content for any drill
- FR27: Players can view all canvas slides for any drill in read-only mode

**Practice Planning (MVP Phase 1)**
- FR28: Coaches can create a practice plan by selecting and ordering drills from their library
- FR29: Coaches can set a total practice duration and assign a time allocation to each drill in the plan
- FR30: Coaches can see remaining available practice time updated in real time as drills are added, removed, or adjusted
- FR31: Coaches can reorder drills within a practice plan
- FR32: Coaches can edit or delete an existing practice plan
- FR33: Coaches can designate a practice plan as the active upcoming plan visible to players
- FR34: Coaches can mark individual drills within a practice plan as hidden from player view

**Practice Planning (Phase 1.5)**
- FR35: Assistant coaches can edit practice plans, including adding, removing, and reordering drills

**Player Experience (MVP Phase 1)**
- FR36: Players can view the team's active practice plan in read-only mode
- FR37: Players can browse the complete team drill library in read-only mode
- FR38: Players can open any drill and view its full detail, including all canvas slides, in read-only mode
- FR39: Players can access practice plan and drill library views on mobile devices with all interactive elements operable via touch navigation

**Engagement & Home Practice (Phase 2)**
- FR40: Coaches can assign specific drills from their library as home practice suggestions for the team
- FR41: Players can view drills assigned to them as home practice
- FR42: Coaches can see which players have opened assigned home practice drills

**Content Discovery & Social Hub (Phase 2)**
- FR43: Coaches can mark individual drills as publicly visible to the broader coach community
- FR44: Coaches can browse publicly shared drills from other coaches
- FR45: Coaches can save a public drill directly into their own library
- FR46: Solo players (without a team) can browse the public drill library and save drills to a personal collection

**Scheduling (Phase 2)**
- FR47: Coaches can create and manage a team schedule of practices and games
- FR48: Players can view upcoming scheduled events

**Offline Access (Phase 2)**
- FR49: Players and coaches can access their drill library and practice plans in read-only mode without an active internet connection

**Compliance & Platform (MVP Phase 1)**
- FR50: The marketing and landing page is publicly accessible and indexed by search engines
- FR51: All authenticated application pages are excluded from search engine indexing
- FR52: Users can navigate all interactive UI components using keyboard alone and access all content via screen reader (WCAG 2.1 AA)
- FR53: Each canvas whiteboard slide exposes a text alternative describing the drill name and slide number for assistive technologies

**Total FRs: 53** (FR1–FR53)
- Phase 1 MVP: FR1–FR6, FR11–FR21, FR23–FR34, FR36–FR39, FR50–FR53 (32 FRs)
- Phase 1.5: FR7–FR10, FR22, FR35 (6 FRs)
- Phase 2+: FR40–FR49 (10 FRs)

---

### Non-Functional Requirements

**Performance**
- NFR1: Canvas interactions render at ≤16ms frame time (60fps) during active drawing, validated on mid-range Android with Chrome
- NFR2: Largest Contentful Paint (LCP) ≤2.5s on mid-range Android over 4G
- NFR3: Time to Interactive (TTI) ≤3.5s on initial page load
- NFR4: In-app navigation responds in ≤1s after initial load
- NFR5: Lighthouse performance score ≥85 on both desktop and mobile audits
- NFR6: Canvas library loaded on demand without degrading Lighthouse score below NFR5 threshold

**Security**
- NFR7: All data transmitted exclusively over HTTPS in every environment
- NFR8: All protected API requests validated server-side — no client-side-only authorization
- NFR9: User credentials managed exclusively by the authentication provider; backend stores no passwords, tokens, or OAuth credentials
- NFR10: PII limited to what is necessary (name, email, position tag, team assignment)
- NFR11: All endpoints that create, modify, or delete data require a valid, authenticated session token
- NFR12: Role-based access (coach vs. player; head coach vs. assistant coach) enforced server-side

**Scalability**
- NFR13: System supports 5–25 concurrent users without performance degradation
- NFR14: No horizontal scaling required for MVP; single-server deployment sufficient
- NFR15: Data schema and API design must support Phase 2 additions via additive changes — no destructive schema migrations for planned growth features

**Accessibility**
- NFR16: All interactive UI components meet WCAG 2.1 AA — keyboard navigation, focus management, screen reader compatibility not overridden
- NFR17: Brand accent colors achieve minimum 4.5:1 contrast ratio against background in both light and dark modes
- NFR18: Canvas surfaces exempt from interactive accessibility; each exposes text alternative describing drill name and slide context
- NFR19: All surfaces use semantic HTML — correct heading hierarchy, landmark regions, labeled form inputs

**Integration**
- NFR20: Auth system handles email/password and OAuth; backend validates tokens locally without additional network calls to auth provider
- NFR21: API routing resolves correctly in local and containerized environments via environment-variable config — no code changes between environments
- NFR22: PWA service worker installed but not activated for MVP; architecture must not conflict with Phase 2 service worker activation

**Total NFRs: 22** (NFR1–NFR22)

---

### Additional Requirements & Constraints

**Compliance Constraints:**
- COPPA: 13+ age gate at signup; under-13 players use share-link access only (no account required)
- FERPA: Deferred; not a blocker for MVP pilot; revisit at Phase 2
- GDPR/CCPA: Standard PII coverage via privacy policy; data minimization already achieved

**Technical Constraints:**
- Solo developer; sequential development; no dedicated QA
- PWA installed but not activated (Serwist deferred to Phase 2)
- No real-time features (SignalR deferred to Phase 2)
- No BFF layer — direct frontend-to-.NET API calls
- No in-app admin panel — Supabase dashboard + direct DB access for operator tasks
- `drill_slides` JSON schema must be designed carefully upfront — schema changes are costly after data exists

**Browser/Device Constraints:**
- Primary: Chrome (Android/desktop), Safari iOS current, Chrome desktop
- Secondary: Firefox desktop, Edge desktop
- Explicitly excluded: IE11 / legacy browsers
- Device floor: mid-range Android with Chrome (4GB RAM)

**Architecture Constraints:**
- Business logic written platform-agnostic for future React Native extraction
- react-konva isolated as swappable dependency (replacement: react-native-skia)
- No destructive schema migrations for any planned Phase 2 growth features

---

### PRD Completeness Assessment

The PRD is thorough and well-structured. FRs are clearly numbered (FR1–FR53), phased, and traceable to user journeys. NFRs are specific and measurable with concrete targets. Compliance constraints are documented. The phasing (MVP / Phase 1.5 / Phase 2) is explicit and consistent.

**Potential gaps to flag for epic coverage validation:**
1. No explicit FR for "coach can view multiple practice plans" (list/history view) — FR28/FR32 imply it but don't state it
2. No explicit FR for password reset / forgot password flow
3. No explicit FR for profile management (e.g., updating display name or email)
4. The `drill_slides` schema design constraint is a technical risk called out in risk section but has no corresponding FR or NFR to enforce design review before build
5. FR34 (hide drill from players) is called out in PRD FRs but worth confirming it maps clearly into epics

---

## Epic Coverage Validation

### Coverage Matrix

| FR | PRD Requirement (summary) | Epic Coverage | Status |
|---|---|---|---|
| FR1 | Email/password account creation | Epic 1 — Story 1.1 | ✓ Covered |
| FR2 | OAuth (Google) account creation | Epic 1 — Story 1.2 | ✓ Covered |
| FR3 | Email/password sign-in | Epic 1 — Story 1.3 | ✓ Covered |
| FR4 | OAuth sign-in | Epic 1 — Story 1.3 | ✓ Covered |
| FR5 | Age gate (13+) at signup | Epic 1 — Story 1.1, 1.2 | ✓ Covered |
| FR6 | Sign out | Epic 1 — Story 1.3 | ✓ Covered |
| FR7 | Head coach invites assistant by email | Epic 7 — Story 7.1 (Phase 1.5) | ✓ Covered |
| FR8 | Assistant coach accepts invite | Epic 7 — Story 7.2 (Phase 1.5) | ✓ Covered |
| FR9 | Head coach removes assistant coach | Epic 7 — Story 7.3 (Phase 1.5) | ✓ Covered |
| FR10 | Head coach vs assistant scope | Epic 7 — Story 7.4 (Phase 1.5) | ✓ Covered |
| FR11 | Coach creates team | Epic 2 — Story 2.2 | ✓ Covered |
| FR12 | Head coach deletes team | Epic 2 — Story 2.2 | ✓ Covered |
| FR13 | Coach generates player invite link | Epic 2 — Story 2.3 | ✓ Covered |
| FR14 | Player joins via invite link | Epic 2 — Story 2.4 | ✓ Covered |
| FR15 | Coach manages roster (view, remove) | Epic 2 — Story 2.5 | ✓ Covered |
| FR16 | Coach assigns position tags to players | Epic 2 — Story 2.6 | ✓ Covered |
| FR17 | Create drill with full metadata | Epic 3 — Story 3.1 | ✓ Covered |
| FR18 | Edit drill attributes | Epic 3 — Story 3.2 | ✓ Covered |
| FR19 | Delete drill (soft delete) | Epic 3 — Story 3.3 | ✓ Covered |
| FR20 | Library view with filtering | Epic 3 — Story 3.4 | ✓ Covered |
| FR21 | Library search | Epic 3 — Story 3.5 | ✓ Covered |
| FR22 | Assistant coach creates/edits drills | Epic 7 — Story 7.4 (Phase 1.5) | ✓ Covered |
| FR23 | Multi-slide canvas on drill | Epic 4 — Story 4.2 | ✓ Covered |
| FR24 | Draw, shapes, text, erase on canvas | Epic 4 — Story 4.3 | ✓ Covered |
| FR25 | Add, remove, reorder slides | Epic 4 — Story 4.4 | ✓ Covered |
| FR26 | Retrieve saved canvas content | Epic 4 — Story 4.5 | ✓ Covered |
| FR27 | Player read-only canvas view | Epic 4 — Story 4.6 | ✓ Covered |
| FR28 | Create practice plan from library | Epic 5 — Story 5.1, 5.2 | ✓ Covered |
| FR29 | Total duration + per-drill time allocation | Epic 5 — Story 5.1, 5.3 | ✓ Covered |
| FR30 | Live available-time counter | Epic 5 — Story 5.2 | ✓ Covered |
| FR31 | Reorder drills in plan | Epic 5 — Story 5.4 | ✓ Covered |
| FR32 | Edit or delete practice plan | Epic 5 — Story 5.5 | ✓ Covered |
| FR33 | Designate active plan for players | Epic 5 — Story 5.6 | ✓ Covered |
| FR34 | Hide individual drills from players | Epic 5 — Story 5.6 | ✓ Covered |
| FR35 | Assistant coach edits practice plans | Epic 7 — Story 7.4 (Phase 1.5) | ✓ Covered |
| FR36 | Player views active practice plan | Epic 6 — Story 6.1 | ✓ Covered |
| FR37 | Player browses drill library | Epic 6 — Story 6.2 | ✓ Covered |
| FR38 | Player views drill detail + canvas | Epic 6 — Story 6.3 | ✓ Covered |
| FR39 | Player: mobile touch navigation | Epic 6 — Story 6.4 | ✓ Covered |
| FR40–FR42 | Home practice (Phase 2) | Out of MVP scope — acknowledged | ✓ Acknowledged |
| FR43–FR46 | Social Hub (Phase 2) | Out of MVP scope — acknowledged | ✓ Acknowledged |
| FR47–FR48 | Scheduling (Phase 2) | Out of MVP scope — acknowledged | ✓ Acknowledged |
| FR49 | Offline access (Phase 2) | Out of MVP scope — acknowledged | ✓ Acknowledged |
| FR50 | Landing page publicly indexed | Epic 1 — Story 1.5 | ✓ Covered |
| FR51 | Auth app pages excluded from indexing | Epic 1 — Story 1.4 | ✓ Covered |
| FR52 | WCAG 2.1 AA keyboard + screen reader | Definition of Done (all epics) | ✓ Covered |
| FR53 | Canvas text alternative per slide | Epic 4 — Story 4.6 | ✓ Covered |

---

### Missing Requirements & Coverage Gaps

#### Gap 1 — CRITICAL: No story for Practice Plans List view

**Issue:** Story 5.5 returns coach to "the plans list" and Story 5.1 navigates to "new practice plan" — both imply a plans list page exists, but there is **no story** defining it. How are existing plans displayed? Can the coach see all plans? Is there a search or filter? What's the empty state?
**Impact:** A developer building Story 5.1 without this story has no spec for the list page. The navigation stub exists but the view itself has no acceptance criteria.
**Recommendation:** Add Story 5.0 (or Story 5.7): "As a coach, I want to view all my practice plans, so that I can open, manage, or create plans from one place."

---

#### Gap 2 — HIGH: No story for Password Reset / Forgot Password

**Issue:** FR3 covers sign-in but there is no FR or story for what happens when a user can't remember their password. Supabase provides this flow, but it requires a front-end "Forgot Password?" link on the login page that triggers a Supabase password reset email — and a `/reset-password` route to handle the token callback.
**Impact:** Without this, users who forget their password are locked out and must contact the operator (Journey 4 pattern). At pilot scale this is manageable but a real friction point.
**Recommendation:** Add to Epic 1 (Story 1.X): "As a registered user, I want to reset my password via email, so that I can regain access if I forget it." Maps to Supabase `resetPasswordForEmail()` + callback route.

---

#### Gap 3 — HIGH: No story for Email Verification flow (email/password signup)

**Issue:** Story 1.1 creates an account and immediately redirects to the coach dashboard. But Supabase email/password signups send a verification email by default — the user isn't confirmed until they click it. The story doesn't address: What does the user see while unverified? Is there a "check your email" intermediary screen? Can they use the app before verifying?
**Impact:** If Supabase `email_confirm` is enabled (default), users who skip verification won't have a confirmed session. Story 1.1's last AC checks that the JWT validates against .NET — this may fail for an unconfirmed user.
**Recommendation:** Clarify Supabase email confirmation setting in Story 1.1's context (enabled or disabled for MVP?), and add an AC for the post-submit state.

---

#### Gap 4 — MEDIUM: No story for Soft-Delete Auto-Purge BackgroundService

**Issue:** The architecture document (included in epics requirements inventory) explicitly states: "a BackgroundService runs 7-day auto-purge of hard deletes" for soft-deleted drills. Story 3.3 covers soft delete, but there is no story for the BackgroundService that executes the eventual hard delete.
**Impact:** Without a story, this backend service will likely be skipped or deferred indefinitely. If drill storage accumulates soft-deleted records with no purge mechanism, the table grows unbounded.
**Recommendation:** Add a developer story to Epic 3 or a backend infrastructure epic: "As the platform, I need a BackgroundService to hard-delete drill records soft-deleted more than 7 days ago, so that storage doesn't accumulate stale data."

---

#### Gap 5 — MEDIUM: NFR1 (canvas ≤16ms) has no validation story

**Issue:** NFR1 is explicitly called out as the **highest priority** technical success criterion in the PRD ("Canvas responsiveness (highest priority)"), yet there is no story or acceptance criterion that validates ≤16ms frame time on mid-range Android. Story 4.1 establishes code-split to protect Lighthouse score, but that's a different concern.
**Impact:** The riskiest technical component (react-konva on mobile) has no defined validation gate. It could be discovered as failing at the end of development.
**Recommendation:** Add an AC to Story 4.3 or a dedicated performance story: "Given the draw tool is active and I drag continuously on a mid-range Android device with Chrome, when I inspect frame times, then no frame exceeds 16ms during active drawing."

---

#### Gap 6 — MEDIUM: Email sending infrastructure for assistant coach invites is assumed, not built

**Issue:** Story 7.1 states "an invitation email is sent to that address" as part of the acceptance criteria. However, no story covers the email delivery infrastructure. The current stack has no email service configured — Supabase handles auth emails (signup/reset), but transactional coaching emails (assistant invite) require a separate service (e.g., Resend, SendGrid, or Supabase's own transactional email).
**Impact:** Story 7.1 cannot be completed without email delivery working. This is a dependency that has no story.
**Recommendation:** Add infrastructure story to Epic 7 (or a platform epic): "As the platform, I need a transactional email service integrated so that assistant coach invite emails can be delivered reliably."

---

#### Gap 7 — LOW: NFR7 (HTTPS enforcement), NFR17 (color contrast), NFR22 (PWA SWinstalled) have no validation stories

**Issue:** These NFRs have no corresponding acceptance criteria anywhere in the epics.
- **NFR7** (HTTPS-only): No story validates this. Enforced at infrastructure level but never verified.
- **NFR17** (4.5:1 contrast): Referenced in NFR list but no acceptance criterion checks it.
- **NFR22** (Serwist installed but not activated): No story installs the service worker or verifies it doesn't conflict.
**Impact:** Low individually, but collectively these represent untested non-functional requirements that could cause issues at audit/review time.
**Recommendation:** Add NFR verification ACs to the Definition of Done checklist, or add a dedicated "Foundation NFR validation" story to Epic 1.

---

### Coverage Statistics

- **Total PRD FRs:** 53 (FR1–FR53)
- **FRs explicitly covered in MVP epics:** 39 (FR1–FR39, FR50–FR53)
- **FRs in Phase 1.5 epics (Epic 7):** 6 (FR7–FR10, FR22, FR35)
- **Phase 2 FRs acknowledged, out of scope:** 10 (FR40–FR49)
- **FR coverage (MVP + Phase 1.5):** 45/45 = **100% — all in-scope FRs have epic coverage**

**NFR coverage gaps identified:** 3 NFRs with no validation path (NFR7, NFR17, NFR22)
**Functional gaps identified:** 3 missing stories (plans list, password reset, auto-purge) + 1 ambiguous story (email verification) + 1 missing infrastructure (email service)

---

## UX Alignment Assessment

### UX Document Status

**Found:** `_bmad-output/planning-artifacts/ux-design-specification.md` (60K, Feb 27)

UX is comprehensive — covers design system, component strategy, journey flows, responsive strategy, accessibility, and visual design in full detail. The spec is tightly integrated with the epics (many UX requirements are absorbed directly into story acceptance criteria).

---

### Alignment Issues

#### Issue 1 — HIGH: Breakpoint inconsistency within UX spec itself

**UX Implementation Approach section (line ~521):** "Responsive breakpoint: Layout switches at 768px (tablet)"
**UX Responsive Design section (line ~981):** "Shell breakpoint: `1024px` (`lg` in Tailwind)"
**Epics document:** Consistently uses `1024px` as the shell switch breakpoint.

**Impact:** If a developer reads the Implementation Approach section, they'll build the shell switch at 768px — tablet users will get the desktop shell instead of the mobile shell, contradicting the documented design intent (tablet = mobile shell by default). This is a direct implementation conflict hiding in the same document.
**Resolution:** The 768px reference in Implementation Approach is a stale value from an earlier iteration. **Correct value: 1024px.** The UX spec needs to be corrected at that section.

---

#### Issue 2 — HIGH: Under-13 share-link path described in UX/PRD but not implemented in any epic

**UX states:** "Players under 13 can access practice content via a share link from their coach."
**PRD states:** "Players under 13 access practice plan content via share link only (no account = outside COPPA scope)."
**Epics:** No story exists for a share-link-only, no-account-required practice plan view.

**Impact:** The COPPA compliance note in the PRD explicitly documents this path as the mechanism for under-13 player access. If this isn't built, the COPPA compliance statement in the PRD is inaccurate — the product has no compliant path for under-13 users. For a pilot of 3–5 known coaches this may be operationally fine, but it's a gap between what's claimed and what's built.
**Resolution:** Either add a story for the share-link view (unauthenticated read-only practice plan access via token), or explicitly note in the PRD and epics that under-13 share-link access is deferred and COPPA compliance relies on the 13+ gate alone for MVP.

---

#### Issue 3 — MEDIUM: D3 Timeline view (optional toggle) is in UX spec but has no epic or story

**UX states:** "D3 as optional view — Timeline gives a visual budget read; list gives density and reorderability. Coaches get both." and "Coaches can toggle between List view (default) and Timeline view."
**Epics:** No story covers building the D3 timeline view or the toggle between list/timeline views.

**Impact:** A developer reading the UX spec will see the timeline view described as a shipped feature (Phase 1 in the UX Implementation Roadmap it says "Phase 1 — MVP Core Loop" for the counter, card, etc., and Phase 3 lists "Timeline view components — D3 optional view"). However, there's no corresponding story and no clear phase assignment. If built, it's unspecified; if not built, it conflicts with the UX spec.
**Resolution:** The UX spec's Phase 3 roadmap seems to defer timeline. Confirm the UX spec's own component roadmap (where timeline is Phase 3) is the authoritative source, and explicitly mark D3 timeline as post-MVP in the spec to avoid confusion.

---

#### Issue 4 — MEDIUM: "Coach before team" UX concept may conflict with team-scoped data architecture

**UX states:** "A coach can create drills, build practice plans, and experience full product value before creating or joining a team. Team setup is an enhancement to an already-useful tool, not a prerequisite."
**Architecture (via epics):** `ValidateTeamAccess(userId, teamId)` is established in Story 2.1 as the security foundation and is called before any team-scoped data access. The base service enforces team membership on every protected endpoint.
**PRD:** Lists Team Management as one of 6 core MVP features.

**Impact:** If drills are coach-owned (not team-scoped), the `ValidateTeamAccess` model doesn't apply to them — a coach without a team can access their drills. But if the data model requires `team_id` on drill records, a coach can't create drills until they have a team. This is an architectural conflict with the UX aspiration. No story or data model spec explicitly resolves this.
**Resolution:** Confirm whether drills are `team_id`-scoped or `coach_id`-scoped in the data schema. If coach-scoped, `ValidateTeamAccess` is inapplicable to drill creation — the architecture story needs to account for this. If team-scoped, the "coach before team" UX aspiration is aspirational only and cannot be delivered without a default/personal team being auto-created at account setup.

---

#### Issue 5 — MEDIUM: Keyboard drag-and-drop phasing conflict between UX and epics

**UX states:** "Drag-and-drop: keyboard fallback via dnd-kit `KeyboardSensor` (Phase 1.5 — required before public release, not a pilot blocker)"
**Epic 5 Story 5.4:** Includes keyboard arrow key drag-and-drop as an acceptance criterion — it's in MVP, not Phase 1.5.

**Impact:** Minor — Story 5.4 delivering keyboard reorder in MVP is better than deferring it. But the UX spec and epics are misaligned on the phase. A developer reading the UX spec might assume it's Phase 1.5 work and not include keyboard drag in the MVP implementation.
**Resolution:** Update UX spec to mark keyboard drag fallback as MVP (aligned with Story 5.4).

---

#### Issue 6 — LOW: Onboarding split path (fast path vs. build-first-drill) has no epic story

**UX describes:** "Onboarding split path — New coaches arrive at a choice — build from a default practice plan (pre-populated with template drills) OR create a drill from scratch."
**Epics:** Story 3.6 covers pre-loaded template drills. Story 5.1 shows a pre-populated plan template. But no story defines the onboarding decision point itself — the split screen or path choice that UX describes as the entry to the product.

**Impact:** Without a story, the onboarding flow is whatever a developer decides it should be. The UX's specific framing of the split path is unimplemented.
**Resolution:** Determine if the onboarding split is a UI screen (requiring a story) or an implicit experience (drill templates in library + plan template auto-loaded means both paths happen without an explicit choice). If the latter, the UX description is aspirational prose, not a spec — clarify.

---

#### Issue 7 — LOW: Filter persistence behavior has no acceptance criterion

**UX states:** "Active filters persist within a session. Reset on navigation away from the library."
**Epics:** No acceptance criterion covers filter state persistence.

**Impact:** Low risk — implementation will likely default to resetting filters on navigation regardless. But the UX intent is explicit.
**Resolution:** Add one AC to Story 3.4 or 3.5: "Given I have active filters and navigate away from and back to the library, When the page loads, Then filter state is reset to none."

---

### Warnings

⚠️ **The 768px breakpoint reference in the UX spec Implementation Approach section is a confirmed error.** The correct shell switch breakpoint is `1024px`. This should be corrected in the UX spec before implementation to avoid a developer building at the wrong breakpoint.

⚠️ **The "coach before team" aspiration requires explicit data architecture resolution.** If this UX goal is real, the data model must support it — drills need to be coach-scoped, not team-scoped, and the onboarding flow must not gate drill creation behind team creation.

⚠️ **The under-13 share-link path is currently an unfulfilled compliance claim.** If the PRD's COPPA note is to be technically accurate, this path needs either implementation or explicit deferral documentation.

---

## Epic Quality Review

### Epic Structure Validation

| Epic | User Value | Independent | Status |
|---|---|---|---|
| Epic 1: Foundation & Authenticated Onboarding | ✅ Users can sign up, sign in, access app | ✅ Standalone | ✅ Pass |
| Epic 2: Team & Player Onboarding | ✅ Coaches create teams, players join | ✅ Depends only on Epic 1 | ⚠️ One technical story |
| Epic 3: Drill Library | ✅ Core memory-extension value prop | ✅ Depends on Epic 1 & 2 | ✅ Pass |
| Epic 4: Whiteboard & Canvas | ✅ Canvas-native drill authoring | ✅ Depends on Epic 1–3 | ⚠️ One technical story |
| Epic 5: Practice Planning | ✅ Hero interaction, core differentiator | ✅ Depends on Epic 1–3 | ⚠️ Forward dependency |
| Epic 6: Player Experience | ✅ Player side of the core loop | ✅ Explicitly requires Epic 5 | ✅ Pass |
| Epic 7: Assistant Coach Access (1.5) | ✅ Coach staff management | ✅ Depends on Epic 1 & 2 | ⚠️ Unbuilt dependency |

---

### 🔴 Critical Violations

#### Violation 1: Story 2.1 is a technical developer story, not a user story

**Story:** "As a **developer**, I want the BaseService with team access validation and the EF Core soft-delete global query filter established, so that every subsequent protected endpoint is built on a consistent, secure foundation."
**Violation:** Epic quality standards require stories to deliver user value. "As a developer" with a developer-only outcome (BaseService, EF Core filter) is a technical milestone dressed as a story. No user receives any benefit from this story being done — it is invisible to users. There is also no natural Definition of Done that maps to a user capability.

**Impact:** This story must be completed before Story 2.2 or any subsequent team-scoped story can work. It's a real prerequisite — but its placement as a numbered user story (Story 2.1) implies it can be independently verified and delivered like the other stories. It cannot be demonstrated to a user or product owner.

**Remediation:** Convert to a developer task embedded in Story 2.2 ("Team Creation and Deletion"). The `ValidateTeamAccess` base service and EF Core filter are implementation details of team data access — they should be prerequisites within Story 2.2's implementation, not a separate numbered story. Alternatively, prefix the title explicitly: "**[Technical Prerequisite]** Backend Foundation — ValidateTeamAccess & Soft-Delete Filter" to make the nature clear and prevent it from being treated as a sprint-demoable story.

---

#### Violation 2: Story 4.1 is a technical developer story, not a user story

**Story:** "As a **developer**, I want react-konva dynamically imported and isolated from all player-facing routes, so that the canvas bundle never loads for players and the Lighthouse performance score is not degraded."
**Violation:** Same class as Story 2.1 — "As a developer" with a developer-only outcome. No user receives a direct benefit from this story. A player doesn't experience "react-konva not being in their bundle." This is an architectural implementation detail.

**ACs include:** "Given any component in the codebase imports react-konva, When the import is written, Then it must use `next/dynamic` with `{ ssr: false }` — direct static imports of react-konva are forbidden." This is a code review rule, not a user-facing acceptance criterion.

**Remediation:** Same approach as Story 2.1 — embed as a technical prerequisite task within Story 4.2 ("Add a Whiteboard Canvas to a Drill"). The dynamic import boundary is an implementation constraint of building the canvas feature, not a separately deliverable user story. Alternatively, merge with Story 4.2's implementation notes and move the Lighthouse AC to an NFR verification checklist.

---

#### Violation 3: Story 5.6 contains a forward dependency AC on Epic 6

**Story 5.6 AC:** "Given a plan is marked active, When a player views their dashboard, Then they see this plan as the upcoming practice **(covered in Epic 6)**"

**Violation:** This acceptance criterion cannot be tested or verified until Epic 6 (Story 6.1) is complete. The parenthetical "(covered in Epic 6)" is an explicit acknowledgment that this AC has a forward dependency. By definition, a story with an untestable AC is not a completable story — it creates a situation where Story 5.6 can only be marked "done" after Epic 6 is done, making Epic 5 dependent on Epic 6.

**Impact:** Epic 5 cannot be fully signed off before Epic 6 is complete. This breaks the independence guarantee between epics.

**Remediation:** Remove the forward-reference AC from Story 5.6. The AC "When a player views their dashboard, Then they see this plan" belongs in Story 6.1, not Story 5.6. Story 5.6's scope should end at "the active plan designation is persisted and the API correctly marks one plan as active at a time" — observable without Epic 6. Story 6.1 then owns the player-visible outcome.

---

### 🟠 Major Issues

#### Issue 1: Story 2.2 contains a forward dependency AC on Epic 7 (Phase 1.5)

**Story 2.2 AC:** "Given I am an assistant coach and view team settings, When the page renders, Then no team deletion option is visible or accessible to me."

**Violation:** The assistant coach role doesn't exist until Epic 7 (Phase 1.5). Testing this AC requires Phase 1.5 work. An MVP story should not have an AC that requires post-MVP features to verify.

**Remediation:** Move this AC to Story 7.4 ("Role-Scoped Permissions — Head Coach vs Assistant Coach") where it belongs. Story 2.2 needs no assistant coach ACs — it's an MVP story about head coach team creation and deletion.

---

#### Issue 2: Story 7.1 depends on unbuilt email delivery infrastructure

**Story 7.1 AC:** "an invitation email is sent to that address"

**Violation:** No story builds the transactional email service required to send assistant coach invites. This AC cannot pass without that infrastructure. Story 7.1 is currently impossible to complete as written.

**Remediation:** Add a prerequisite infrastructure story to Epic 7 (or a platform epic): "As the platform, I need a transactional email service configured, so that assistant coach invite emails can be reliably delivered." This story must be completed before Story 7.1.

---

#### Issue 3: Story 5.1 and Story 3.6 have vague "pre-populated template" ACs

**Story 5.1 AC:** "a pre-populated template structure is present so I am editing rather than starting from a blank state" — no specification of what the template contains, how many drills, or what the structure looks like.
**Story 3.6 AC:** "a set of pre-loaded lacrosse drill templates is present" — no specification of how many or which drills are pre-loaded.

**Violation:** Non-measurable outcomes. A developer implementing these stories has no spec for what "pre-populated" or "a set of" means — they will make an arbitrary decision that may not match the intended product experience.

**Remediation:** Specify the template content. For Story 3.6: list the minimum number and categories of pre-loaded drills (e.g., "At least 5 drills covering Attack, Midfield, and Defense categories"). For Story 5.1: describe the default plan structure (e.g., "A 60-minute plan with 3 placeholder drill slots from the template drill set").

---

### 🟡 Minor Concerns

#### Concern 1: "Profile" navigation destination has no backing stories

**Story 1.6 AC:** Coach shell includes "Profile" as a navigation destination.
**Issue:** No story in any epic defines a Profile page, profile management, or account settings. The navigation destination points to a page that has no implementation spec.
**Remediation:** Either add a minimal profile story (e.g., "As a user, I can view my account email and sign out from the profile tab") or explicitly clarify the Profile tab is a stub/placeholder in MVP.

---

#### Concern 2: Story 3.2 has an implicit cross-epic dependency

**Story 3.2 AC:** "Then any practice plans containing this drill reflect the updated duration in their time calculations."
**Issue:** This AC requires Epic 5 (practice plans) to exist for full verification. At the time Story 3.2 is being tested, practice plans may not exist yet.
**Remediation:** Add a note that this AC is verified during Epic 5 integration testing, or split it into two ACs: one for the data persistence (Epic 3 scope) and one for the plan recalculation (verified during Epic 5).

---

#### Concern 3: Session token auto-refresh AC is not manually testable

**Story 1.3 AC:** "Given I am signed in and my session token is approaching expiry, When I continue using the app, Then the Supabase client refreshes my token automatically with no interruption to my session."
**Issue:** Token expiry testing requires either waiting for natural expiry or manipulating session state — neither is practical in manual testing. This is an integration concern that needs a clear test approach.
**Remediation:** Add a note on how this will be verified: "Verified by inspecting Supabase client behavior in dev tools network tab — confirm token refresh requests are visible without user interruption after session near-expiry (simulate by reducing token TTL in test environment)."

---

#### Concern 4: No "validate existing foundation" story for brownfield context

**Context:** The PRD and architecture note this is a brownfield project — auth scaffolding, backend, frontend, and database schema already exist.
**Issue:** No story validates that the existing foundation works correctly before building on top of it. If the existing scaffold has broken state, it will be discovered mid-Epic 1 rather than at a defined validation gate.
**Remediation:** Consider adding a Story 0 or preflight story: "As a developer, validate the existing brownfield foundation — Supabase auth flow, .NET backend health, Docker compose stack, and database connection — before any feature stories begin." (This can also be a technical task, not a user story.)

---

### Best Practices Compliance Summary

| Check | Status | Notes |
|---|---|---|
| Epics deliver user value | ⚠️ | 2 stories use "As a developer" — technical milestones |
| Epic independence | ⚠️ | Story 5.6 has forward reference to Epic 6 |
| Story independence | ⚠️ | Story 2.2 references Phase 1.5; Story 3.2 references Epic 5 |
| Forward dependencies | 🔴 | Found in Story 5.6 (Epic 6), Story 2.2 (Epic 7) |
| Database tables created when needed | ✅ | No evidence of upfront schema dumps |
| Clear acceptance criteria | ⚠️ | Story 5.1, 3.6 vague; Story 1.3 not manually testable |
| FR traceability | ✅ | Coverage map present and complete |
| Brownfield integration points | ⚠️ | No foundation validation story |

---

## Summary and Recommendations

### Overall Readiness Status

> **NEEDS WORK** — before proceeding to implementation

The planning is strong at its core. FR coverage is 100%, epics are logically sequenced, and story acceptance criteria are detailed and testable. The issues found are fixable — none require fundamental rethinking of the architecture or product direction. However, 3 critical violations and 6 high-priority gaps must be addressed before development begins to avoid rework, broken test coverage, and implementation confusion.

---

### Issue Summary

| Severity | Count | Categories |
|---|---|---|
| 🔴 Critical | 3 | 2 technical stories, 1 forward dependency |
| 🟠 High | 6 | Missing stories, UX inconsistency, compliance gap |
| 🟡 Medium | 7 | Missing validation, vague ACs, architectural ambiguity |
| ⬜ Low | 7 | Minor AC gaps, minor UX spec corrections |
| **Total** | **23** | |

---

### Critical Issues — Address Before Writing Any Code

**1. Convert Story 2.1 and Story 4.1 from developer stories to implementation tasks**
These are technical prerequisite tasks embedded in Epic 2 and Epic 4 respectively. They should not be numbered user stories. Move the implementation requirements into the containing story's technical notes (Story 2.2 and Story 4.2), or prefix them explicitly as `[Technical Task]` to prevent them from being treated as sprint-demoable stories. Do not demo these to stakeholders — they have no user-observable output.

**2. Remove the forward-reference AC from Story 5.6**
The AC "Given a plan is marked active, When a player views their dashboard, Then they see this plan (covered in Epic 6)" does not belong in Epic 5. Move it into Story 6.1. Story 5.6's scope ends at the data layer: active plan designation is saved, only one plan is active at a time, and the API returns the correct plan when queried. The player-visible outcome is Story 6.1's job.

**3. Fix the breakpoint inconsistency in the UX spec**
The Implementation Approach section states `768px` as the shell breakpoint. Every other reference — the Responsive Design section, the epics, the Architecture — says `1024px`. Correct the UX spec to `1024px` before implementation begins. A developer reading the wrong section will build the wrong shell switch and the mismatch won't be caught until testing.

---

### High Priority — Address Before Stories Begin Implementation

**4. Add a Practice Plans list story (Story 5.0 or 5.7)**
Stories 5.1 and 5.5 both reference "the plans list" as a navigation target, but no story defines it. A developer has no spec for this page. Add a story: "As a coach, I want to view all my practice plans, so that I can open, manage, or create plans from one place."

**5. Add a Password Reset story to Epic 1**
Self-service password reset (Supabase `resetPasswordForEmail()` + callback route) is not optional. Without it, users who forget their password require operator intervention for every login failure. Add Story 1.X: "As a registered user, I want to reset my password via email, so that I can regain access if I forget it."

**6. Add an email infrastructure story before Story 7.1**
Story 7.1 requires sending an invitation email to an assistant coach. No email delivery infrastructure is defined or built. Add a prerequisite: "As the platform, I need a transactional email service configured so that assistant coach invite emails can be reliably delivered." Story 7.1 is blocked until this is complete.

**7. Clarify or add the under-13 share-link path**
The PRD explicitly states this as the COPPA compliance mechanism for under-13 players. Either build it (add a story for unauthenticated read-only practice plan access via share token) or explicitly mark it as deferred in both the PRD and epics — removing the COPPA compliance claim if it won't be built.

**8. Remove Story 2.2's assistant coach forward-reference AC**
The AC "Given I am an assistant coach, When the page renders, Then no team deletion option is visible" cannot be tested until Phase 1.5. Move it to Story 7.4.

**9. Clarify the "coach before team" architectural question**
The UX says coaches can build drills and plans before creating a team. If true, drills must be coach-scoped (not team-scoped) — `ValidateTeamAccess` doesn't apply to drill creation. If false, the UX aspiration is unfulfillable and should be removed from the spec. Resolve this before any data schema is finalized.

---

### Medium Priority — Address During Story Refinement

10. Specify what "pre-populated template" means concretely in Story 3.6 and Story 5.1 (minimum drill count, categories, default plan structure)
11. Add NFR1 canvas performance validation AC to Story 4.3 — test on mid-range Android before building the full library on top of the canvas
12. Clarify D3 Timeline view phase assignment in the UX spec (it's listed as an optional UX feature with no corresponding story)
13. Add a soft-delete auto-purge BackgroundService story to Epic 3 or a backend infrastructure section
14. Add keyboard drag-and-drop phasing alignment between UX spec and Story 5.4 (UX says Phase 1.5; Story 5.4 includes it in MVP — align on MVP)

---

### Final Note

This assessment identified **23 issues** across 5 categories: FR coverage, epic quality, UX alignment, story structure, and NFR validation. The good news: the planning foundation is genuinely strong. FR traceability is complete (100%), the epic sequence is logically ordered, and the story ACs are among the most detailed I've reviewed. The 3 critical issues are all fixable in under an hour of editing — they don't require rethinking the plan, just cleaning up what's there. Resolve the criticals and high-priority items, then implementation is ready to begin.

**Assessor:** BMAD Implementation Readiness Workflow
**Date:** 2026-02-28
**Report:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-02-28.md`








