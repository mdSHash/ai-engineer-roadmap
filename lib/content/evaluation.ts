import type { Module } from '../types'

export const evaluationModule: Module = {
  slug: 'evaluation',
  number: '07',
  title: 'Evaluation and observability — without it, you are guessing',
  tagline: 'You cannot ship what you cannot measure. Evals are the most undervalued AI skill in interviews.',
  duration: '40 min read',
  level: 'Intermediate',
  intro:
    'Evaluation separates engineers who ship reliable AI from those who ship demos. The interviewer who asks "how do you know your system is good?" is testing whether you have ever maintained an AI system in production. This module covers the eval and observability stack you must speak to.',
  sections: [
    {
      heading: 'Two evals, two purposes',
      body: [
        'Production AI requires two distinct evaluation modes. Conflating them is a junior pattern.',
      ],
      matrix: {
        caption: 'Offline vs online evaluation',
        headers: ['Mode', 'When', 'Purpose', 'Tools'],
        rows: [
          ['Offline (eval set)',  'Before deploy / in CI',         'Did this change improve or regress quality?',     'RAGAS, custom test harness, golden datasets'],
          ['Online (production)', 'Continuous in production',      'Is the live system performing as expected?',     'Traces (LangSmith, LangFuse), feedback signals, sampling'],
        ],
      },
      callout: { kind: 'rule', text: 'Both modes are required. Offline catches regressions before deploy; online catches drift and edge cases that the eval set missed.' },
    },
    {
      heading: 'Building the offline eval set',
      body: [
        'The eval set is the single highest-leverage artifact in any AI project. Most teams skip it. Don\'t.',
      ],
      bullets: [
        '50-200 (input, expected output) tuples covering the workload distribution. Sourced from real production logs (with PII redaction) plus deliberate edge cases.',
        'Distribution-balanced: include common queries AND rare-but-important ones. Do not eval only on the easy 80%.',
        'Include adversarial cases: prompt injection attempts, off-topic questions, ambiguous queries. Production has all of these.',
        'Versioned in source control (CSV, JSONL, or YAML). Treated as code: diff-reviewed, tagged per release.',
      ],
    },
    {
      heading: 'RAG evaluation: the four metrics',
      body: [
        'For RAG systems, four metrics give you a near-complete picture. RAGAS popularized them; you should know them by name.',
      ],
      matrix: {
        caption: 'RAG evaluation metrics',
        headers: ['Metric', 'What it measures', 'Failure mode it catches'],
        rows: [
          ['Context precision', 'Are the retrieved chunks actually relevant?', 'Top-k full of garbage; needs better retriever or re-ranker'],
          ['Context recall',    'Did retrieval surface ALL relevant chunks?',  'Important info missed; needs higher k or better embedder'],
          ['Faithfulness',      'Does the answer stick to the retrieved context?', 'Model hallucinating beyond what was retrieved'],
          ['Answer relevance',  'Does the answer address the actual question?', 'Model produces correct but off-topic content'],
        ],
      },
    },
    {
      heading: 'LLM-as-judge: when to use, when to distrust',
      body: [
        'Using an LLM to score outputs (faithfulness, answer quality) is fast and scalable but has known biases.',
      ],
      bullets: [
        'Position bias: judges prefer the first option in pairwise comparisons. Always test both orderings.',
        'Length bias: judges score longer answers higher. Normalize for length when comparing.',
        'Self-preference bias: a judge model often scores its own family\'s output higher. Use a different model family as judge.',
        'Calibration drift: judge scores can be inconsistent over time. Pin the judge model and version.',
      ],
      callout: { kind: 'warn', text: 'LLM-as-judge is fine for trends and triage but never sufficient as the sole truth on high-stakes decisions. Pair with human review on a sample.' },
    },
    {
      heading: 'Observability stack: what you must instrument',
      body: [
        'Production AI without traces is unmaintainable. The minimum viable observability is small but non-negotiable.',
      ],
      bullets: [
        'Trace per request: every LLM call, retrieval call, and tool call as a span with timing, input, output, and metadata.',
        'Token telemetry: input/output/cached tokens per call, per user, per feature. Aggregated for cost.',
        'Error telemetry: failed calls by error class (rate limit, JSON parse, content filter, timeout).',
        'User feedback: thumbs up/down or rating, tied to the trace ID. Without feedback, you cannot improve quality.',
        'Metadata: prompt version, model name, retrieval config. Lets you correlate quality changes to deploys.',
      ],
    },
    {
      heading: 'Tools landscape',
      body: [
        'You should be able to name the major tools and what they are best at.',
      ],
      bullets: [
        'LangSmith: tightly integrated with LangChain. Best for teams already in that ecosystem. Strong eval tooling.',
        'LangFuse: open-source, self-hosted option. Strong observability + prompt management. Good if data residency matters.',
        'Helicone: lightweight proxy approach, easy drop-in. Best for cost and rate-limit visibility without deeper integration.',
        'Phoenix (Arize): open-source observability + eval, strong on traces and embedding drift detection.',
        'Braintrust: eval-first, plays well with CI. Good for teams treating evals as tests.',
        'OpenTelemetry: vendor-neutral standard. Use when you need to integrate AI tracing with broader app traces.',
      ],
    },
    {
      heading: 'Ground truth: how to source it',
      body: [
        'The hardest part of eval is the ground-truth labels. Three approaches, in order of quality:',
      ],
      bullets: [
        'Human-labeled: domain experts label correct outputs. Most expensive, highest quality.',
        'Distillation: a stronger/larger model produces labels for the eval set. Useful when human review is costly. Lower ceiling than human-labeled.',
        'Bootstrapped: production traces with positive user feedback used as positive examples. Cheapest, noisiest.',
        'Most teams use a mix: human-labeled core set (50-100 examples) + bootstrapped expansion to broader workload (500+).',
      ],
    },
    {
      heading: 'Eval in CI: making evals first-class',
      body: [
        'Evals that only run when remembered are evals that go stale. Production teams run them automatically.',
      ],
      bullets: [
        'Run eval suite on PR for prompt changes, retriever changes, model swaps, chunking changes.',
        'Block merges below threshold (e.g. faithfulness drops > 5pp).',
        'Cost the eval at the budget. Some suites cost $5-20 per run; that adds up. Use cheaper proxy metrics for fast feedback, full eval on merge candidates.',
        'Treat eval failures like test failures: red, blocking, must be addressed.',
      ],
    },
    {
      heading: 'Online evaluation patterns',
      body: [
        'Once shipped, you need ongoing measurement. Three patterns dominate.',
      ],
      bullets: [
        'Sampling: 1-5% of production traffic gets graded (LLM-as-judge or shadow human review). Catches drift cheaply.',
        'Shadow mode: new prompt or model runs alongside production but does not return to user. Compare outputs offline.',
        'Canary: route 1-10% of traffic to the new version, monitor key metrics, ramp up if healthy. Standard release pattern.',
        'A/B test: split traffic between two variants, measure user-level outcomes. Statistically rigorous but slower than shadow/canary.',
      ],
    },
    {
      heading: 'When evals lie',
      body: [
        'Senior engineers know their evals can mislead. Three failure modes to volunteer in interviews:',
      ],
      bullets: [
        'Eval set ages: the workload shifts, your eval set does not. Quality "improves" by gaming the static set. Refresh quarterly.',
        'Distribution skew: your eval is mostly easy queries; production has hard ones. Always weight by production frequency.',
        'Goodharts law: optimizing for the metric stops improving the underlying behavior. Watch for over-fitting to faithfulness while answer relevance drops.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three patterns that distinguish hands-on AI engineers.',
      ],
      bullets: [
        'Trap 1 — "I\'d try a few queries manually." Senior answer: build a versioned eval set first.',
        'Trap 2 — Trusting LLM-as-judge as the sole truth. Senior answer: pair with human review on a sample.',
        'Trap 3 — No mention of online eval. Offline-only eval is half the answer. Always cover both.',
      ],
    },
  ],
  keyTakeaways: [
    'Two evals: offline (regression catching) and online (drift detection). Both are required.',
    'For RAG, master four metrics: context precision/recall, faithfulness, answer relevance.',
    'Build the eval set first, before optimizing anything. Without it you are guessing.',
    'Instrument traces, token spend, errors, and user feedback. Production AI without observability is unmaintainable.',
    'Eval can mislead — refresh quarterly, weight by real distribution, watch for Goodharting.',
  ],
  pitfalls: [
    'No eval set; quality changes are invisible.',
    'Eval set built once and never refreshed; quality drifts silently.',
    'LLM-as-judge with self-preference bias as sole truth.',
    'No CI integration; evals run only when someone remembers.',
    'Optimizing offline metrics without verifying online behavior.',
  ],
  relatedSlugs: ['rag', 'bottlenecks', 'lifecycle'],
}
