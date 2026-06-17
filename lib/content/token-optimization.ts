import type { Module } from '../types'

export const tokenOptimizationModule: Module = {
  slug: 'token-optimization',
  number: '06',
  title: 'Token economics — getting the same quality for 10% the cost',
  tagline: 'Most production LLM bills are 5-10x what they should be. The fix is not "use a smaller model." It is hygiene.',
  duration: '40 min read',
  level: 'Intermediate',
  intro:
    'Token costs scale linearly with prompt size and inversely with caching discipline. A poorly-tuned RAG pipeline costs 10x what a well-tuned one does for indistinguishable quality. This module covers the hygiene that separates expensive prototypes from cheap production.',
  sections: [
    {
      heading: 'Where the tokens actually go',
      body: [
        'Before optimizing, audit. Most teams have no idea where their token spend goes. Run this exercise on any new project.',
      ],
      bullets: [
        'System prompt: re-sent on every call. If 2k tokens × 100k calls/day = 200M tokens/day, just on the system prompt.',
        'Few-shot examples: same — sent every call. 5 examples × 200 tokens = 1k tokens of pure repetition per call.',
        'RAG context: typically 2-4 chunks × 500 tokens = 1-2k tokens. Bloats with naive chunking.',
        'Conversation history: scales linearly with conversation length. 10-turn convos can be 5k+ tokens of history per call.',
        'Output: usually the cheapest. ~200-500 tokens per response unless asking for long generation.',
      ],
      callout: { kind: 'rule', text: 'Add token counters before optimization. You cannot fix what you cannot measure. Tokenizers are model-specific (tiktoken for OpenAI, anthropic-tokenizer for Claude).' },
    },
    {
      heading: 'Lever 1: Prompt caching (the single biggest win)',
      body: [
        'Most providers cache repeated prefix prompt tokens at 10% the cost of fresh tokens. Anthropic, OpenAI, and Google all support this. The discount applies to whatever stays the same across calls.',
        'How to use it: put the static parts (system prompt, few-shots, retrieved docs that do not change per turn) at the front, dynamic parts at the end. Mark a cache breakpoint at the boundary.',
        'What to cache: large system prompts (>1k tokens), document context in long-context Q&A, multi-turn conversations where the early turns repeat. Skip caching for sub-1k-token prompts.',
        'TTL: typically 5 minutes (Anthropic) to 1 hour with extended caching. Calls within the TTL hit cache; outside, you pay full price for the next miss.',
      ],
      callout: { kind: 'insight', text: 'Real-world impact: a chatbot with a 4k system prompt and 50k chat traffic/day saves ~$300/day on Claude Sonnet just from prompt caching. The change is a one-line marker.' },
      viz: { slug: 'token-cost-calculator', caption: 'flip the cache toggle and watch the bill' },
    },
    {
      heading: 'Lever 2: Pick the right model for the right task',
      body: [
        'Using the largest model for everything is the most expensive habit in production AI. Most workloads have steps that smaller models do equally well.',
      ],
      decisionRules: [
        { when: 'Classification / routing / triage',                  pick: 'Smallest fast model (Haiku, GPT-4.1 mini, Gemini Flash)', why: 'Tasks under 100 output tokens with clear output schema rarely need flagship reasoning.' },
        { when: 'RAG generation with retrieved context',              pick: 'Mid-tier (Sonnet, GPT-4.1, Gemini Pro)',                why: 'Quality matters but the model is doing extraction + light synthesis, not novel reasoning.' },
        { when: 'Multi-step planning / agentic workflows',            pick: 'Flagship (Opus, GPT-5)',                                  why: 'Reasoning errors compound across steps. Pay once for the better model rather than 10x debugging cheap-model errors.' },
        { when: 'Code generation in large repos',                     pick: 'Flagship reasoning model',                               why: 'Cheaper models hallucinate APIs at high rates; the time cost of fixing > the inference savings.' },
        { when: 'Bulk summarization / extraction at scale',           pick: 'Smallest model that hits quality bar',                  why: 'Volume matters more than top-end quality. Eval on a sample, pick smallest that passes.' },
      ],
    },
    {
      heading: 'Lever 3: Routing and cascades',
      body: [
        'Send 80% of easy queries to a cheap model and route only the hard 20% to the expensive one. Two patterns:',
        'Pre-routing: a cheap classifier decides which model to use based on query features (length, complexity, intent). Saves cost upfront but adds latency and a failure mode.',
        'Cascading: try the cheap model first; if it returns "I don\'t know" or low confidence, escalate to the expensive one. Only the hard cases pay the expensive price.',
        'Tradeoff: cascades add latency on the hard path. If your p95 budget is tight, prefer pre-routing.',
      ],
    },
    {
      heading: 'Lever 4: RAG token hygiene',
      body: [
        'RAG context is where token spend compounds. Three fixes worth memorizing:',
      ],
      bullets: [
        'Reduce top-k. Top-10 chunks of 800 tokens = 8k context. Top-3 with re-ranking often matches quality at 30% the cost.',
        'Compress chunks before sending. LongLLMLingua and similar token-compression techniques cut prompt size 2-4x with <5% quality loss.',
        'Cache static retrievals. If 50% of queries hit the same 100 chunks, cache them at the prompt level.',
        'Drop retrieval entirely for direct queries. If a classifier says "this is a calculation, not a knowledge question," skip RAG and call a tool.',
      ],
    },
    {
      heading: 'Lever 5: Conversation history truncation',
      body: [
        'Multi-turn chat costs scale with cumulative history. Senior engineers do not just truncate to the last N turns — they summarize older turns.',
        'Pattern: keep the last 3-5 turns verbatim, summarize the rest into a compact "what happened so far" block. The summary is regenerated periodically (every N turns) to keep it fresh.',
        'Cost: one cheap-model call per N turns to maintain the summary. Saves 5-10x in long sessions.',
      ],
    },
    {
      heading: 'Lever 6: Output token discipline',
      body: [
        'Output tokens are usually 5x more expensive than input tokens. Two cheap fixes:',
      ],
      bullets: [
        'Set max_tokens aggressively. If you only ever expect ~200 tokens, cap at 300. A runaway generation can burn $0.50 in one call.',
        'Use structured output (JSON schema, tool calling). Forces the model to be terse and removes filler text like "Sure, here is your answer:". 20-40% output savings.',
        'Stop sequences. End generation when the model emits a delimiter you control. Useful for streaming chunks where natural completion is unclear.',
      ],
    },
    {
      heading: 'Lever 7: Embedding model choice',
      body: [
        'Embedding cost is often invisible because it is amortized across many queries. But for large corpora it dominates.',
        'OpenAI text-embedding-3-small at $0.02/1M tokens vs text-embedding-3-large at $0.13/1M = 6.5x cost for ~3-5% quality lift on most tasks.',
        'Open-source embedders (bge-large, e5-mistral, jina-v3) are free at inference if you self-host. Worth it for high-volume use cases past ~100M chunks/year.',
      ],
    },
    {
      heading: 'Lever 8: Batch inference where possible',
      body: [
        'Batch APIs (Anthropic Message Batches, OpenAI Batch API) run async with a 24-hour SLA at 50% the price. For non-realtime workloads, this is a 2x cost reduction with one config change.',
        'Use cases: nightly evaluation runs, bulk re-indexing, offline content generation, weekly digest emails.',
      ],
    },
    {
      heading: 'When NOT to optimize tokens',
      body: [
        'Premature optimization burns engineering time on small bills. Three signals that token cost is not your problem yet:',
      ],
      bullets: [
        'Total LLM bill < 10% of total infra spend. Your engineers cost more than your tokens.',
        'You do not have evaluation in place. Optimizing without quality measurement makes you faster and worse.',
        'You are still iterating on the system prompt. Lock the prompt before optimizing token cost — every prompt change can invalidate your work.',
      ],
      callout: { kind: 'warn', text: 'The cost optimization order: first measure, then evaluate, then cache, then route, then compress. Skipping steps usually means re-doing them.' },
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three frequently-missed signals.',
      ],
      bullets: [
        'Trap 1 — "I\'d use a smaller model." Senior answer: list specific levers (caching, routing, top-k reduction) before changing models.',
        'Trap 2 — Counting only inference cost. Embedding, vector storage, and re-indexing all add up. Senior answers itemize.',
        'Trap 3 — Optimizing without measurement. Always start with "I\'d add token telemetry first to know where the spend goes."',
      ],
    },
  ],
  keyTakeaways: [
    'Prompt caching is the largest single lever — 10% of the cost on cached tokens.',
    'Right-size the model per step. Cheap models for routing/classification, flagship for reasoning.',
    'RAG token bills can drop 50-70% from re-ranking + smaller top-k + chunk compression.',
    'Output tokens are 5x input cost — cap aggressively, use structured output.',
    'Optimize after measurement. Token telemetry is non-negotiable for production.',
  ],
  pitfalls: [
    'Sending 8k tokens of RAG context when 1.5k of re-ranked context performs identically.',
    'No prompt caching marker, paying full price for static system prompts.',
    'Using flagship models for trivial classification.',
    'Truncating conversation history without summarizing — losing context.',
    'Optimizing prompt size without first establishing eval. You may not notice the quality drop.',
  ],
  relatedSlugs: ['prompting-for-code', 'rag', 'evaluation'],
}
