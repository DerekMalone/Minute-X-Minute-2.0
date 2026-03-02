---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-01b-continue', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
date: '2026-02-26'
lastEdited: '2026-02-27'
editHistory:
  - date: '2026-02-27'
    changes: 'Post-validation edit: added hide_conditioning FR, rewrote NFR security/integration section to remove implementation leakage, fixed FR format violations, aligned executive summary with MVP scope'
inputDocuments:
  - "_bmad-output/project-context.md"
  - "_bmad-output/planning-artifacts/create-brief-context.md"
  - "_bmad-output/planning-artifacts/product-brief-minuteXminute2-2026-02-24.md"
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: web_app
  domain: sports_tech
  complexity: medium
  projectContext: brownfield
  architecturalNotes: >
    Business logic written platform-agnostic from day one in preparation for
    future React Native extraction (Option 3 monorepo path). react-konva
    isolated as a swappable dependency (replacement: react-native-skia).
    Capacitor documented as the lowest-cost App Store distribution path when
    distribution data demands it. PWA for MVP and Phase 2.
---

# Product Requirements Document - minuteXminute2

**Author:** Derek
**Date:** 2026-02-26

## Executive Summary

MinuteXMinute 2.0 is a practice-first coaching platform for lacrosse teams. It targets the gap every existing sports tool ignores: structured practice creation, execution, and off-practice continuity. As lacrosse grows, the coaching toolset hasn't kept pace — logistics, stats, and video platforms dominate while practice planning methodology has stagnated at "just do it the way we always have." MxM is purpose-built to close this gap.

Primary users: coaches who need a persistent drill library and practice composer to stop being constrained by working memory; and players who need plan visibility and purposeful direction for development outside of practice. Solo players who find MxM independently serve as a long-term coach acquisition funnel — they'll hit the limits of what MxM offers without a coach, and that ceiling is the referral signal.

Core product loop: coach builds a drill library → composes a practice plan → players view the plan. Phase 2 extends this loop with home-practice drill assignment and engagement visibility. Every link in the MVP loop is missing from every competing tool.

### Differentiator

MxM owns the full development cycle — practice planning and off-practice development in one connected system. No competitor is here; they've chosen logistics, stats, or video.

Core insight: coaches aren't constrained by knowledge — they're constrained by recall. A persistent, organized drill library functions as a memory extension, expanding what a coach can execute over a season, not just what they can remember on the field. This is the foundational value prop.

Why now: the sport is growing; the infrastructure for coaching it hasn't kept pace. The tooling gap exists, nobody is filling it, and it's time to do something about that.

## Project Classification

- **Type:** Progressive Web App (PWA) — Next.js 16 frontend + .NET 9 backend
- **Domain:** Sports technology — lacrosse coaching and player development (multi-sport architecture ready)
- **Complexity:** Medium — no regulated data; novel flows in whiteboard/canvas drill creation; multi-role access model (coach/player)
- **Context:** Brownfield — foundation exists (auth scaffolding, backend, frontend, database schema); this PRD defines the feature layer built on top of it

## Success Criteria

### User Success

**Coach (Marcus)**
- At least 1 practice plan created before their first practice using MxM
- Drill integration rate: >50% of drills in a plan pulled from existing library by month 2 (library is compounding, not just being bypassed)
- Plan edit frequency: regular edits per plan (signals tool is embedded in real workflow, not just trialed)

**Team Player (Jordan)**
- Practice plan opened before each practice session
- Regular drill views between sessions (pre-practice prep habit forming)
- Return visit frequency increasing over first 4 weeks (habit formation signal)

### Business Success

**3-Month (Validation)**
- 3–5 active pilot coaches recruited and running the core loop: plan → practice → player views
- Positive qualitative feedback from pilot coaches confirming workflow improvement
- At least one practice plan per coach built before their first practice using MxM

**12-Month (Traction)**
- Pilot coach retention: original cohort still active
- Month-over-month new coach signups increasing

### Technical Success

1. **Canvas responsiveness** (highest priority) — whiteboard interactions (draw, move, erase, resize) feel instantaneous; target 60fps / ≤16ms frame time during active drawing
2. **Page load time** (second priority) — initial load and in-app navigation fast enough to not be a friction point; target Lighthouse performance score ≥ 85
3. **Offline availability** (lowest priority) — deferred from MVP; basic read access to drill library and practice plans when offline is a Phase 2 consideration via Serwist

