import type { Module } from '../types'

export const fineTuningModule: Module = {
  slug: 'fine-tuning' as Module['slug'],
  number: '11',
  title: 'Fine-tuning vs RAG vs prompting — the real decision',
  tagline: 'Fine-tuning teaches HOW. RAG teaches WHAT. Prompting unlocks capability. Mix them up and you ship the wrong thing.',
  duration: '45 min read',
  level: 'Intermediate',
  intro:
    "The RAG module mentions fine-tuning as one of four ways to give an LLM information, but never explains what fine-tuning actually is, when it wins, what LoRA/QLoRA/SFT/DPO/RLHF are, or how to defend the choice. This module is the missing decision matrix.",
  sections: [
    {
      heading: 'Three different things people call "fine-tuning"',
      body: [
        'When a stakeholder says "let\'s fine-tune the model", they almost always mean one of three very different procedures, each with different data needs, costs, and outcomes. Conflating them is the single most common junior mistake in this topic.',
        'Continued pretraining keeps doing next-token prediction on a new corpus — useful for shifting the base distribution toward a domain (legal, medical, code in a niche language). It needs hundreds of millions to billions of tokens and rarely makes sense outside frontier labs or very specific verticals.',
        'Supervised fine-tuning (SFT) trains the model on labeled (input, output) pairs — this is what 95% of teams actually mean. Preference tuning (DPO, RLHF, KTO) takes an already-SFT\'d model and aligns it to ranked or thumbs-up/down signal. You almost never start with preference tuning; it is a polish step.',
      ],
      callout: { kind: 'rule', text: 'When someone says "fine-tune", make them name which of the three. If they cannot, the project is not ready to spend money on it.' },
    },
    {
      heading: 'What fine-tuning actually teaches (and what it does not)',
      body: [
        'Fine-tuning is excellent at teaching the model HOW to behave: output format, voice and tone, refusal patterns, domain vocabulary, structured response schemas, and consistent task templates. It works because these are stable patterns the gradient can latch onto.',
        'Fine-tuning is bad at teaching the model WHAT is true. Facts injected via SFT leak slowly, get overwritten by later training signal, and silently rot when the underlying truth changes. A fine-tuned model that "knows" your product catalog will hallucinate the catalog the moment a SKU is renamed.',
        'The senior framing: fine-tuning shifts the conditional distribution of outputs given an input pattern. It is a behavior dial, not a knowledge store. When a teammate proposes fine-tuning to "stop hallucinating product specs", they are reaching for the wrong tool.',
      ],
      callout: { kind: 'warn', text: 'Fine-tuning to inject facts is the most expensive way to build a stale, hard-to-update knowledge base. Use RAG. The only exception is when the fact set is tiny, frozen, and latency-critical.' },
    },
    {
      heading: 'The decision triangle: prompt, RAG, fine-tune',
      body: [
        'Every information-shaping problem in LLM engineering reduces to three knobs. Pick the one that matches what is missing, not the one that sounds most sophisticated.',
      ],
      decisionRules: [
        { when: 'The model cannot do the task at all (capability gap)', pick: 'Better prompting first, then a stronger model', why: 'If the base model lacks the capability, no amount of fine-tuning a weaker one will catch up. Prompting reveals capabilities that already exist.' },
        { when: 'The model can do the task but does not know your data', pick: 'RAG (or tools, or long-context)', why: 'Knowledge that changes, requires citation, or has access control belongs outside the weights.' },
        { when: 'The model can do the task and knows the data, but the output style/format/refusal pattern is wrong', pick: 'Supervised fine-tuning', why: 'This is the canonical SFT use case — narrowing the conditional distribution to your house style.' },
        { when: 'The SFT model is mostly right but ranks bad answers above good ones', pick: 'Preference tuning (DPO)', why: 'You already have the capability and format; you need to teach which of two acceptable outputs is preferred.' },
        { when: 'You want a smaller, cheaper model to act like a bigger one on a narrow task', pick: 'Distillation', why: 'Train a small model on outputs from a frontier model. Cost lever for high-volume inference.' },
      ],
    },
    {
      heading: 'PEFT, LoRA, QLoRA — the only training math you need to remember',
      body: [
        'Full fine-tuning updates all weights of the base model. For a 7B model that is ~14GB in fp16 plus optimizer state — typically 60-80GB of VRAM for SFT. Most teams do not have this and do not need it.',
        'Parameter-Efficient Fine-Tuning (PEFT) freezes the base model and trains a small set of adapter parameters instead. LoRA is the dominant method: it inserts pairs of low-rank matrices A (d×r) and B (r×d) into attention layers. With r=8 or r=16, you train under 1% of the parameters and get most of the quality of full fine-tuning.',
        'QLoRA goes further: quantize the frozen base to 4-bit (NF4 format), then attach LoRA adapters in fp16. A 70B model fine-tunes on a single 48GB GPU. The quality cost is small (often within 1-2% of full fine-tuning on benchmarks) and the cost savings are 10-20x. For 95% of production fine-tuning today, QLoRA + LoRA is the right default.',
      ],
      callout: { kind: 'insight', text: 'LoRA adapters are tiny (10-200MB). You can ship one base model and hot-swap dozens of adapters per tenant or per task — a deployment pattern impossible with full fine-tuning.' },
    },
    {
      heading: 'How much data do you actually need?',
      body: [
        'Data volume questions are almost always answered with "more than you think for behavior, less than you think for style". The shape of the curve is well-known and worth memorizing.',
      ],
      matrix: {
        caption: 'Rough data requirements by fine-tuning goal (SFT)',
        headers: ['Goal', 'Examples needed', 'What "good data" looks like', 'Common failure'],
        rows: [
          ['Voice / tone / format consistency', '50-500',                 'High-quality, hand-curated, exemplar pairs',   'Templated outputs with no diversity — model overfits the template'],
          ['Single narrow task (extraction, classification)', '500-5k',  'Real production examples with edge cases',    'Trained only on happy path; brittle in the wild'],
          ['Multi-task instruction tuning', '10k-100k',                   'Diverse instructions across many task types', 'Underrepresented task collapses to nearest neighbor'],
          ['New domain behavior (legal/medical reasoning)', '50k-500k',  'Domain experts validating each example',      'Cheap synthetic data drifts from real distribution'],
          ['Foundation behavior shift (alignment)', '100k+',              'Human preference rankings, not raw outputs',  'Reward hacking; model games the proxy'],
          ['Distillation from a teacher model', '5k-50k',                 'Teacher outputs filtered for quality',        'Inheriting the teacher\'s mistakes wholesale'],
        ],
      },
    },
    {
      heading: 'RLHF vs DPO vs KTO — the alignment lineage',
      body: [
        'RLHF (Reinforcement Learning from Human Feedback) was the original alignment recipe: train a reward model on ranked pairs, then optimize the LLM with PPO against the reward. It works but is famously unstable — three moving models, hyperparameter-sensitive, easy to collapse into mode-seeking behavior.',
        'DPO (Direct Preference Optimization) algebraically eliminates the reward model. You train directly on (prompt, chosen, rejected) triples with a single closed-form loss. It is dramatically simpler, more stable, and now the default for almost everyone who is not OpenAI or Anthropic. If a candidate suggests PPO/RLHF for a new project in 2026, ask why not DPO.',
        'KTO (Kahneman-Tversky Optimization) drops the paired comparison requirement. You only need binary thumbs-up / thumbs-down per output, which is what real production telemetry actually gives you. Use it when you have a flood of unary feedback rather than carefully ranked pairs.',
      ],
      callout: { kind: 'rule', text: 'Default to SFT first. Only reach for DPO when the SFT model is generating acceptable outputs but ranking them in the wrong order. Skipping SFT and going straight to preference tuning rarely works.' },
    },
    {
      heading: 'Distillation: the cost lever nobody uses enough',
      body: [
        'Distillation trains a small model on the outputs of a large one. You take a frontier model that nails your task, generate thousands of (input, output) pairs, then SFT a 7B or 13B model on that synthetic dataset. The result: 80-95% of the quality at 1/10th to 1/50th the inference cost.',
        'When it makes sense: high-volume inference paths where the marginal cost of the frontier model dominates the project budget. Classification, extraction, summarization, structured output generation, and routing decisions are textbook distillation targets.',
        'When it does not: open-ended reasoning, long-tail edge cases, or anything where the frontier model is itself sometimes wrong. Distillation amplifies the teacher\'s blind spots and adds new ones from compression.',
      ],
    },
    {
      heading: 'When fine-tuning beats RAG (and the inverse)',
      body: [
        'The cleanest way to defend the choice in an interview is to show you know exactly where each tool wins. There are real cases where fine-tuning is clearly correct, and real cases where it is clearly wrong.',
      ],
      matrix: {
        caption: 'When does fine-tuning beat retrieval?',
        headers: ['Scenario', 'Winner', 'Why'],
        rows: [
          ['Stable knowledge that rarely changes (taxonomy, fixed schema)', 'Fine-tune',  'Bake it into weights; no retrieval latency, no per-call tokens'],
          ['Knowledge that changes weekly or daily',                        'RAG',         'Re-fine-tuning has a turnaround time RAG indexing does not'],
          ['Latency-critical hot path (sub-200ms)',                         'Fine-tune',   'No retrieval roundtrip, smaller prompt = faster generation'],
          ['Citations required for compliance or trust',                    'RAG',         'Retrieval gives you the source pointer; weights do not'],
          ['Multi-tenant with per-user access control',                     'RAG',         'Filter retrieved chunks by ACL; weights leak across tenants'],
          ['Output style/format consistency at scale',                      'Fine-tune',   'SFT on exemplar pairs locks the format reliably'],
          ['Massive corpus (10M+ documents) the model must reason over',    'RAG',         'Cannot fit in weights; cannot fit in context'],
          ['Very high-volume inference where cost dominates',               'Fine-tune (smaller model)', 'Distillation + LoRA on a 7B beats running a frontier model per request'],
          ['Multi-hop questions across heterogeneous sources',              'RAG (agentic)', 'Decomposition and citation are retrieval-shaped problems'],
          ['Domain-specific refusal or safety patterns',                    'Fine-tune',   'Prompting is brittle; SFT or DPO bakes the refusal in'],
        ],
      },
    },
    {
      heading: 'Catastrophic forgetting and other ways fine-tuning silently breaks',
      body: [
        'Fine-tuning narrows the model. Every gradient step toward your task pushes the weights away from the broad capability distribution they started with. Push hard enough and the model forgets how to do things you never thought to test.',
        'A model fine-tuned on customer-support tickets will get better at customer-support tickets and worse at, say, JSON generation, code, math, and following instructions formatted differently from your training set. This is catastrophic forgetting, and it is not theoretical — it is the default outcome of overtraining on a narrow distribution.',
        'Defenses: (1) always evaluate on held-out general benchmarks (MMLU subset, IFEval, GSM8K) before and after, (2) prefer LoRA over full fine-tuning because the frozen base preserves general capability, (3) include a small slice of diverse instruction data in the training mix, (4) cap epochs aggressively — most SFT runs need 1-3 epochs, not 10.',
      ],
      callout: { kind: 'warn', text: 'A fine-tuned model that scores higher on your task evaluation but lower on general capability is a regression in disguise. Always run a general eval suite alongside the task eval.' },
    },
    {
      heading: 'The cost crossover model',
      body: [
        'The economics question that matters: at what request volume does fine-tuning a smaller model become cheaper than RAG over a frontier model? The answer is a crossover curve, not a single number.',
        'Fine-tuning has a fixed training cost (LoRA SFT on a 7B model: $50-500; full fine-tune on 70B: $5k-50k) plus a per-call inference cost on a smaller, cheaper model (often 5-20x cheaper per token than the frontier model). RAG has near-zero training cost but each call carries retrieval latency, embedding cost, and a larger prompt (retrieved context tokens).',
        'Rule of thumb for 2026 pricing: under ~10k requests/day, the training cost of fine-tuning rarely amortizes — stay on RAG with a frontier model. Above ~100k requests/day on a stable task, a distilled + fine-tuned smaller model usually wins decisively. Between those, model it explicitly with your real numbers; do not eyeball it.',
      ],
    },
    {
      heading: 'Hosted vs self-hosted fine-tuning',
      body: [
        'You have two paths. Hosted fine-tuning (OpenAI, Anthropic, Google, Cohere) takes a JSONL file of examples and returns a model id you call like any other. You give up control of base model choice, training hyperparameters, and inspection of the resulting weights, but you pay nothing up front and you ship in hours.',
        'Self-hosted fine-tuning on Hugging Face + LoRA on Llama, Mistral, Qwen, or Gemma gives you everything: weight ownership, hot-swappable adapters, deployment to your VPC, no per-token markup at inference. You pay for it with engineering time, GPU operations, and the responsibility for safety and evaluation.',
        'The senior pick: start hosted to validate the bet (does fine-tuning actually solve our problem at all?). Move self-hosted only when one of three things is true — volume justifies the inference savings, weight ownership is required by compliance, or you need adapter swapping that hosted APIs do not support.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three traps separate junior from senior answers in fine-tuning questions.',
      ],
      bullets: [
        'Trap 1 — "When would you fine-tune instead of RAG?" Junior answer: "for domain knowledge". Senior answer: name a concrete scenario — high-volume customer-support classification with stable taxonomy, sub-200ms latency budget, output schema enforcement, and no citation requirement. Defend each constraint as the reason RAG loses here.',
        'Trap 2 — "SFT vs DPO vs RLHF, when do I need each?" Junior answer treats them as alternatives. Senior answer: SFT first to teach the task, DPO second to teach the ordering of acceptable outputs, RLHF only if you are at frontier scale and have the infra to run it stably. Most teams never need RLHF.',
        'Trap 3 — "Team wants to fine-tune so the model stops hallucinating product specs." Senior answer: that is the wrong tool. Hallucinated facts come from missing grounding, not from a behavior the gradient can fix. Ship RAG over the product catalog with strict citation, then maybe SFT for output format. Fine-tuning facts into weights makes the problem worse on the next catalog change.',
      ],
    },
  ],
  keyTakeaways: [
    'Fine-tuning teaches HOW (style, format, behavior). RAG teaches WHAT (knowledge, citations). Prompting unlocks capability that already exists.',
    'LoRA + QLoRA is the production default — under 1% of parameters trained, 10-20x cheaper, hot-swappable adapters per tenant or task.',
    'SFT first, DPO second, RLHF almost never. Preference tuning is a polish step on top of an already-working SFT model.',
    'Catastrophic forgetting is the default outcome of overtraining. Always run general benchmarks alongside task evals.',
    'Distillation is the under-used cost lever: train a small model on a frontier model\'s outputs for high-volume narrow tasks.',
    'The fine-tune-vs-RAG crossover is a real curve, not a vibe — model it with your actual request volume before committing.',
  ],
  pitfalls: [
    'Fine-tuning to inject facts. Knowledge belongs in retrieval, not weights — it rots and cannot be cited.',
    'Skipping the held-out general benchmark. The model gets better at your task and worse at everything else, and you never notice.',
    'Going straight to DPO or RLHF without an SFT pass first. Preference tuning on a model that cannot do the task yet diverges or collapses.',
    'Using full fine-tuning when LoRA would have given 95% of the quality at 5% of the cost and 1% of the deployment complexity.',
    'Training for 10 epochs because "more is better". Most SFT runs peak at 1-3 epochs and overfit hard past that.',
    'Picking hosted fine-tuning APIs and assuming you can later self-host the same model — the weights are not yours.',
  ],
  relatedSlugs: ['rag', 'evaluation', 'lifecycle', 'token-optimization'] as Module['relatedSlugs'],
}
