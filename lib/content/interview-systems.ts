import type { InterviewQuestion } from '../types'

export const interviewSystems: InterviewQuestion[] = [
  {
    id: 'sys-001',
    category: 'System Design',
    difficulty: 'Senior',
    scenario: 'Design an AI customer support assistant that can answer from a 500k-article knowledge base, escalate to humans when confidence is low, and learn from agent corrections.',
    answer: {
      summary: 'Hybrid RAG with re-ranking, confidence scoring, agent feedback loop. Three layers: retrieval, generation with citations, escalation router.',
      steps: [
        'Retrieval: hybrid (BM25 + dense), top-30 → cross-encoder rerank to top-5. Vector DB: Qdrant or pgvector at this scale.',
        'Generation: mid-tier model with prompt caching, structured output with citations and a self-reported confidence field.',
        'Confidence routing: score threshold (calibrated against eval set) decides auto-respond vs escalate. Always escalate when no chunks pass relevance threshold.',
        'Feedback loop: when agents correct, log original query + chunks + agent answer. Periodic batch creates new eval cases + identifies retrieval misses.',
        'Observability: trace per request, faithfulness sampled in production, weekly drift report.',
      ],
      tradeoffs: [
        'Self-reported confidence is unreliable solo; combine with retrieval-score threshold and rule-based gates.',
        'Agent feedback is noisy — not all corrections are improvements.',
      ],
      redFlags: [
        'No citation/escalation story.',
        'Treating LLM confidence as authoritative.',
      ],
      followUps: [
        'How do you handle multi-language?',
        'What if articles change daily?',
        'How do you prevent prompt injection from articles?',
      ],
    },
  },
  {
    id: 'sys-002',
    category: 'System Design',
    difficulty: 'Senior',
    scenario: 'Design RAG-as-a-service for an enterprise: each customer has their own corpus, strict isolation, custom embedders allowed.',
    answer: {
      summary: 'Multi-tenant vector DB with namespace per tenant + tenant-aware retrieval. Either per-tenant collections (isolation, ops cost) or shared collection with strict metadata filters (efficient, riskier).',
      steps: [
        'Per-tenant collections is the safer default — true data isolation, separate access keys, no risk of cross-tenant leakage in retrieval.',
        'For embedder choice: support 2-3 vetted embedders, allow per-tenant config. Document the re-embedding cost when switching.',
        'Auth: tenant ID in JWT → enforce in retrieval layer, never trust the prompt.',
        'Rate limits per tenant; fair-queueing on shared LLM provider quota.',
        'Observability tagged by tenant for cost allocation and SLA tracking.',
      ],
      tradeoffs: [
        'Shared collection with filters: cheaper, scales to more tenants, but a single bug leaks data.',
        'Per-tenant collections: ops scales linearly with tenants but isolation is structural.',
      ],
      redFlags: [
        'Trusting the prompt to enforce tenancy.',
        'No cost allocation per tenant.',
      ],
      followUps: [
        'How do you handle tenant offboarding?',
        'What about tenants with 100M docs vs 1k docs?',
      ],
    },
  },
  {
    id: 'sys-003',
    category: 'System Design',
    difficulty: 'Mid',
    scenario: 'How would you design an internal AI assistant for engineers to query company docs?',
    answer: {
      summary: 'Hybrid RAG with SSO-based access control, focus on citations and "I do not know" responses, low complexity to operate.',
      steps: [
        'Source-of-truth ingest: wikis, runbooks, ADRs, recent Slack threads (with permission).',
        'Chunking by document structure (headings); contextual prefix per chunk.',
        'Hybrid retrieval (BM25 + dense), filter by user\'s SSO groups for permission boundaries.',
        'Generation: Sonnet-tier model, hard-coded "if context insufficient, say so and link to retrieved sources" instruction.',
        'Eval set: 50 internal-style queries, run weekly; thumbs feedback in Slack.',
      ],
      tradeoffs: [
        'Internal use case tolerates higher latency than consumer; can spend it on better retrieval.',
        'Slack ingest privacy concerns — opt-in by channel.',
      ],
      redFlags: [
        'No access control; everyone sees everything.',
        'No citation; engineers cannot verify.',
      ],
      followUps: [
        'How do you handle deleted docs?',
        'What if engineers want to query code?',
      ],
    },
  },
  {
    id: 'sys-004',
    category: 'System Design',
    difficulty: 'Senior',
    scenario: 'Design a meeting summary AI that handles 30k transcripts/day with action item extraction, output to Slack.',
    answer: {
      summary: 'Async batch architecture. No retrieval — this is per-document summarization at scale. Cost optimization is the dominant constraint.',
      steps: [
        'Architecture: queue-based, transcripts → worker pool → LLM (batch API where SLA allows) → Slack.',
        'Chunking: long transcripts split by speaker turns or time windows; map-reduce summarization.',
        'Model: cheap-tier for chunk summaries, mid-tier for final synthesis.',
        'Output: structured (summary + bullets + action items + owners), validated before posting.',
        'Eval: ROUGE/BERTScore vs human-written summaries on 100 transcripts; LLM-as-judge for action item completeness.',
      ],
      tradeoffs: [
        'Batch API: 50% cost, 24h SLA. If summaries are needed in minutes, this fails.',
        'Map-reduce: scales to long meetings, loses cross-section context.',
      ],
      redFlags: [
        'Single-prompt summarization that fails on 2-hour meetings.',
        'No structured output; downstream Slack post breaks on edge cases.',
      ],
      followUps: [
        'How do you handle multi-language meetings?',
        'What about diarization errors in transcripts?',
      ],
    },
  },
  {
    id: 'sys-005',
    category: 'System Design',
    difficulty: 'Senior',
    scenario: 'Build an agent that can take actions on a SaaS app (create tickets, update tasks, send messages). Discuss safety.',
    answer: {
      summary: 'Tool calling with permission gates, action confirmation for destructive operations, audit trail per action, rollback capability.',
      steps: [
        'Tool boundary: each action is a typed function. Schema validation on inputs.',
        'Permission gating: tools have scopes; agent can only call tools the user has permissions for.',
        'Confirmation gate: destructive actions (delete, irreversible state change) require explicit user approval before execution.',
        'Audit trail: every tool call logged with input, output, user, timestamp. Rollback procedures for reversible actions.',
        'Sandbox / dry-run: agent can plan without executing; user reviews then approves.',
      ],
      tradeoffs: [
        'Confirmation gates slow the agent; without them, you ship "the agent deleted my tickets" headlines.',
        'Audit trail adds storage cost; non-negotiable for compliance.',
      ],
      redFlags: [
        'Letting the agent execute arbitrary actions without permission scopes.',
        'No audit trail.',
      ],
      followUps: [
        'How do you defend against prompt injection from incoming tickets?',
        'What is your rate limit on destructive actions?',
      ],
    },
  },
  {
    id: 'eval-001',
    category: 'Evaluation',
    difficulty: 'Mid',
    scenario: 'How do you evaluate a RAG system?',
    answer: {
      summary: 'Four metrics: context precision, context recall, faithfulness, answer relevance. Plus offline + online modes.',
      steps: [
        'Build eval set: 50-200 (query, expected answer, ideal context) tuples sampled from production.',
        'Context precision: are retrieved chunks actually relevant?',
        'Context recall: did retrieval surface all relevant chunks?',
        'Faithfulness: does the answer stick to retrieved context (no hallucination)?',
        'Answer relevance: does the answer address the actual question?',
        'Online: 1-5% sampled traces, LLM-as-judge or human review.',
      ],
      tradeoffs: [
        'LLM-as-judge: scales but biased.',
        'Human eval: gold-standard but slow.',
      ],
      redFlags: [
        'Vibes-only eval.',
        'Offline only — no online drift detection.',
      ],
      followUps: ['Which metric do you optimize first?'],
    },
  },
  {
    id: 'eval-002',
    category: 'Evaluation',
    difficulty: 'Senior',
    scenario: 'Your eval scores stay stable but users keep complaining. What is going wrong?',
    answer: {
      summary: 'Eval set stale, distribution mismatch with production, or you are measuring the wrong thing.',
      steps: [
        'Check workload: are recent production queries similar in shape to eval set queries? Likely no.',
        'Refresh eval from current production samples. Tag intent categories.',
        'Check what users complain about specifically. May be a metric you are not measuring (latency? format? tone?).',
        'Add the missing metric to the eval; treat user complaints as a signal of measurement gaps.',
      ],
      tradeoffs: ['Refreshing the eval breaks comparability with old metrics; tradeoff for relevance.'],
      redFlags: [
        'Trusting unchanged scores when complaints rise.',
        'Optimizing offline metrics without checking production.',
      ],
      followUps: ['Cadence for refreshing the eval set?'],
    },
  },
  {
    id: 'eval-003',
    category: 'Evaluation',
    difficulty: 'Mid',
    scenario: 'How do you handle LLM-as-judge bias?',
    answer: {
      summary: 'Use a different model family than your generator. Test both orderings in pairwise. Normalize for length. Pin judge version. Sample human-validate periodically.',
      steps: [
        'Use OpenAI judge for an Anthropic-generated system, or vice versa. Avoid self-preference.',
        'In pairwise: run both orderings (A vs B, B vs A); average to neutralize position bias.',
        'Length-normalize: longer answers score higher; control for word count.',
        'Pin model version; judges drift as models update.',
        'Human-validate 5-10% of judgments quarterly to catch judge regressions.',
      ],
      tradeoffs: ['More rigor = more eval cost; balance against eval frequency.'],
      redFlags: ['Treating LLM-as-judge as ground truth without validation.'],
      followUps: ['What if results disagree across judges?'],
    },
  },
  {
    id: 'lc-001',
    category: 'Lifecycle',
    difficulty: 'Senior',
    scenario: 'A great POC ran in a notebook with 10 test queries. Now stakeholders want to ship. What is your phase plan?',
    answer: {
      summary: 'POC → Architecture → Build → Hardening → Deploy. Most teams skip hardening; that is where launches break.',
      steps: [
        'Architecture decisions: model per step, vector DB, eval/observability stack, deployment shape, security model. Lock before building.',
        'Build: replace POC code with production code (config, retries, logging). In parallel: eval harness (50-200 queries) and observability (traces, token telemetry).',
        'Hardening: prompt injection defense, output validation, cost ceilings, rate limit handling, edge cases (empty, very long, non-English, adversarial). Usually doubles build time.',
        'Deploy: shadow mode → canary → gradual ramp. Define rollback triggers explicitly.',
        'Maintenance plan: drift detection, eval refresh cadence, owner.',
      ],
      tradeoffs: [
        'Each phase shortened to "ship faster" comes back as production incidents.',
      ],
      redFlags: [
        'Skipping hardening.',
        'No rollback plan.',
        'No owner after launch.',
      ],
      followUps: ['What is your rollback trigger?'],
    },
  },
  {
    id: 'lc-002',
    category: 'Lifecycle',
    difficulty: 'Mid',
    scenario: 'Your provider deprecates the model your prod system uses. 90 days notice. Plan?',
    answer: {
      summary: 'Replacement evaluation, shadow run, gradual cutover. Treat as a planned migration with eval-driven validation.',
      steps: [
        'Identify candidate replacements (provider\'s suggestion + 1-2 alternatives from other providers for leverage).',
        'Run full eval suite on each candidate against the current production model. Compare faithfulness, latency, cost.',
        'Spot-check edge cases: long inputs, structured output, tool calling quirks. Different families behave differently.',
        'Shadow mode for 2 weeks: dual call, compare outputs offline.',
        'Gradual canary: 5% → 25% → 100% with rollback at each step.',
      ],
      tradeoffs: [
        'Multi-provider strategy is more expensive but de-risks future deprecations.',
      ],
      redFlags: [
        'Cutover without shadow validation.',
        'Picking replacement on benchmark sheets alone.',
      ],
      followUps: ['What if no replacement matches the deprecated model\'s quality?'],
    },
  },
  {
    id: 'lc-003',
    category: 'Lifecycle',
    difficulty: 'Senior',
    scenario: 'How do you make AI features maintainable after launch?',
    answer: {
      summary: 'Owner assigned, drift detection automated, eval refresh scheduled, prompts version-controlled, model deprecations tracked.',
      steps: [
        'Single owner per AI feature; their on-call covers it.',
        'Weekly drift report: eval scores vs launch baseline, cost trends, error rate trends.',
        'Quarterly eval set refresh; replace stale queries with current production samples.',
        'Prompts in git; PR review for changes; eval gate on prompt PRs.',
        'Model deprecation calendar tracked; provider announcements monitored.',
      ],
      tradeoffs: [
        'Automation is upfront cost; pays back across years of operation.',
      ],
      redFlags: [
        'No owner — everyone\'s job is no one\'s job.',
        'Treating prompts as not-code.',
      ],
      followUps: ['What is the smallest viable maintenance discipline?'],
    },
  },
  {
    id: 'lc-004',
    category: 'Lifecycle',
    difficulty: 'Mid',
    scenario: 'Stakeholders want AI added to a workflow. How do you decide if it is the right tool?',
    answer: {
      summary: 'Could a SQL query, regex, or rule solve it? Is there a measurable success definition? What is the failure cost? What is the human-in-the-loop story?',
      steps: [
        'Can it be deterministic? If yes, do that. AI is for problems that resist rules.',
        'Define success measurably: latency, cost, quality. "Helpful" is not measurable.',
        'Failure cost: a wrong answer in a low-cost setting is fine; in a high-cost setting (medical, legal, financial) needs human-in-loop.',
        'Decide the loop: always-autonomous, always-reviewed, mixed. Drives the entire architecture.',
      ],
      tradeoffs: [
        'AI brings flexibility at the cost of determinism.',
      ],
      redFlags: ['AI-ifying a problem that has a closed-form solution.'],
      followUps: ['Have you ever pushed back on an "AI feature" request? What happened?'],
    },
  },
  {
    id: 'lc-005',
    category: 'Lifecycle',
    difficulty: 'Senior',
    scenario: 'Walk me through a real incident with an AI system in production.',
    answer: {
      summary: 'Show structured incident handling: detect, contain, diagnose, fix, post-mortem. AI-specific incidents are usually drift, prompt injection, or provider issues.',
      steps: [
        'Detect: alert fires (eval score drop, error rate spike, cost regression). Owner paged.',
        'Contain: feature flag off or canary rollback. Restore baseline service.',
        'Diagnose: traces, recent deploys, provider status, eval comparison.',
        'Fix: targeted change with eval validation, gradual ramp.',
        'Post-mortem: root cause, contributing factors, prevention. Add to eval set if applicable.',
      ],
      tradeoffs: [
        'Aggressive containment minimizes user impact; can mask the underlying issue if you skip diagnosis.',
      ],
      redFlags: [
        'No detection until users report.',
        'No post-mortem; same incident repeats.',
      ],
      followUps: ['What is the most surprising AI-specific incident you have seen?'],
    },
  },
  {
    id: 'sys-006',
    category: 'System Design',
    difficulty: 'Mid',
    scenario: 'Design an AI feature that drafts marketing copy from a brand voice guide and product info.',
    answer: {
      summary: 'Long-context approach (not RAG). Brand guide + product info fits in cached prompt. Generation with structured variants.',
      steps: [
        'Cache brand guide as system prompt (consistent per request).',
        'Per-request: product info + audience + format spec.',
        'Generate 3-5 variants, return all. Let the human pick — fastest path to good copy.',
        'Quality eval: brand-voice match (LLM-as-judge with brand guide as reference) + readability metrics.',
      ],
      tradeoffs: [
        'Long context with caching: simpler than RAG, single source-of-truth in prompt.',
        'If brand guide grows past 30k tokens, switch to RAG.',
      ],
      redFlags: [
        'RAG-ifying when long-context with caching is simpler.',
      ],
      followUps: ['How would you A/B test variants in production?'],
    },
  },
]
