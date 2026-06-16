'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChunkingComparator } from '@/components/viz/chunking-comparator'
import { RagPipelineFlow } from '@/components/viz/rag-pipeline-flow'
import { TokenCostCalculator } from '@/components/viz/token-cost-calculator'
import { Eyebrow } from '@/components/section'
import { Layers, Workflow, Calculator, ArrowRight } from 'lucide-react'

type Viz = 'chunking' | 'pipeline' | 'cost'

const VIZ: { id: Viz; title: string; tagline: string; module: { slug: string; label: string }; icon: React.ReactNode }[] = [
  { id: 'chunking', title: 'Chunking strategies, side by side', tagline: 'Watch the same document split four different ways.', module: { slug: 'chunking', label: 'Chunking module' }, icon: <Layers className="w-5 h-5" /> },
  { id: 'pipeline', title: 'RAG pipeline flow',                tagline: 'Toggle stages and see latency, cost, quality move.',  module: { slug: 'rag', label: 'RAG module' },        icon: <Workflow className="w-5 h-5" /> },
  { id: 'cost',     title: 'Token cost calculator',            tagline: 'Where the bills hide. With and without optimization.', module: { slug: 'token-optimization', label: 'Token economics module' }, icon: <Calculator className="w-5 h-5" /> },
]

export default function VisualizationsPage() {
  const [active, setActive] = useState<Viz>('chunking')
  const meta = VIZ.find(v => v.id === active)!

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
      <Eyebrow>Visualizations</Eyebrow>
      <h1 className="font-serif text-display-lg text-ink-50 mt-4 mb-4">See it. Then read it.</h1>
      <p className="text-xl text-ink-300 leading-relaxed max-w-3xl mb-12 font-serif italic">
        Some concepts collapse into a five-second interaction. These do.
      </p>

      <div className="flex flex-wrap gap-2 mb-10 border-b border-ink-800 pb-4">
        {VIZ.map(v => {
          const isActive = v.id === active
          return (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              className={`relative font-mono text-[11px] uppercase tracking-wider px-4 py-2.5 transition-colors flex items-center gap-2 ${
                isActive ? 'text-lime-accent' : 'text-ink-300 hover:text-ink-100'
              }`}
            >
              {isActive && <motion.span layoutId="viz-tab" className="absolute inset-0 bg-lime-accent/10 border border-lime-accent/40" />}
              <span className="relative z-10 flex items-center gap-2">
                {v.icon}
                <span className="hidden sm:inline">{v.title}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-50">{meta.title}</h2>
          <p className="text-ink-400 leading-relaxed font-serif italic mt-1">{meta.tagline}</p>
        </div>
        <Link
          href={`/modules/${meta.module.slug}`}
          className="font-mono text-[11px] uppercase tracking-wider text-ink-300 hover:text-lime-accent inline-flex items-center gap-1.5"
        >
          Read the {meta.module.label} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {active === 'chunking' && <ChunkingComparator />}
          {active === 'pipeline' && <RagPipelineFlow />}
          {active === 'cost'     && <TokenCostCalculator />}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
