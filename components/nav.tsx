'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'

const links = [
  { href: '/',                label: 'Home' },
  { href: '/modules',         label: 'Modules' },
  { href: '/decision-trees',  label: 'Decision Trees' },
  { href: '/flashcards',      label: 'Flashcards' },
  { href: '/interview',       label: 'Interview' },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-950/70 border-b border-ink-800">
      <nav className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
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
          className="md:hidden text-ink-200 font-mono text-sm"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? '×' : '≡'}
        </button>

        <ul className="hidden md:flex items-center gap-8">
          {links.map(l => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href))
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    'relative font-mono text-[13px] tracking-wide uppercase transition-colors',
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
      </nav>

      {open && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-t border-ink-800 px-6 py-4 space-y-3"
        >
          {links.map(l => (
            <li key={l.href}>
              <Link
                onClick={() => setOpen(false)}
                href={l.href}
                className="block font-mono text-sm uppercase text-ink-200"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </motion.ul>
      )}
    </header>
  )
}
