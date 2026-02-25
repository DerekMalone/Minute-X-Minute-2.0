---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "_bmad-output/project-context.md"
  - "_bmad-output/planning-artifacts/create-brief-context.md"
  - "/home/laxma/Minute x Minute/Minute x Minute User Stories.pdf"
  - "/home/laxma/Minute x Minute/MxM2.0 dbDiagram.pdf"
  - "/home/laxma/Minute x Minute/Minute_x_Minute_UI_Translation_and_Styles.docx"
  - "/home/laxma/Minute x Minute/Minute_x_Minute_shadcn_Tailwind_Styles.docx"
  - "/home/laxma/Minute x Minute/Minute_x_Minute_Icon_Production_Spec_B1v1.docx"
date: 2026-02-24
author: Derek
---

# Product Brief: minuteXminute2

## Executive Summary

MinuteXMinute 2.0 is a practice-first coaching platform for lacrosse coaches and
players built around a single outcome: making the team better. It closes the gap
that every team management platform (TeamSnap, Hudl, SportsYou) leaves open —
the structured creation, execution, and continuity of practice and player
development. Coaches get a persistent drill library that eliminates
planning-by-memory, a practice composer that builds focused plans and eliminates
wasted time between drills, and a player-facing layer that extends development
beyond practice day. Every minute saved on the field is a rep gained. Every rep
with purpose compounds into a better player. Every better player compounds into a
better team. The long-term vision is a full-stack coaching platform that absorbs
scheduling, logistics, and performance analytics — making MxM the single operating
system for a coaching staff.

---

## Core Vision

### Problem Statement

Lacrosse coaches have no dedicated tool for practice creation, continuity, or
player development. They rely on memory to recall drills, Google Slides to
communicate formations, and verbal reminders to drive off-practice effort. The
result: repetitive practices constrained by what the coach remembers, players who
arrive unprepared, wasted minutes between drills, and an off-practice culture
summed up by the same instruction after every session — "pick up your stick and
practice." Nobody does, because there's nothing purposeful to practice toward.

### Problem Impact

- Drill diversity capped by working memory — coaches reuse familiar drills because
  they're remembered, not because they're best
- Wasted transition time between drills compounds across a season into meaningful
  lost reps
- Players arrive without context, burning practice time on basics
- Off-practice development is entirely unstructured — "go practice" with no
  direction produces purposeless repetition, not growth
- Coaching knowledge lives in one person's head with no structured way to share it

### Why Existing Solutions Fall Short

- **TeamSnap / Hudl / SportsYou**: logistics platforms — rosters, scheduling,
  communications. Practice planning is absent. Player development is untouched.
- **Google Slides / Docs**: no structure, no drill reuse, no player integration,
  no continuity across a season
- **Community drill sites**: consume-only, video/presentation format — no way to
  compose drills into a practice plan or assign them to players

### Proposed Solution

A practice-first platform that gives coaches the tools to make their team
measurably better — on the field and off it:

1. **Drill Library** — persistent, categorized, never forgotten. The memory
   extension that expands what a coach can execute over a season.
2. **Practice Composer** — build focused plans from the library, allocate time
   per drill, track "available time left". Less dead time between drills means
   more reps per session.
3. **Player-Facing Views** — read-only access to the drill library and upcoming
   practice plan. Players arrive informed, not lost.
4. **Home Practice Suggestions** — coaches assign specific drills for players to
   work on outside of practice. Purposeful reps replace purposeless ones.
5. **Engagement Visibility** — coaches see who opened their suggested drills.
   The tool surfaces commitment. The coach decides what to do with it.
6. **Social Hub** — browse and save drills from other coaches in a structured,
   actionable format. Pull directly into your own library and plans.

Long-term: performance analytics (ground ball differential, shot-to-goal ratio,
turnovers) feed back into drill recommendations. Stat-identified weaknesses become
targeted practice priorities. Full logistics layer added to become the complete
coaching platform.

### Key Differentiators

1. **Outcome-driven, not feature-driven**: every capability exists to make the
   team better — not to organize data
2. **Drill library as memory extension**: structured storage that expands what a
   coach can execute, not just recall
3. **Full development cycle ownership**: practice planning AND off-practice
   development in one loop — nobody in this space owns both
4. **Purposeful off-practice work**: "here's something to work on at home" backed
   by a real drill, not a vague reminder after practice
5. **Coach visibility without surveillance**: engagement data informs decisions,
   humans make them
6. **Actionable community sharing**: browse by coach/team, pull directly into
   your library — no format friction
7. **Full-stack potential**: MVP is the practice and development layer;
   architecture built to absorb analytics and logistics

