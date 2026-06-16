'use client'

import { cn } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block font-mono text-[11px] tracking-[0.2em] uppercase text-lime-accent', className)}>
      {children}
    </span>
  )
}

export function Heading({ as: As = 'h2', children, className }: { as?: 'h1' | 'h2' | 'h3' | 'h4'; children: React.ReactNode; className?: string }) {
  const sizes = {
    h1: 'text-display-xl',
    h2: 'text-display-lg',
    h3: 'text-display-md',
    h4: 'text-2xl md:text-3xl',
  } as const
  return (
    <As className={cn('font-serif text-ink-50', sizes[As], className)}>
      {children}
    </As>
  )
}

export function Callout({ kind = 'insight', children }: { kind?: 'rule' | 'warn' | 'insight'; children: React.ReactNode }) {
  const tone = {
    rule:    { border: 'border-lime-accent/40',  bg: 'bg-lime-accent/5',  label: 'RULE',    color: 'text-lime-accent' },
    warn:    { border: 'border-amber-accent/40', bg: 'bg-amber-accent/5', label: 'WATCH',   color: 'text-amber-accent' },
    insight: { border: 'border-ink-600',         bg: 'bg-ink-800/40',     label: 'INSIGHT', color: 'text-ink-200' },
  }[kind]

  return (
    <div className={cn('not-prose my-6 border-l-2 pl-5 py-3 pr-4', tone.border, tone.bg)}>
      <div className={cn('font-mono text-[10px] tracking-[0.25em] mb-1.5', tone.color)}>{tone.label}</div>
      <div className="text-ink-100 leading-relaxed">{children}</div>
    </div>
  )
}

export function Matrix({ headers, rows, caption }: { headers: string[]; rows: string[][]; caption?: string }) {
  return (
    <div className="my-8 overflow-x-auto">
      {caption && <p className="font-mono text-xs text-ink-400 mb-3 uppercase tracking-wider">{caption}</p>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-ink-700">
            {headers.map((h, i) => (
              <th key={i} className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-400 py-3 px-4 first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-ink-800 hover:bg-ink-800/40 transition-colors">
              {r.map((c, j) => (
                <td key={j} className="py-3 px-4 first:pl-0 text-ink-200 align-top">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DecisionRule({ when, pick, why }: { when: string; pick: string; why: string }) {
  return (
    <div className="border border-ink-700 bg-ink-900/40 p-5 hover:border-lime-accent/40 transition-colors">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-1">When</div>
          <div className="text-ink-100 leading-relaxed">{when}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime-accent mb-1">Pick</div>
          <div className="text-ink-100 leading-relaxed font-medium">{pick}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-1">Why</div>
          <div className="text-ink-300 leading-relaxed">{why}</div>
        </div>
      </div>
    </div>
  )
}
