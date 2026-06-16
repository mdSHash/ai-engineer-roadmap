import { notFound } from 'next/navigation'
import Link from 'next/link'
import { decisionTrees } from '@/lib/content/decision-trees'
import { DecisionTreeRunner } from '@/components/decision-tree'
import { Eyebrow } from '@/components/section'
import { ChevronLeft } from 'lucide-react'

export function generateStaticParams() {
  return decisionTrees.map(t => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const t = decisionTrees.find(x => x.slug === params.slug)
  return t ? { title: `${t.title} — Decision Tree` } : {}
}

export default function DecisionTreePage({ params }: { params: { slug: string } }) {
  const tree = decisionTrees.find(t => t.slug === params.slug)
  if (!tree) notFound()
  return (
    <section className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <Link href="/decision-trees" className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-400 hover:text-lime-accent mb-8">
        <ChevronLeft className="w-3.5 h-3.5" /> All trees
      </Link>
      <Eyebrow>Decision tree</Eyebrow>
      <h1 className="font-serif text-display-md text-ink-50 mt-4 mb-4">{tree.title}</h1>
      <p className="text-ink-300 leading-relaxed mb-12 font-serif italic">{tree.description}</p>
      <DecisionTreeRunner tree={tree} />
    </section>
  )
}
