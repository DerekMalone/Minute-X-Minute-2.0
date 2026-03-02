import type { Metadata } from 'next'
import { CoachShell } from '@/features/coach/components/coach-shell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <CoachShell>{children}</CoachShell>
}
