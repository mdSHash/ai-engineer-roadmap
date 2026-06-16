'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Flashcard as FC } from '@/lib/types'
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from 'lucide-react'

export function FlashcardDeck({ cards }: { cards: FC[] }) {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [filter, setFilter] = useState<string>('All')

  const categories = useMemo(() => ['All', ...Array.from(new Set(cards.map(c => c.category)))], [cards])

  const filtered = useMemo(
    () => order.filter(i => filter === 'All' || cards[i].category === filter),
    [order, filter, cards]
  )

  const card = cards[filtered[idx % filtered.length]]

  function shuffle() {
    const a = [...order]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    setOrder(a)
    setIdx(0)
    setFlipped(false)
  }

  function next() { setFlipped(false); setIdx(i => (i + 1) % filtered.length) }
  function prev() { setFlipped(false); setIdx(i => (i - 1 + filtered.length) % filtered.length) }

  function setFilterAndReset(c: string) {
    setFilter(c); setIdx(0); setFlipped(false)
  }

  if (filtered.length === 0) return <p className="text-ink-400">No cards in this category.</p>

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilterAndReset(c)}
            className={`font-mono text-[11px] tracking-wider uppercase px-3 py-1.5 border transition-colors ${
              filter === c
                ? 'border-lime-accent text-lime-accent bg-lime-accent/10'
                : 'border-ink-700 text-ink-300 hover:border-ink-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 text-ink-400 font-mono text-xs">
        <span>{idx + 1} / {filtered.length}</span>
        <div className="flex gap-2">
          <button onClick={shuffle} title="Shuffle" className="p-1.5 border border-ink-700 hover:border-lime-accent/40">
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setIdx(0); setFlipped(false) }} title="Reset" className="p-1.5 border border-ink-700 hover:border-lime-accent/40">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative h-72 md:h-80 cursor-pointer perspective-1000"
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          className="relative w-full h-full preserve-3d"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="absolute inset-0 backface-hidden border border-ink-700 bg-ink-900/40 hover:border-lime-accent/40 transition-colors p-8 md:p-10 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="font-mono text-[10px] tracking-[0.25em] text-lime-accent">{card.category} · QUESTION</span>
            <p className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight">{card.front}</p>
            <span className="font-mono text-[10px] text-ink-500 self-end">click to flip</span>
          </div>
          <div
            className="absolute inset-0 backface-hidden border border-lime-accent/40 bg-lime-accent/[0.04] p-8 md:p-10 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="font-mono text-[10px] tracking-[0.25em] text-lime-accent">{card.category} · ANSWER</span>
            <p className="text-ink-100 text-lg md:text-xl leading-relaxed">{card.back}</p>
            <span className="font-mono text-[10px] text-ink-500 self-end">click to flip</span>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={prev} className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-lime-accent/40 font-mono text-xs uppercase tracking-wider">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button onClick={next} className="inline-flex items-center gap-2 px-4 py-2 border border-ink-700 hover:border-lime-accent/40 font-mono text-xs uppercase tracking-wider">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