### Measurable Outcomes

| Metric | Signal | Target |
|---|---|---|
| Practice plans created per coach | Adoption | ≥1 before first practice |
| Plan edit frequency | Workflow depth | Regular edits per plan |
| Drill integration rate | Library compounding | >50% from library by month 2 |
| Practice plan opens (players) | Pre-practice prep | Opened before each session |
| Drill views per player | Engagement | Regular views between sessions |
| Pilot coach count (3mo) | Validation | 3–5 active coaches |
| Coach retention (12mo) | Sustained value | Pilot cohort still active |
| New coach signups (12mo) | Growth | Month-over-month increase |
| Canvas frame time | Technical | ≤16ms during active drawing |
| Lighthouse performance score | Technical | ≥85 |

## Product Scope

### MVP — Minimum Viable Product

1. Authentication — Supabase (email/password + OAuth)
2. Team Management — roster, coach assignments
3. Drill Library — create/edit/delete drills with category, difficulty, duration, position tags
4. Whiteboard — react-konva multi-slide canvas per drill; canvas data as JSON in `drill_slides`
5. Practice Planner — compose practice from library drills, time allocation per drill, "available time left" display
6. Player Views — read-only access to team drill library and upcoming practice plan

### Growth Features (Post-MVP)

- **Phase 2:** Social Hub (browse/save public drills), Calendar/Scheduling (top priority post-MVP), Practice timer/drill countdown, Lightweight parent access via share link, Video embedding (freemium model), Offline read access (Serwist), Solo Player (Alex) experience
- **Phase 2 also:** Home practice suggestions, Engagement visibility (who opened assigned drills)

### Vision (Future)

- **Phase 3:** Performance analytics (ground ball differential, shot-to-goal ratio, turnovers) feeding drill recommendations; full parent dashboard; individual session tracking; leaderboards; recorded session + coach remote feedback (primary monetization candidate)
- Long-term: MxM as the single operating system for a coaching staff — scheduling, logistics, communications, analytics, multi-sport

## User Journeys

### Journey 1: Coach (Marcus) — Onboarding to First Clean Practice

Marcus hears about MxM from another coach at a tournament. He's been planning practices in his head for years — he knows what he wants to run but always blanks on the drill name when he's standing on the field. He signs up.

He creates his account, creates his team, and immediately hits the drill library. He spends his first session building out the drills he runs most. Each one gets a name, category, difficulty, duration, and a whiteboard canvas — the sketch he's been drawing on whiteboards and Google Slides for years, now stored. By the end of the session he has 12 drills in the library. It already feels different from anything he's used before — these drills aren't going anywhere.

He builds his first practice plan. He pulls from the library, drops drills in order, sets time allocations, watches the "available time left" counter count down. For the first time he can see the math: his 90-minute practice has 94 minutes of planned content. He trims one drill. Now it fits.

He invites his players. They get a link, join the team, and can immediately see the upcoming practice plan and the drill library. The night before practice, two players have already looked at the drills.

Practice day. No "what are we doing next?" gaps. Players who looked at the plan already know what's coming. The plan runs within a minute of schedule.

**This journey reveals requirements for:** authentication, team creation, drill library (create/edit/tag/whiteboard), practice planner (compose/time-track), player invite flow, player-facing read-only views.

---

### Journey 2: Assistant Coach — Being Added and Joining

Marcus wants his assistant, Tyler, to be able to add drills and help plan practices. He goes into team settings and opens the coach management section — separate from the player roster. He adds Tyler by email and assigns him the Assistant Coach role.

Tyler gets an invite email. He clicks the link, creates his account (or signs into an existing one), and lands on the team — with full coaching access. He can see the drill library, edit drills, create new ones, and contribute to practice plans. He can't create or delete the team itself — that's the head coach's seat.

**This journey reveals requirements for:** coach role distinction (head coach / assistant coach) on `coach_teams`, separate "Add Coach" flow in team management, role-scoped permissions (head coach vs. assistant coach), coach invite/accept flow analogous to player invite.

---

### Journey 3: Player (Jordan) — Accept Invite and Pre-Practice Prep

Jordan's coach texts the team a link. Jordan taps it on his phone, creates an account (or signs in), and lands on the team view. He can see the upcoming practice plan — time-blocked, with the drills listed in order — and the full team drill library.

