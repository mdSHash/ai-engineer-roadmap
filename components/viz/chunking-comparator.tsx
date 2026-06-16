'use client'

import { useMemo, useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { FileText, Code2, MessagesSquare } from 'lucide-react'

// ----------------------------------------------------------------------------
// Sample documents — picked to expose strategy differences clearly.
// ----------------------------------------------------------------------------

type DocPreset = { id: string; label: string; icon: React.ElementType; text: string }

const DOCS: DocPreset[] = [
  {
    id: 'policy',
    label: 'Policy doc',
    icon: FileText,
    text: `# Remote Work Policy

## 1. Eligibility
All full-time employees who have completed their 90-day probationary period are eligible to request remote work arrangements. Eligibility is granted at the discretion of the direct manager and is subject to role suitability. Roles requiring on-site equipment are excluded.

## 2. Working Hours
Remote employees are expected to maintain core working hours from 10:00 to 16:00 in their assigned regional timezone. Outside core hours, schedules are flexible provided that deliverables and meeting commitments are honored. Time worked must still total 40 hours per week.

## 3. Equipment
The company provides a laptop, an external monitor, and a noise-cancelling headset. Office furniture, including a chair and desk, is reimbursable up to USD 800 per calendar year with manager approval and an itemized receipt.

## 4. Security
All remote work must occur over a company-managed VPN. Public Wi-Fi is prohibited for accessing internal systems. Devices must remain locked when unattended and disk encryption must be enabled at all times.`,
  },
  {
    id: 'code',
    label: 'Code + comments',
    icon: Code2,
    text: `// retrieval/embed.ts — embeds chunks for vector search.
// Uses a small bi-encoder; falls back to a larger model on retry.

import { openai } from './client'
import { chunkDocument } from './chunk'

/**
 * Embed a corpus of documents and return rows ready to upsert.
 * Throws on any failed batch — the caller decides retry policy.
 */
export async function embedCorpus(docs: Doc[]) {
  const rows: Row[] = []

  for (const doc of docs) {
    // Heuristic chunk size of 256 tokens with 10% overlap.
    const chunks = chunkDocument(doc.text, { size: 256, overlap: 0.1 })

    // Embed in batches to avoid rate limit headaches.
    const batches = batchOf(chunks, 50)
    for (const batch of batches) {
      const vectors = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(c => c.text),
      })
      vectors.data.forEach((v, i) =>
        rows.push({ docId: doc.id, idx: batch[i].idx, vec: v.embedding })
      )
    }
  }
  return rows
}`,
  },
  {
    id: 'chat',
    label: 'Conversational',
    icon: MessagesSquare,
    text: `Alex: Hey, did you get the design review notes from yesterday? I need to roll changes into the spec before Friday.
Sam: Yeah I have them. Three big asks. First, the onboarding flow needs a skip option for returning users — they want to A/B test it.
Alex: Skip option, got it. What about the empty state?
Sam: They liked the empty state but want a secondary CTA, something soft like "browse examples" rather than a hard "create new".
Alex: That's reasonable. And the third?
Sam: Pricing page. Marketing wants the comparison table above the fold on desktop, not below it. They think the scroll cost is hurting conversion.
Alex: I'll push back on that one. The hero copy is doing real work right now. We can test it but I don't want to ship blind.
Sam: Fair. I'll write up the AB test plan tonight and share it in the channel for review.
Alex: Thanks. One more thing — when's the next sync with the platform team?
Sam: Tuesday 2pm. They're going to walk us through the new auth boundaries.`,
  },
]

// ----------------------------------------------------------------------------
// Strategies — pure functions (text, size, overlap) -> chunks
// ----------------------------------------------------------------------------

type Chunk = { start: number; end: number; text: string }

// Approximate token count from word count. ~1.3 tokens per word is a fair proxy.
const tokenCount = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length * 1.3))

// Translate a desired token count to an approximate character count.
// Average English word ~5 chars + 1 space; ~1.3 tokens/word -> ~4.6 chars/token.
const tokensToChars = (tokens: number) => Math.round(tokens * 4.6)

// 1) Fixed-size: walk by character window with optional overlap.
function fixedSize(text: string, sizeTokens: number, overlapPct: number): Chunk[] {
  const window = tokensToChars(sizeTokens)
  const step = Math.max(1, Math.round(window * (1 - overlapPct)))
  const out: Chunk[] = []
  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(text.length, i + window)
    out.push({ start: i, end, text: text.slice(i, end) })
    if (end === text.length) break
  }
  return out
}

