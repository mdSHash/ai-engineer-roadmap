import type { Module } from '../types'

export const bottlenecksModule: Module = {
  slug: 'bottlenecks',
  number: '06',
  title: 'Finding bottlenecks in projects (new or familiar)',
  tagline: 'You join a project. It is slow, expensive, or unreliable. Your first three days decide everything.',
  duration: '40 min read',
  level: 'Intermediate',
  intro:
    'Every AI engineer faces this: walk into a system you did not build, and within a week, identify why it is slow, expensive, or wrong. The skill is not technical — it is investigative. This module is the framework for systematic bottleneck identification, applied to AI systems specifically.',
  sections: [
    {
      heading: 'The four bottleneck types in AI systems',
      body: [
        'Most AI bottlenecks fall into one of four buckets. Identifying which kind you have narrows the search space dramatically.',
      ],
      matrix: {
        caption: 'Type, symptoms, where to look first',
        headers: ['Bottleneck type', 'Symptom', 'First place to investigate'],
        rows: [
          ['Latency',  'p95 > budget; users complain about waiting',  'Trace a single request end-to-end. Find the longest span.'],
          ['Cost',     'Bills outpacing usage growth',                'Token counter per call type. Look for outliers and repeated calls.'],
          ['Quality',  'Bad outputs, hallucinations, low CSAT',       'Eval set + sampled prod traces. Categorize failure modes.'],
          ['Reliability', 'Errors, timeouts, inconsistent answers',   'Provider error logs, retry patterns, rate limit hits.'],
        ],
      },
    },
    {
      heading: 'Day 1: read before you touch',
      body: [
        'When joining a project, fight the urge to immediately propose changes. Senior engineers read first.',
      ],
      bullets: [
        'Map the request path: where does a user query enter, what services does it hit, what calls the LLM, what writes back to the user?',
        'Find the eval suite. If there is none, that is finding #1 (most projects have no eval).',
        'Read the last 30 days of incidents/issues. Patterns surface — same component fails repeatedly.',
        'Read 10 sampled production traces. What does a "normal" request actually look like? Surprises here are usually the bottleneck.',
        'Identify the metrics already collected (token spend, latency, error rate per step). Gaps are tracking debt — note them.',
      ],
      callout: { kind: 'rule', text: 'Resist the urge to suggest fixes in week 1. Spend that week understanding what "broken" actually means in this codebase. Confident fixes from a new joiner that miss context erode trust fast.' },
    },
    {
      heading: 'Latency bottlenecks: the trace-driven approach',
      body: [
        'Latency problems live in spans. You need a request-level trace to find them. If there are no traces, instrumenting one path is the highest-leverage first move.',
      ],
      bullets: [
        'Tools: LangSmith, LangFuse, OpenTelemetry-based traces, Helicone, Phoenix.',
        'Look for: the LLM call (often 70% of latency), retrieval call (10-20%), pre/post processing (10-20%), network (rest).',
        'Common offenders: long top-k retrieval, sequential LLM calls that could be parallel, re-embedding the query when it could be cached, blocking on a third-party API.',
        'Within an LLM call, output tokens dominate. A response twice as long takes roughly twice as long. Aggressive max_tokens caps are real latency wins.',
      ],
      callout: { kind: 'insight', text: 'Streaming hides latency, it does not reduce it. Streaming the first token in 800ms feels faster than waiting 2s for the whole answer, but the system is just as slow. Both fixes (faster total, faster TTFT) are real engineering work.' },
    },
    {
      heading: 'Cost bottlenecks: where the bills hide',
      body: [
        'Cost regression often comes from invisible places. Three patterns recur.',
      ],
      bullets: [
        'Pattern A: retry storms. A failing tool call retried 5x with the full prompt each time. Total cost = 5x. Fix: idempotent retries with backoff, or skip retry on certain error classes.',
        'Pattern B: prompt bloat creep. Each release adds a few hundred tokens to the system prompt. Six months later, the system prompt is 8k tokens long.',
        'Pattern C: dev/test traffic in prod-priced calls. Test runs hitting the same paid endpoints as production. Tag and route them separately.',
        'Pattern D: no caching despite repetitive prefix. Static system prompts not marked as cacheable. 90% potential discount left on table.',
      ],
    },
    {
      heading: 'Quality bottlenecks: build the eval first',
      body: [
        'Quality complaints without an eval set are noise. Step one is always to construct a small evaluation harness even if one does not exist.',
      ],
      bullets: [
        'Sample 50-100 real production queries (with PII redaction). Categorize them by intent.',
        'For each, write the expected behavior — exact output if it is structured, criteria if it is open-ended.',
        'Run the current system against this set. Score and categorize failures.',
        'Categories that recur are the bottlenecks. Now you have a target.',
      ],
      callout: { kind: 'rule', text: '"The model is bad" is never the right diagnosis until you have categorized the failures. 80% of the time the issue is retrieval, 15% is prompt, 5% is the model. Investigate in that order.' },
    },
    {
      heading: 'Reliability bottlenecks: error patterns and tail behavior',
      body: [
        'Reliability problems show up as flaky tests and angry users. The investigation is more about p99 than p50.',
      ],
      bullets: [
        'Read the error logs by class: rate limits, context-length overflows, JSON parse failures, network errors, schema validation. Each has a different fix.',
        'Rate limits: usually fixed by routing across providers or batching, not retrying harder.',
        'Context overflows: prompt size grew past the model\'s limit. Truncation logic missing or wrong.',
        'JSON parse failures: structured output not enforced; switch to JSON mode or tool calling.',
        'Inconsistent outputs: temperature too high for the use case, or model is non-deterministic for that prompt class. Lower temperature, add output schema.',
      ],
    },
    {
      heading: 'The retrieval-vs-generation diagnostic',
      body: [
        'For RAG-shaped systems, the single most important question is: is the failure in retrieval or generation? They have different fixes.',
      ],
      bullets: [
        'Retrieval failure: the right chunks were not in the top-k. Check by manually inspecting top-20 retrievals for the failing query.',
        'Generation failure: the right chunks were retrieved, but the answer was wrong/incomplete. Check by feeding the correct chunks and seeing if the model nails it.',
        'Test: re-run failing queries with hand-curated context. If the model nails them, the bug is retrieval. If not, generation.',
        'Most teams jump to prompt-tuning when retrieval is the issue. Always confirm before changing prompts.',
      ],
    },
    {
      heading: 'New project investigation checklist',
      body: [
        'A practical 10-question checklist for your first week on any AI project.',
      ],
      bullets: [
        '1. Where is the source-of-truth eval set? (If none: build one.)',
        '2. What is the request path from user to LLM and back?',
        '3. What does a sampled trace show as the longest span?',
        '4. What is the per-call token budget at each step?',
        '5. Is prompt caching enabled where it should be?',
        '6. What is the retrieval recall@5 on the eval set?',
        '7. What is the answer faithfulness score?',
        '8. What models are used at each step? Why?',
        '9. What error classes dominate the last 7 days of logs?',
        '10. What is the cost per query and where does it come from?',
      ],
    },
    {
      heading: 'Familiar project bottlenecks: when things change',
      body: [
        'When a project you know becomes slow/expensive/unreliable, the question is what changed. Investigation is git-archeology + metric correlation.',
      ],
      bullets: [
        'Bisect on the symptom: when did p95 latency cross threshold X? What deployed near that day?',
        'Look at the metric correlation: did token spend per call jump? Did retry rate climb? Did embedder version change?',
        'Watch for "silent" upgrades: provider API changes, embedding model deprecations, vector index rebuilds.',
        'Review the eval set on the regressed version vs. previous. The eval will tell you if quality also moved.',
      ],
    },
    {
      heading: 'When the bottleneck is the team or process',
      body: [
        'Not all bottlenecks are technical. Senior engineers name them anyway.',
      ],
      bullets: [
        'No eval discipline: every change is shipped on vibes. Fix: a 50-query eval set checked into the repo.',
        'No observability: bugs are diagnosed by re-running the prompt manually. Fix: traces + per-call metrics.',
        'No PR template for prompt changes: prompt edits not reviewed like code. Fix: treat prompts as code, with diffs and review.',
        'Single owner: one engineer holds all the LLM knowledge. Fix: write down decisions in module READMEs.',
      ],
      callout: { kind: 'warn', text: 'In interviews, naming a process bottleneck (no eval, no traces) before a technical one signals you have shipped real systems. Most production problems are tooling and discipline, not models.' },
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three frequently-missed signals in bottleneck questions.',
      ],
      bullets: [
        'Trap 1 — Jumping to a solution. Senior answer: investigate first. List the 3-5 things you would check before proposing a fix.',
        'Trap 2 — Skipping eval. "I would tune the prompt" is a junior answer. "I would build an eval set first" is the senior answer.',
        'Trap 3 — Treating LLM as a black box. Knowing what spans dominate (retrieval, generation, output streaming) shows production experience.',
      ],
    },
  ],
  keyTakeaways: [
    'Bottlenecks classify into latency, cost, quality, and reliability. Identify the type before guessing the cause.',
    'Investigate before suggesting fixes. Read traces, eval results, and incidents.',
    'Quality regressions are most often retrieval problems, not prompt or model problems. Test that explicitly.',
    'Most production bottlenecks are process, not models — no eval, no traces, no review.',
  ],
  pitfalls: [
    'Suggesting fixes in week 1 without trace data or eval results.',
    'Tuning the prompt when retrieval is the actual culprit.',
    'Counting only API costs and missing embedding, vector storage, and observability spend.',
    'Treating temperature as a quality knob without measurement.',
  ],
  relatedSlugs: ['rag', 'evaluation', 'token-optimization'],
}
