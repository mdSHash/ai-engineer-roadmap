'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import type { InterviewQuestion } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAuth } from './auth-provider'
import { getAllProgress, type SrStatus } from '@/lib/interview-progress'

const ALL = 'All'

export function InterviewExplorer({ questions, categories }: { questions: InterviewQuestion[]; categories: readonly string[] }) {
  const [cat, setCat] = useState<string>(ALL)
  const [diff, setDiff] = useState<string>(ALL)
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const { user } = useAuth()
  const [statusMap, setStatusMap] = useState<Record<string, SrStatus>>({})
  useEffect(() => {
    if (!user) return setStatusMap({})
    const all = getAllProgress(user.id)
    const map: Record<string, SrStatus> = {}
    for (const [id, p] of Object.entries(all)) map[id] = p.status
    setStatusMap(map)
  }, [user, questions])

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (cat !== ALL && q.category !== cat) return false
      if (diff !== ALL && q.difficulty !== diff) return false
      if (query) {
        const Q = query.toLowerCase()
        return q.scenario.toLowerCase().includes(Q) || q.answer.summary.toLowerCase().includes(Q)
      }
      return true
    })
  }, [cat, diff, query, questions])

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search scenarios..."
            className="w-full pl-12 pr-4 py-3 bg-ink-900/40 border border-ink-700 focus:border-lime-accent/60 outline-none font-mono text-sm placeholder:text-ink-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[ALL, ...categories].map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors',
                cat === c ? 'border-lime-accent text-lime-accent bg-lime-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[ALL, 'Junior', 'Mid', 'Senior'].map(d => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={cn(
                'font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors',
                diff === d ? 'border-amber-accent text-amber-accent bg-amber-accent/10' : 'border-ink-700 text-ink-300 hover:border-ink-500'
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="font-mono text-[11px] text-ink-400 uppercase tracking-wider">
          {filtered.length} scenario{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.map((q, i) => (
          <motion.li
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03 }}
          >
            <button
              onClick={() => setOpenId(o => (o === q.id ? null : q.id))}
              className="w-full text-left p-5 border border-ink-700 hover:border-lime-accent/40 bg-ink-900/30 hover:bg-ink-800/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-lime-accent">{q.category}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-accent">{q.difficulty}</span>
                  {statusMap[q.id] && <StatusChip status={statusMap[q.id]} />}
                </div>
                <ChevronDown className={cn('w-4 h-4 text-ink-400 transition-transform shrink-0', openId === q.id && 'rotate-180')} />
              </div>
              <p className="text-ink-100 leading-relaxed">{q.scenario}</p>
            </button>

            <AnimatePresence>
              {openId === q.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-x border-b border-ink-700 bg-ink-950/40"
                >
                  <div className="p-5 md:p-8 space-y-6">
                    <AnswerSection label="Summary"     content={<p className="text-ink-100 leading-relaxed">{q.answer.summary}</p>} />
                    <AnswerSection label="How to walk through it" content={<NumberedList items={q.answer.steps} />} />
                    <AnswerSection label="Trade-offs to acknowledge" content={<BulletList items={q.answer.tradeoffs} tone="neutral" />} />
                    <AnswerSection label="Red flags / junior signals" content={<BulletList items={q.answer.redFlags} tone="warn" />} />
                    <AnswerSection label="Likely follow-up probes" content={<BulletList items={q.answer.followUps} tone="accent" />} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-ink-400 font-mono text-sm">No scenarios match your filters.</div>
      )}
    </div>
  )
}

function AnswerSection({ label, content }: { label: string; content: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-2">{label}</div>
      {content}
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

function StatusChip({ status }: { status: SrStatus }) {
  const tone = {
    new:      'border-ink-700 text-ink-400',
    learning: 'border-amber-accent/60 text-amber-accent',
    review:   'border-lime-accent/60 text-lime-accent',
    mastered: 'border-lime-accent text-lime-accent bg-lime-accent/10',
  }[status]
  const label = status === 'mastered' ? 'mastered' : status === 'review' ? 'review' : status === 'learning' ? 'learning' : 'new'
  return (
    <span className={cn('font-mono text-[9px] uppercase tracking-wider border px-1.5 py-0.5', tone)}>
      {label}
    </span>
  )
}
