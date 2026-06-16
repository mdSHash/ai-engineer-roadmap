'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useAuth } from './auth-provider'

export function HomeCta() {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className="flex flex-wrap gap-4">
        <Link href="/register" className="group inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-6 py-3.5 font-mono text-xs uppercase tracking-wider transition-colors">
          Sign up — start free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/login" className="inline-flex items-center gap-2 border border-ink-700 hover:border-lime-accent/40 text-ink-100 px-6 py-3.5 font-mono text-xs uppercase tracking-wider transition-colors">
          I have an account
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-4">
      <Link href="/modules" className="group inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-6 py-3.5 font-mono text-xs uppercase tracking-wider transition-colors">
        Continue the curriculum <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link href="/profile" className="inline-flex items-center gap-2 border border-ink-700 hover:border-lime-accent/40 text-ink-100 px-6 py-3.5 font-mono text-xs uppercase tracking-wider transition-colors">
        See my progress
      </Link>
    </div>
  )
}