---

## Target Users

### Primary Users

---

#### Persona 1: The Coach — "Marcus"

**Context:** Marcus could be anyone from a volunteer parent coaching a U14 club
team to a high school varsity coach with a decade of experience. Level doesn't
define this persona — the shared reality does: he knows more drills than he can
remember in the moment, spends more time planning than he should, and says "pick
up your stick and practice" after every session knowing nobody will.

**Motivations:** Team improvement above all else. Efficient practices. Getting
the most out of limited field time. For regulated programs (HS, college), staying
within mandated practice time windows.

**Current workarounds:** Mental drill library (lossy). Google Slides for
formations (no reuse). Verbal practice plans (no continuity). Post-practice
reminders that land nowhere.

**Success vision:** Walks into practice with a plan that runs clean — no dead
time between drills, players who already know what's coming, and a growing library
that makes every future practice better than the last.

**Journey:**
- **Discovery:** Word of mouth from another coach, or finds MxM searching for
  practice planning tools
- **Onboarding:** Creates account → creates team → builds initial drill library
  → creates first practice plan → invites players
- **Core usage:** Weekly practice planning from library, Social Hub browsing to
  expand drills, home practice suggestions after sessions, engagement visibility
  to see who's putting in the work
- **Success moment:** First practice that runs to time with no "what's next?"
  gaps and players who arrived already knowing the drills
- **Long-term:** Season-long drill library growth, home practice habit forming
  across the roster, stat analytics (Phase 3) identifying what to work on next

---

#### Persona 2: The Team Player — "Jordan"

**Context:** Jordan is on a team whose coach uses MxM. Could be 14 or 22.
Currently shows up to practice reactively — drills are explained on the spot,
the plan is unknown until they're standing on the field.

**Motivations:** Getting better. Earning playing time. Feeling competent and
prepared rather than lost.

**Current workarounds:** None. Shows up and figures it out. Does wall ball with
no structure because "practice" wasn't defined.

**Success vision:** Arrives at practice knowing the plan, knowing the drills,
and having actually done the suggested work at home. Feels ahead, not behind.

**Journey:**
- **Discovery:** Coach invites them or shares a link
- **Onboarding:** Accepts invite → sees team drill library and upcoming practice
  plan immediately
- **Core usage:** Reviews practice plan and drills before each session, opens
  home practice suggestions from coach, works through them with purpose
- **Success moment:** First practice where they already know a drill before it's
  explained — confidence shifts
- **Long-term:** Checking MxM before practice becomes habit; engagement
  visibility gives coach signal without Jordan having to say a word

---

#### Persona 3: The Solo Player — "Alex"

**Context:** Alex doesn't have a team yet, or their coach hasn't adopted MxM.
Wants to improve but has no structure — solo sessions are purposeless repetition
with no direction.

**Motivations:** Purposeful self-improvement. Something to work toward between
seasons or before tryouts.

**Current workarounds:** YouTube videos. Aimless wall ball. Looking up drills
in presentation format with no way to organize them.

**Success vision:** A personal list of drills to run through in a solo session
with real purpose — not just "throw at a wall."

**Journey:**
- **Discovery:** Searching for lacrosse improvement content, word of mouth
- **Onboarding:** Creates account → browses Social Hub public drills → favorites
  drills for quick access
- **Core usage:** Returns to favorited drills for structured solo sessions
- **Success moment:** First solo practice with a real drill list — purposeful
  reps instead of mindless ones
- **Long-term:** Hits the drill creation wall → "want to add drills? Get your
  coach to sign up" → natural coach acquisition funnel

---

### Secondary Users

**Parent (Youth Edge Case):** For young players without personal devices, a
parent may access MxM on their behalf. No dedicated parent view in v1 — handled
via share-via-link for practice plans. Long-term consideration: parent as a
primary access point for youth accounts.

**Athletic Director (Future):** Becomes relevant when multi-sport support is
introduced. AD-level visibility across teams within a program. Out of scope for
MVP.

---

### User Journey Summary

| Moment | Coach | Team Player | Solo Player |
|---|---|---|---|
| Discovery | Word of mouth / search | Coach invite / link | Search / word of mouth |
| Onboarding | Create team + drill library | Accept invite, see plan | Browse public drills |
| Core loop | Plan → practice → suggest → check | Review → attend → improve | Favorite → solo session |
| Aha moment | First clean practice, no dead time | Shows up knowing the drills | First purposeful solo session |
| Growth hook | Expanding library + team improvement | Habit of pre-practice prep | Drill creation wall → bring coach in |