The night before practice he opens the plan. He clicks into a drill he doesn't recognize and reads the description, sees the canvas. He's not walking in blind anymore.

At practice, the first drill is set up before the coach finishes explaining it. Jordan already knows the setup. That's the moment — small, but it shifts something.

**This journey reveals requirements for:** player invite flow (link-based), player account creation, read-only practice plan view (time-blocked, ordered drills), read-only drill library with canvas view, mobile-first layout (players are on phones).

---

### Journey 4: Operator (Derek) — Pilot Issue Resolution

A pilot coach emails Derek: they can't log in. Derek opens the Supabase dashboard, finds the user by email, confirms the account exists and is confirmed. The issue is they signed up with Google OAuth but are trying to email/password login. Derek replies with the correct provider. No app intervention needed.

A second scenario: a coach accidentally deletes a drill that had whiteboard slides. Derek connects to the database via `docker exec -it sports-postgres psql -U postgres -d sportsdb`, queries `drill_slides` to confirm the data is still there (soft-delete or recoverable), and advises accordingly.

**This journey reveals requirements for:** Supabase dashboard is sufficient for auth management; no in-app admin UI for MVP. If drill deletion is destructive (no soft-delete), recoverability becomes a data design concern worth flagging. Phase 2 candidate: in-app admin panel when pilot cohort outgrows manual management.

---

### Journey Requirements Summary

| Capability | Required By |
|---|---|
| Authentication (Supabase — email + OAuth) | All journeys |
| Team creation + management | Journey 1 |
| Drill library — create/edit/tag/canvas | Journeys 1, 2 |
| Practice planner — compose + time-track | Journeys 1, 2 |
| Player invite (link-based) | Journeys 1, 3 |
| Player read-only views (plan + library) | Journey 3 |
| Coach role distinction (head / assistant) | Journey 2 |
| Coach invite flow (separate from player) | Journey 2 |
| Role-scoped permissions | Journey 2 |
| Mobile-first layout | Journey 3 |
| Operator tooling (Supabase + direct DB) | Journey 4 |

## Domain-Specific Requirements

### Compliance & Regulatory

- **COPPA (Age Gate):** Users must confirm they are 13 or older at account creation. Age acknowledgment required at signup (checkbox or DOB field). Players under 13 access practice plan content via share link only (no account = outside COPPA scope). No parental consent flow in MVP.
- **FERPA (Watch Item):** Player data collected (name, email, position, team) is not an education record under FERPA. Risk emerges at scale when marketing to school programs whose districts require Data Processing Agreements (DPAs) with third-party tools. Not a blocker for MVP pilot; document and revisit at Phase 2 growth stage.
- **GDPR/CCPA:** Standard PII (name, email) covered by privacy policy. Data minimization principle already achieved — no sensitive data beyond what is necessary for platform function.

*Technical security constraints are specified in Non-Functional Requirements (NFR7–NFR12).*

### Risk Mitigations

- **Minor users:** 13+ age gate at signup eliminates COPPA consent flow complexity. Share-link access for practice plan views provides a natural path for younger players without accounts.
- **FERPA scale risk:** Defer DPA process definition to Phase 2 when school program outreach begins. No action needed for pilot cohort.
- **Content moderation:** Not a concern for MVP with 3–5 known pilot coaches. Becomes relevant in Phase 2 when Social Hub enables public drill sharing from unknown coaches — flag for Phase 2 scoping.

## Innovation & Novel Patterns

### Detected Innovation Areas

MxM's innovation is product-level, not technical. The stack is standard; the insight and integration are not.

**1. Drill Library as Memory Extension**
The central reframe: coaches aren't constrained by knowledge, they're constrained by recall. Existing tools treat a drill library as an organizational convenience. MxM treats it as a capability multiplier — a coach with 50 drills in their library can execute 50 drills; a coach working from memory can execute whatever they remembered that morning. This framing changes what the library *is* and why it matters, and it's not present in any competing product.

**2. Canvas-Native Drill Authoring**
Whiteboard canvas (react-konva) is embedded as the native creation interface for drills — not a presentation tool bolted on after the fact. Canvas data is stored as structured JSON (`drill_slides`) per drill, making it a first-class part of the drill record. Sports apps that include drawing tools treat them as separate features; MxM makes the canvas the drill's voice. This is a meaningful UX and data architecture choice, not a technical novelty.

