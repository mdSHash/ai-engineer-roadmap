'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, MessageSquare, Sparkles, FileText, History, Zap, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModelKey = 'haiku' | 'sonnet' | 'opus' | 'gpt41' | 'flash'

interface Model {
  key: ModelKey
  label: string
  inputPerM: number  // $ per 1M input tokens
  outputPerM: number // $ per 1M output tokens
}

const MODELS: Model[] = [
  { key: 'flash',  label: 'Gemini Flash',   inputPerM: 0.075, outputPerM: 0.30 },
  { key: 'haiku',  label: 'Haiku 4.5',      inputPerM: 1.00,  outputPerM: 5.00 },
  { key: 'gpt41',  label: 'GPT-4.1',        inputPerM: 2.00,  outputPerM: 8.00 },
  { key: 'sonnet', label: 'Sonnet 4.6',     inputPerM: 3.00,  outputPerM: 15.00 },
  { key: 'opus',   label: 'Opus 4.7',       inputPerM: 15.00, outputPerM: 75.00 },
]

interface Inputs {
  callsPerDay: number
  systemTokens: number
  fewShotTokens: number
  ragTopK: number
  ragChunkTokens: number
  historyTokens: number
  outputTokens: number
  model: ModelKey
  caching: boolean
  cascade: boolean
  escalationRate: number // 0..1
}

const DEFAULTS: Inputs = {
  callsPerDay: 10000,
  systemTokens: 2000,
  fewShotTokens: 1000,
  ragTopK: 5,
  ragChunkTokens: 500,
  historyTokens: 1500,
  outputTokens: 400,
  model: 'sonnet',
  caching: false,
  cascade: false,
  escalationRate: 0.15,
}

const SEGMENTS = [
  { key: 'system',  label: 'System',     color: 'bg-ink-500',         text: 'text-ink-300',     icon: FileText,      cacheable: true },
  { key: 'fewShot', label: 'Few-shot',   color: 'bg-ink-400',         text: 'text-ink-200',     icon: Sparkles,      cacheable: true },
  { key: 'rag',     label: 'RAG ctx',    color: 'bg-amber-accent/70', text: 'text-amber-accent',icon: Database,      cacheable: false },
  { key: 'history', label: 'History',    color: 'bg-amber-accent/40', text: 'text-amber-accent',icon: History,       cacheable: false },
  { key: 'output',  label: 'Output',     color: 'bg-lime-accent',     text: 'text-lime-accent', icon: MessageSquare, cacheable: false },
] as const

type Breakdown = Record<typeof SEGMENTS[number]['key'], { tokens: number; cost: number }>

