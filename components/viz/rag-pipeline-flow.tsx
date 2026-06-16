'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Cpu, Database, Filter, Sparkles, MessageSquare, RefreshCw, Zap, X, Search } from 'lucide-react'

type StageId = 'query' | 'embed' | 'bm25' | 'fuse' | 'retrieve' | 'rerank' | 'generate' | 'answer'

interface StageDef {
  id: StageId
  label: string
  sub: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  branch?: 'top' | 'bottom'
}

const STAGES: Record<StageId, StageDef> = {
  query:    { id: 'query',    label: 'Query',     sub: 'user input',         detail: 'The raw natural-language question entering the pipeline. Tokenized but not yet vectorized — pure text.', icon: MessageSquare },
  embed:    { id: 'embed',    label: 'Embed',     sub: 'dense vector',       detail: 'Encoder model maps the query to a dense vector (e.g. 1536d). Same model used for indexed chunks ensures aligned space.', icon: Cpu },
  bm25:     { id: 'bm25',     label: 'BM25',      sub: 'sparse keyword',     detail: 'Classic lexical scoring runs in parallel. Catches exact-match terms, code identifiers, and rare proper nouns dense vectors miss.', icon: Search, branch: 'bottom' },
  fuse:     { id: 'fuse',     label: 'RRF Fuse',  sub: 'reciprocal rank',    detail: 'Reciprocal Rank Fusion merges the dense and sparse result lists into one ranked set without needing score calibration.', icon: Filter },
  retrieve: { id: 'retrieve', label: 'Retrieve',  sub: 'top-k from index',   detail: 'ANN search over the vector index returns the top-k nearest neighbors. Throughput scales with k; recall drops below k=20.', icon: Database },
  rerank:   { id: 'rerank',   label: 'Re-rank',   sub: 'cross-encoder',      detail: 'A cross-encoder scores each (query, chunk) pair jointly. Slower per item but dramatically improves precision at top-5.', icon: Filter },
  generate: { id: 'generate', label: 'Generate',  sub: 'LLM with context',   detail: 'The LLM receives the retrieved chunks as context and produces a grounded answer. Quality is bounded by retrieval.', icon: Sparkles },
  answer:   { id: 'answer',   label: 'Answer',    sub: 'final response',     detail: 'The grounded response returned to the user, ideally with citations pointing back to source chunks for verification.', icon: MessageSquare },
}

interface NodePos { x: number; y: number; w: number; h: number }
interface Edge { from: StageId; to: StageId; agentic?: boolean }

const NODE_W = 132
const NODE_H = 68
const VB_W = 1080
const VB_H = 360

function buildLayout(opts: { hybrid: boolean; rerank: boolean }) {
  const { hybrid, rerank } = opts
  const visible: StageId[] = ['query', 'embed']
  if (hybrid) visible.push('bm25', 'fuse')
  visible.push('retrieve')
  if (rerank) visible.push('rerank')
  visible.push('generate', 'answer')

  // X positions across columns
  const cols: Record<string, number> = {
    query: 60,
    embed: 220,
    bm25: 220,
    fuse: 380,
    retrieve: hybrid ? 540 : 400,
    rerank: hybrid ? 700 : 580,
    generate: hybrid ? (rerank ? 860 : 700) : (rerank ? 760 : 580),
    answer: hybrid ? (rerank ? 1000 : 860) : (rerank ? 920 : 760),
  }

  const midY = VB_H / 2
  const positions: Partial<Record<StageId, NodePos>> = {}
  for (const id of visible) {
    let y = midY - NODE_H / 2
    if (id === 'bm25') y = midY + 60
    if (id === 'embed' && hybrid) y = midY - 90
    positions[id] = { x: cols[id] - NODE_W / 2, y, w: NODE_W, h: NODE_H }
  }

  // Edges
  const edges: Edge[] = []
  edges.push({ from: 'query', to: 'embed' })
  if (hybrid) {
    edges.push({ from: 'query', to: 'bm25' })
    edges.push({ from: 'embed', to: 'fuse' })
    edges.push({ from: 'bm25', to: 'fuse' })
    edges.push({ from: 'fuse', to: 'retrieve' })
  } else {
    edges.push({ from: 'embed', to: 'retrieve' })
  }
  if (rerank) {
    edges.push({ from: 'retrieve', to: 'rerank' })
    edges.push({ from: 'rerank', to: 'generate' })
  } else {
    edges.push({ from: 'retrieve', to: 'generate' })
  }
  edges.push({ from: 'generate', to: 'answer' })

  return { visible, positions, edges }
}