**3. Full Development Cycle in One Loop**
The practice planning → player prep → off-practice development loop is complete and connected in MxM. No competitor owns all three: logistics platforms (TeamSnap, Hudl) skip practice design entirely; drill sites are consume-only with no plan composition; no tool closes the loop into off-practice development. MxM's integration of these phases is new territory in the sports tech space.

### Market Context & Competitive Landscape

The sports team management market is occupied by logistics-first platforms (TeamSnap, SportsYou) and performance-data platforms (Hudl, GameChanger). Practice planning is absent from all of them. The community drill space (YouTube, presentation-format sites) is consume-only with no composition or team integration. The gap MxM occupies — structured practice planning connected to player development — has no direct competitor at MVP scope.

Why now: lacrosse's growth has outpaced the coaching infrastructure available to support it. The technology required (canvas APIs, PWA capabilities, cloud auth) is mature and accessible.

### Validation Approach

- **Drill library as memory extension:** Validated when drill integration rate exceeds 50% by month 2 — coaches are pulling from the library rather than creating new drills for every practice. Library is compounding, not being bypassed.
- **Canvas-native authoring:** Validated when coaches create multi-slide whiteboards as part of drill creation (not just text descriptions). Canvas adoption rate within drill creation flow is the signal.
- **Full development cycle:** Validated when players open practice plans before sessions (pre-practice prep habit) — the loop is working when the player end of it is active, not just the coach end.

### Risk Mitigation

- **Canvas complexity:** react-konva is well-maintained and React-native. The main risk is performance on lower-end mobile devices during active drawing. Mitigation: canvas responsiveness as technical success criteria #1 (≤16ms frame time); test on mid-range Android devices early.
- **Product adoption risk:** The innovation here is behavioral change — coaches adopting a tool when they've been fine without one. Mitigation: pilot cohort of 3–5 coaches who are already open to change; qualitative feedback loop; low barrier to entry (free, no commitment required).
- **Execution over invention:** Because there's no technical moat, the advantage is in execution quality and user experience. A well-funded competitor could build this. Mitigation: get coaches embedded in the workflow before competition arrives; library data lock-in is real (a coach with 50 drills in MxM has friction to leave).

## Web App Specific Requirements

### Project-Type Overview

MinuteXMinute 2.0 is a PWA built on Next.js 16 App Router — server-rendered by default with client components for interactive features (canvas, forms, state). This is not a traditional SPA; it's a hybrid rendering model that benefits from server components for initial page load and client components for the practice planner, whiteboard, and real-time UI interactions.

### Browser Matrix

| Browser | Priority | Notes |
|---|---|---|
| Chrome (Android, desktop) | Primary | Mid-range Android is the floor; target 4GB RAM devices |
| Safari (iOS current) | Primary | Players on iPhones; current iOS versions only, no legacy Safari |
| Chrome (desktop) | Primary | Coach workflow — drill creation, practice planning |
| Firefox (desktop) | Secondary | Support, don't optimize for |
| Edge (desktop) | Secondary | Support, don't optimize for |
| IE11 / legacy browsers | Not supported | Explicitly excluded |

**Device floor:** Mid-range Android with Chrome. Canvas performance testing should be conducted on mid-range Android hardware before MVP launch — this is where react-konva frame rate is most likely to degrade.

### Responsive Design

- **Mobile-first layout:** Players access on phones — practice plan and drill library views are designed mobile-first
- **Coach interface:** Drill creation (whiteboard) and practice planner are complex enough to warrant desktop-optimized layouts, but must remain functional on tablet and mobile
- **Canvas on mobile:** react-konva supports touch events; coaches may view canvases on mobile but primary authoring is expected on desktop/tablet
- **Navigation pattern:** Bottom navigation bar (coach view) and simplified top navigation (player view) to accommodate mobile thumb zones

*(Performance targets specified in Non-Functional Requirements NFR1–NFR6.)*

### SEO Strategy

- **Marketing/landing page:** SEO required — public-facing, needs meta tags, Open Graph, structured data, semantic HTML. This is how coaches discover MxM.
- **App interior (behind auth):** No SEO needed — private, gated content. `noindex` on all authenticated routes.
- **Next.js metadata API:** Use for landing page SEO; not a concern for app pages.

### Accessibility Level

WCAG 2.1 AA target for all surfaces except the whiteboard canvas. shadcn/ui (Radix UI) primitives provide keyboard navigation, ARIA attributes, and focus management by default — these must not be overridden. Canvas exception uses `role="img"` with `aria-label` per NFR18. Full measurable requirements in NFR16–NFR19.

