'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Lock, ArrowRight } from 'lucide-react'
import { useAuth } from './auth-provider'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname() ?? '/'

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname)
      router.replace(`/register?next=${next}`)
    }
  }, [loading, user, router, pathname])

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-6 py-32 text-center">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400">Checking session…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto px-6 md:px-12 py-24 md:py-32 text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 border border-lime-accent/40 mb-8">
          <Lock className="w-6 h-6 text-lime-accent" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-ink-50 mb-4 leading-tight">
          Sign up to continue.
        </h1>
        <p className="text-ink-300 leading-relaxed mb-10 max-w-md mx-auto">
          The roadmap content — modules, quizzes, flashcards, decision trees, and the interview bank — is only available to registered users so we can save your progress.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/register?next=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-5 py-3 font-mono text-xs uppercase tracking-wider"
          >
            Create account <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-2 border border-ink-700 hover:border-lime-accent/40 px-5 py-3 font-mono text-xs uppercase tracking-wider"
          >
            I have an account
          </Link>
        </div>
        <p className="font-mono text-[11px] text-ink-500 mt-10">
          Redirecting…
        </p>
      </motion.div>
    )
  }

  return <>{children}</>
}
