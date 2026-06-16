import { ModuleCard } from '@/components/module-card'
import { moduleList } from '@/lib/content/modules'
import { FadeIn, Eyebrow } from '@/components/section'

export const metadata = {
  title: 'Modules — AI Engineer Roadmap',
}

export default function ModulesIndex() {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
      <FadeIn>
        <Eyebrow>Curriculum</Eyebrow>
        <h1 className="font-serif text-display-lg text-ink-50 mt-4 mb-6">Eight modules.</h1>
        <p className="text-xl text-ink-300 leading-relaxed max-w-3xl mb-16 font-serif italic">
          Sequenced from foundational decisions to lifecycle thinking. Each ends with a quiz. The whole thing is interview-aligned, not academic.
        </p>
      </FadeIn>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleList.map((m, i) => (
          <ModuleCard key={m.slug} index={i} {...m} />
        ))}
      </div>
    </section>
  )
}
