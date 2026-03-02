# Create Brief — Pre-Session Context
_Prepared from conversation on 2026-02-24. Feed this into `/bmad-bmm-create-product-brief`._

---

## Project Overview
**MinuteXMinute 2.0** — Sports team management PWA for lacrosse coaches and players. Built on C#/.NET Core 9 backend, Next.js 16 frontend, PostgreSQL 17, Docker, Supabase Auth.

---

## User Roles

### Coach
- Create/manage a team
- Create drills (with whiteboard canvas via react-konva) and organize by category
- Build practice plans: set duration, add drills with per-drill time allocation, track "available time left"
- Control whether conditioning drills are hidden from players (per drill slot in a practice)
- Browse the Social Hub: view other coaches' public drills, save/favorite them, add saved drills to their own practice plans

### Player
- Read-only view of upcoming practice plan
- Read-only view of team drill library
- Conditioning drill visibility in practice view is coach-controlled (not auto-hidden)

---

## Key Features (MVP)

1. **Authentication** — Supabase (email/password + OAuth)
2. **Team Management** — roster, coach assignments
3. **Drill Library** — create/edit/delete drills with category, difficulty, duration, position tags
4. **Whiteboard (react-konva)** — multi-slide canvas per drill; canvas data stored as JSON in `drill_slides`
5. **Practice Planner** — build practice from existing drills, time-track per drill, "available time left" display
6. **Social Hub** — browse public drills from other coaches, save/favorite to personal library

## Out of MVP Scope
- Message board / team discussion
- Saving full practice plans from other coaches (drills only)
- Animation playback for drill slides
- Multi-sport (DB ready, UI lacrosse-only for now)

---

## Database (dbdiagram — updated with two confirmed gaps)

### Confirmed gap fixes needed in diagram:
1. Add to `practice_drills`: `hide_conditioning boolean [default: false]`
2. Add new table:
```
Table saved_drills {
  id varchar [pk]
  coach_id varchar [not null, ref: > coaches.id]
  drill_id varchar [not null, ref: > drills.id]
  saved_at timestamp [default: `now()`, not null]

  indexes {
    (coach_id, drill_id) [unique]
  }
}
```

### Existing tables (all solid):
users, teams, coaches, coach_teams, players, player_teams, drill_tags, drills, drill_positions, drill_tag_assignments, drill_slides, practices, practice_drills

---

## Design System

### Aesthetic
- Confident, disciplined — NOT sporty/gamer
- No gradients, no glow, no ribbon effects
- Brand motif: the "X" (time intersection) + dry-erase stroke character

### Color Tokens (light + dark mode)
```css
/* Dark */
--mx-bg: 11 15 20;        /* near-black charcoal */
--mx-surface: 16 23 34;
--mx-surface-2: 22 33 48;
--mx-text: 234 240 247;
--mx-muted: 167 179 194;
--mx-green: 166 214 74;   /* desaturated neon green — primary accent */
--mx-teal: 70 183 166;    /* muted teal — secondary accent */

/* Light */
--mx-bg: 255 255 255;
--mx-surface: 245 247 250;
--mx-surface-2: 236 240 246;
--mx-text: 12 18 28;
--mx-muted: 92 106 115;
/* green + teal same in both modes */
```

### Component System
- shadcn/ui (new-york style) with custom `mx-*` Tailwind tokens
- Typography: warm geometric/humanist sans; tight heading tracking; no futuristic fonts
- Radius scale: sm 10px, md 14px, lg 18px, xl 22px
- Shadows: low-contrast, no glow

### Icons / PWA
- App icon spec exists (B1v1): dark-mode master, dry-erase X motif, green+teal accents
- PWA icon set at 1024/512/192/180/32px

---

## V1 Wireframe Reference (outdated — for directional reference only)
Screens captured: Landing Page, Coach Team View, Coach Practices View, Coach Community View.

### What to carry forward (structure):
- Bottom/top nav with: Practices | Team | Drills tabs for coach
- Practice plan as card list
- Drill cards with name/description/category

### What to update:
- Landing page → marketing/auth gate (not public nav with Coaches/Players/Community)
- "Link to Drill Slides" → whiteboard canvas thumbnail
- Community tab → Social Hub (separate section, not a coach-nav tab)
- Apply shadcn components + mx-* design tokens throughout
- Add Player views (not shown in v1 wireframes at all)
- Add drill creation flow with whiteboard canvas

---

## Tech Stack (for agent awareness)
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4 (CSS config, no tailwind.config.js)
- shadcn/ui: `npx shadcn@latest add [component]` — never manually create
- State: Zustand 5 (global) + React Query 5 (server)
- Canvas: react-konva 19
- Auth: Supabase (`@supabase/ssr` for server, `@supabase/supabase-js` for client)
- Backend: .NET 9 / EF Core 9 / PostgreSQL 17 — always runs in Docker
