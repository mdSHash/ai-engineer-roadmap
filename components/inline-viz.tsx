'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import type { VizSlug } from '@/lib/types'
import Link from 'next/link'
import { Maximize2 } from 'lucide-react'

// Visualizations are heavy; lazy-load them per-section so module pages stay light.
const ChunkingComparator   = dynamic(() => import('./viz/chunking-comparator').then(m => m.ChunkingComparator),     { ssr: false, loading: () => <Placeholder /> })
const RagPipelineFlow      = dynamic(() => import('./viz/rag-pipeline-flow').then(m => m.RagPipelineFlow),           { ssr: false, loading: () => <Placeholder /> })
const TokenCostCalculator  = dynamic(() => import('./viz/token-cost-calculator').then(m => m.TokenCostCalculator),   { ssr: false, loading: () => <Placeholder /> })

function Placeholder() {
  return (
    <div className="border border-ink-700 bg-ink-900/30 p-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400">
      Loading visualization…
    </div>
  )
}

export function InlineViz({ slug, caption }: { slug: VizSlug; caption?: string }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="not-prose my-10 -mx-2 md:-mx-4"
    >
      <div className="border border-ink-700 bg-ink-950/40 p-1">
        <div className="border border-ink-800 p-4 md:p-6 bg-ink-950/60 max-h-[1100px] overflow-auto">
          {slug === 'chunking-comparator'   && <ChunkingComparator />}
          {slug === 'rag-pipeline-flow'     && <RagPipelineFlow />}
          {slug === 'token-cost-calculator' && <TokenCostCalculator />}
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400">
          Interactive · {caption ?? 'try it'}
        </span>
        <Link
          href="/visualizations"
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 hover:text-lime-accent inline-flex items-center gap-1.5"
        >
          <Maximize2 className="w-3 h-3" /> Open full-screen
        </Link>
      </figcaption>
    </motion.figure>
  )
}
