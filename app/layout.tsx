import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/nav'

export const metadata: Metadata = {
  title: 'AI Engineer Roadmap — Decisions, not code',
  description: 'A learning platform for beginner to mid-level AI engineers. Master the decisions that matter: when to RAG, which vector DB, how to chunk, how to spot bottlenecks, and how to talk through it in interviews.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-ink-950 text-ink-100 min-h-screen relative">
        <div className="grain" aria-hidden />
        <div className="fixed inset-0 bg-grid-faint bg-[size:48px_48px] opacity-40 pointer-events-none" aria-hidden />
        <div className="relative z-10">
          <Nav />
          <main>{children}</main>
          <footer className="border-t border-ink-700 mt-32 py-12 px-6 md:px-12 text-ink-400 text-sm">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between">
              <p className="font-mono">AI Engineer Roadmap · built for interview-grade decision making.</p>
              <p className="font-mono">No code samples. Just <span className="text-lime-accent">judgement</span>.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