### Implementation Considerations

- **Real-time:** Not in MVP. SignalR documented as Phase 2 candidate for live practice timer and potential multi-coach editing. No WebSocket infrastructure needed for launch.
- **PWA shell:** Serwist installed but not configured for MVP. Service worker and offline caching deferred to Phase 2. App functions as a standard web app at launch.
- **API routing:** Next.js rewrites proxy `/api/*` to .NET backend — local dev hits `localhost:8080`, Docker hits `backend:8080`. No BFF layer in MVP; direct frontend-to-.NET calls.
- **Auth flow:** Supabase handles sign-up, sign-in, OAuth, and email verification client-side. .NET backend validates JWT tokens on every protected request. No session state in Next.js.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — prove the core loop works for real coaches. The minimum that makes a coach say "this is useful" is: drills stored persistently, practice planned from those drills, players able to see the plan. Every MVP feature exists to validate that loop. Nothing else ships until it does.

**MVP is not:** a revenue event, a platform launch, or a feature showcase. It's a validation instrument for 3–5 pilot coaches.

**Resource:** Solo developer with heavy AI-assisted development (Claude Code). Sequential work — no parallel streams. Testing is manual with AI assistance. No dedicated QA.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1: Coach onboarding to first clean practice
- Journey 3: Player accepts invite and prepares pre-practice
- Journey 4: Operator handles pilot issues via Supabase + direct DB

**Must-Have Capabilities:**

| Feature | Why It's MVP |
|---|---|
| Authentication (Supabase — email/password + OAuth) | Nothing works without it |
| Team creation + player roster management | Coach needs a team to plan for |
| Player invite (link-based) | Players need access to view the plan |
| Drill library (create/edit/delete, tags, category, difficulty, duration) | The memory extension — core value prop |
| Whiteboard (react-konva, multi-slide canvas per drill) | Canvas-native authoring — core differentiator |
| Practice planner (compose from library, time allocation, "available time left") | The composition layer — closes the loop |
| Player read-only views (practice plan + drill library) | Player end of the loop — validates the full cycle |
| 13+ age gate at signup | COPPA compliance minimum |

### Phase 1.5 — Pilot Stabilization

Add after initial pilot is running and stable. These are high-value features that don't block the core loop but extend it meaningfully.

- **Assistant coach role distinction** — head coach / assistant coach on `coach_teams`, separate "Add Coach" invite flow, role-scoped permissions (head coach creates/deletes team; assistant contributes drills and plans)
- **Feedback loop with pilot cohort** — qualitative interviews, usage review, iterate on pain points before Phase 2

### Phase 2 — Growth Features (Post-MVP)

- **Calendar / Scheduling** *(top priority)* — coach-managed practice and game schedule; players see upcoming events
- **Social Hub** — browse and save public drills from other coaches; pull directly into personal library
- **Home practice suggestions** — coach assigns specific drills for players to work on between sessions
- **Engagement visibility** — coach sees who opened assigned drills
- **Practice timer / drill countdown** — on-field practice execution tool
- **Lightweight parent access** — shareable link or read-only view for parents of youth players
- **Video embedding** — coach-only upload per drill; freemium model (N free, paid for more)
- **Offline read access** — Serwist service worker for drill library and practice plan caching
- **Solo Player (Alex) experience** — browse public drills, build personal drill set without a team

### Phase 3 — Vision / Expansion

- **Performance analytics** — ground ball differential, shot-to-goal ratio, turnovers; stat-identified weaknesses feed drill recommendations
- **Full parent dashboard** — dedicated parent role with communications, schedule, roster
- **Individual session tracking** — log out-of-practice activity and drill completion
- **Leaderboards** — area/global rankings; requires user scale to be meaningful
- **Recorded session + coach remote feedback** — primary monetization candidate
- **Multi-sport UI** — database is sport-agnostic; UI expands beyond lacrosse
- **In-app admin panel** — platform management UI when pilot cohort outgrows manual Supabase management

### Risk Mitigation Strategy

