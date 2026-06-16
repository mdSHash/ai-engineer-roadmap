'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DecisionTree as DT } from '@/lib/types'
import { ArrowRight, RotateCcw, ChevronLeft } from 'lucide-react'
import { useProgress } from '@/lib/use-progress'

interface Step { nodeId: string; pickedLabel?: string }

export function DecisionTreeRunner({ tree }: { tree: DT }) {
  const [path, setPath] = useState<Step[]>([{ nodeId: tree.rootId }])
  const current = tree.nodes[path[path.length - 1].nodeId]
  const { recordTreeCompleted } = useProgress()

  useEffect(() => {
    if (current && current.recommendation) recordTreeCompleted(tree.slug)
  }, [current, tree.slug, recordTreeCompleted])

  function pick(opt: { label: string; nextId: string }) {
    setPath(p => {
      const last = { ...p[p.length - 1], pickedLabel: opt.label }
      return [...p.slice(0, -1), last, { nodeId: opt.nextId }]
    })
  }

  function back() {
    if (path.length <= 1) return
    setPath(p => {
      const trimmed = p.slice(0, -1)
      return [...trimmed.slice(0, -1), { nodeId: trimmed[trimmed.length - 1].nodeId }]
    })
  }

  function reset() { setPath([{ nodeId: tree.rootId }]) }

  return (
    <div>
      {path.length > 1 && (
        <div className="mb-6 space-y-1.5">
          {path.slice(0, -1).map((s, i) => {
            const node = tree.nodes[s.nodeId]
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-ink-400">
                <span className="font-mono text-[10px] mt-1.5 text-ink-500">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <span className="text-ink-300">{node.question}</span>
                  <ArrowRight className="inline w-3 h-3 mx-1.5 text-lime-accent/60" />
                  <span className="text-lime-accent">{s.pickedLabel}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          {current.question && current.options ? (
            <div>
              <h3 className="font-serif text-2xl md:text-3xl text-ink-50 mb-6 leading-tight">{current.question}</h3>
              <ul className="space-y-3">
                {current.options.map((o, i) => (
                  <li key={i}>
                    <button
                      onClick={() => pick(o)}
                      className="w-full text-left p-5 border border-ink-700 hover:border-lime-accent/50 hover:bg-ink-800/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-ink-100 leading-relaxed mb-1">{o.label}</div>
                          {o.rationale && <div className="text-sm text-ink-400">{o.rationale}</div>}
                        </div>
                        <ArrowRight className="w-5 h-5 text-ink-500 group-hover:text-lime-accent group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="border border-lime-accent/40 bg-lime-accent/5 p-8">
              <div className="font-mono text-[10px] tracking-[0.25em] text-lime-accent mb-3">RECOMMENDATION</div>
              <h3 className="font-serif text-3xl md:text-4xl text-ink-50 mb-4 leading-tight">{current.recommendation}</h3>
              <p className="text-ink-200 leading-relaxed">{current.detail}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        <button
          onClick={back}
          disabled={path.length <= 1}
          className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-lime-accent/40 font-mono text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-lime-accent/40 font-mono text-xs uppercase tracking-wider"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restart
        </button>
      </div>
    </div>
  )
}