function computeCost(i: Inputs) {
  const ragTokens = i.ragTopK * i.ragChunkTokens

  const inputBreakdown = {
    system:  i.systemTokens,
    fewShot: i.fewShotTokens,
    rag:     ragTokens,
    history: i.historyTokens,
  }

  const totalInput = inputBreakdown.system + inputBreakdown.fewShot + inputBreakdown.rag + inputBreakdown.history

  function priceFor(modelKey: ModelKey) {
    const m = MODELS.find(x => x.key === modelKey)!
    return { inP: m.inputPerM / 1_000_000, outP: m.outputPerM / 1_000_000 }
  }

  const primary = priceFor(i.model)
  const cheap = priceFor('haiku')

  // Cached tokens: system + fewShot at 10% cost when caching enabled
  function inputCost(prices: { inP: number; outP: number }, withCaching: boolean) {
    const cacheableTokens = inputBreakdown.system + inputBreakdown.fewShot
    const fullTokens = inputBreakdown.rag + inputBreakdown.history
    const cacheMultiplier = withCaching ? 0.1 : 1.0
    return cacheableTokens * prices.inP * cacheMultiplier + fullTokens * prices.inP
  }

  let perCallInput: number
  let perCallOutput: number

  if (i.cascade) {
    // cheap model handles all, primary handles escalationRate share
    const cheapCost = inputCost(cheap, i.caching) + i.outputTokens * cheap.outP
    const primaryCost = inputCost(primary, i.caching) + i.outputTokens * primary.outP
    perCallInput = cheapCost * (1 - i.escalationRate) + primaryCost * i.escalationRate
    perCallOutput = 0 // folded above
  } else {
    perCallInput = inputCost(primary, i.caching)
    perCallOutput = i.outputTokens * primary.outP
  }

  const perCall = perCallInput + perCallOutput

  // Segment-level cost (for breakdown bar) — use primary model for visualization clarity
  const breakdown: Breakdown = {
    system:  { tokens: inputBreakdown.system,  cost: inputBreakdown.system  * primary.inP * (i.caching ? 0.1 : 1) },
    fewShot: { tokens: inputBreakdown.fewShot, cost: inputBreakdown.fewShot * primary.inP * (i.caching ? 0.1 : 1) },
    rag:     { tokens: inputBreakdown.rag,     cost: inputBreakdown.rag     * primary.inP },
    history: { tokens: inputBreakdown.history, cost: inputBreakdown.history * primary.inP },
    output:  { tokens: i.outputTokens,         cost: i.outputTokens         * primary.outP },
  }

  const totalCost = Object.values(breakdown).reduce((s, b) => s + b.cost, 0)
  const totalTokens = totalInput + i.outputTokens

  const perMonth = perCall * i.callsPerDay * 30

  return { perCall, perMonth, breakdown, totalCost, totalTokens }
}

function fmtMoney(v: number) {
  if (v >= 1000) return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (v >= 1)    return '$' + v.toFixed(2)
  return '$' + v.toFixed(4)
}
function fmtCents(v: number) {
  const c = v * 100
  if (c >= 100) return '$' + (c / 100).toFixed(2)
  if (c >= 1)   return c.toFixed(2) + '¢'
  return c.toFixed(3) + '¢'
}