**Technical Risks:**
- **Canvas performance (highest):** react-konva on mid-range Android is the riskiest component. Mitigation: test on physical mid-range Android device early in development; establish ≤16ms frame time benchmark before drill library is built on top of it. Don't discover this problem at the end.
- **Supabase + .NET JWT integration:** Already partially scaffolded. Lower risk. Mitigation: validate end-to-end auth flow as the first thing built.
- **Whiteboard multi-slide data schema:** JSON storage in `drill_slides` needs careful design — schema changes are painful after data exists. Mitigation: design `drill_slides` schema thoroughly before building the canvas feature.

**Market Risks:**
- **Coach behavior change (primary risk):** Coaches have been fine without this tool. Mitigation: recruit pilot coaches who are already open to change; keep onboarding friction minimal; first value delivery should happen within one session of signing up.
- **Pilot cohort recruitment:** 3–5 coaches is a small number but still requires active outreach. Mitigation: recruit from personal network first; don't launch to strangers before the product is stable.

**Resource Risks:**
- **Solo developer ceiling:** AI-assisted development accelerates velocity but sequential work means features take longer than a team build. Mitigation: Phase 1.5 exists specifically to keep Phase 1 lean enough to ship; resist scope creep during development.
- **No dedicated QA:** Manual + AI-assisted testing only. Mitigation: pilot cohort acts as real-world QA; keep pilot small enough to manage issues personally.

## Functional Requirements

### Identity & Access

- **FR1:** Visitors can create an account using email and password
- **FR2:** Visitors can create an account using an OAuth provider (Google)
- **FR3:** Users can sign in using email and password
- **FR4:** Users can sign in using an OAuth provider
- **FR5:** Users must confirm they are 13 or older before completing account creation
- **FR6:** Users can sign out of their account
- **FR7:** Head coaches can invite assistant coaches to their team by email *(Phase 1.5)*
- **FR8:** Invited assistant coaches can accept an invite and join a team with assistant-level permissions *(Phase 1.5)*
- **FR9:** Head coaches can remove an assistant coach from their team *(Phase 1.5)*
- **FR10:** Head coaches have exclusive authority to create and delete teams; assistant coaches can create and edit drills and practice plans but cannot create, configure, or delete the team *(Phase 1.5)*

### Team Management

- **FR11:** Coaches can create a team
- **FR12:** Head coaches can delete their team
- **FR13:** Coaches can generate a shareable invite link to add players to their team
- **FR14:** Players can join a team via an invite link, either creating a new account or signing into an existing one
- **FR15:** Coaches can view and manage the team roster — view all members, see roles, and remove members
- **FR16:** Coaches can assign position tags to players on the roster

### Drill Library

- **FR17:** Coaches can create a drill with name, description, category, difficulty, estimated duration, and position tags
- **FR18:** Coaches can edit any attribute of an existing drill
- **FR19:** Coaches can delete a drill from their library
- **FR20:** Coaches can view their complete drill library with filtering by category, difficulty, duration, and position tag
- **FR21:** Coaches can search their drill library by name or keyword
- **FR22:** Assistant coaches can create and edit drills in the team library *(Phase 1.5)*

### Canvas & Whiteboard

- **FR23:** Coaches can add a multi-slide whiteboard canvas to any drill
- **FR24:** Coaches can draw, add shapes, place text, and erase content on a canvas slide
- **FR25:** Coaches can add, remove, and reorder slides within a drill's canvas
- **FR26:** Coaches can retrieve previously saved canvas content for any drill
- **FR27:** Players can view all canvas slides for any drill in read-only mode

### Practice Planning

- **FR28:** Coaches can create a practice plan by selecting and ordering drills from their library
- **FR29:** Coaches can set a total practice duration and assign a time allocation to each drill in the plan
- **FR30:** Coaches can see remaining available practice time updated in real time as drills are added, removed, or adjusted
- **FR31:** Coaches can reorder drills within a practice plan
- **FR32:** Coaches can edit or delete an existing practice plan
- **FR33:** Coaches can designate a practice plan as the active upcoming plan visible to players
- **FR34:** Coaches can mark individual drills within a practice plan as hidden from player view
- **FR35:** Assistant coaches can edit practice plans, including adding, removing, and reordering drills *(Phase 1.5)*

### Player Experience

- **FR36:** Players can view the team's active practice plan in read-only mode
- **FR37:** Players can browse the complete team drill library in read-only mode
- **FR38:** Players can open any drill and view its full detail, including all canvas slides, in read-only mode
- **FR39:** Players can access practice plan and drill library views on mobile devices with all interactive elements operable via touch navigation

