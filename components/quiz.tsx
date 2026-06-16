'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react'
import type { Quiz as QuizT } from '@/lib/types'

export function Quiz({ quiz }: { quiz: QuizT }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = quiz.questions[idx]
  const isCorrect = selected === q.correctIndex

  function pick(i: number) {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (i === q.correctIndex) setScore(s => s + 1)
  }

  function next() {
    if (idx + 1 >= quiz.questions.length) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function reset() {
    setIdx(0); setSelected(null); setRevealed(false); setScore(0); setDone(false)
  }

  if (done) {
    const pct = Math.round((score / quiz.questions.length) * 100)
    const tier = pct >= 80 ? 'Senior signal' : pct >= 60 ? 'Mid-level' : 'Foundations'
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
        <div className="font-mono text-[11px] tracking-[0.25em] text-lime-accent mb-4">QUIZ COMPLETE</div>
        <div className="font-serif text-6xl md:text-8xl text-ink-50 mb-4">{score}/{quiz.questions.length}</div>
        <div className="text-ink-300 text-lg mb-2">{pct}% — {tier}</div>
        <div className="text-ink-400 max-w-md mx-auto mb-8 leading-relaxed">
          {pct >= 80
            ? 'You can answer these in interviews with confidence. Move to the next module.'
            : pct >= 60
              ? 'Solid base. Re-read the missed sections, then come back.'
              : 'Re-read the module before continuing. The decisions matter more than the names.'}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-ink-700 hover:border-lime-accent/40 font-mono text-xs uppercase tracking-wider transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Try again
        </button>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-[11px] tracking-[0.2em] text-ink-400">QUESTION {idx + 1} / {quiz.questions.length}</span>
        <span className="font-mono text-[11px] tracking-[0.2em] text-lime-accent">SCORE {score}</span>
      </div>

      <div className="h-px bg-ink-800 mb-6 relative">
        <motion.div
          className="absolute top-0 left-0 h-px bg-lime-accent"
          initial={false}
          animate={{ width: `${((idx + (revealed ? 1 : 0)) / quiz.questions.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-serif text-2xl md:text-3xl text-ink-50 mb-8 leading-tight">{q.prompt}</h3>

          <ul className="space-y-3 mb-6">
            {q.choices.map((c, i) => {
              const isThis = selected === i
              const correct = revealed && i === q.correctIndex
              const wrong = revealed && isThis && i !== q.correctIndex
              return (
                <li key={i}>
                  <button
                    onClick={() => pick(i)}
                    disabled={revealed}
                    className={cn(
                      'w-full text-left p-4 border transition-all flex items-start gap-3 group',
                      !revealed && 'border-ink-700 hover:border-lime-accent/50 hover:bg-ink-800/40 cursor-pointer',
                      revealed && correct && 'border-lime-accent/60 bg-lime-accent/10',
                      revealed && wrong && 'border-amber-accent/60 bg-amber-accent/10',
                      revealed && !correct && !wrong && 'border-ink-800 opacity-50',
                    )}
                  >
                    <span className={cn(
                      'font-mono text-xs mt-1 px-1.5 py-0.5 border',
                      !revealed && 'border-ink-700 text-ink-400 group-hover:border-lime-accent/50 group-hover:text-lime-accent',
                      correct && 'border-lime-accent text-lime-accent',
                      wrong && 'border-amber-accent text-amber-accent',
                    )}>{String.fromCharCode(65 + i)}</span>
                    <span className="text-ink-100 leading-relaxed flex-1">{c}</span>
                    {correct && <CheckCircle2 className="w-5 h-5 text-lime-accent shrink-0 mt-0.5" />}
                    {wrong && <XCircle className="w-5 h-5 text-amber-accent shrink-0 mt-0.5" />}
                  </button>
                </li>
              )
            })}
          </ul>

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-l-2 border-lime-accent/40 bg-lime-accent/5 pl-5 py-3 pr-4 mb-6"
              >
                <div className="font-mono text-[10px] tracking-[0.25em] text-lime-accent mb-1.5">
                  {isCorrect ? 'CORRECT' : 'NOT QUITE'}
                </div>
                <p className="text-ink-100 leading-relaxed">{q.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {revealed && (
            <button
              onClick={next}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime-accent text-ink-950 hover:bg-lime-glow font-mono text-xs uppercase tracking-wider transition-colors"
            >
              {idx + 1 < quiz.questions.length ? 'Next' : 'See results'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
