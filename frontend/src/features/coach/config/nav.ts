import {
  ClipboardList,
  Dumbbell,
  Users,
  CircleUser,
} from 'lucide-react'

export const COACH_NAV_ITEMS = [
  { label: 'Practice Plans', href: '/coach/dashboard', icon: ClipboardList },
  { label: 'Drill Library',  href: '/coach/drills',    icon: Dumbbell },
  { label: 'Team',           href: '/coach/team',       icon: Users },
  { label: 'Profile',        href: '/coach/profile',    icon: CircleUser },
] as const
