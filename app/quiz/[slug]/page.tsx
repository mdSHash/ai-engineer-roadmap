import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Quiz } from '@/components/quiz'
import { quizzes } from '@/lib/content/quizzes'
import { modules } from '@/lib/content/modules'
import type { ModuleSlug } from '@/lib/types'
import { Eyebrow } from '@/components/section'
import { ChevronLeft } from 'lucide-react'

export function generateStaticParams() {
  return quizzes.map(q => ({ slug: q.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const q = quizzes.find(qz => qz.slug === params.slug)
  return q ? { title: `Quiz · ${q.title} — AI Engineer Roadmap` } : {}
}

export default function QuizPage({ params }: { params: { slug: string } }) {
  const quiz = quizzes.find(q => q.slug === params.slug)
  if (!quiz) notFound()
  const mod = modules[params.slug as ModuleSlug]
  return (
    <section className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <Link href={`/modules/${quiz.slug}`} className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-400 hover:text-lime-accent mb-8">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to module
      </Link>
      <Eyebrow>Quiz · Module {mod?.number}</Eyebrow>
      <h1 className="font-serif text-display-md text-ink-50 mt-4 mb-12">{quiz.title}</h1>
      <Quiz quiz={quiz} />
    </section>
  )
}
