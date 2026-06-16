import { FlashcardDeck } from '@/components/flashcard'
import { flashcards } from '@/lib/content/flashcards'
import { Eyebrow, FadeIn } from '@/components/section'

export const metadata = {
  title: 'Flashcards — AI Engineer Roadmap',
}

export default function FlashcardsPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 md:px-12 py-20 md:py-28">
      <FadeIn>
        <Eyebrow>Spaced practice</Eyebrow>
        <h1 className="font-serif text-display-lg text-ink-50 mt-4 mb-6">Flashcards.</h1>
        <p className="text-xl text-ink-300 leading-relaxed max-w-2xl mb-12 font-serif italic">
          The high-leverage facts you&apos;ll be asked. Click to flip. Shuffle when you&apos;re ready to test recall.
        </p>
      </FadeIn>
      <FadeIn delay={0.1}>
        <FlashcardDeck cards={flashcards} />
      </FadeIn>
    </section>
  )
}
