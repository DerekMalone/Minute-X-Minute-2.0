// Sports Team Management System ERD
// Designed for lacrosse with future multi-sport support
// Optimized for searchable drill library and whiteboard features

Table users {
  id varchar [pk, note: 'UUID from Supabase auth']
  email varchar [not null, unique]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
}

Table teams {
  id varchar [pk]
  team_name varchar [not null]
  sport varchar [default: 'lacrosse', note: 'Future multi-sport support']
  created_by varchar [not null, ref: > users.id]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
}

Table coaches {
  id varchar [pk]
  name varchar [not null]
  role varchar [not null, note: 'head_coach, assistant_coach, coordinator, etc']
  user_id varchar [not null, ref: - users.id]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
}

Table coach_teams {
  id varchar [pk]
  coach_id varchar [not null, ref: > coaches.id]
  team_id varchar [not null, ref: > teams.id]
  created_at timestamp [default: `now()`, not null]
  
  indexes {
    (coach_id, team_id) [unique]
  }
}

Table players {
  id varchar [pk]
  name varchar [not null]
  user_id varchar [not null, ref: - users.id]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
}

Table player_teams {
  id varchar [pk]
  player_id varchar [not null, ref: > players.id]
  team_id varchar [not null, ref: > teams.id]
  position varchar [note: 'Attack, Midfield, Defense, Goalie for lacrosse']
  jersey_number integer
  created_at timestamp [default: `now()`, not null]
  
  indexes {
    (player_id, team_id) [unique]
  }
}

Table drill_tags {
  id varchar [pk]
  name varchar [not null, unique]
  category varchar [note: 'offense, defense, conditioning, fundamentals, etc']
  created_at timestamp [default: `now()`, not null]
}

Table drills {
  id varchar [pk]
  name varchar [not null]
  description text
  duration_minutes integer
  difficulty_level integer [note: '1-10 scale']
  is_conditioning boolean [default: false]
  is_private boolean [default: true, note: 'Private to team/coach vs public community']
  created_by varchar [not null, ref: > coaches.id]
  team_id varchar [not null, ref: > teams.id]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
  
  indexes {
    (team_id, created_at)
    (created_by, created_at)
    (difficulty_level)
    (duration_minutes)
  }
}

Table drill_positions {
  id varchar [pk]
  drill_id varchar [not null, ref: > drills.id]
  position varchar [not null, note: 'Attack, Midfield, Defense, Goalie, etc']
  
  indexes {
    (drill_id, position) [unique]
  }
}

Table drill_tag_assignments {
  id varchar [pk]
  drill_id varchar [not null, ref: > drills.id]
  tag_id varchar [not null, ref: > drill_tags.id]
  
  indexes {
    (drill_id, tag_id) [unique]
  }
}

Table drill_slides {
  id varchar [pk]
  drill_id varchar [not null, ref: > drills.id]
  slide_order integer [not null]
  canvas_data json [not null, note: 'Whiteboard X&O positions, arrows, etc']
  duration_ms integer [note: 'For future animation support']
  transition_type varchar [note: 'For future animation support']
  created_at timestamp [default: `now()`, not null]
  
  indexes {
    (drill_id, slide_order) [unique]
  }
}

Table practices {
  id varchar [pk]
  name varchar
  date_time timestamp [not null]
  duration_minutes integer
  notes text
  created_by varchar [not null, ref: > coaches.id]
  team_id varchar [not null, ref: > teams.id]
  created_at timestamp [default: `now()`, not null]
  updated_at timestamp [default: `now()`, not null]
  
  indexes {
    (team_id, date_time)
    (created_by, date_time)
  }
}

Table practice_drills {
  id varchar [pk]
  practice_id varchar [not null, ref: > practices.id]
  drill_id varchar [not null, ref: > drills.id]
  drill_order integer [note: 'Order of drills in practice']
  start_time_minutes integer [note: 'Minutes from practice start']
  notes text [note: 'Practice-specific drill notes']
  
  indexes {
    (practice_id, drill_order)
    (practice_id, start_time_minutes)
  }
}

// Indexes for performance
Table drill_search_performance {
  note: '''
  Key indexes for drill search functionality:
  - drills(team_id, created_at) - Team drill listings
  - drills(difficulty_level) - Filter by difficulty
  - drills(duration_minutes) - Filter by duration
  - drill_positions(drill_id, position) - Position filtering
  - drill_tag_assignments(drill_id, tag_id) - Tag filtering
  '''
}

// Notes about future features
Table future_considerations {
  note: '''
  Architecture ready for:
  1. Community drill sharing (is_private flag)
  2. Animation (duration_ms, transition_type in drill_slides)
  3. Multi-sport (sport field in teams)
  4. Advanced permissions (coach roles)
  5. Player position flexibility (position in player_teams)
  '''
}