'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

interface ModuleCardProps {
  number: string
  title: string
  tagline: string
  duration: string
  level: string
  slug: string
  index: number
}

export function ModuleCard({ number, title, tagline, duration, level, slug, index }: ModuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link
        href={`/modules/${slug}`}
        className="group block border border-ink-800 hover:border-lime-accent/40 bg-ink-900/30 hover:bg-ink-800/40 transition-all duration-300 p-6 md:p-8 relative overflow-hidden h-full"
      >
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-lime-accent/0 group-hover:via-lime-accent/40 to-transparent transition-all duration-700" />

        <div className="flex items-start justify-between mb-6">
          <span className="font-mono text-xs text-ink-400 tracking-widest">
            {number}
          </span>
          <ArrowUpRight className="w-5 h-5 text-ink-500 group-hover:text-lime-accent group-hover:rotate-12 transition-all" />
        </div>

        <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight mb-3 group-hover:text-lime-accent transition-colors">
          {title}
        </h3>
        <p className="text-ink-300 mb-6 leading-relaxed">{tagline}</p>

        <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-wider text-ink-400">
          <span>{duration}</span>
          <span className="w-1 h-1 bg-ink-600 rounded-full" />
          <span>{level}</span>
        </div>
      </Link>
    </motion.div>
  )
}