// 2) Recursive character split: try paragraph -> sentence -> word -> char,
//    accumulating into chunks as close as possible to the size target.
function recursiveSplit(text: string, sizeTokens: number, overlapPct: number): Chunk[] {
  const target = tokensToChars(sizeTokens)
  const overlapChars = Math.round(target * overlapPct)
  // Split into paragraphs first, then re-split anything still too big.
  const splitters = [/\n\n+/, /(?<=[.!?])\s+/, /\s+/]
  function recurse(segment: string, level: number): string[] {
    if (segment.length <= target || level >= splitters.length) return [segment]
    const parts = segment.split(splitters[level]).filter(Boolean)
    return parts.flatMap(p => recurse(p, level + 1))
  }
  const pieces = recurse(text, 0)

  const out: Chunk[] = []
  let buf = ''
  let bufStart = 0
  let cursor = 0
  for (const piece of pieces) {
    const pieceStart = text.indexOf(piece, cursor)
    if (pieceStart === -1) continue
    cursor = pieceStart + piece.length
    if (!buf) bufStart = pieceStart
    if ((buf + ' ' + piece).length > target && buf) {
      out.push({ start: bufStart, end: bufStart + buf.length, text: buf })
      // Start the next chunk with overlap from the tail of the last one.
      if (overlapChars > 0) {
        const tailStart = Math.max(bufStart, bufStart + buf.length - overlapChars)
        buf = text.slice(tailStart, pieceStart + piece.length)
        bufStart = tailStart
      } else {
        buf = piece
        bufStart = pieceStart
      }
    } else {
      buf = buf ? buf + ' ' + piece : piece
    }
  }
  if (buf) out.push({ start: bufStart, end: bufStart + buf.length, text: buf })
  return out
}

// 3) Sentence-based: pack whole sentences until size limit, then start new chunk.
function sentenceSplit(text: string, sizeTokens: number, overlapPct: number): Chunk[] {
  const target = tokensToChars(sizeTokens)
  // Match sentence with trailing whitespace so we keep offsets aligned.
  const sentenceRe = /[^.!?\n]+[.!?]+|\S[^.!?\n]*$/g
  const sentences: { start: number; end: number; text: string }[] = []
  let m
  while ((m = sentenceRe.exec(text))) {
    sentences.push({ start: m.index, end: m.index + m[0].length, text: m[0] })
  }
  const out: Chunk[] = []
  let buf: typeof sentences = []
  let bufLen = 0
  const flush = () => {
    if (!buf.length) return
    const start = buf[0].start
    const end = buf[buf.length - 1].end
    out.push({ start, end, text: text.slice(start, end) })
    if (overlapPct > 0 && buf.length > 1) {
      // Keep last sentence as overlap seed for the next chunk.
      buf = [buf[buf.length - 1]]
      bufLen = buf[0].text.length
    } else {
      buf = []
      bufLen = 0
    }
  }
  for (const s of sentences) {
    if (bufLen + s.text.length > target && buf.length) flush()
    buf.push(s)
    bufLen += s.text.length
  }
  flush()
  return out
}

// 4) Structural: split on paragraph / heading boundaries; oversized blocks get
//    flushed alone. Ignores the size slider for boundaries — only for merging.
function structuralSplit(text: string, sizeTokens: number): Chunk[] {
  const target = tokensToChars(sizeTokens)
  const blocks: { start: number; end: number; text: string }[] = []
  const re = /[^\n]+(?:\n(?!\n)[^\n]+)*/g
  let m
  while ((m = re.exec(text))) {
    blocks.push({ start: m.index, end: m.index + m[0].length, text: m[0] })
  }
  const out: Chunk[] = []
  let buf: typeof blocks = []
  let bufLen = 0
  const flush = () => {
    if (!buf.length) return
    const start = buf[0].start
    const end = buf[buf.length - 1].end
    out.push({ start, end, text: text.slice(start, end) })
    buf = []
    bufLen = 0
  }
  for (const b of blocks) {
    // Headings always start a fresh chunk.
    const isHeading = /^#{1,6}\s/.test(b.text) || /^\/\//.test(b.text)
    if (isHeading && buf.length) flush()
    if (bufLen + b.text.length > target && buf.length) flush()
    buf.push(b)
    bufLen += b.text.length + 2
    if (isHeading && b.text.length > target * 0.6) flush()
  }
  flush()
  return out
}

// ----------------------------------------------------------------------------
// Strategy registry
// ----------------------------------------------------------------------------

type StrategyId = 'fixed' | 'recursive' | 'sentence' | 'structural'

