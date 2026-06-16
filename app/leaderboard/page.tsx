'use client'

import { motion } from 'framer-motion'
import { Eyebrow } from '@/components/section'
import { useLeaderboard } from '@/lib/use-progress'
import { useAuth } from '@/components/auth-provider'
import { Trophy, Crown } from 'lucide-react'
import Link from 'next/link'

export default function LeaderboardPage() {
  const rows = useLeaderboard()
  const { user } = useAuth()

  return (
    <section className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <Eyebrow>Community</Eyebrow>
      <h1 className="font-serif text-display-md text-ink-50 mt-4 mb-3">Leaderboard.</h1>
      <p className="text-ink-300 leading-relaxed max-w-2xl mb-12 font-serif italic">
        Everyone working through the roadmap on this device. Your rank updates every time you finish a module, ace a quiz, or walk a decision tree.
      </p>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-ink-400 font-mono text-sm">
          No accounts yet. <Link href="/register" className="text-lime-accent hover:underline">Be the first.</Link>
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => {
            const me = user?.username === r.username
            const top = i === 0 && r.totalPct > 0
            return (
              <motion.li
                key={r.username}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
                className={`flex items-center gap-4 p-4 md:p-5 border transition-colors ${
                  me
                    ? 'border-lime-accent/60 bg-lime-accent/5'
                    : 'border-ink-800 bg-ink-900/30 hover:bg-ink-800/30'
                }`}
              >
                <div className="font-mono text-2xl md:text-3xl text-ink-400 w-10 text-center shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-serif text-xl md:text-2xl ${me ? 'text-lime-accent' : 'text-ink-50'}`}>{r.username}</span>
                    {top && <Crown className="w-4 h-4 text-amber-accent" />}
                    {r.isAdmin && <span className="font-mono text-[10px] tracking-wider uppercase text-amber-accent border border-amber-accent/40 px-1.5 py-0.5">Admin</span>}
                    {me && <span className="font-mono text-[10px] tracking-wider uppercase text-lime-accent">you</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    <span>{r.modulesViewed} modules</span>
                    <span>{r.quizzesCompleted} quizzes</span>
                    <span>{r.flashcardsSeen} cards</span>
                    <span>{r.treesCompleted} trees</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-serif text-3xl md:text-4xl text-ink-50">
                    {r.totalPct}<span className="text-lg text-ink-400">%</span>
                  </div>
                  <div className="font-mono text-[10px] text-ink-500 uppercase tracking-wider flex items-center justify-end gap-1">
                    <Trophy className="w-3 h-3" /> overall
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}

      <p className="font-mono text-[11px] text-ink-500 leading-relaxed mt-12 max-w-2xl">
        Note: this leaderboard is per-device. Each browser has its own user list and rankings — see the <Link href="/SECURITY.md" className="text-lime-accent hover:underline">security notes</Link> for why.
      </p>
    </section>
  )
}