### Engagement & Home Practice *(Phase 2)*

- **FR40:** Coaches can assign specific drills from their library as home practice suggestions for the team
- **FR41:** Players can view drills assigned to them as home practice
- **FR42:** Coaches can see which players have opened assigned home practice drills

### Content Discovery & Social Hub *(Phase 2)*

- **FR43:** Coaches can mark individual drills as publicly visible to the broader coach community
- **FR44:** Coaches can browse publicly shared drills from other coaches
- **FR45:** Coaches can save a public drill directly into their own library
- **FR46:** Solo players (without a team) can browse the public drill library and save drills to a personal collection

### Scheduling *(Phase 2)*

- **FR47:** Coaches can create and manage a team schedule of practices and games
- **FR48:** Players can view upcoming scheduled events

### Offline Access *(Phase 2)*

- **FR49:** Players and coaches can access their drill library and practice plans in read-only mode without an active internet connection

### Compliance & Platform

- **FR50:** The marketing and landing page is publicly accessible and indexed by search engines
- **FR51:** All authenticated application pages are excluded from search engine indexing
- **FR52:** Users can navigate all interactive UI components using keyboard alone and access all content via screen reader (WCAG 2.1 AA)
- **FR53:** Each canvas whiteboard slide exposes a text alternative describing the drill name and slide number for assistive technologies (e.g., "Whiteboard diagram for Box Drill, slide 1 of 3")

## Non-Functional Requirements

### Performance

- **NFR1:** Canvas interactions (draw, move, erase, resize) render at ≤16ms frame time (60fps) during active drawing, validated on mid-range Android with Chrome
- **NFR2:** Largest Contentful Paint (LCP) ≤2.5s on mid-range Android over 4G
- **NFR3:** Time to Interactive (TTI) ≤3.5s on initial page load
- **NFR4:** In-app navigation (subsequent page transitions after initial load) responds in ≤1s
- **NFR5:** Lighthouse performance score ≥85 on both desktop and mobile audits
- **NFR6:** The canvas library is loaded on demand and does not degrade the Lighthouse performance score below the NFR5 threshold (≥85)

### Security

- **NFR7:** All data is transmitted exclusively over HTTPS in every environment (dev, Docker, production)
- **NFR8:** All protected API requests are validated server-side — no client-side-only authorization is permitted
- **NFR9:** User credentials are managed exclusively by the authentication provider; the application backend stores no passwords, session tokens, or OAuth credentials
- **NFR10:** PII collected is limited to what is necessary for platform function (name, email, position tag, team assignment)
- **NFR11:** All endpoints that create, modify, or delete data require a valid, authenticated session token
- **NFR12:** Role-based access (coach vs. player; head coach vs. assistant coach) is enforced server-side — player-scoped sessions cannot reach coach-scoped endpoints

### Scalability

- **NFR13:** System supports the MVP pilot load of 5–25 concurrent users (3–5 coaches plus rosters) without performance degradation
- **NFR14:** No horizontal scaling infrastructure is required for MVP; a single-server deployment supports the pilot load defined in NFR13
- **NFR15:** The data schema and API design must support Phase 2 feature additions (Social Hub, scheduling, engagement) via additive changes — no destructive schema migrations required for planned growth features

### Accessibility

- **NFR16:** All interactive UI components meet WCAG 2.1 AA standards — keyboard navigation, focus management, and screen reader compatibility provided by the baseline component library must not be overridden
- **NFR17:** Brand accent colors (desaturated green and muted teal) achieve a minimum 4.5:1 contrast ratio against background surface colors in both light and dark modes
- **NFR18:** Canvas whiteboard surfaces are exempt from interactive accessibility requirements; each canvas surface exposes a text alternative describing the drill name and current slide context (e.g., "Whiteboard diagram for Box Drill, slide 1 of 3")
- **NFR19:** All public and authenticated surfaces use semantic HTML — correct heading hierarchy, landmark regions, and labeled form inputs throughout

### Integration

- **NFR20:** The authentication system successfully handles both email/password and OAuth provider flows; the application backend validates authentication tokens locally per request without requiring additional network calls to the authentication provider
- **NFR21:** API routing resolves correctly in both local development and containerized environments using environment-variable configuration — no code changes required between environments
- **NFR22:** The PWA service worker is installed but not activated for MVP; the PWA architecture must not conflict with Phase 2 service worker activation for offline caching
