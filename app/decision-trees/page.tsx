import Link from 'next/link'
import { decisionTrees } from '@/lib/content/decision-trees'
import { Eyebrow, FadeIn } from '@/components/section'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Decision Trees — AI Engineer Roadmap',
}

export default function DecisionTreesPage() {
  return (
    <section className="max-w-5xl mx-auto px-6 md:px-12 py-20 md:py-28">
      <FadeIn>
        <Eyebrow>Interactive</Eyebrow>
        <h1 className="font-serif text-display-lg text-ink-50 mt-4 mb-6">Decision trees.</h1>
        <p className="text-xl text-ink-300 leading-relaxed max-w-3xl mb-16 font-serif italic">
          Click through real scenarios. Each branch ends in a senior recommendation with the reasoning. Designed to mirror how an experienced engineer thinks out loud in interviews.
        </p>
      </FadeIn>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decisionTrees.map((t, i) => (
          <FadeIn key={t.slug} delay={i * 0.05}>
            <Link href={`/decision-trees/${t.slug}`} className="group block p-7 border border-ink-700 hover:border-lime-accent/40 bg-ink-900/30 hover:bg-ink-800/40 transition-all h-full">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime-accent mb-4">Tree {String(i + 1).padStart(2, '0')}</div>
              <h2 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-3 group-hover:text-lime-accent transition-colors">{t.title}</h2>
              <p className="text-ink-300 leading-relaxed mb-6">{t.description}</p>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink-400 group-hover:text-lime-accent">
                Run it <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
