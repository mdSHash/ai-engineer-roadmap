import { InterviewExplorer } from '@/components/interview-explorer'
import { interviewQuestions, interviewCategories } from '@/lib/content/interview-questions'
import { Eyebrow, FadeIn } from '@/components/section'

export const metadata = {
  title: 'Interview Q&A Bank — AI Engineer Roadmap',
}

export default function InterviewPage() {
  return (
    <section className="max-w-5xl mx-auto px-6 md:px-12 py-20 md:py-28">
      <FadeIn>
        <Eyebrow>Scenario bank</Eyebrow>
        <h1 className="font-serif text-display-lg text-ink-50 mt-4 mb-6">{interviewQuestions.length} interview scenarios.</h1>
        <p className="text-xl text-ink-300 leading-relaxed max-w-3xl mb-12 font-serif italic">
          Real questions you&apos;ll face. Each comes with a model answer, the trade-offs to acknowledge, the red flags that mark a junior, and the follow-up probes the interviewer is likely to ask.
        </p>
      </FadeIn>
      <FadeIn delay={0.1}>
        <InterviewExplorer questions={interviewQuestions} categories={interviewCategories} />
      </FadeIn>
    </section>
  )
}
