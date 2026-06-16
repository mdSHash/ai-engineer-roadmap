'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InterviewExplorer } from '@/components/interview-explorer'
import { InterviewStudy } from '@/components/interview-study'
import { InterviewMock } from '@/components/interview-mock'
import { InterviewModeSwitcher, InterviewModeHelp, type InterviewMode } from '@/components/interview-mode-switcher'
import { interviewQuestions, interviewCategories } from '@/lib/content/interview-questions'
import { Eyebrow, FadeIn } from '@/components/section'

export default function InterviewPage() {
  const [mode, setMode] = useState<InterviewMode>('study')

  return (
    <section className="max-w-5xl mx-auto px-6 md:px-12 py-20 md:py-28">
      <FadeIn>
        <Eyebrow>Interview practice</Eyebrow>
        <h1 className="font-serif text-display-lg text-ink-50 mt-4 mb-6">
          {interviewQuestions.length} scenarios. <span className="text-lime-accent">Three ways to drill.</span>
        </h1>
        <p className="text-xl text-ink-300 leading-relaxed max-w-3xl mb-12 font-serif italic">
          Reading model answers does not survive the interview. Active recall does. Pick a mode below — Study trains memory with spaced repetition, Mock simulates the live conversation, Browse stays as a searchable reference.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <InterviewModeSwitcher value={mode} onChange={setMode} />
          <InterviewModeHelp mode={mode} />
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {mode === 'browse' && <InterviewExplorer questions={interviewQuestions} categories={interviewCategories} />}
            {mode === 'study'  && <InterviewStudy   questions={interviewQuestions} categories={interviewCategories} />}
            {mode === 'mock'   && <InterviewMock    questions={interviewQuestions} />}
          </motion.div>
        </AnimatePresence>
      </FadeIn>
    </section>
  )
}
