'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Mic, MicOff, Clock, ChevronRight, Trophy, X, RotateCcw } from 'lucide-react'
import type { InterviewQuestion } from '@/lib/types'
import { buildMockQueue, appendSession, type MockQueueItem } from '@/lib/interview-progress'
import { useAuth } from './auth-provider'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'question' | 'reveal' | 'recap'

interface RubricMark {
  hitSummary:    boolean
  mentionedTradeoff: boolean
  avoidedRedFlag:  boolean
  answeredFollowUp: boolean
}

const EMPTY_RUBRIC: RubricMark = { hitSummary: false, mentionedTradeoff: false, avoidedRedFlag: false, answeredFollowUp: false }

export function InterviewMock({ questions }: { questions: InterviewQuestion[] }) {
  const { user } = useAuth()
  const [length, setLength] = useState<number>(5)
  const [target, setTarget] = useState<'Junior' | 'Mid' | 'Senior'>('Mid')
  const [timerSec, setTimerSec] = useState<number>(180)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const [queue, setQueue] = useState<MockQueueItem[]>([])
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState<Stage>('setup')
  const [attempt, setAttempt] = useState('')
  const [remaining, setRemaining] = useState(timerSec)
  const [paused, setPaused] = useState(false)
  const [rubrics, setRubrics] = useState<RubricMark[]>([])
  const [recordingUrls, setRecordingUrls] = useState<(string | null)[]>([])
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<Blob[]>([])

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
  }, [])

  function start() {
    if (questions.length === 0) return
    const q = buildMockQueue(questions, { length, targetDifficulty: target })
    if (q.length === 0) return
    setQueue(q)
    setIdx(0)
    setAttempt('')
    setRubrics(Array(q.length).fill(null).map(() => ({ ...EMPTY_RUBRIC })))
    setRecordingUrls(Array(q.length).fill(null))
    setStartedAt(Date.now())
    setRemaining(timerSec)
    setPaused(false)
    setStage('question')
    if (audioEnabled) startRecording()
    runTimer()
  }

  function runTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return r - 1
      })
    }, 1000)
  }

  // Pause-aware timer
  useEffect(() => {
    if (paused && timerRef.current) clearInterval(timerRef.current)
    else if (stage === 'question' && !paused && remaining > 0) runTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, stage])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recChunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = ev => { if (ev.data.size > 0) recChunksRef.current.push(ev.data) }
      rec.onstop = () => {
        const blob = new Blob(recChunksRef.current, { type: rec.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordingUrls(prev => {
          const next = [...prev]
          next[idx] = url
          return next
        })
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start()
      recRef.current = rec
    } catch (err) {
      // Mic permission denied or unsupported — quietly disable audio for the session.
      setAudioEnabled(false)
    }
  }

  function stopRecording() {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
    recRef.current = null
  }

  function reveal() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (audioEnabled) stopRecording()
    setStage('reveal')
  }

  function nextQuestion() {
    if (idx + 1 >= queue.length) {
      finish()
      return
    }
    setIdx(i => i + 1)
    setAttempt('')
    setRemaining(timerSec)
    setPaused(false)
    setStage('question')
    if (audioEnabled) startRecording()
  }

  function finish() {
    if (!user || !startedAt) return
    if (audioEnabled) stopRecording()
    const score = rubrics.reduce((acc, r) => acc + (Number(r.hitSummary) + Number(r.mentionedTradeoff) + Number(r.avoidedRedFlag) + Number(r.answeredFollowUp)), 0)
    appendSession(user.id, {
      id: `mock-${startedAt}`,
      mode: 'mock',
      startedAt,
      endedAt: Date.now(),
      questionIds: queue.map(q => q.question.id),
      ratings: [],
      rubricScores: rubrics.map(r => Number(r.hitSummary) + Number(r.mentionedTradeoff) + Number(r.avoidedRedFlag) + Number(r.answeredFollowUp)),
      durationMs: Date.now() - startedAt,
    })
    setStage('recap')
  }

  function setRubric(field: keyof RubricMark, value: boolean) {
    setRubrics(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  // Auto-reveal when timer hits zero
  useEffect(() => {
    if (stage === 'question' && remaining === 0) reveal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, stage])

  const current = queue[idx]
  const totalScore = rubrics.reduce((acc, r) => acc + (Number(r.hitSummary) + Number(r.mentionedTradeoff) + Number(r.avoidedRedFlag) + Number(r.answeredFollowUp)), 0)
  const maxScore = queue.length * 4

  // ── SETUP ────────────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div className="space-y-8">
        <div className="border-l-2 border-amber-accent/60 bg-amber-accent/5 pl-5 py-4 pr-4">
          <div className="font-mono text-[10px] tracking-[0.25em] text-amber-accent mb-2">PRODUCTION SIMULATION</div>
          <p className="text-ink-200 leading-relaxed text-sm">
            Mixed categories. A clock per question. No peeking until time runs out or you click Done. After each, a four-criteria rubric you score honestly.
          </p>
        </div>

        <div className="border border-ink-700 bg-ink-900/30 p-6 md:p-8 space-y-6">
          <Field label="Length">
            <div className="flex flex-wrap gap-2">
              {[3, 5, 8, 10].map(n => (
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

          <Field label="Target role">
            <div className="flex flex-wrap gap-2">
              {(['Junior', 'Mid', 'Senior'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setTarget(d)}
                  className={cn(
                    'font-mono text-xs uppercase tracking-wider px-4 py-2 border transition-colors',
                    target === d ? 'border-amber-accent text-amber-accent bg-amber-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
                  )}
                >{d}</button>
              ))}
            </div>
          </Field>

          <Field label="Per-question timer">
            <div className="flex flex-wrap gap-2">
              {[60, 120, 180, 300].map(s => (
                <button
                  key={s}
                  onClick={() => setTimerSec(s)}
                  className={cn(
                    'font-mono text-xs uppercase tracking-wider px-4 py-2 border transition-colors',
                    timerSec === s ? 'border-lime-accent text-lime-accent bg-lime-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
                  )}
                >{Math.round(s / 60)} min</button>
              ))}
            </div>
          </Field>

          <Field label="Record audio (optional)">
            <button
              onClick={() => setAudioEnabled(a => !a)}
              className={cn(
                'inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider px-4 py-2 border transition-colors',
                audioEnabled ? 'border-lime-accent text-lime-accent bg-lime-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
              )}
            >
              {audioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              {audioEnabled ? 'Recording on (in-browser only)' : 'Mic off'}
            </button>
            <p className="font-mono text-[10px] text-ink-500 mt-2 leading-relaxed">
              Stays on your device. We never upload it. Recording trains the speaking-out-loud skill that interviewers actually test.
            </p>
          </Field>

          <button
            onClick={start}
            className="inline-flex items-center gap-2 bg-amber-accent text-ink-950 hover:opacity-90 px-6 py-3 font-mono text-xs uppercase tracking-wider"
          >
            Start mock <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // ── RECAP ────────────────────────────────────────────
  if (stage === 'recap') {
    const pctScore = Math.round((totalScore / Math.max(1, maxScore)) * 100)
    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 60000) : 0
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-amber-accent mb-3">Mock complete</div>
          <h2 className="font-serif text-5xl md:text-6xl text-ink-50 mb-3">{totalScore}<span className="text-2xl text-ink-400">/{maxScore}</span></h2>
          <p className="text-ink-300">{queue.length} questions · {pctScore}% · {elapsed} min</p>
        </div>

        <div className="space-y-3">
          {queue.map((it, i) => {
            const r = rubrics[i]
            const score = Number(r.hitSummary) + Number(r.mentionedTradeoff) + Number(r.avoidedRedFlag) + Number(r.answeredFollowUp)
            return (
              <div key={i} className="border border-ink-800 bg-ink-900/30 p-4 md:p-5">
                <div className="flex flex-wrap items-start gap-3 justify-between mb-2">
                  <div className="flex gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-lime-accent">{it.question.category}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber-accent">{it.question.difficulty}</span>
                  </div>
                  <span className={cn('font-mono text-xs', score >= 3 ? 'text-lime-accent' : score === 2 ? 'text-amber-accent' : 'text-ink-400')}>
                    {score}/4
                  </span>
                </div>
                <p className="text-ink-200 leading-relaxed mb-3 text-sm">{it.question.scenario}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono uppercase tracking-wider">
                  <RubricChip ok={r.hitSummary}        label="Summary" />
                  <RubricChip ok={r.mentionedTradeoff} label="Trade-off" />
                  <RubricChip ok={r.avoidedRedFlag}    label="No red flag" />
                  <RubricChip ok={r.answeredFollowUp}  label="Follow-up" />
                </div>
                {recordingUrls[i] && (
                  <audio controls className="mt-3 w-full" src={recordingUrls[i]!} />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => setStage('setup')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-accent text-ink-950 hover:opacity-90 font-mono text-xs uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" /> New mock
          </button>
        </div>
      </motion.div>
    )
  }

  if (!current) return null

  // ── ACTIVE QUESTION ──────────────────────────────────
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timerWarning = remaining <= 30
  const timerCritical = remaining <= 10

  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-ink-400 font-mono text-[11px] uppercase tracking-wider">
        <span>Question {idx + 1} / {queue.length}</span>
        <span className="flex items-center gap-3">
          <span className="text-lime-accent">{current.question.category}</span>
          <span className="text-amber-accent">{current.question.difficulty}</span>
        </span>
      </div>

      {/* Timer */}
      <div className={cn('flex items-center gap-2 mb-6 px-4 py-3 border', timerCritical ? 'border-amber-accent bg-amber-accent/10' : timerWarning ? 'border-amber-accent/40' : 'border-ink-700')}>
        <Clock className={cn('w-4 h-4', timerCritical ? 'text-amber-accent' : 'text-ink-300')} />
        <span className={cn('font-mono text-xl tabular-nums', timerCritical ? 'text-amber-accent' : 'text-ink-100')}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        {audioEnabled && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-accent inline-flex items-center gap-1 ml-3">
            <span className="w-2 h-2 bg-amber-accent rounded-full animate-pulse-slow" /> REC
          </span>
        )}
        <button onClick={() => setPaused(p => !p)} className="ml-auto font-mono text-[10px] uppercase tracking-wider text-ink-400 hover:text-ink-200">
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'question' && (
          <motion.div key={`q${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-8">{current.question.scenario}</h3>

            <textarea
              value={attempt}
              onChange={e => setAttempt(e.target.value)}
              placeholder="Type your answer (or speak it; you can do both)…"
              className="w-full bg-ink-900/40 border border-ink-700 focus:border-lime-accent/60 outline-none px-4 py-3 font-mono text-sm text-ink-100 placeholder:text-ink-500 min-h-40 mb-4"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">No peeking. Reveal unlocks at zero or when you click Done.</span>
              <button
                onClick={reveal}
                className="inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
              >
                Done · reveal <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div key={`r${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-6">{current.question.scenario}</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="border border-ink-700 bg-ink-900/30 p-5">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-2">YOUR ATTEMPT</div>
                {attempt ? (
                  <p className="text-ink-100 leading-relaxed whitespace-pre-wrap text-sm">{attempt}</p>
                ) : (
                  <p className="text-ink-500 italic text-sm">(spoken or skipped — score yourself fairly)</p>
                )}
              </div>
              <div className="border border-lime-accent/40 bg-lime-accent/5 p-5">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent mb-2">SUMMARY</div>
                <p className="text-ink-100 leading-relaxed text-sm">{current.question.answer.summary}</p>
              </div>
            </div>

            <details className="border border-ink-700 mb-8">
              <summary className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-300 px-4 py-3 cursor-pointer hover:bg-ink-900/40">More detail (steps · trade-offs · red flags · follow-ups)</summary>
              <div className="px-4 pb-4 space-y-5">
                <Section title="Steps">
                  <NumberedList items={current.question.answer.steps} />
                </Section>
                <Section title="Trade-offs">
                  <BulletList items={current.question.answer.tradeoffs} tone="neutral" />
                </Section>
                <Section title="Red flags">
                  <BulletList items={current.question.answer.redFlags} tone="warn" />
                </Section>
                <Section title="Follow-ups">
                  <BulletList items={current.question.answer.followUps} tone="accent" />
                </Section>
              </div>
            </details>

            <div className="border border-ink-700 bg-ink-900/30 p-5 mb-6">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-300 mb-3">Self-rubric — be honest</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <RubricToggle on={rubrics[idx].hitSummary}        onChange={v => setRubric('hitSummary', v)}        label="Hit the summary's core claim" />
                <RubricToggle on={rubrics[idx].mentionedTradeoff} onChange={v => setRubric('mentionedTradeoff', v)} label="Mentioned at least one trade-off" />
                <RubricToggle on={rubrics[idx].avoidedRedFlag}    onChange={v => setRubric('avoidedRedFlag', v)}    label="Avoided the listed red flags" />
                <RubricToggle on={rubrics[idx].answeredFollowUp}  onChange={v => setRubric('answeredFollowUp', v)}  label="Could answer at least one follow-up" />
              </div>
            </div>

            <button
              onClick={nextQuestion}
              className="inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
            >
              {idx + 1 >= queue.length ? 'Finish mock' : 'Next question'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
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

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3 text-ink-200 leading-relaxed text-sm">
          <span className="font-mono text-[11px] text-lime-accent shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
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
        <li key={i} className="flex gap-3 text-ink-200 leading-relaxed text-sm">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-2', dot)} />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  )
}

function RubricToggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn(
        'flex items-start gap-3 text-left p-3 border transition-colors',
        on ? 'border-lime-accent/60 bg-lime-accent/10' : 'border-ink-700 hover:border-ink-500'
      )}
    >
      <span className={cn(
        'w-4 h-4 border shrink-0 mt-0.5 flex items-center justify-center',
        on ? 'bg-lime-accent border-lime-accent' : 'border-ink-600'
      )}>
        {on && <span className="w-2 h-2 bg-ink-950" />}
      </span>
      <span className="text-ink-100 text-sm leading-tight">{label}</span>
    </button>
  )
}

function RubricChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 border',
      ok ? 'border-lime-accent/60 text-lime-accent bg-lime-accent/5' : 'border-ink-800 text-ink-500'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', ok ? 'bg-lime-accent' : 'bg-ink-700')} />
      {label}
    </span>
  )
}
