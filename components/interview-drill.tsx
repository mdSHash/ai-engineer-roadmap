'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Eye, RotateCcw, Zap, ChevronRight, Plus, CheckCircle2, XCircle } from 'lucide-react'
import type { InterviewQuestion } from '@/lib/types'
import { recordReview, getAllProgress, type SrRating } from '@/lib/interview-progress'
import { useAuth } from './auth-provider'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'prompt' | 'compare' | 'recap'

const ALL = 'All'
type DrillRating = 'got' | 'partial' | 'missed'

interface DrillResult {
  questionId: string
  rating: DrillRating
}

export function InterviewDrill({ questions, categories }: { questions: InterviewQuestion[]; categories: readonly string[] }) {
  const { user } = useAuth()
  const [filter, setFilter] = useState<'category' | 'difficulty' | 'hardest'>('category')
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL)
  const [difficultyFilter, setDifficultyFilter] = useState<string>(ALL)
  const [length, setLength] = useState<number>(10)

  const [queue, setQueue] = useState<InterviewQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState<Stage>('setup')
  const [attempt, setAttempt] = useState('')
  const [results, setResults] = useState<DrillResult[]>([])

  const myHardest = useMemo(() => {
    if (!user) return [] as InterviewQuestion[]
    const all = getAllProgress(user.id)
    const ranked = questions
      .map(q => ({ q, p: all[q.id] }))
      .filter(x => x.p !== undefined)
      .sort((a, b) => (a.p!.easeFactor - b.p!.easeFactor) || (b.p!.lapses - a.p!.lapses))
      .map(x => x.q)
    return ranked.slice(0, 30)
  }, [user, questions])

  function buildQueue(): InterviewQuestion[] {
    let pool = questions
    if (filter === 'hardest') {
      pool = myHardest.length > 0 ? myHardest : questions
    } else if (filter === 'category' && categoryFilter !== ALL) {
      pool = pool.filter(q => q.category === categoryFilter)
    } else if (filter === 'difficulty' && difficultyFilter !== ALL) {
      pool = pool.filter(q => q.difficulty === difficultyFilter)
    }
    // Lightweight client shuffle
    const shuffled = [...pool].sort(() => (typeof window !== 'undefined' ? Date.now() % 7 : 0) - (Date.now() % 13))
    return shuffled.slice(0, length)
  }

  function start() {
    const q = buildQueue()
    if (q.length === 0) return
    setQueue(q)
    setIdx(0)
    setAttempt('')
    setResults([])
    setStage('prompt')
  }

  function reveal() {
    setStage('compare')
  }

  function rate(r: DrillRating) {
    const current = queue[idx]
    setResults(prev => [...prev, { questionId: current.id, rating: r }])

    if (idx + 1 >= queue.length) {
      setStage('recap')
    } else {
      setIdx(i => i + 1)
      setAttempt('')
      setStage('prompt')
    }
  }

  function promoteMissedToStudy() {
    if (!user) return
    // Mark missed/partial questions as 'again' in the SR scheduler so they appear at the top of the next Study session.
    const failed = results.filter(r => r.rating === 'missed' || r.rating === 'partial')
    failed.forEach(r => recordReview(user.id, r.questionId, 'again' as SrRating))
  }

  // Keyboard shortcuts on compare stage
  useEffect(() => {
    if (stage !== 'compare') return
    function onKey(e: KeyboardEvent) {
      if (e.key === '1') { e.preventDefault(); rate('missed') }
      if (e.key === '2') { e.preventDefault(); rate('partial') }
      if (e.key === '3') { e.preventDefault(); rate('got') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, idx])

  if (!user) return <p className="text-ink-300">Sign in to use Drill mode.</p>

  // ── SETUP ──────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div className="space-y-8">
        <div className="border-l-2 border-amber-accent/60 bg-amber-accent/5 pl-5 py-4 pr-4">
          <div className="font-mono text-[10px] tracking-[0.25em] text-amber-accent mb-2 inline-flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> CRAM SESSION
          </div>
          <p className="text-ink-200 leading-relaxed text-sm">
            Drill is for "I have an interview Thursday on RAG specifically." It uses the same retrieval-gated flow as Study, but ratings here do <strong>not</strong> change your spaced-repetition schedule — cramming should not corrupt long-term scheduling.
          </p>
        </div>

        <div className="border border-ink-700 bg-ink-900/30 p-6 md:p-8 space-y-6">
          <Field label="Pick from">
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'category',   label: 'A category' },
                { id: 'difficulty', label: 'A difficulty' },
                { id: 'hardest',    label: 'My hardest 30' },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  disabled={opt.id === 'hardest' && myHardest.length === 0}
                  className={cn(
                    'font-mono text-xs uppercase tracking-wider px-4 py-2 border transition-colors',
                    filter === opt.id ? 'border-lime-accent text-lime-accent bg-lime-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500',
                    opt.id === 'hardest' && myHardest.length === 0 && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {opt.label}
                  {opt.id === 'hardest' && myHardest.length === 0 && <span className="ml-2 text-[9px]">(need Study reviews first)</span>}
                </button>
              ))}
            </div>
          </Field>

          {filter === 'category' && (
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {[ALL, ...categories].map(c => (
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
          )}

          {filter === 'difficulty' && (
            <Field label="Difficulty">
              <div className="flex flex-wrap gap-2">
                {[ALL, 'Junior', 'Mid', 'Senior'].map(d => (
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
          )}

          <Field label="Length">
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setLength(n)}
                  className={cn(
                    'font-mono text-xs uppercase tracking-wider px-4 py-2 border transition-colors',
                    length === n ? 'border-lime-accent text-lime-accent bg-lime-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
                  )}
                >{n} questions</button>
              ))}
            </div>
          </Field>

          <button
            onClick={start}
            className="inline-flex items-center gap-2 bg-amber-accent text-ink-950 hover:opacity-90 px-6 py-3 font-mono text-xs uppercase tracking-wider"
          >
            Start drill <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // ── RECAP ──────────────────────────────────────
  if (stage === 'recap') {
    const counts = results.reduce<Record<DrillRating, number>>((acc, r) => ({ ...acc, [r.rating]: acc[r.rating] + 1 }), { got: 0, partial: 0, missed: 0 })
    const accuracy = Math.round((counts.got / Math.max(1, results.length)) * 100)
    const failedCount = counts.partial + counts.missed

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-amber-accent mb-3 inline-flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Drill complete
          </div>
          <div className="font-serif text-6xl md:text-7xl text-ink-50 mb-3">{accuracy}<span className="text-2xl text-ink-400">% confident</span></div>
          <p className="text-ink-300">{results.length} questions · drill-only, your SR schedule is untouched</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="border border-amber-accent/40 bg-amber-accent/5 py-4 text-center">
            <div className="font-serif text-3xl text-amber-accent">{counts.missed}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mt-1">Missed</div>
          </div>
          <div className="border border-ink-700 bg-ink-900/30 py-4 text-center">
            <div className="font-serif text-3xl text-ink-200">{counts.partial}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mt-1">Partial</div>
          </div>
          <div className="border border-lime-accent/40 bg-lime-accent/5 py-4 text-center">
            <div className="font-serif text-3xl text-lime-accent">{counts.got}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mt-1">Got</div>
          </div>
        </div>

        {failedCount > 0 && (
          <div className="border border-lime-accent/40 bg-lime-accent/5 p-5">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent mb-3">PROMOTE TO LONG-TERM PRACTICE</div>
            <p className="text-ink-200 leading-relaxed text-sm mb-4">
              You missed or partially missed {failedCount} questions. Add them to your Study queue so spaced repetition picks them up — your next Study session will start with these.
            </p>
            <button
              onClick={() => { promoteMissedToStudy(); setStage('setup') }}
              className="inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-4 py-2 font-mono text-xs uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" /> Add {failedCount} to Study queue
            </button>
          </div>
        )}

        <div className="space-y-2">
          {results.map((r, i) => {
            const q = queue[i]
            const tone = r.rating === 'got' ? 'border-lime-accent/40 bg-lime-accent/5' : r.rating === 'partial' ? 'border-ink-700' : 'border-amber-accent/40 bg-amber-accent/5'
            const ratingLabel = r.rating === 'got' ? 'Got it' : r.rating === 'partial' ? 'Partial' : 'Missed'
            const ratingColor = r.rating === 'got' ? 'text-lime-accent' : r.rating === 'partial' ? 'text-ink-300' : 'text-amber-accent'
            return (
              <div key={i} className={cn('border p-4 flex items-start justify-between gap-3', tone)}>
                <div className="flex gap-3 min-w-0">
                  <span className="font-mono text-[10px] text-ink-500 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <div className="flex gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-lime-accent">{q.category}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-amber-accent">{q.difficulty}</span>
                    </div>
                    <p className="text-ink-200 leading-relaxed text-sm">{q.scenario}</p>
                  </div>
                </div>
                <span className={cn('font-mono text-xs uppercase tracking-wider shrink-0', ratingColor)}>{ratingLabel}</span>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <button onClick={() => setStage('setup')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-accent text-ink-950 hover:opacity-90 font-mono text-xs uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" /> New drill
          </button>
        </div>
      </motion.div>
    )
  }

  if (queue.length === 0) return null

  const current = queue[idx]
  const progress = ((idx + (stage !== 'prompt' ? 1 : 0)) / queue.length) * 100

  // ── ACTIVE QUESTION ────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-ink-400 font-mono text-[11px] uppercase tracking-wider">
        <span>Drill {idx + 1} / {queue.length}</span>
        <span className="flex items-center gap-3">
          <span className="text-lime-accent">{current.category}</span>
          <span className="text-amber-accent">{current.difficulty}</span>
          <span className="text-ink-500 text-[9px]">SR-isolated</span>
        </span>
      </div>
      <div className="h-px bg-ink-800 mb-8 relative">
        <motion.div initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
          className="absolute top-0 left-0 h-px bg-amber-accent" />
      </div>

      <AnimatePresence mode="wait">
        {stage === 'prompt' && (
          <motion.div key={`p${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-8">{current.scenario}</h3>

            <textarea
              value={attempt}
              onChange={e => setAttempt(e.target.value)}
              placeholder="Type your answer (optional but improves recall)…"
              className="w-full bg-ink-900/40 border border-ink-700 focus:border-lime-accent/60 outline-none px-4 py-3 font-mono text-sm text-ink-100 placeholder:text-ink-500 min-h-32 mb-4"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">Drill ratings do not change your SR schedule.</span>
              <button
                onClick={reveal}
                className="inline-flex items-center gap-2 bg-amber-accent text-ink-950 hover:opacity-90 px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
              >
                <Eye className="w-3.5 h-3.5" /> Reveal
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'compare' && (
          <motion.div key={`c${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-6">{current.scenario}</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="border border-ink-700 bg-ink-900/30 p-5">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-2">YOUR ATTEMPT</div>
                {attempt ? (
                  <p className="text-ink-100 leading-relaxed whitespace-pre-wrap text-sm">{attempt}</p>
                ) : (
                  <p className="text-ink-500 italic text-sm">(skipped — score honestly)</p>
                )}
              </div>
              <div className="border border-amber-accent/40 bg-amber-accent/5 p-5">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-amber-accent mb-2">MODEL ANSWER</div>
                <p className="text-ink-100 leading-relaxed text-sm">{current.answer.summary}</p>
              </div>
            </div>

            <details className="border border-ink-700 mb-6">
              <summary className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-300 px-4 py-3 cursor-pointer hover:bg-ink-900/40">More detail · steps · trade-offs · red flags · follow-ups</summary>
              <div className="px-4 pb-4 space-y-5">
                <Section title="Steps">
                  <ol className="space-y-2">{current.answer.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-ink-200 leading-relaxed text-sm">
                      <span className="font-mono text-[11px] text-lime-accent shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                      <span>{s}</span>
                    </li>
                  ))}</ol>
                </Section>
                <Section title="Trade-offs"><Bullets items={current.answer.tradeoffs} dot="bg-ink-500" /></Section>
                <Section title="Red flags"><Bullets items={current.answer.redFlags}  dot="bg-amber-accent" /></Section>
                <Section title="Follow-ups"><Bullets items={current.answer.followUps} dot="bg-lime-accent" /></Section>
              </div>
            </details>

            <div className="border border-ink-700 bg-ink-900/30 p-5">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-300 mb-3">Did you have it?</div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => rate('missed')} className="flex items-center justify-center gap-2 p-3 border border-amber-accent/60 hover:bg-amber-accent/10 text-amber-accent font-mono text-xs uppercase tracking-wider">
                  <XCircle className="w-3.5 h-3.5" /> Missed <kbd className="text-[10px]">1</kbd>
                </button>
                <button onClick={() => rate('partial')} className="flex items-center justify-center gap-2 p-3 border border-ink-600 hover:bg-ink-800/60 text-ink-200 font-mono text-xs uppercase tracking-wider">
                  Partial <kbd className="text-[10px]">2</kbd>
                </button>
                <button onClick={() => rate('got')} className="flex items-center justify-center gap-2 p-3 border border-lime-accent/60 hover:bg-lime-accent/10 text-lime-accent font-mono text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Got it <kbd className="text-[10px]">3</kbd>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-2">{title}</div>
      {children}
    </div>
  )
}

function Bullets({ items, dot }: { items: string[]; dot: string }) {
  return (
    <ul className="space-y-2">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3 text-ink-200 leading-relaxed text-sm">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-2', dot)} />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  )
}
