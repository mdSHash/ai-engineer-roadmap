'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, RotateCcw, Eye, EyeOff, ChevronRight, Lightbulb, Target, Trophy } from 'lucide-react'
import type { InterviewQuestion } from '@/lib/types'
import {
  buildStudyQueue, getStats, recordReview, recordFollowUp, getPrefs, savePrefs,
  appendSession, type StudyQueueItem, type SrRating,
} from '@/lib/interview-progress'
import { useAuth } from './auth-provider'
import { cn } from '@/lib/utils'

const RATING_BUTTONS: { rating: SrRating; label: string; help: string; key: string; tone: string }[] = [
  { rating: 'again', label: 'Again',  help: 'Failed retrieval. See in ~10 min.', key: '1', tone: 'border-amber-accent/60 hover:bg-amber-accent/10 text-amber-accent' },
  { rating: 'hard',  label: 'Hard',   help: 'Recalled with difficulty.',         key: '2', tone: 'border-ink-600 hover:bg-ink-800/60 text-ink-200' },
  { rating: 'good',  label: 'Good',   help: 'Recalled correctly.',                key: '3', tone: 'border-lime-accent/60 hover:bg-lime-accent/10 text-lime-accent' },
  { rating: 'easy',  label: 'Easy',   help: 'Instantly obvious.',                 key: '4', tone: 'border-lime-accent hover:bg-lime-accent/15 text-lime-accent' },
]

type Stage = 'setup' | 'prompt' | 'compare' | 'rate' | 'followup' | 'session-recap'