function NumField({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">{label}</span>
        <span className="font-mono text-xs text-ink-100 tabular-nums">
          {value.toLocaleString()}{suffix && <span className="text-ink-500 ml-0.5">{suffix}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-lime-accent h-1 bg-ink-800 rounded-none appearance-none cursor-pointer"
      />
    </label>
  )
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={cn(
        'w-full text-left p-3 border transition-all',
        on ? 'border-lime-accent/60 bg-lime-accent/5' : 'border-ink-700 bg-ink-900/40 hover:border-ink-600'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={cn('font-mono text-[11px] uppercase tracking-[0.2em]', on ? 'text-lime-accent' : 'text-ink-300')}>
            {label}
          </div>
          {hint && <div className="text-[11px] text-ink-500 mt-0.5">{hint}</div>}
        </div>
        <div className={cn('w-9 h-5 border flex items-center transition-colors', on ? 'border-lime-accent bg-lime-accent/20 justify-end' : 'border-ink-600 justify-start')}>
          <div className={cn('w-3 h-3 m-0.5', on ? 'bg-lime-accent' : 'bg-ink-500')} />
        </div>
      </div>
    </button>
  )
}

function Bar({ breakdown, totalCost, caching }: { breakdown: Breakdown; totalCost: number; caching: boolean }) {
  if (totalCost === 0) return null
  return (
    <div>
      <div className="flex h-10 w-full overflow-hidden border border-ink-700">
        {SEGMENTS.map(seg => {
          const b = breakdown[seg.key]
          const pct = (b.cost / totalCost) * 100
          if (pct < 0.01) return null
          const isCached = caching && seg.cacheable
          return (
            <motion.div
              layout
              key={seg.key}
              animate={{ width: pct + '%' }}
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
              className={cn('relative h-full', seg.color, isCached && 'opacity-60')}
              title={`${seg.label}: ${pct.toFixed(1)}% — ${fmtCents(b.cost)}`}
            >
              {isCached && (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(198,255,61,0.35)_4px,rgba(198,255,61,0.35)_5px)]" />
              )}
            </motion.div>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SEGMENTS.map(seg => {
          const b = breakdown[seg.key]
          const pct = totalCost > 0 ? (b.cost / totalCost) * 100 : 0
          const Icon = seg.icon
          return (
            <div key={seg.key} className="flex items-start gap-2 text-[11px]">
              <div className={cn('w-2.5 h-2.5 mt-0.5 shrink-0', seg.color)} />
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-ink-300 font-mono uppercase tracking-wider text-[10px]">
                  <Icon className="w-3 h-3" />{seg.label}
                </div>
                <div className="text-ink-100 font-mono tabular-nums">{pct.toFixed(0)}%</div>
                <div className="text-ink-500 font-mono text-[10px]">{b.tokens.toLocaleString()}t</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TokenCostCalculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS)
  const [compare, setCompare] = useState(false)

  const naive = useMemo(() => computeCost(inputs), [inputs])

  // Optimized variant: caching on, top-k cut to 2, model downgraded one tier
  const optimizedInputs: Inputs = useMemo(() => {
    const tier: ModelKey[] = ['flash', 'haiku', 'gpt41', 'sonnet', 'opus']
    const idx = tier.indexOf(inputs.model)
    const downgraded = tier[Math.max(0, idx - 1)]
    return {
      ...inputs,
      caching: true,
      cascade: true,
      escalationRate: 0.1,
      ragTopK: Math.max(2, Math.min(inputs.ragTopK, 2)),
      model: downgraded,
    }
  }, [inputs])
  const optimized = useMemo(() => computeCost(optimizedInputs), [optimizedInputs])

  const savings = naive.perMonth > 0 ? naive.perMonth / optimized.perMonth : 1

  function set<K extends keyof Inputs>(k: K, v: Inputs[K]) {
    setInputs(p => ({ ...p, [k]: v }))
  }

  return (
    <div className="border border-ink-700 bg-ink-900/40 p-5 md:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 pb-5 border-b border-ink-800">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime-accent mb-1.5">CALCULATOR</div>
          <h3 className="font-serif text-2xl md:text-3xl text-ink-50 leading-tight">Token Cost Calculator</h3>
          <p className="text-ink-400 text-sm mt-1">Where the tokens go — and what optimization actually buys you.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCompare(c => !c)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 border font-mono text-[11px] uppercase tracking-wider transition-colors',
              compare ? 'border-lime-accent/60 text-lime-accent bg-lime-accent/5' : 'border-ink-700 text-ink-300 hover:border-ink-600'
            )}
          >
            <Zap className="w-3.5 h-3.5" /> {compare ? 'Hide' : 'Show'} optimized
          </button>
          <button
            onClick={() => setInputs(DEFAULTS)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-ink-700 hover:border-ink-600 font-mono text-[11px] uppercase tracking-wider text-ink-300"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-7">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-2">Model</div>
            <div className="grid grid-cols-2 gap-1.5">
              {MODELS.map(m => (
                <button
                  key={m.key}
                  onClick={() => set('model', m.key)}
                  className={cn(
                    'p-2 border text-left transition-colors',
                    inputs.model === m.key
                      ? 'border-lime-accent/60 bg-lime-accent/5'
                      : 'border-ink-700 hover:border-ink-600 bg-ink-900/40'
                  )}
                >
                  <div className={cn('font-mono text-[11px]', inputs.model === m.key ? 'text-lime-accent' : 'text-ink-200')}>
                    {m.label}
                  </div>
                  <div className="text-[10px] text-ink-500 font-mono tabular-nums mt-0.5">
                    ${m.inputPerM.toFixed(2)} / ${m.outputPerM.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <NumField label="Calls / day" value={inputs.callsPerDay} min={100} max={1_000_000} step={100} onChange={v => set('callsPerDay', v)} />
            <NumField label="System prompt" value={inputs.systemTokens} min={0} max={20000} step={100} onChange={v => set('systemTokens', v)} suffix="tok" />
            <NumField label="Few-shot examples" value={inputs.fewShotTokens} min={0} max={20000} step={100} onChange={v => set('fewShotTokens', v)} suffix="tok" />
            <div className="grid grid-cols-2 gap-3">
              <NumField label="RAG top-k" value={inputs.ragTopK} min={0} max={20} step={1} onChange={v => set('ragTopK', v)} />
              <NumField label="Chunk size" value={inputs.ragChunkTokens} min={0} max={2000} step={50} onChange={v => set('ragChunkTokens', v)} suffix="tok" />
            </div>
            <NumField label="Conversation history" value={inputs.historyTokens} min={0} max={20000} step={100} onChange={v => set('historyTokens', v)} suffix="tok" />
            <NumField label="Output / call" value={inputs.outputTokens} min={0} max={4000} step={50} onChange={v => set('outputTokens', v)} suffix="tok" />
          </div>

          <div className="space-y-2 pt-1">
            <Toggle on={inputs.caching} onChange={v => set('caching', v)} label="Prompt caching" hint="System + few-shot at 10% cost on hits" />
            <Toggle on={inputs.cascade} onChange={v => set('cascade', v)} label="Cascade routing" hint="Cheap model first, escalate hard cases" />
            {inputs.cascade && (
              <div className="pl-3 border-l border-lime-accent/30">
                <NumField
                  label="Escalation rate"
                  value={Math.round(inputs.escalationRate * 100)}
                  min={0} max={100} step={1}
                  onChange={v => set('escalationRate', v / 100)}
                  suffix="%"
                />
              </div>
            )}
          </div>
        </div>

        {/* Output panel */}
        <div className="space-y-6">
          {/* Naive */}
          <div className="border border-ink-700 bg-ink-950/60 p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-1">
                  {compare ? 'As configured' : 'Per-call breakdown'}
                </div>
                <div className="font-serif text-3xl text-ink-50 tabular-nums leading-none">
                  {fmtCents(naive.perCall)}
                  <span className="text-sm text-ink-500 font-sans ml-2">/ call</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 mb-1">Monthly</div>
                <div className="font-serif text-2xl text-ink-100 tabular-nums leading-none">{fmtMoney(naive.perMonth)}</div>
                <div className="text-[10px] text-ink-500 font-mono mt-1">{naive.totalTokens.toLocaleString()}t / call</div>
              </div>
            </div>
            <Bar breakdown={naive.breakdown} totalCost={naive.totalCost} caching={inputs.caching} />
            {inputs.caching && (
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-lime-accent/80">
                <div className="w-3 h-3 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(198,255,61,0.5)_2px,rgba(198,255,61,0.5)_3px)] border border-lime-accent/40" />
                hatched = cached at 10%
              </div>
            )}
          </div>

          {/* Optimized */}
          {compare && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border border-lime-accent/40 bg-lime-accent/5 p-5"
            >
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime-accent mb-1">
                    Optimized — caching + smaller k + cascade
                  </div>
                  <div className="font-serif text-3xl text-ink-50 tabular-nums leading-none">
                    {fmtCents(optimized.perCall)}
                    <span className="text-sm text-ink-500 font-sans ml-2">/ call</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-lime-accent mb-1">Monthly</div>
                  <div className="font-serif text-2xl text-lime-accent tabular-nums leading-none">{fmtMoney(optimized.perMonth)}</div>
                  <div className="text-[10px] text-ink-400 font-mono mt-1">
                    {savings.toFixed(1)}× cheaper · saves {fmtMoney(naive.perMonth - optimized.perMonth)}/mo
                  </div>
                </div>
              </div>
              <Bar breakdown={optimized.breakdown} totalCost={optimized.totalCost} caching={true} />
            </motion.div>
          )}

          <div className="text-[11px] text-ink-500 font-mono leading-relaxed">
            Pricing approximate, per 1M tokens. Caching modeled at 10% of cacheable input.
            Cascade assumes Haiku handles {Math.round((1 - inputs.escalationRate) * 100)}% of traffic when enabled.
          </div>
        </div>
      </div>
    </div>
  )
}