const STRATEGIES: { id: StrategyId; label: string; blurb: string; honors: { overlap: boolean } }[] = [
  { id: 'fixed',      label: 'Fixed-size window', blurb: 'Walks N tokens at a time, ignoring boundaries.',           honors: { overlap: true  } },
  { id: 'recursive',  label: 'Recursive split',   blurb: 'Tries paragraph → sentence → word, packs to target size.', honors: { overlap: true  } },
  { id: 'sentence',   label: 'Sentence-based',    blurb: 'Packs whole sentences until size limit.',                  honors: { overlap: true  } },
  { id: 'structural', label: 'Structural',        blurb: 'Splits on paragraph and heading boundaries.',              honors: { overlap: false } },
]

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

const SIZES: { value: number; label: string }[] = [
  { value: 32,  label: '32' },
  { value: 64,  label: '64' },
  { value: 128, label: '128' },
  { value: 256, label: '256' },
]

const OVERLAPS: { value: number; label: string }[] = [
  { value: 0.0, label: '0%' },
  { value: 0.1, label: '10%' },
  { value: 0.2, label: '20%' },
]

export function ChunkingComparator() {
  const [docId, setDocId] = useState(DOCS[0].id)
  const [size, setSize] = useState(128)
  const [overlap, setOverlap] = useState(0)
  // The first word of the hovered chunk; used to highlight aligned chunks across columns.
  const [hoverAnchor, setHoverAnchor] = useState<string | null>(null)

  const doc = DOCS.find(d => d.id === docId)!

  // Compute all four strategies. useMemo keeps this stable across re-renders.
  const strategyChunks = useMemo(() => {
    return {
      fixed:      fixedSize(doc.text, size, overlap),
      recursive:  recursiveSplit(doc.text, size, overlap),
      sentence:   sentenceSplit(doc.text, size, overlap),
      structural: structuralSplit(doc.text, size),
    } as Record<StrategyId, Chunk[]>
  }, [doc, size, overlap])

  // Pull the first non-trivial word from a chunk — this is the anchor we use
  // to find "the same content" across strategies.
  function anchorWord(chunk: Chunk): string {
    const m = chunk.text.trim().match(/[A-Za-z0-9]{3,}/)
    return m ? m[0].toLowerCase() : ''
  }

  function chunkContainsAnchor(chunk: Chunk, anchor: string): boolean {
    if (!anchor) return false
    return chunk.text.toLowerCase().includes(anchor)
  }

  return (
    <div className="border border-ink-700 bg-ink-900/30 p-5 md:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent mb-2">Interactive</div>
          <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight">Chunking Strategy Comparator</h3>
        </div>
        <p className="text-sm text-ink-400 max-w-sm">
          Same document, four splitters. Hover a chunk to trace its content across strategies.
        </p>
      </div>

      {/* Doc preset picker */}
      <div className="mb-5">
        <ControlLabel>Document</ControlLabel>
        <div className="flex flex-wrap gap-2">
          {DOCS.map(d => {
            const Icon = d.icon
            const active = d.id === docId
            return (
              <button
                key={d.id}
                onClick={() => setDocId(d.id)}
                className={cls(
                  'inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[11px] uppercase tracking-[0.2em] transition-colors',
                  active
                    ? 'border-lime-accent bg-lime-accent/10 text-lime-accent'
                    : 'border-ink-700 text-ink-300 hover:border-lime-accent/40 hover:text-ink-100'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {d.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Controls: size + overlap */}
      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        <div>
          <ControlLabel>
            <span>Chunk size</span>
            <span className="text-ink-300 normal-case tracking-normal">{size} tokens</span>
          </ControlLabel>
          <Segmented
            options={SIZES}
            value={size}
            onChange={setSize}
          />
        </div>
        <div>
          <ControlLabel>
            <span>Overlap</span>
            <span className="text-ink-300 normal-case tracking-normal">{Math.round(overlap * 100)}%</span>
          </ControlLabel>
          <Segmented
            options={OVERLAPS}
            value={overlap}
            onChange={setOverlap}
          />
        </div>
      </div>

      {/* Strategy grid */}
      <LayoutGroup>
        <div className="grid md:grid-cols-2 gap-4">
          {STRATEGIES.map(strat => {
            const chunks = strategyChunks[strat.id]
            const overlapHonored = strat.honors.overlap && overlap > 0
            return (
              <div
                key={strat.id}
                className="border border-ink-700 bg-ink-950/40 flex flex-col"
              >
                {/* Strategy header */}
                <div className="border-b border-ink-800 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-300">
                      {strat.label}
                    </div>
                    <div className="font-mono text-[10px] text-ink-500">
                      {chunks.length} chunks
                    </div>
                  </div>
                  <p className="text-[12px] text-ink-400 mt-1 leading-snug">{strat.blurb}</p>
                  {overlap > 0 && !strat.honors.overlap && (
                    <div className="mt-1.5 font-mono text-[10px] text-amber-accent/90">
                      overlap N/A — boundaries are content-defined
                    </div>
                  )}
                </div>

                {/* Chunk list */}
                <div className="p-1.5 max-h-[420px] overflow-y-auto">
                  {chunks.map((chunk, i) => {
                    const anchor = anchorWord(chunk)
                    const ownAnchor = hoverAnchor === anchor
                    const aligned = hoverAnchor !== null && chunkContainsAnchor(chunk, hoverAnchor)
                    return (
                      <motion.button
                        key={`${strat.id}-${i}-${chunk.start}`}
                        layout
                        layoutId={`${strat.id}-${i}`}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onMouseEnter={() => setHoverAnchor(anchor)}
                        onMouseLeave={() => setHoverAnchor(null)}
                        onFocus={() => setHoverAnchor(anchor)}
                        onBlur={() => setHoverAnchor(null)}
                        className={cls(
                          'w-full text-left block border-l-2 px-3 py-2 mb-0.5 transition-colors focus:outline-none',
                          'font-mono text-[11px] leading-relaxed',
                          // Alternating row tint to delineate chunks
                          i % 2 === 0 ? 'bg-ink-900/30' : 'bg-ink-800/20',
                          ownAnchor
                            ? 'border-lime-accent bg-lime-accent/10 text-ink-50'
                            : aligned
                              ? 'border-lime-accent/60 bg-lime-accent/[0.04] text-ink-100'
                              : 'border-ink-700 text-ink-300 hover:border-lime-accent/40 hover:text-ink-100'
                        )}
                      >
                        {/* Index + token count */}
                        <div className="flex items-baseline justify-between mb-1 text-[10px] tracking-[0.2em] uppercase">
                          <span className={cls(
                            'text-ink-500',
                            ownAnchor && 'text-lime-accent',
                            aligned && !ownAnchor && 'text-lime-accent/80'
                          )}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-ink-500">
                            ~{tokenCount(chunk.text)} tok
                          </span>
                        </div>

                        {/* Chunk content with optional overlap shading at the head.
                            Only shown when the strategy honors overlap and i > 0. */}
                        <div className="whitespace-pre-wrap break-words text-ink-200">
                          {overlapHonored && i > 0 ? (
                            <OverlapText text={chunk.text} overlap={overlap} />
                          ) : (
                            <span>{chunk.text}</span>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </LayoutGroup>

      {/* Footnote / legend */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 border-l-2 border-lime-accent bg-lime-accent/10" />
          hovered chunk
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 border-l-2 border-lime-accent/60 bg-lime-accent/[0.04]" />
          aligned content
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 bg-amber-accent/30" />
          overlap region
        </span>
        <span className="ml-auto text-ink-600 normal-case tracking-normal text-[11px]">
          token estimate = words × 1.3
        </span>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-2 font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400">
      {children}
    </div>
  )
}

// A small radio-style segmented control built on real <button>s for keyboard access.
function Segmented<T extends number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" className="inline-flex border border-ink-700">
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cls(
              'px-3 py-1.5 font-mono text-[11px] tracking-[0.15em] uppercase border-r border-ink-700 last:border-r-0 transition-colors',
              active
                ? 'bg-lime-accent text-ink-950'
                : 'bg-ink-950/40 text-ink-300 hover:bg-ink-800/40 hover:text-ink-100'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// Renders chunk text with the leading overlap region tinted to show what was
// carried over from the previous chunk. Approximate but communicates the idea.
function OverlapText({ text, overlap }: { text: string; overlap: number }) {
  const overlapLen = Math.min(text.length, Math.round(text.length * overlap))
  if (overlapLen <= 0) return <span>{text}</span>
  // Snap to a word boundary so we don't paint mid-word.
  let cut = overlapLen
  while (cut < text.length && cut > 0 && /\S/.test(text[cut])) cut++
  return (
    <>
      <span className="bg-amber-accent/25 text-ink-100 px-0.5">{text.slice(0, cut)}</span>
      <span>{text.slice(cut)}</span>
    </>
  )
}

// Tiny class joiner — avoids importing clsx for one helper.
function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
