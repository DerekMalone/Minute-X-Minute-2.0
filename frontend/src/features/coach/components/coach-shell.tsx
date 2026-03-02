'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { COACH_NAV_ITEMS } from '@/features/coach/config/nav'

export function CoachShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-mx-bg">

      {/* Desktop sidebar — hidden below lg */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-mx-surface border-r border-mx-stroke/10">
        <div className="px-4 py-6">
          <span className="text-mx-text font-bold text-lg tracking-tight">
            MinuteXMinute
          </span>
        </div>

        <nav aria-label="Coach navigation" className="flex-1 px-2 space-y-1">
          {COACH_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-mx-green bg-mx-surface-2'
                    : 'text-mx-muted hover:text-mx-text hover:bg-mx-surface-2'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 pb-4">
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 min-h-[44px] rounded-md text-sm font-medium text-mx-muted hover:text-mx-text hover:bg-mx-surface-2 transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Page content — bottom padding reserves space for mobile nav */}
      <main className="flex-1 overflow-y-auto pb-14 lg:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav — hidden at lg and above */}
      <nav
        aria-label="Coach navigation"
        className="fixed bottom-0 inset-x-0 flex items-center bg-mx-surface border-t border-mx-stroke/10 z-50 lg:hidden"
      >
        {COACH_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] min-w-[44px] py-2 text-xs font-medium transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? 'text-mx-green' : 'text-mx-muted'}
              />
              <span className={isActive ? 'text-mx-green' : 'text-mx-muted'}>
                {label}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => signOut()}
          aria-label="Sign out"
          className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] min-w-[44px] py-2 text-xs font-medium text-mx-muted hover:text-mx-text transition-colors"
        >
          <LogOut size={22} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </nav>

    </div>
  )
}
