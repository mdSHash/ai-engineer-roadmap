import Link from 'next/link'
import { ArrowRight, Brain, Compass, Layers, Target } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { moduleList } from '@/lib/content/modules'
import { interviewQuestions } from '@/lib/content/interview-questions'
import { flashcards } from '@/lib/content/flashcards'
import { decisionTrees } from '@/lib/content/decision-trees'
import { FadeIn, Eyebrow } from '@/components/section'

export default function Home() {
  return (
    <div>
      <section className="relative px-6 md:px-12 pt-20 md:pt-32 pb-20 md:pb-28 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <Eyebrow>For beginner to mid-level AI engineers</Eyebrow>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-display-xl text-ink-50 mt-6 mb-8 max-w-4xl">
              Stop learning <em className="text-lime-accent not-italic">syntax</em>.
              <br />
              Start learning <em className="text-lime-accent not-italic">decisions</em>.
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-xl md:text-2xl text-ink-300 leading-relaxed max-w-3xl mb-12 font-serif italic">
              Interviews don&apos;t ask you to write code anymore. They ask: when to RAG, which vector DB, how to chunk, how to find bottlenecks, how to ask AI for code in big projects. This is the playbook.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-wrap gap-4">
              <Link href="/modules" className="group inline-flex items-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow px-6 py-3.5 font-mono text-xs uppercase tracking-wider transition-colors">
                Start the curriculum <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/interview" className="inline-flex items-center gap-2 border border-ink-700 hover:border-lime-accent/40 text-ink-100 px-6 py-3.5 font-mono text-xs uppercase tracking-wider transition-colors">
                Jump to interview Q&A
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 border-t border-ink-800 pt-10">
              <Stat n={moduleList.length}             label="modules" />
              <Stat n={interviewQuestions.length}     label="interview scenarios" />
              <Stat n={flashcards.length}             label="flashcards" />
              <Stat n={decisionTrees.length}          label="decision trees" />
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 md:px-12 py-20 md:py-24 border-t border-ink-800">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <Eyebrow>The four pillars</Eyebrow>
            <h2 className="font-serif text-display-lg text-ink-50 mt-4 mb-12 max-w-3xl">What separates a junior from a senior signal in interviews.</h2>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-px bg-ink-800">
            <Pillar
              icon={<Brain />}
              title="Decisions, not defaults"
              body="Senior engineers pick from constraints. They name failure modes. They eliminate before naming a tool."
            />
            <Pillar
              icon={<Layers />}
              title="The full lifecycle"
              body="POC → Architecture → Build → Hardening → Deploy → Maintenance. Every gap is where launches break."
            />
            <Pillar
              icon={<Target />}
              title="Bottleneck investigation"
              body="Most production AI failures are process and retrieval, not models. Know what to check, in what order."
            />
            <Pillar
              icon={<Compass />}
              title="Trade-off fluency"
              body="Cost vs latency. Recall vs precision. Long-context vs RAG. Always volunteer the trade-off — that is the senior signal."
            />
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-20 md:py-24 border-t border-ink-800">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
              <div>
                <Eyebrow>Curriculum</Eyebrow>
                <h2 className="font-serif text-display-lg text-ink-50 mt-4">Eight modules. Every decision.</h2>
              </div>
              <Link href="/modules" className="font-mono text-xs uppercase tracking-wider text-ink-300 hover:text-lime-accent">All modules →</Link>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleList.slice(0, 6).map((m, i) => (
              <ModuleCard key={m.slug} index={i} {...m} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-20 md:py-24 border-t border-ink-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <FeatureCard
            href="/decision-trees"
            eyebrow="Interactive"
            title="Decision trees"
            body="Click through real scenarios. Get the senior recommendation with the reasoning."
          />
          <FeatureCard
            href="/flashcards"
            eyebrow="Spaced practice"
            title="Flashcards"
            body="42 high-leverage facts you'll be asked. Flip, shuffle, filter by topic."
          />
          <FeatureCard
            href="/interview"
            eyebrow="Scenario bank"
            title="46 interview scenarios"
            body="Real questions with model answers, trade-offs, red flags, and follow-up probes."
          />
        </div>
      </section>

      <section className="px-6 md:px-12 py-20 md:py-24 border-t border-ink-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          <FeatureCard
            href="/register"
            eyebrow="Track your progress"
            title="Sign up — it's free"
            body="Create an account to log every module, quiz score, flashcard, and decision tree you complete. Your progress only resets when you reset it."
          />
          <FeatureCard
            href="/leaderboard"
            eyebrow="Compete"
            title="Leaderboard"
            body="See how you stack up against everyone else working through the roadmap."
          />
        </div>
      </section>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-serif text-5xl md:text-6xl text-lime-accent leading-none">{n}</div>
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400 mt-2">{label}</div>
    </div>
  )
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-ink-950 p-8 md:p-10 hover:bg-ink-900/60 transition-colors">
      <div className="text-lime-accent mb-5 [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
      <h3 className="font-serif text-2xl text-ink-50 mb-3">{title}</h3>
      <p className="text-ink-300 leading-relaxed">{body}</p>
    </div>
  )
}

function FeatureCard({ href, eyebrow, title, body }: { href: string; eyebrow: string; title: string; body: string }) {
  return (
    <Link href={href} className="group block p-8 border border-ink-700 hover:border-lime-accent/40 bg-ink-900/30 hover:bg-ink-800/40 transition-all">
      <div className="font-mono text-[11px] tracking-[0.2em] text-lime-accent uppercase mb-4">{eyebrow}</div>
      <h3 className="font-serif text-2xl md:text-3xl text-ink-50 mb-3 group-hover:text-lime-accent transition-colors">{title}</h3>
      <p className="text-ink-300 leading-relaxed mb-6">{body}</p>
      <span className="font-mono text-xs uppercase tracking-wider text-ink-400 group-hover:text-lime-accent inline-flex items-center gap-1.5">
        Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  )
}
