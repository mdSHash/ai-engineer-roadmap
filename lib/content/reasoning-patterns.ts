import type { Module } from '../types'

export const reasoningPatternsModule: Module = {
  slug: 'reasoning-patterns' as Module['slug'],
  number: '09',
  title: 'Reasoning patterns — CoT, ToT, self-consistency, ReAct',
  tagline: 'When does "think step by step" help? When does it hurt? Why do reasoning models change the rules?',
  duration: '40 min read',
  level: 'Intermediate',
  intro:
    "Chain of thought, tree of thoughts, self-consistency, reflection, and the rise of reasoning models have changed how engineers prompt for hard problems. Most teams over-apply CoT and never measure if it actually helps. This module is the decision layer: which technique earns its cost, which is theatre, and how reasoning models invert most of the old advice.",
  sections: [
    {
      heading: 'The reasoning landscape in one paragraph',
      body: [
        'There are five reasoning techniques you must speak to fluently: zero-shot CoT (just say "think step by step"), few-shot CoT (show worked examples), self-consistency (sample N answers, majority vote), tree of thoughts (branch and prune), and ReAct (interleave reasoning with tool calls). On top of all of these sits a sixth thing — reasoning models like o1, o3, R1, and extended-thinking variants — which internalize CoT during training and behave differently from flagship chat models.',
        'The senior framing is not "which technique is best" but "which technique justifies its token, latency, and complexity cost on this task". Most teams skip the cost-benefit step entirely and ship CoT into every prompt because a 2022 paper said it helped on GSM8K.',
      ],
      callout: { kind: 'rule', text: 'CoT is not free. Every reasoning technique trades tokens, latency, or both for accuracy. If you cannot show the trade is worth it on your eval set, you are paying for theatre.' },
    },
    {
      heading: 'Zero-shot vs few-shot CoT — and why the lift is shrinking',
      body: [
        'Zero-shot CoT is the famous "Let\'s think step by step" prompt. It worked on GPT-3-class models because they had latent reasoning ability that was not surfaced by default; the prompt unlocked it. Few-shot CoT goes further by showing two or three worked examples in the prompt, which conditions the model on the format and the granularity of the steps.',
        'On modern flagship chat models (Sonnet, GPT-4-class), the lift from zero-shot CoT on common benchmarks has compressed. Some tasks gain 5-15 points; others gain nothing or regress. The lift on reasoning models is often negative — they already do CoT internally, and forcing an external format competes with their trained reasoning trace.',
        'The senior practice is to A/B test zero-shot vs few-shot vs no-CoT on your actual eval set before committing. The junior practice is to assume CoT helps because the original paper said so.',
      ],
    },
    {
      heading: 'When each technique earns its cost',
      body: [
        'Use this as the first-pass decision. Each row trades tokens for accuracy in a different way; pick by the failure mode of the cheaper option.',
      ],
      decisionRules: [
        { when: 'Task is simple lookup, classification, extraction, or summarization', pick: 'No CoT — direct answer', why: 'CoT adds latency and tokens for a task that does not benefit. Often makes the answer worse by encouraging confabulation.' },
        { when: 'Multi-step math, logic puzzles, planning over a few constraints', pick: 'Zero-shot CoT on a flagship chat model', why: 'Cheap, well-studied, and almost always positive on multi-step arithmetic and constraint problems.' },
        { when: 'Domain-specific reasoning with a non-obvious format (e.g. legal step decomposition)', pick: 'Few-shot CoT with 2-3 worked examples', why: 'Format conditioning matters more than reasoning unlock. Examples show the model what good steps look like in your domain.' },
        { when: 'Hard problems with a small, discrete answer space (math, multiple choice, tagging)', pick: 'Self-consistency: sample 5-10 CoT runs, majority vote', why: 'Variance reduction works because correct paths converge while wrong paths diverge. Only useful when you can vote on the answer.' },
        { when: 'The model needs external information or tools to answer', pick: 'ReAct (interleaved reason + act)', why: 'Pure CoT cannot fetch facts. ReAct lets the model reason about what it knows, retrieve what it does not, and continue.' },
        { when: 'The task is hard math, complex code generation, multi-step planning, formal proofs', pick: 'A reasoning model (o3, R1, extended thinking) — without CoT prompting', why: 'These models are trained to think internally. They beat flagship + CoT on the right tasks at 5-10x the cost.' },
        { when: 'You have an eval set and want to optimize a prompt programmatically', pick: 'DSPy or TextGrad', why: 'Hand-tuning prompts is a junior workflow once you have an eval. Treat the prompt as a parameter and optimize it.' },
      ],
    },
    {
      heading: 'The technique matrix',
      body: [
        'Memorize the rough cost shape of each. In an interview you should be able to say "self-consistency at N=5 costs 5x" without hesitation.',
      ],
      matrix: {
        caption: 'Reasoning technique cost-benefit at a glance',
        headers: ['Technique', 'Cost multiplier', 'Best on', 'Failure mode'],
        rows: [
          ['No CoT (direct)',          '1x',                       'Lookup, extraction, classification, simple Q&A',     'Multi-step problems where the model skips intermediate steps'],
          ['Zero-shot CoT',            '1.5-3x output tokens',     'Math, logic, multi-constraint planning',             'Reasoning models (degrades), simple tasks (overhead for nothing)'],
          ['Few-shot CoT',             '2-4x (longer prompt)',     'Domain-specific reasoning with non-obvious format',  'Format overfit — model parrots example structure even when wrong'],
          ['Self-consistency',         'N x (typically 5-10x)',    'Discrete answer spaces: math, MCQ, tagging',         'Free-form generation (no votable answer), reasoning models (already low variance)'],
          ['Tree of Thoughts',         '10-50x',                    'Search problems with cheap-to-evaluate states',      'Production cost. Almost never worth shipping; useful for research'],
          ['Reflection / self-critique', '2-3x per round',         'Code generation, writing tasks with clear quality criteria', 'Diminishing returns past 1-2 rounds; can introduce new errors'],
          ['ReAct',                    '2-10x (depends on tools)', 'QA over external systems, agents, tool-using tasks', 'Tool latency dominates; reasoning loops can spiral'],
          ['Reasoning model (no CoT)', '5-10x ($) + huge tokens',  'Math, code, formal reasoning, complex planning',     'Conversational tasks (over-deliberates), latency-sensitive paths'],
          ['Verifier + generator',     '~2x of generator',         'Code, math, structured outputs you can check',       'Tasks with no cheap verifier; trusting a weak verifier'],
        ],
      },
    },
    {
      heading: 'Self-consistency: the most misunderstood technique',
      body: [
        'Self-consistency means: sample the same CoT prompt N times at temperature greater than zero, then take the majority answer. The intuition is that there are many wrong reasoning paths but few right ones, so the right answer wins the vote even when individual samples are noisy.',
        'It only works when you can vote. Math problems, multiple choice, and tagging tasks have a discrete answer space — you can count "37" appearing four out of five times. Free-form generation does not vote: you cannot majority-vote a paragraph.',
        'The cost is N times the original. At N=10 on a problem that already used CoT, you are paying 10x for a typically 5-15 point lift. On a reasoning model, the lift collapses to almost zero because variance is already low. Use self-consistency on flagship models with discrete answers and an eval that says it helps.',
      ],
      callout: { kind: 'warn', text: 'A junior signal is recommending self-consistency on creative writing or open-ended chat. There is no answer to vote on. The technique requires a discrete answer space.' },
    },
    {
      heading: 'Tree of Thoughts: research-grade, rarely production-grade',
      body: [
        'Tree of Thoughts (ToT) explicitly branches at each reasoning step, evaluates the partial state with a value function (often the LLM itself), prunes weak branches, and continues. It is the LLM analog of beam search or A*.',
        'It produces real lifts on toy problems with cheap-to-evaluate states (Game of 24, crosswords, 8-puzzle). On open-ended real-world tasks the value function is unreliable and the cost balloons by 10-50x with limited and inconsistent gains.',
        'In production, the right answer is usually a structured ReAct loop or a planner-executor agent rather than ToT. Know the technique exists, know why it does not ship.',
      ],
    },
    {
      heading: 'ReAct: the bridge to agents',
      body: [
        'ReAct interleaves Thought, Action, and Observation. The model thinks, calls a tool, observes the result, and thinks again. Without the Action step, CoT is reasoning over what the model already knows; ReAct is reasoning over what it can find out.',
        'The pattern is the foundation of every modern tool-using agent. When you see "agent" in a system, the inner loop is almost always ReAct or a structured variant of it. The prompts have evolved (function calling, structured output, JSON-only modes) but the shape — reason, act, observe, repeat — has not.',
        'Failure modes: tool-call loops where the model retries the same broken action; reasoning that ignores observations; runaway token cost on multi-hop chains. The fix is usually budget caps (max steps), action validation, and forcing a final answer step.',
      ],
    },
    {
      heading: 'Reflection and self-critique: cap it at 2 rounds',
      body: [
        'Reflection has the model produce a draft, then critique its own output, then revise. It works well for code generation against tests, structured writing tasks with clear rubrics, and any task where bugs are easier to spot than to avoid.',
        'The big finding from years of empirical work: most of the gain comes in round one. Round two adds a little. Round three usually breaks even or regresses because the model starts second-guessing correct answers and introducing new errors.',
        'In production: cap at 1-2 rounds, gate further rounds on a cheap verifier (tests pass, schema validates, regex matches). Open-ended "reflect until you are confident" loops blow budgets.',
      ],
      callout: { kind: 'insight', text: 'The strongest version of reflection is generator + external verifier (compiler, tests, JSON schema, type checker). The verifier does not have to be an LLM. When it is not an LLM, reflection becomes near-deterministic and very cheap.' },
    },
    {
      heading: 'Reasoning models change the rules',
      body: [
        'o1, o3, DeepSeek R1, and extended-thinking modes are trained with reinforcement learning to produce long internal reasoning traces before answering. The thinking happens before any visible output. They typically emit 10k-100k internal thinking tokens on a hard problem, even if the final answer is one line.',
        'Two practical consequences. First, on math, code, and planning tasks they beat flagship + CoT by a wide margin and often exceed what self-consistency or ToT achieve at lower wall-clock cost. Second, they cost roughly 5-10x the equivalent flagship at output, because thinking tokens are billed and they generate a lot of them.',
        'They are bad at: short conversational tasks (over-deliberate), creative or stylistic writing (reasoning is the wrong axis), latency-critical paths (10-60s thinking is normal), and anything where the answer was already obvious.',
      ],
    },
    {
      heading: 'The most common reasoning-model anti-pattern',
      body: [
        'A team takes their existing flagship + CoT prompt and points it at o1 or R1. They keep the "Let\'s think step by step. Show your work." instructions. Quality drops, costs explode, latency triples. They blame the new model.',
        'What happened: the explicit CoT format competes with the model\'s trained reasoning trace. The model now thinks internally AND tries to produce a visible step-by-step output, doubling the work and confusing the policy. Reasoning models want short, declarative prompts that state the goal and constraints, not a CoT scaffold.',
      ],
      callout: { kind: 'warn', text: 'When migrating a prompt to a reasoning model: strip "think step by step", strip CoT few-shot examples, strip "show your reasoning", strip self-consistency loops. State the task and the answer format. Let the model think on its own.' },
    },
    {
      heading: 'Reasoning model vs flagship + CoT — the cost math',
      body: [
        'You will be asked to walk through this in interviews. Make the math concrete. Suppose flagship output is $15/M tokens and the reasoning model is $60/M output (typical 4x ratio at the top tier).',
        'A flagship + CoT call on a hard problem might generate 800 output tokens — say, $0.012. The same problem on a reasoning model might generate 30,000 thinking tokens plus 200 visible output, billed as ~30,200 output tokens — $1.81. That is roughly 150x for the single call.',
        'But: if the flagship needs self-consistency at N=10 to match accuracy, that is $0.12 vs $1.81 — still ~15x. And if the flagship cannot reach the required accuracy at any N (genuinely hard reasoning), the reasoning model is the only option at any price. The decision is "is the accuracy lift worth the multiple", and the multiple varies from 5x to 100x by task.',
      ],
    },
    {
      heading: 'Programmatic prompt optimization: DSPy and TextGrad',
      body: [
        'Once you have an eval set, hand-tuning prompts is a junior workflow. DSPy compiles a high-level program description into optimized prompts using your eval as the training signal — bootstrapping few-shot examples, tuning instructions, and selecting demonstrations. TextGrad treats the prompt as a parameter and uses LLM-generated "gradients" (textual critiques) to update it.',
        'When this is the right move: you have an eval with at least 50-200 examples, the task is non-trivial, and the prompt has surface area to optimize (multiple steps, retrievals, format choices). When it is not: you do not have an eval, or the prompt is one short instruction.',
        'These are not magic. They surface the right next experiment faster than humans typing variations into a chat box. Treat them as compilers, not oracles.',
      ],
    },
    {
      heading: 'Verification beats generation',
      body: [
        'A repeated finding across reasoning research: a fast generator paired with a separate verifier model often beats self-consistency at the same total cost. Generate 5 candidates with a small fast model, score them with a larger or specialized verifier, return the top one.',
        'Why it works: scoring is easier than producing. The verifier sees the whole candidate at once and can be tuned (or fine-tuned) for that specific scoring task. Generation has to be locally consistent at every token.',
        'When to reach for it: you have a clear notion of "correct" (tests, schema, factuality check, regex). When not: open-ended creative tasks where there is no clean scoring function. In those cases, fall back to reflection with a human-in-the-loop or A/B testing.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three traps separate junior from senior answers in reasoning-pattern questions.',
      ],
      bullets: [
        'Trap 1 — Self-consistency vs plain CoT, when neither? Senior answer: when the task has no discrete answer to vote on (creative writing, conversation), self-consistency is meaningless; when the task is a simple lookup or classification, even plain CoT is overhead. Direct prompting wins on both ends.',
        'Trap 2 — A junior adds "think step by step" to every reasoning-model prompt. What happens? Senior answer: explicit CoT scaffolding competes with the model\'s internal reasoning trace; thinking-token output bloats, quality typically drops or stays flat, latency triples, and cost rises. Strip CoT, state the goal and answer format, let the model think.',
        'Trap 3 — Reasoning model vs CoT-flagship cost math. Senior answer: walk through token economics. Flagship + CoT at ~1k output, reasoning model at ~30k thinking tokens, prices typically 4x apart at the output tier — net 100x+ per call. Self-consistency narrows the gap to 10-20x. The decision is whether the accuracy lift on the specific task class (math, code, planning) is worth that multiple, knowing reasoning models lose on conversational and creative work.',
      ],
    },
  ],
  keyTakeaways: [
    'CoT is not free. Measure the lift on your eval before shipping it everywhere; on modern flagships and reasoning models, the lift is often smaller or negative.',
    'Self-consistency only works on discrete answer spaces. N=5-10 costs that multiplier and adds 5-15 points on math, MCQ, and tagging tasks.',
    'Tree of Thoughts is research-grade. In production, prefer ReAct or a planner-executor agent.',
    'Reasoning models internalize CoT — strip explicit "think step by step" scaffolding when you migrate a prompt to o1, o3, or R1.',
    'Reflection caps at 1-2 rounds; pair it with an external verifier (tests, schema, types) whenever possible.',
    'A fast generator plus a verifier model often beats self-consistency at the same total cost when correctness is checkable.',
    'Once you have an eval set, treat the prompt as a parameter — DSPy and TextGrad optimize it for you.',
  ],
  pitfalls: [
    'Slapping "think step by step" on every prompt without measuring whether it helps on your eval.',
    'Running self-consistency on free-form generation tasks where there is no discrete answer to vote on.',
    'Migrating to a reasoning model while keeping the flagship CoT scaffolding — you pay 100x for worse output.',
    'Letting reflection loops run unbounded; round 3+ regresses while burning budget.',
    'Treating Tree of Thoughts as a production technique. The 10-50x cost rarely returns proportional accuracy.',
    'Choosing a reasoning model for latency-critical or conversational paths where its 10-60s thinking time is unacceptable.',
  ],
  relatedSlugs: ['prompting-for-code', 'evaluation', 'token-optimization', 'agents-and-tools'] as Module['relatedSlugs'],
}
