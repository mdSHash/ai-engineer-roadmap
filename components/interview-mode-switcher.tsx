'use client'

import { motion } from 'framer-motion'
import { Search, Brain, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

export type InterviewMode = 'browse' | 'study' | 'mock'

const MODES: { value: InterviewMode; label: string; help: string; icon: React.ReactNode }[] = [
  { value: 'study',  label: 'Study',  help: 'Active recall + spaced repetition',  icon: <Brain  className="w-4 h-4" /> },
  { value: 'mock',   label: 'Mock',   help: 'Timed mixed-domain interview',       icon: <Timer  className="w-4 h-4" /> },
  { value: 'browse', label: 'Browse', help: 'Searchable reference list',          icon: <Search className="w-4 h-4" /> },
]

export function InterviewModeSwitcher({ value, onChange }: { value: InterviewMode; onChange: (m: InterviewMode) => void }) {
  return (
    <div className="border border-ink-700 bg-ink-900/40 inline-flex flex-wrap relative">
      {MODES.map(m => {
        const active = m.value === value
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={cn(
              'relative flex items-center gap-2 px-5 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors border-r border-ink-700 last:border-r-0',
              active ? 'text-lime-accent' : 'text-ink-300 hover:text-ink-100'
            )}
          >
            {active && (
              <motion.span
                layoutId="mode-indicator"
                className="absolute inset-0 bg-lime-accent/10 border border-lime-accent/40"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function InterviewModeHelp({ mode }: { mode: InterviewMode }) {
  const help = MODES.find(m => m.value === mode)?.help
  return (
    <p className="font-mono text-[11px] uppercase tracking-wider text-ink-400">{help}</p>
  )
}
