'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from './auth-provider'
import { LogOut, User as UserIcon } from 'lucide-react'

const links = [
  { href: '/',                label: 'Home' },
  { href: '/modules',         label: 'Modules' },
  { href: '/decision-trees',  label: 'Trees' },
  { href: '/flashcards',      label: 'Cards' },
  { href: '/interview',       label: 'Interview' },
  { href: '/leaderboard',     label: 'Leaderboard' },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { user, logout, loading } = useAuth()

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-950/70 border-b border-ink-800">
      <nav className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3 shrink-0">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 bg-lime-accent/20 blur-md group-hover:bg-lime-accent/40 transition-colors" />
            <div className="relative w-7 h-7 border border-lime-accent flex items-center justify-center font-mono text-xs text-lime-accent">
              AI
            </div>
          </div>
          <span className="font-serif text-xl tracking-tight">
            Roadmap<span className="text-lime-accent">.</span>
          </span>
        </Link>

        <button
          className="md:hidden text-ink-200 font-mono text-sm ml-auto"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? '×' : '≡'}
        </button>

        <ul className="hidden md:flex items-center gap-7">
          {links.map(l => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href))
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    'relative font-mono text-[12px] tracking-wide uppercase transition-colors',
                    active ? 'text-lime-accent' : 'text-ink-300 hover:text-ink-100'
                  )}
                >
                  {l.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-px bg-lime-accent"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {!loading && (user ? (
            <>
              <Link
                href="/profile"
                className={cn(
                  'group flex items-center gap-2 px-3 py-1.5 border font-mono text-[11px] uppercase tracking-wider transition-colors',
                  pathname.startsWith('/profile')
                    ? 'border-lime-accent text-lime-accent'
                    : 'border-ink-700 text-ink-200 hover:border-lime-accent/40'
                )}
              >
                <UserIcon className="w-3.5 h-3.5" />
                {user.username}
                {user.isAdmin && <span className="text-amber-accent text-[9px]">★</span>}
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className="p-1.5 border border-ink-700 text-ink-300 hover:border-amber-accent/40 hover:text-amber-accent transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-mono text-[11px] uppercase tracking-wider text-ink-300 hover:text-lime-accent transition-colors">
                Log in
              </Link>
              <Link href="/register" className="font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 bg-lime-accent text-ink-950 hover:bg-lime-glow transition-colors">
                Sign up
              </Link>
            </>
          ))}
        </div>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-t border-ink-800 px-6 py-4"
        >
          <ul className="space-y-3 mb-4">
            {links.map(l => (
              <li key={l.href}>
                <Link onClick={() => setOpen(false)} href={l.href} className="block font-mono text-sm uppercase text-ink-200">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-800 pt-4 flex items-center gap-3">
            {user ? (
              <>
                <Link onClick={() => setOpen(false)} href="/profile" className="flex items-center gap-2 font-mono text-xs uppercase text-lime-accent">
                  <UserIcon className="w-4 h-4" /> {user.username}
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="ml-auto font-mono text-xs uppercase text-amber-accent">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link onClick={() => setOpen(false)} href="/login" className="font-mono text-xs uppercase text-ink-300">Log in</Link>
                <Link onClick={() => setOpen(false)} href="/register" className="ml-auto font-mono text-xs uppercase px-3 py-1.5 bg-lime-accent text-ink-950">Sign up</Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  )
}