function edgePath(a: NodePos, b: NodePos) {
  const x1 = a.x + a.w
  const y1 = a.y + a.h / 2
  const x2 = b.x
  const y2 = b.y + b.h / 2
  const dx = (x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

function agenticPath(gen: NodePos, ret: NodePos) {
  const x1 = gen.x + gen.w / 2
  const y1 = gen.y
  const x2 = ret.x + ret.w / 2
  const y2 = ret.y
  const apex = Math.min(y1, y2) - 110
  return `M ${x1} ${y1} C ${x1} ${apex}, ${x2} ${apex}, ${x2} ${y2}`
}

export function RagPipelineFlow() {
  const [hybrid, setHybrid] = useState(false)
  const [rerank, setRerank] = useState(true)
  const [agentic, setAgentic] = useState(false)
  const [topK, setTopK] = useState(20)
  const [chunkSize, setChunkSize] = useState(512)
  const [runId, setRunId] = useState(0)
  const [activeNode, setActiveNode] = useState<StageId | null>(null)
  const [hops, setHops] = useState(0)

  const layout = useMemo(() => buildLayout({ hybrid, rerank }), [hybrid, rerank])

  // Latency / cost stub math
  const metrics = useMemo(() => {
    let latency = 0
    let cost = 0
    latency += 30 // embed
    cost += 0.02
    if (hybrid) {
      latency += 25 // bm25 in parallel-ish, count fuse overhead
      cost += 0.005
    }
    latency += 50 + (topK / 10) * 15
    cost += 0.01 * (topK / 10)
    if (rerank) {
      latency += 150
      cost += 0.08
    }
    latency += 800
    cost += 0.6 * (chunkSize / 512)
    if (agentic) {
      latency += 500 * (hops || 1)
      cost += 0.5 * (hops || 1)
    }
    return {
      latency: Math.round(latency),
      cost: cost.toFixed(2),
      throughput: Math.round(1000 / (50 + (topK / 10) * 15)),
    }
  }, [hybrid, rerank, agentic, topK, chunkSize, hops])

  function runQuery() {
    setRunId(v => v + 1)
    setHops(agentic ? 2 : 0)
  }

  // Auto-run once on mount
  useEffect(() => {
    const t = setTimeout(() => setRunId(1), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="border border-ink-700 bg-ink-900/40 p-5 md:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent mb-2">Interactive · Pipeline</div>
          <h3 className="font-serif text-3xl md:text-4xl text-ink-50 leading-tight">RAG Pipeline Flow</h3>
          <p className="text-ink-400 text-sm mt-2 max-w-xl">
            Watch a query travel end-to-end. Toggle stages, slide retrieval params, and re-run to feel the latency / cost tradeoffs.
          </p>
        </div>
        <button
          onClick={runQuery}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-lime-accent text-ink-950 font-mono text-xs uppercase tracking-[0.2em] hover:bg-lime-glow transition-colors"
        >
          <Play className="w-3.5 h-3.5" /> Run query
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-5">
        {/* DIAGRAM */}
        <div className="relative border border-ink-800 bg-ink-950/60 overflow-hidden">
          <div
            className="relative w-full"
            style={{ aspectRatio: `${VB_W} / ${VB_H}`, minHeight: 280 }}
          >
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker id="rag-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#5a5a66" />
                </marker>
                <marker id="rag-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffb13d" />
                </marker>
                <linearGradient id="rag-edge" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#33333d" />
                  <stop offset="100%" stopColor="#5a5a66" />
                </linearGradient>
              </defs>

              {/* Edges */}
              <g>
                {layout.edges.map((e, i) => {
                  const a = layout.positions[e.from]
                  const b = layout.positions[e.to]
                  if (!a || !b) return null
                  const d = edgePath(a, b)
                  return (
                    <g key={`edge-${e.from}-${e.to}-${i}`}>
                      <motion.path
                        d={d}
                        stroke="url(#rag-edge)"
                        strokeWidth={1.5}
                        fill="none"
                        markerEnd="url(#rag-arrow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                      />
                    </g>
                  )
                })}

                {/* Agentic feedback edge */}
                {agentic && layout.positions.generate && layout.positions.retrieve && (
                  <motion.path
                    key="agentic-edge"
                    d={agenticPath(layout.positions.generate, layout.positions.retrieve)}
                    stroke="#ffb13d"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                    markerEnd="url(#rag-arrow-amber)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </g>

              {/* Animated traveling dots */}
              <g key={`dots-${runId}-${hybrid}-${rerank}-${agentic}`}>
                {layout.edges.map((e, i) => {
                  const a = layout.positions[e.from]
                  const b = layout.positions[e.to]
                  if (!a || !b) return null
                  const d = edgePath(a, b)
                  const baseDelay = i * 0.45
                  return (
                    <g key={`dot-${i}`}>
                      {[0, 0.18, 0.36].map((stagger, j) => (
                        <motion.circle
                          key={`dot-${i}-${j}`}
                          r={3}
                          fill="#c6ff3d"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 1, 0] }}
                          transition={{
                            duration: 1.1,
                            delay: baseDelay + stagger,
                            repeat: Infinity,
                            repeatDelay: 2.4,
                            ease: 'linear',
                          }}
                        >
                          <animateMotion
                            dur="1.1s"
                            begin={`${baseDelay + stagger}s;`}
                            repeatCount="indefinite"
                            path={d}
                            keyPoints="0;1"
                            keyTimes="0;1"
                          />
                        </motion.circle>
                      ))}
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* HTML node overlay */}
            <AnimatePresence>
              {layout.visible.map(id => {
                const pos = layout.positions[id]
                const def = STAGES[id]
                if (!pos) return null
                const Icon = def.icon
                const isAccent = id === 'bm25' || id === 'fuse'
                return (
                  <motion.button
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={() => setActiveNode(activeNode === id ? null : id)}
                    className={`absolute group focus-visible:outline-none ${
                      activeNode === id ? 'z-20' : 'z-10'
                    }`}
                    style={{
                      left: `${(pos.x / VB_W) * 100}%`,
                      top: `${(pos.y / VB_H) * 100}%`,
                      width: `${(pos.w / VB_W) * 100}%`,
                      height: `${(pos.h / VB_H) * 100}%`,
                    }}
                  >
                    <div
                      className={`w-full h-full rounded-md border bg-ink-900/90 backdrop-blur px-2 py-1.5 flex flex-col justify-center text-left transition-all ${
                        activeNode === id
                          ? 'border-lime-accent bg-ink-800/90 shadow-[0_0_0_3px_rgba(198,255,61,0.15)]'
                          : isAccent
                            ? 'border-amber-accent/60 hover:border-amber-accent'
                            : 'border-lime-accent/40 hover:border-lime-accent'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className={`w-3 h-3 ${isAccent ? 'text-amber-accent' : 'text-lime-accent'}`} />
                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-300 truncate">
                          {def.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-500 font-mono truncate">{def.sub}</div>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>

            {/* Tooltip / detail panel */}
            <AnimatePresence>
              {activeNode && (
                <motion.div
                  key={activeNode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-3 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-md z-30 border border-lime-accent/50 bg-ink-950/95 p-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-lime-accent">
                      {STAGES[activeNode].label}
                    </div>
                    <button
                      onClick={() => setActiveNode(null)}
                      className="text-ink-400 hover:text-ink-100 transition-colors"
                      aria-label="Close detail"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-ink-200 leading-relaxed">{STAGES[activeNode].detail}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* METRICS PANEL */}
        <div className="space-y-4">
          <div className="border border-ink-800 bg-ink-950/60 p-4">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-3">Run metrics</div>
            <div className="space-y-3">
              <Metric label="Latency" value={`${metrics.latency} ms`} icon={<Zap className="w-3 h-3" />} accent />
              <Metric label="Cost / query" value={`${metrics.cost} ¢`} />
              <Metric label="Throughput" value={`${metrics.throughput}/s`} />
              {agentic && <Metric label="Hops" value={String(hops || 1)} amber />}
            </div>
          </div>

          <div className="border border-ink-800 bg-ink-950/60 p-4">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-3">Toggles</div>
            <div className="space-y-2">
              <Toggle label="Hybrid (BM25 + dense)" on={hybrid} onChange={setHybrid} />
              <Toggle label="Re-ranking (cross-encoder)" on={rerank} onChange={setRerank} />
              <Toggle label="Agentic loop" on={agentic} onChange={setAgentic} amber />
            </div>
          </div>

          <div className="border border-ink-800 bg-ink-950/60 p-4">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-3">Params</div>
            <Slider label="top-k" value={topK} min={5} max={50} step={5} onChange={setTopK} unit="" />
            <Slider label="chunk size" value={chunkSize} min={256} max={1024} step={128} onChange={setChunkSize} unit="t" />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-5 flex items-center gap-2 text-[11px] text-ink-500 font-mono">
        <RefreshCw className="w-3 h-3" />
        <span>Click any node to inspect. Toggles update visible stages and budgets in real time.</span>
      </div>
    </div>
  )
}

function Metric({ label, value, icon, accent, amber }: { label: string; value: string; icon?: React.ReactNode; accent?: boolean; amber?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-ink-800/60 pb-2 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </div>
      <div
        className={`font-mono text-sm tabular-nums ${
          accent ? 'text-lime-accent' : amber ? 'text-amber-accent' : 'text-ink-100'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function Toggle({ label, on, onChange, amber }: { label: string; on: boolean; onChange: (v: boolean) => void; amber?: boolean }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="w-full flex items-center justify-between gap-3 group py-1.5"
      aria-pressed={on}
    >
      <span className="text-[11px] text-ink-200 leading-tight text-left group-hover:text-ink-50 transition-colors">
        {label}
      </span>
      <span
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors ${
          on
            ? amber
              ? 'border-amber-accent bg-amber-accent/30'
              : 'border-lime-accent bg-lime-accent/30'
            : 'border-ink-600 bg-ink-800'
        }`}
      >
        <motion.span
          className={`block h-2.5 w-2.5 rounded-full ${
            on ? (amber ? 'bg-amber-accent' : 'bg-lime-accent') : 'bg-ink-500'
          }`}
          animate={{ x: on ? 14 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </span>
    </button>
  )
}

function Slider({ label, value, min, max, step, onChange, unit }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="font-mono text-[10px] uppercase tracking-wider text-ink-400">{label}</label>
        <span className="font-mono text-xs text-lime-accent tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-ink-800 rounded-full appearance-none cursor-pointer accent-lime-accent"
        aria-label={label}
      />
    </div>
  )
}
