import type { Module } from '../types'

export const lifecycleModule: Module = {
  slug: 'lifecycle',
  number: '15',
  title: 'The AI engineering lifecycle — every phase mapped',
  tagline: 'From "we should add AI" to "we have an AI system in prod for 12 months." Know every step.',
  duration: '45 min read',
  level: 'Advanced',
  intro:
    'Most AI failures happen in the gaps between phases — a great POC that cannot scale, a production system with no eval, a feature that drifts without observability. Senior engineers see the full lifecycle and the handoffs in it. This module walks the eight phases with the decisions and risks at each.',
  sections: [
    {
      heading: 'The eight phases',
      body: [
        'Every AI feature traverses these phases, even if the team is unaware. Naming them lets you anticipate problems.',
      ],
      bullets: [
        '1. Problem framing — is this an AI problem at all?',
        '2. Data audit — what do we have, what is missing?',
        '3. POC / prototyping — does the simplest version work?',
        '4. Architecture decisions — RAG vs fine-tune vs tools, model choice, deployment shape.',
        '5. Build — production code, eval harness, observability.',
        '6. Hardening — safety, cost, reliability, edge cases.',
        '7. Deployment — release strategy, monitoring, rollback plan.',
        '8. Maintenance — drift, feedback loops, model updates, deprecations.',
      ],
    },
    {
      heading: 'Phase 1: Problem framing',
      body: [
        'The cheapest hour you will spend. Many "AI projects" should not be AI projects.',
      ],
      bullets: [
        'Could this be solved with a SQL query, a regex, or a deterministic rule? If yes, do that. AI is for problems that resist deterministic solutions.',
        'Define success in measurable terms: latency, cost, quality. "An assistant that helps users" is not measurable.',
        'Identify the failure cost. If a wrong answer costs $1000 in support load, your reliability bar is high. If it costs nothing, you can move fast.',
        'Decide the human-in-the-loop story. Will outputs be reviewed before action? Always autonomous? Mixed? This decides the entire architecture.',
      ],
      callout: { kind: 'rule', text: 'A 30-minute "is this AI-shaped?" check kills the projects that waste six months. The senior move is asking "what is the simplest thing that solves the user problem?" before naming AI.' },
    },
    {
      heading: 'Phase 2: Data audit',
      body: [
        'For RAG, fine-tuning, or any data-grounded AI feature, the data audit is what separates feasible from fantasy.',
      ],
      bullets: [
        'What sources of truth exist? Wikis, ticket systems, docs, databases, transcripts, code repos. Catalog them.',
        'What is the access model? Who can see what data? AI systems amplify access risks.',
        'What is the data freshness requirement? Daily? Real-time? Static? This decides the ingestion architecture.',
        'What is the data quality? PII present? OCR errors? Duplicates? Outdated content? Each is a downstream problem.',
        'Are there gaps? Information the AI needs but does not exist anywhere? Build it or flag the limitation.',
      ],
    },
    {
      heading: 'Phase 3: POC / prototyping',
      body: [
        'The POC has one job: prove or disprove that the approach can work. Optimize for speed of learning, not code quality.',
      ],
      bullets: [
        'Build the dumbest version first: hard-coded prompts, manual chunking, single document, flagship model.',
        'Run it on 10 representative queries. If 7+ work acceptably, the approach is feasible. If 3-, the architecture is wrong.',
        'Resist polishing the POC. Polishing is for phase 5; POC code is throwaway.',
        'Document what you learned, not just what you built. The decisions matter more than the code.',
      ],
      callout: { kind: 'warn', text: 'POCs that pass evaluation in a notebook routinely fail in production. The POC tells you "the approach can work," not "this code can ship."' },
    },
    {
      heading: 'Phase 4: Architecture decisions',
      body: [
        'Once feasibility is proven, lock the structural decisions before building. Changing them later is expensive.',
      ],
      bullets: [
        'Approach: RAG vs fine-tuning vs long-context vs tool calling. (Most production systems are RAG + tools.)',
        'Model choice per step: cheap for routing, mid for generation, flagship for reasoning. Document the why.',
        'Vector DB / data store: based on scale and access patterns. (See vector DB module.)',
        'Deployment shape: serverless vs containers vs edge. Latency budget and traffic shape decide.',
        'Eval and observability stack: pick before building, not after.',
        'Security model: prompt injection defense, output validation, PII handling.',
      ],
    },
    {
      heading: 'Phase 5: Build',
      body: [
        'The build phase is where most of the lifecycle effort actually goes. Three workstreams happen in parallel.',
      ],
      bullets: [
        'Production code: replace the POC with a real system — config, error handling, retries, structured logging.',
        'Eval harness: 50-200 example eval set, run-on-CI, threshold gates.',
        'Observability: traces, token telemetry, error classification, user feedback hooks. Wire from day 1, not after launch.',
      ],
    },
    {
      heading: 'Phase 6: Hardening',
      body: [
        'Hardening is the gap most teams miss between "works in staging" and "ships to users." Five categories of work.',
      ],
      bullets: [
        'Safety: prompt injection defenses, output validation, refusal handling, content moderation.',
        'Cost: prompt caching enabled, model right-sized, top-k tuned, max_tokens capped.',
        'Reliability: retry logic with backoff, circuit breakers on provider failures, fallback paths.',
        'Edge cases: empty inputs, very long inputs, non-English inputs, adversarial inputs. Each is a separate test.',
        'Privacy: PII detection, data retention rules, audit logging.',
      ],
      callout: { kind: 'rule', text: 'Hardening usually doubles the time of the build phase. Plan for it explicitly. Skipping it is the #1 reason "POC ships" launches go wrong.' },
    },
    {
      heading: 'Phase 7: Deployment',
      body: [
        'Release strategy decides how much risk you take per launch.',
      ],
      bullets: [
        'Shadow first: run the new system in parallel without affecting users. Compare outputs offline.',
        'Canary: 1-10% of traffic, monitor key metrics, ramp if healthy.',
        'Feature flag per cohort: enable for internal users, then beta, then GA. Standard pattern.',
        'Rollback plan: ALWAYS define what triggers rollback and how fast you can do it. Practice it.',
      ],
    },
    {
      heading: 'Phase 8: Maintenance',
      body: [
        'Most AI systems degrade silently. Maintenance is where the difference between "AI engineer" and "shipped AI engineer" becomes visible.',
      ],
      bullets: [
        'Drift detection: compare current eval scores to launch scores. If they drop, investigate.',
        'Workload drift: are users asking different questions than before? Refresh the eval set quarterly.',
        'Model deprecations: providers retire models. Have a migration plan; eval the replacement before forced switch.',
        'Embedding model updates: re-embedding the corpus is a project. Plan the cost and downtime.',
        'Feedback loop: user thumbs-down should turn into eval cases or prompt fixes, not be lost.',
        'Cost watch: bills creep. Quarterly cost-per-query review prevents surprise bills.',
      ],
      callout: { kind: 'insight', text: 'In interviews, naming maintenance work (drift, deprecations, embedding migrations) signals you have actually run AI in production for over a year. Most candidates skip this entirely.' },
    },
    {
      heading: 'The handoffs that break projects',
      body: [
        'Watch the gaps between phases. These are where projects fail.',
      ],
      bullets: [
        'POC → Production: the demo worked, but no eval set means the production version cannot be regressed safely.',
        'Build → Hardening: launch pressure skips hardening; production breaks at edge cases that staging missed.',
        'Deploy → Maintenance: nobody owns the system after launch; quality drifts unnoticed for months.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three patterns that signal lifecycle thinking.',
      ],
      bullets: [
        'Trap 1 — Talking only about model choice. Senior answer: walk through framing, data, eval, deploy, maintenance.',
        'Trap 2 — No rollback plan. Always state how you would unship a bad release.',
        'Trap 3 — No drift story. The system is not done at launch. Naming the post-launch work signals senior.',
      ],
    },
  ],
  keyTakeaways: [
    'Eight phases: framing, data, POC, architecture, build, hardening, deploy, maintain.',
    'Most failures happen in handoffs — POC to prod, build to hardening, deploy to maintain.',
    'Hardening usually doubles build time. Plan for it.',
    'Maintenance is the senior signal. Drift detection, eval refresh, deprecation planning.',
  ],
  pitfalls: [
    'Skipping the framing phase and AI-ifying problems that should be SQL.',
    'Polishing the POC instead of throwing it away and building production from clean state.',
    'Launching without a rollback plan.',
    'No owner after launch; the system rots.',
  ],
  relatedSlugs: ['bottlenecks', 'evaluation', 'rag'],
}
