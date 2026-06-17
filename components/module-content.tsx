'use client'

import type { Module, Section } from '@/lib/types'
import { Callout, DecisionRule, FadeIn, Heading, Matrix } from './section'
import { InlineViz } from './inline-viz'
import Link from 'next/link'
import { ArrowRight, AlertTriangle, Sparkles } from 'lucide-react'

export function ModuleContent({ mod, next, prev }: { mod: Module; next?: Module; prev?: Module }) {
  return (
    <article className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20">
      <FadeIn>
        <div className="mb-12">
          <span className="font-mono text-[11px] tracking-[0.25em] text-lime-accent uppercase">Module {mod.number} · {mod.level}</span>
          <Heading as="h1" className="mt-4 mb-6">{mod.title}</Heading>
          <p className="text-xl md:text-2xl text-ink-300 leading-relaxed font-serif italic">{mod.tagline}</p>
          <div className="mt-6 flex items-center gap-4 text-[11px] font-mono uppercase tracking-wider text-ink-400">
            <span>{mod.duration}</span>
            <span className="w-1 h-1 bg-ink-600 rounded-full" />
            <Link href={`/quiz/${mod.slug}`} className="text-lime-accent hover:underline">Take the quiz →</Link>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="text-lg text-ink-200 leading-relaxed mb-16 first-letter:font-serif first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-lime-accent">
          {mod.intro}
        </p>
      </FadeIn>

      {mod.sections.map((s, i) => (
        <SectionBlock key={i} section={s} />
      ))}

      <FadeIn>
        <div className="mt-20 grid md:grid-cols-2 gap-6">
          <div className="border border-lime-accent/30 bg-lime-accent/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-lime-accent" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-lime-accent uppercase">Key takeaways</span>
            </div>
            <ul className="space-y-3">
              {mod.keyTakeaways.map((t, i) => (
                <li key={i} className="flex gap-3 text-ink-100 leading-relaxed">
                  <span className="font-mono text-[11px] text-lime-accent shrink-0 mt-1">{String(i + 1).padStart(2, '0')}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-amber-accent/30 bg-amber-accent/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-accent" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-amber-accent uppercase">Pitfalls</span>
            </div>
            <ul className="space-y-3">
              {mod.pitfalls.map((p, i) => (
                <li key={i} className="flex gap-3 text-ink-100 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-accent shrink-0 mt-2.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </FadeIn>

      <FadeIn>
        <div className="mt-16 grid md:grid-cols-3 gap-4">
          {prev ? (
            <Link href={`/modules/${prev.slug}`} className="group p-6 border border-ink-700 hover:border-lime-accent/40 bg-ink-900/30 transition-all flex items-center gap-3">
              <ArrowRight className="w-5 h-5 text-ink-400 group-hover:text-lime-accent rotate-180 group-hover:-translate-x-1 transition-all shrink-0" />
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-1">Previous · {prev.number}</div>
                <div className="font-serif text-base text-ink-200 truncate">{prev.title}</div>
              </div>
            </Link>
          ) : (
            <div className="hidden md:block" />
          )}
          <Link href={`/quiz/${mod.slug}`} className="group p-6 border border-lime-accent/30 bg-lime-accent/5 hover:border-lime-accent/60 transition-all flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime-accent mb-1">Test yourself</div>
              <div className="font-serif text-base text-ink-50">5-question quiz</div>
            </div>
            <ArrowRight className="w-5 h-5 text-lime-accent group-hover:translate-x-1 transition-all" />
          </Link>
          {next ? (
            <Link href={`/modules/${next.slug}`} className="group p-6 border border-ink-700 hover:border-lime-accent/40 bg-ink-900/30 transition-all flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-1">Up next · {next.number}</div>
                <div className="font-serif text-base text-ink-200 truncate">{next.title}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-ink-400 group-hover:text-lime-accent group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ) : (
            <div className="p-6 border border-ink-800 bg-ink-900/20 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-400">
              <Sparkles className="w-4 h-4 text-lime-accent" /> End of curriculum
            </div>
          )}
        </div>
      </FadeIn>
    </article>
  )
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <FadeIn>
      <section className="mb-16">
        <Heading as="h2" className="mb-6">{section.heading}</Heading>
        {section.body.map((p, i) => (
          <p key={i} className="text-ink-200 leading-[1.75] mb-4 text-[17px]">{p}</p>
        ))}
        {section.bullets && (
          <ul className="space-y-2.5 my-6">
            {section.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-ink-200 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-accent shrink-0 mt-2.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {section.callout && <Callout kind={section.callout.kind}>{section.callout.text}</Callout>}
        {section.matrix && <Matrix headers={section.matrix.headers} rows={section.matrix.rows} caption={section.matrix.caption} />}
        {section.decisionRules && (
          <div className="my-6 space-y-3">
            {section.decisionRules.map((r, i) => (
              <DecisionRule key={i} when={r.when} pick={r.pick} why={r.why} />
            ))}
          </div>
        )}
        {section.viz && <InlineViz slug={section.viz.slug} caption={section.viz.caption} />}
      </section>
    </FadeIn>
  )
}
