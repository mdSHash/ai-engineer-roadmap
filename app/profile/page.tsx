'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth-provider'
import { useProgress } from '@/lib/use-progress'
import { Eyebrow } from '@/components/section'
import { moduleList } from '@/lib/content/modules'
import { quizzes } from '@/lib/content/quizzes'
import { decisionTrees } from '@/lib/content/decision-trees'
import { ArrowRight, AlertTriangle, Trophy, BookOpen, Layers, GitBranch, Sparkles } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const { progress, summary, reset, totals } = useProgress()
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/profile')
  }, [user, loading, router])

  if (loading || !user || !progress || !summary) {
    return <div className="max-w-3xl mx-auto px-6 md:px-12 py-24 text-ink-400">Loading…</div>
  }

  return (
    <section className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <Eyebrow>Your dashboard</Eyebrow>
      <div className="mt-4 mb-12 flex flex-col md:flex-row md:items-end gap-4 md:justify-between">
        <h1 className="font-serif text-display-md text-ink-50">
          {user.username}
          {user.isAdmin && <span className="text-amber-accent text-3xl ml-3 align-middle">★</span>}
        </h1>
        <div className="font-mono text-xs text-ink-400">{user.email}</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-lime-accent/30 bg-lime-accent/5 p-8 md:p-10 mb-12"
      >
        <div className="flex flex-wrap items-end gap-6 justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent mb-2">Overall progress</div>
            <div className="flex items-baseline gap-4">
              <div className="font-serif text-7xl md:text-8xl text-ink-50 leading-none">{summary.totalPct}<span className="text-3xl text-ink-400">%</span></div>
              <Trophy className="w-7 h-7 text-lime-accent mb-2" />
            </div>
          </div>
          <p className="text-ink-300 max-w-sm leading-relaxed">
            Track every module, quiz, flashcard, and decision tree. Your data lives only in this browser — no server, no third party.
          </p>
        </div>
        <div className="mt-8 h-1.5 bg-ink-800 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${summary.totalPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-lime-accent"
          />
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <ProgressCard icon={<BookOpen />} label="Modules"     completed={summary.modulesViewed}    total={totals.modules}    pct={summary.modulesPct} />
        <ProgressCard icon={<Sparkles />} label="Quizzes"      completed={summary.quizzesCompleted} total={totals.quizzes}    pct={summary.quizzesPct} />
        <ProgressCard icon={<Layers />}   label="Flashcards"   completed={summary.flashcardsSeen}   total={totals.flashcards} pct={summary.flashcardsPct} />
        <ProgressCard icon={<GitBranch />}label="Decision trees" completed={summary.treesCompleted} total={totals.trees}      pct={summary.treesPct} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="font-serif text-2xl text-ink-50 mb-5">Modules</h2>
          <ul className="space-y-2">
            {moduleList.map(m => {
              const done = progress.modulesViewed.includes(m.slug)
              return (
                <li key={m.slug}>
                  <Link href={`/modules/${m.slug}`} className="flex items-center justify-between gap-3 p-3 border border-ink-800 hover:border-lime-accent/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[10px] text-ink-500">{m.number}</span>
                      <span className="text-ink-100 truncate">{m.title}</span>
                    </div>
                    <span className={`font-mono text-[10px] uppercase tracking-wider shrink-0 ${done ? 'text-lime-accent' : 'text-ink-500'}`}>
                      {done ? 'read' : 'pending'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-ink-50 mb-5">Quizzes</h2>
          <ul className="space-y-2">
            {quizzes.map(q => {
              const score = progress.quizScores[q.slug]
              const total = q.questions.length
              return (
                <li key={q.slug}>
                  <Link href={`/quiz/${q.slug}`} className="flex items-center justify-between gap-3 p-3 border border-ink-800 hover:border-lime-accent/40 transition-colors">
                    <span className="text-ink-100 truncate">{q.title}</span>
                    <span className={`font-mono text-[11px] shrink-0 ${score ? 'text-lime-accent' : 'text-ink-500'}`}>
                      {score ? `${score.best}/${total}` : `0/${total}`}
                      {score && score.attempts > 1 && <span className="text-ink-500"> · {score.attempts}×</span>}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <h2 className="font-serif text-2xl text-ink-50 mb-5 mt-10">Decision trees</h2>
          <ul className="space-y-2">
            {decisionTrees.map(t => {
              const done = progress.treesCompleted.includes(t.slug)
              return (
                <li key={t.slug}>
                  <Link href={`/decision-trees/${t.slug}`} className="flex items-center justify-between gap-3 p-3 border border-ink-800 hover:border-lime-accent/40 transition-colors">
                    <span className="text-ink-100 truncate">{t.title}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-wider shrink-0 ${done ? 'text-lime-accent' : 'text-ink-500'}`}>
                      {done ? 'walked' : 'pending'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="border border-amber-accent/30 bg-amber-accent/5 p-6 md:p-8">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-accent shrink-0 mt-0.5" />
          <h3 className="font-serif text-xl text-ink-50">Reset your progress</h3>
        </div>
        <p className="text-ink-300 leading-relaxed mb-5 max-w-2xl">
          Your progress only resets when you reset it. This wipes module history, quiz scores, flashcards seen, and decision trees walked — for this account on this browser. The account itself stays.
        </p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-accent/60 text-amber-accent hover:bg-amber-accent/10 font-mono text-xs uppercase tracking-wider transition-colors"
          >
            Reset progress
          </button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { reset(); setConfirmReset(false) }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-accent text-ink-950 hover:opacity-90 font-mono text-xs uppercase tracking-wider"
            >
              Yes, wipe my progress
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-ink-500 font-mono text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/leaderboard" className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-lime-accent/40 font-mono text-xs uppercase tracking-wider">
          See leaderboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button onClick={() => { logout(); router.push('/') }} className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-amber-accent/40 hover:text-amber-accent font-mono text-xs uppercase tracking-wider">
          Sign out
        </button>
      </div>
    </section>
  )
}

function ProgressCard({ icon, label, completed, total, pct }: { icon: React.ReactNode; label: string; completed: number; total: number; pct: number }) {
  return (
    <div className="border border-ink-800 bg-ink-900/30 p-5">
      <div className="flex items-center gap-2 text-ink-300 mb-3 [&>svg]:w-4 [&>svg]:h-4">{icon} <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span></div>
      <div className="flex items-baseline gap-2 mb-3">
        <div className="font-serif text-3xl text-ink-50">{completed}</div>
        <div className="text-ink-400 text-sm">/ {total}</div>
        <div className="ml-auto font-mono text-[11px] text-lime-accent">{pct}%</div>
      </div>
      <div className="h-1 bg-ink-800 relative overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-lime-accent/80"
        />
      </div>
    </div>
  )
}