export function InterviewStudy({ questions, categories }: { questions: InterviewQuestion[]; categories: readonly string[] }) {
  const { user } = useAuth()
  const [queue, setQueue] = useState<StudyQueueItem[]>([])
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState<Stage>('setup')
  const [attempt, setAttempt] = useState('')
  const [revealed, setRevealed] = useState<'summary' | 'tradeoffs' | 'redFlags' | 'followUps'>('summary')
  const [followUpIdx, setFollowUpIdx] = useState<number | null>(null)
  const [followUpRevealed, setFollowUpRevealed] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All')
  const [sessionRatings, setSessionRatings] = useState<SrRating[]>([])
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)

  const prefs = useMemo(() => user ? getPrefs(user.id) : null, [user])
  const [sessionSize, setSessionSize] = useState(prefs?.sessionSize ?? 12)

  useEffect(() => {
    if (prefs) setSessionSize(prefs.sessionSize)
  }, [prefs])

  const stats = useMemo(() => user ? getStats(user.id, questions.length) : null, [user, questions.length, stage])

  const current = queue[idx]

  function startSession() {
    if (!user) return
    savePrefs(user.id, { sessionSize })
    const q = buildStudyQueue(user.id, questions, {
      sessionSize,
      categoryFilter,
      difficultyFilter,
    })
    if (q.length === 0) return
    setQueue(q)
    setIdx(0)
    setAttempt('')
    setRevealed('summary')
    setFollowUpIdx(null)
    setFollowUpRevealed(false)
    setSessionRatings([])
    setSessionStartedAt(Date.now())
    setStage('prompt')
  }

  function reveal() {
    setStage('compare')
  }

  function rate(rating: SrRating) {
    if (!user || !current) return
    recordReview(user.id, current.question.id, rating)
    setSessionRatings(prev => [...prev, rating])

    // After Good or Easy, optionally serve a follow-up stretch.
    if ((rating === 'good' || rating === 'easy') && current.question.answer.followUps.length > 0) {
      setFollowUpIdx(0)
      setFollowUpRevealed(false)
      setStage('followup')
      return
    }
    advance()
  }

  function advance() {
    setFollowUpIdx(null)
    setFollowUpRevealed(false)
    if (idx + 1 >= queue.length) {
      finishSession()
    } else {
      setIdx(i => i + 1)
      setAttempt('')
      setRevealed('summary')
      setStage('prompt')
    }
  }

  function rateFollowUp(gotIt: boolean) {
    if (!user || !current || followUpIdx === null) return
    recordFollowUp(user.id, current.question.id, followUpIdx, gotIt)
    advance()
  }

  function finishSession() {
    if (!user || !sessionStartedAt) return
    appendSession(user.id, {
      id: `study-${sessionStartedAt}`,
      mode: 'study',
      startedAt: sessionStartedAt,
      endedAt: Date.now(),
      questionIds: queue.map(q => q.question.id),
      ratings: sessionRatings,
      durationMs: Date.now() - sessionStartedAt,
    })
    setStage('session-recap')
  }

  // Keyboard shortcuts on rate stage
  useEffect(() => {
    if (stage !== 'compare') return
    function onKey(e: KeyboardEvent) {
      const map: Record<string, SrRating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }
      const r = map[e.key]
      if (r) { e.preventDefault(); rate(r) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, current, idx])

  if (!user) {
    return <p className="text-ink-300">Sign in to use Study mode.</p>
  }

  // ── SETUP ──────────────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div className="space-y-10">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Due now"        value={stats.dueCount}      icon={<Target />} highlight />
            <StatCard label="Mastered"       value={stats.masteredCount} icon={<Trophy />} />
            <StatCard label="In review"      value={stats.reviewCount}   icon={<Lightbulb />} />
            <StatCard label="Accuracy"       value={`${stats.accuracy}%`} icon={<Sparkles />} />
          </div>
        )}

        <div className="border border-ink-700 bg-ink-900/30 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-serif text-2xl text-ink-50 mb-2">Build today's session</h2>
            <p className="text-ink-300 leading-relaxed">
              Active recall, spaced repetition, interleaved categories. Type or speak your answer before revealing — that's the whole point.
            </p>
          </div>

          <Field label="Session size">
            <div className="flex flex-wrap gap-2">
              {[5, 8, 12, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setSessionSize(n)}
                  className={cn(
                    'font-mono text-xs uppercase tracking-wider px-4 py-2 border transition-colors',
                    sessionSize === n ? 'border-lime-accent text-lime-accent bg-lime-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
                  )}
                >{n} cards</button>
              ))}
            </div>
          </Field>

          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {['All', ...categories].map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={cn(
                    'font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors',
                    categoryFilter === c ? 'border-lime-accent text-lime-accent bg-lime-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
                  )}
                >{c}</button>
              ))}
            </div>
          </Field>

          <Field label="Difficulty">
            <div className="flex flex-wrap gap-2">
              {['All', 'Junior', 'Mid', 'Senior'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={cn(
                    'font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors',
                    difficultyFilter === d ? 'border-amber-accent text-amber-accent bg-amber-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
                  )}
                >{d}</button>
              ))}
            </div>
          </Field>

          <button
            onClick={startSession}
            className="inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-6 py-3 font-mono text-xs uppercase tracking-wider"
          >
            Start session <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border-l-2 border-lime-accent/40 bg-lime-accent/5 pl-5 py-4 pr-4">
          <div className="font-mono text-[10px] tracking-[0.25em] text-lime-accent mb-2">HOW THIS WORKS</div>
          <ul className="text-ink-200 leading-relaxed space-y-2 text-sm">
            <li>· You see the scenario only. No answer, no follow-ups.</li>
            <li>· Type or think your answer first — that's the retrieval moment.</li>
            <li>· Reveal, compare, then rate yourself: <kbd>1</kbd> Again · <kbd>2</kbd> Hard · <kbd>3</kbd> Good · <kbd>4</kbd> Easy.</li>
            <li>· Cards you ace get spaced out. Cards you miss come back fast.</li>
            <li>· Categories interleave automatically — no two consecutive cards share a topic.</li>
          </ul>
        </div>
      </div>
    )
  }

  // ── SESSION RECAP ─────────────────────────────────────
  if (stage === 'session-recap') {
    const counts = sessionRatings.reduce<Record<SrRating, number>>((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), { again: 0, hard: 0, good: 0, easy: 0 })
    const accuracy = Math.round(((counts.good + counts.easy) / Math.max(1, sessionRatings.length)) * 100)
    const elapsed = sessionStartedAt ? Math.round((Date.now() - sessionStartedAt) / 60000) : 0

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 text-center max-w-2xl mx-auto">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent mb-3">Session complete</div>
          <h2 className="font-serif text-5xl md:text-6xl text-ink-50 mb-4">{accuracy}<span className="text-2xl text-ink-400">% recall</span></h2>
          <p className="text-ink-300">{queue.length} cards · {elapsed} min</p>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {([['again', 'Again', 'amber-accent'], ['hard', 'Hard', 'ink-200'], ['good', 'Good', 'lime-accent'], ['easy', 'Easy', 'lime-accent']] as const).map(([r, label, color]) => (
            <div key={r} className="border border-ink-800 bg-ink-900/30 py-4">
              <div className={`font-serif text-3xl text-${color}`}>{counts[r]}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => setStage('setup')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime-accent text-ink-950 hover:bg-lime-glow font-mono text-xs uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" /> New session
          </button>
          <Link href="/profile" className="inline-flex items-center gap-2 px-5 py-2.5 border border-ink-700 hover:border-lime-accent/40 font-mono text-xs uppercase tracking-wider">
            See progress
          </Link>
        </div>
      </motion.div>
    )
  }

  if (!current) return null

  const progress = ((idx + (stage !== 'prompt' ? 1 : 0)) / queue.length) * 100

  // ── ACTIVE QUESTION ───────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-ink-400 font-mono text-[11px] uppercase tracking-wider">
        <span>Card {idx + 1} / {queue.length}</span>
        <span className="flex items-center gap-3">
          <span className="text-lime-accent">{current.question.category}</span>
          <span className="text-amber-accent">{current.question.difficulty}</span>
          {current.isNew && <span className="text-ink-300 border border-ink-700 px-1.5 py-0.5">NEW</span>}
          {!current.isNew && current.isDue && <span className="text-amber-accent border border-amber-accent/60 px-1.5 py-0.5">DUE</span>}
        </span>
      </div>
      <div className="h-px bg-ink-800 mb-8 relative">
        <motion.div initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
          className="absolute top-0 left-0 h-px bg-lime-accent" />
      </div>

      <AnimatePresence mode="wait">
        {/* PROMPT */}
        {stage === 'prompt' && (
          <motion.div key="prompt" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-8">{current.question.scenario}</h3>

            <textarea
              value={attempt}
              onChange={e => setAttempt(e.target.value)}
              placeholder="Type your answer (or speak it aloud and jot keywords)…"
              className="w-full bg-ink-900/40 border border-ink-700 focus:border-lime-accent/60 outline-none px-4 py-3 font-mono text-sm text-ink-100 placeholder:text-ink-500 min-h-32 mb-4"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">Don't peek. The retrieval is the practice.</span>
              <button
                onClick={reveal}
                className="inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
              >
                <Eye className="w-3.5 h-3.5" /> Reveal answer
              </button>
            </div>
          </motion.div>
        )}

        {/* COMPARE + RATE */}
        {stage === 'compare' && (
          <motion.div key="compare" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-6">{current.question.scenario}</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="border border-ink-700 bg-ink-900/30 p-5">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-2">YOUR ATTEMPT</div>
                {attempt ? (
                  <p className="text-ink-100 leading-relaxed whitespace-pre-wrap">{attempt}</p>
                ) : (
                  <p className="text-ink-500 italic">(skipped — rate yourself honestly)</p>
                )}
              </div>
              <div className="border border-lime-accent/40 bg-lime-accent/5 p-5">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent mb-2">MODEL ANSWER</div>
                <p className="text-ink-100 leading-relaxed">{current.question.answer.summary}</p>
              </div>
            </div>

            <div className="border border-ink-700 mb-8">
              <div className="flex flex-wrap border-b border-ink-700">
                {(['summary', 'tradeoffs', 'redFlags', 'followUps'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRevealed(tab)}
                    className={cn(
                      'flex-1 min-w-[110px] px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-r border-ink-700 last:border-r-0',
                      revealed === tab ? 'text-lime-accent bg-ink-900/40' : 'text-ink-400 hover:text-ink-200'
                    )}
                  >
                    {tab === 'summary' ? 'Steps' : tab === 'tradeoffs' ? 'Trade-offs' : tab === 'redFlags' ? 'Red flags' : 'Follow-ups'}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {revealed === 'summary'   && <NumberedList items={current.question.answer.steps} />}
                {revealed === 'tradeoffs' && <BulletList items={current.question.answer.tradeoffs} tone="neutral" />}
                {revealed === 'redFlags'  && <BulletList items={current.question.answer.redFlags} tone="warn" />}
                {revealed === 'followUps' && <BulletList items={current.question.answer.followUps} tone="accent" />}
              </div>
            </div>

            <div className="border border-ink-700 bg-ink-900/30 p-5">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-300 mb-3">How well did you retrieve this BEFORE peeking?</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {RATING_BUTTONS.map(r => (
                  <button
                    key={r.rating}
                    onClick={() => rate(r.rating)}
                    className={cn('text-left p-3 border transition-colors group', r.tone)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider">{r.label}</span>
                      <kbd className="text-[10px]">{r.key}</kbd>
                    </div>
                    <p className="text-[11px] text-ink-400 mt-1 leading-relaxed">{r.help}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* FOLLOW-UP STRETCH */}
        {stage === 'followup' && current && followUpIdx !== null && (
          <motion.div key="followup" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="border-l-2 border-lime-accent/60 bg-lime-accent/5 pl-5 py-4 pr-4 mb-8">
              <div className="font-mono text-[10px] tracking-[0.25em] text-lime-accent mb-2">STRETCH FOLLOW-UP</div>
              <p className="text-ink-100 text-lg leading-relaxed">{current.question.answer.followUps[followUpIdx]}</p>
            </div>

            {!followUpRevealed ? (
              <div className="flex flex-wrap gap-3 justify-end">
                <button onClick={() => advance()} className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-ink-500 font-mono text-xs uppercase tracking-wider text-ink-300">
                  Skip
                </button>
                <button onClick={() => setFollowUpRevealed(true)} className="inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-5 py-2.5 font-mono text-xs uppercase tracking-wider">
                  I have an answer · reveal
                </button>
              </div>
            ) : (
              <div className="border border-ink-700 bg-ink-900/30 p-5">
                <p className="text-ink-300 leading-relaxed mb-4 italic">There's no canonical answer for follow-ups in this bank — they're stretch prompts. Rate yourself honestly:</p>
                <div className="flex gap-3">
                  <button onClick={() => rateFollowUp(true)}  className="flex-1 px-4 py-2.5 border border-lime-accent/60 hover:bg-lime-accent/10 text-lime-accent font-mono text-xs uppercase tracking-wider">Got it</button>
                  <button onClick={() => rateFollowUp(false)} className="flex-1 px-4 py-2.5 border border-amber-accent/60 hover:bg-amber-accent/10 text-amber-accent font-mono text-xs uppercase tracking-wider">Missed</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {(stage === 'compare' || stage === 'followup') && (
        <button
          onClick={() => { if (stage === 'compare') setStage('prompt'); else setStage('compare') }}
          className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-400 hover:text-ink-200"
        >
          <EyeOff className="w-3 h-3" /> Hide
        </button>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-3">{label}</div>
      {children}
    </div>
  )
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      'border p-4',
      highlight ? 'border-lime-accent/40 bg-lime-accent/5' : 'border-ink-800 bg-ink-900/30'
    )}>
      <div className={cn('flex items-center gap-2 mb-2 [&>svg]:w-3.5 [&>svg]:h-3.5', highlight ? 'text-lime-accent' : 'text-ink-400')}>
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-serif text-2xl text-ink-50">{value}</div>
    </div>
  )
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3 text-ink-200 leading-relaxed">
          <span className="font-mono text-[11px] text-lime-accent shrink-0 mt-1">{String(i + 1).padStart(2, '0')}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  )
}

function BulletList({ items, tone }: { items: string[]; tone: 'neutral' | 'warn' | 'accent' }) {
  const dot = { neutral: 'bg-ink-500', warn: 'bg-amber-accent', accent: 'bg-lime-accent' }[tone]
  return (
    <ul className="space-y-2">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3 text-ink-200 leading-relaxed">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-2.5', dot)} />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  )
}

// Tiny inline icon for the stats row to avoid pulling another import
function Sparkles() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
}
