import type { Module } from '../types'

export const llmInternalsModule: Module = {
  slug: 'llm-internals' as Module['slug'],
  number: '01',
  title: 'How LLMs actually work',
  tagline: 'Tokens, attention, KV cache, sampling. Every other module assumes you know this.',
  duration: '50 min read',
  level: 'Foundations',
  intro:
    'You cannot reason about latency, cost, or context windows without a working model of what the LLM is actually doing token-by-token. This module is the missing prerequisite that the rest of the curriculum assumes. By the end you should be able to answer "why is decode slower than prefill" cold.',
  sections: [
    {
      heading: 'Tokens are not words and not characters',
      body: [
        'An LLM does not see your prompt as text. It sees a sequence of integer IDs, each one a token from a fixed vocabulary of roughly 50k-200k entries. Tokenization happens before the model ever runs, and it is lossy in ways that bite you later.',
        'Most modern tokenizers use Byte-Pair Encoding (BPE) or a variant. The training procedure starts from raw bytes and greedily merges the most frequent adjacent pairs until the vocabulary fills. The result: common English words get one token, rare words get split, code and non-English text get more tokens per character, and whitespace and casing matter — "Hello", " Hello", and "hello" are usually three different tokens.',
        'Concrete: "unhappiness" tokenizes to roughly three tokens (something like "un" + "happi" + "ness") on cl100k. A UUID is 10-15 tokens. A single Chinese character is often 2-3 tokens. JSON keys repeat across a payload but each repetition still costs tokens. Your token count is rarely what you guess from word count.',
      ],
      callout: { kind: 'rule', text: 'Always count tokens with the same tokenizer the target provider uses. cl100k for older OpenAI, o200k for newer OpenAI models, the Claude tokenizer for Anthropic, SentencePiece for many open models. A character-based estimate is wrong by 30-50% on code and non-English text.' },
    },
    {
      heading: 'Why the tokenizer choice changes your bill',
      body: [
        'Two providers can quote the same per-token price and still cost different amounts for the same prompt, because their tokenizers carve up text differently. Newer tokenizers like o200k pack non-English text and code more efficiently than older cl100k — sometimes 20-30% fewer tokens for the same input.',
        'This matters for budgeting and for fairness comparisons. If you benchmark provider A against provider B on cost-per-query, run both with their own tokenizers. Counting tokens with cl100k and assuming Anthropic charges the same way will give you a wrong answer in either direction.',
      ],
    },
    {
      heading: 'Inference has two phases, and they are nothing alike',
      body: [
        'When you send a prompt, the model runs in two distinct phases with completely different performance characteristics. Conflating them is the most common reason teams misdiagnose latency.',
        'Prefill is what happens to your input prompt. The model processes all N input tokens in parallel through every transformer layer once. This is matrix-matrix multiplication, dense, and compute-bound — the GPU is the bottleneck, not memory bandwidth. Prefill is fast per token but only happens once per request.',
        'Decode is what happens for each output token. The model generates one token, appends it to the sequence, then runs again to generate the next. This is matrix-vector multiplication, sequential, and memory-bound — the bottleneck is reading the model weights from HBM into compute, not the compute itself. Each output token requires a full pass through the model.',
      ],
      callout: { kind: 'insight', text: 'Prefill is parallel and compute-bound. Decode is serial and memory-bound. This single distinction explains TTFT vs TPOT, why streaming exists, why output tokens cost more, and why long contexts are expensive to serve.' },
    },
    {
      heading: 'Phase characteristics matrix',
      body: [
        'Memorize this. Most production latency questions reduce to picking which row applies.',
      ],
      matrix: {
        caption: 'Prefill vs decode at inference time',
        headers: ['Property', 'Prefill', 'Decode'],
        rows: [
          ['What happens', 'Process all input tokens', 'Generate one output token at a time'],
          ['Parallelism', 'All N tokens in parallel', 'Strictly sequential, one at a time'],
          ['Bottleneck', 'GPU compute (FLOPs)', 'GPU memory bandwidth (HBM reads)'],
          ['Math shape', 'Matrix-matrix multiply', 'Matrix-vector multiply'],
          ['Affects', 'Time to first token (TTFT)', 'Time per output token (TPOT)'],
          ['Scales with', 'Input length, quadratically past a point', 'Output length, linearly'],
          ['Batches well?', 'Yes, naturally', 'Only with continuous batching tricks'],
          ['Caching helps', 'Prompt caching reuses prefill work', 'KV cache reuses past attention work'],
        ],
      },
    },
    {
      heading: 'The KV cache is why long contexts get expensive',
      body: [
        'During decode, the model needs to attend to every previous token. Naively this would mean recomputing key and value projections for the entire sequence on every new token — quadratic work for a sequential phase. Instead, the runtime stores the keys and values from each layer in a per-request buffer called the KV cache, and only computes K and V for the new token.',
        'The KV cache grows linearly with context length. For a typical model: roughly 2 (K and V) * num_layers * hidden_size * 2 bytes per token. For a Llama-class 70B model, that is on the order of 0.5-1 MB per token of context. A 100k token context holds 50-100 GB of KV cache for a single request. This is why long-context serving is dominated by memory, not compute.',
        'Prompt caching offered by providers is exactly the persisted KV cache for a prompt prefix, reused across requests. That is why cached tokens are 5-10x cheaper than fresh input tokens — the prefill work is already done and the KV cache is already populated. It also explains why the cache key is prefix-sensitive: change one token early in the prompt and you invalidate everything after it.',
      ],
      callout: { kind: 'warn', text: 'Reordering messages or dynamically inserting timestamps near the start of a prompt destroys prompt caching. Put stable content (system prompt, tool definitions, long documents) at the start; put volatile content (user turn) at the end.' },
    },
    {
      heading: 'Attention is O(n^2), and you can feel it past 100k',
      body: [
        'The self-attention operation compares every token to every other token, which is quadratic in sequence length. Modern serving stacks use techniques like FlashAttention to make the constant much smaller and to avoid materializing the n-by-n matrix in HBM, but the asymptotic shape is unchanged.',
        'Practical consequence: prefill cost grows roughly linearly with context up to some threshold (where attention is dominated by other linear-in-n work), then begins to bend toward quadratic past 50-100k tokens. By 500k-1M tokens, attention is the dominant cost. This is the real reason providers price long-context tiers above standard input tokens, and why "stuff everything in the context window" stops being economic past a point.',
        'Decode cost grows roughly linearly with the cached context length per output token, because the new token attends to all previous tokens in the cache. So 200k of context plus 1k of output is meaningfully more expensive per output token than 5k of context plus 1k of output, even though the model and output length are identical.',
      ],
    },
    {
      heading: 'Sampling: how the model actually picks the next token',
      body: [
        'The model output at each decode step is a vector of logits — one real number per vocabulary entry. Softmax turns it into a probability distribution. Sampling parameters reshape that distribution before the runtime draws from it.',
        'Temperature divides logits before the softmax. Temperature 0 collapses to argmax (always pick the highest-probability token). Temperature 1 leaves the distribution unchanged. Temperature 2 flattens it (more random). Temperature only matters relative to the distribution\'s sharpness — on confident steps it changes little; on uncertain steps it changes a lot.',
        'Top-k truncates to the k highest-probability tokens before sampling. Top-p (nucleus) keeps the smallest set whose probabilities sum to p. Both are guards against the long tail of low-probability tokens that produce nonsense. Logprobs are the raw log-probabilities the model assigned to each candidate, exposed by the API for analysis or for confidence-aware downstream logic.',
      ],
    },
    {
      heading: 'Sampling decision rules',
      body: [
        'Pick by what you need the output for. Defaults that "feel safe" are often wrong for the task.',
      ],
      decisionRules: [
        { when: 'Structured outputs, JSON, code, function arguments', pick: 'temperature 0, no top-p truncation', why: 'You want the most likely token. Variance hurts schema compliance and reproducibility.' },
        { when: 'Factual Q&A over retrieved documents', pick: 'temperature 0-0.2', why: 'Determinism and faithfulness beat creativity. Hallucination correlates with temperature.' },
        { when: 'Drafting prose, brainstorming, marketing copy', pick: 'temperature 0.7-1.0, top-p 0.9-0.95', why: 'You want diverse outputs across runs. Low temperature here produces flat, repetitive prose.' },
        { when: 'Need diverse candidates for re-ranking or self-consistency', pick: 'temperature 0.7+, run n samples in parallel', why: 'Diversity is the point. Then pick the best with a verifier or majority vote.' },
        { when: 'You want confidence scores for downstream routing', pick: 'request logprobs alongside the response', why: 'Token-level logprobs let you flag low-confidence answers for human review or fallback.' },
      ],
    },
    {
      heading: 'Determinism is a lie at temperature 0',
      body: [
        'Setting temperature to 0 makes sampling deterministic — the runtime picks the argmax token. But the underlying inference is not deterministic across requests, even with identical inputs. Two effects cause this.',
        'First, batch effects: the inference server batches your request with other concurrent requests. The exact reductions performed during attention depend on the batch composition, and floating-point addition on GPU is not associative — (a + b) + c can differ in the last bits from a + (b + c). Most of the time these tiny differences do not change the argmax token, but on a knife-edge step where two tokens have nearly equal logits, they do, and the sampled token diverges.',
        'Second, GPU non-associativity in matrix multiplications and reductions means even single-stream inference can drift across hardware generations or driver versions. The implication for testing is concrete: do not rely on byte-equal output to detect regressions. Build evals on semantic properties — schema validity, contains-fact, accuracy on a labeled set — not on exact-string match.',
      ],
      callout: { kind: 'warn', text: 'If your eval harness asserts string equality on LLM outputs, it will produce flaky failures even at temperature 0. Replace with semantic checks before you trust the green builds.' },
    },
    {
      heading: 'Parametric memory and the knowledge cutoff',
      body: [
        'What the model "knows" without any retrieval lives in its weights, baked in during pretraining. This is parametric memory. It is impressively broad but has three structural limits: it stops at the training data cutoff, it cannot include private or recent information, and the model cannot tell you confidently which facts it actually memorized versus which it is plausibly fabricating.',
        'This is the foundation of the RAG-vs-fine-tune-vs-long-context decision. RAG injects fresh or private information into the context per query. Fine-tuning bakes new patterns into the weights but is poor at injecting facts (the model overfits to surface form, not ground truth). Long context lets you supply information just-in-time without an index. Each is a way to compensate for what parametric memory cannot do.',
        'A senior framing in interviews: parametric memory is for skills, retrieval is for facts. Use fine-tuning to teach the model how to do something it cannot do; use RAG when the facts change or are private; use long-context as a one-off when the corpus is small.',
      ],
    },
    {
      heading: 'Context window vs effective context',
      body: [
        'The marketed context window is the maximum number of tokens the model accepts. The effective context is the number of tokens it can reliably use. These are different numbers, often by a wide margin.',
        'The well-documented "lost in the middle" effect: models attend more reliably to information at the start and end of the prompt, and degrade in the middle. The shape and severity varies by model and by training, but the effect persists even on models advertised at 1M tokens. By the time you cross 100k tokens, retrieval precision matters more than recall — putting the right chunk in the prompt beats putting many chunks in the prompt.',
        'Practical implication: do not let the context window dictate your retrieval strategy. Retrieve fewer, more precise chunks. Place the most important information at the start of the system prompt or immediately before the user question, not buried in the middle of a 200k-token document dump.',
      ],
    },
    {
      heading: 'Why output tokens cost 3-5x input tokens',
      body: [
        'Look at any major provider\'s pricing and output tokens cost meaningfully more than input tokens — usually 3-5x. This is not a margin choice; it is a direct reflection of the prefill-vs-decode asymmetry.',
        'Input tokens go through prefill, which is parallel and compute-bound. The serving system processes thousands of input tokens per GPU-second because it can keep tensor cores saturated with large matrix multiplications. The marginal cost per input token is low.',
        'Output tokens go through decode, which is serial and memory-bound. Each output token requires reading the entire model\'s weights from HBM. The serving system\'s throughput per GPU is measured in tokens-per-second per request, not thousands. The marginal cost per output token is dominated by memory bandwidth, which is the scarcest GPU resource. The 3-5x ratio is what falls out of the hardware physics, with batching and continuous-batching tricks softening it as much as is possible.',
      ],
    },
    {
      heading: 'Streaming is a UX trick, not a cost trick',
      body: [
        'Streaming sends each output token to the client as it is decoded, rather than buffering until the full response is done. The total latency from request-start to last-token is unchanged. The total cost is unchanged. What changes is that the user sees a fast TTFT and a continuous flow of tokens, which feels much faster than the same wall-clock latency delivered as a single payload at the end.',
        'When streaming hurts: any pipeline that needs the full response before doing anything (parsing JSON, validating schema, feeding into a downstream model). Streaming there adds complexity and forces you to handle partial outputs without saving any latency on the critical path.',
        'When streaming helps: chat UIs, long-form generation where the user reads as it generates, agent traces where the user wants to see reasoning unfold. Treat it as a UX feature with no cost or latency benefit, and decide on those grounds.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three traps that distinguish a mechanistic understanding from a hand-wavy one.',
      ],
      bullets: [
        'Trap 1 — "Why are output tokens 3-5x more expensive than input tokens?" Junior answer: providers charge more for output. Senior answer: prefill is parallel and compute-bound; decode is serial and memory-bound, requiring a full HBM read of model weights per token. The pricing reflects the hardware cost.',
        'Trap 2 — "Walk me through what happens between sending a 5k-token prompt and getting the first token, then subsequent tokens." Senior answer: tokenize, prefill all 5k tokens in parallel through every layer (compute-bound), populate KV cache, sample first token from the final-layer logits (this point is TTFT). For each subsequent token: matrix-vector pass through every layer using the cached K/V plus new K/V for the just-generated token, sample, append. TPOT is governed by HBM bandwidth and KV cache size.',
        'Trap 3 — "If I cut my prompt from 8k to 2k tokens, will latency drop 4x?" Senior answer: no. Prefill latency drops roughly proportionally (4x faster prefill, so faster TTFT), but decode latency dominates total wall-clock for any non-trivial output. If output is 500 tokens, decode time is unchanged and the total drops only by the prefill savings. Decode also gets slightly faster because the KV cache is smaller, but the effect is much weaker than the input-length ratio suggests.',
      ],
    },
  ],
  keyTakeaways: [
    'Prefill is parallel and compute-bound; decode is serial and memory-bound. This single asymmetry explains TTFT vs TPOT, output-token pricing, and KV cache importance.',
    'The KV cache grows linearly with context and is what providers persist for prompt caching. Stable prefix, volatile suffix is the rule for cache hits.',
    'Attention is O(n^2) — past 100k tokens the cost curve bends, and effective context degrades faster than the marketed window suggests.',
    'Temperature 0 is not deterministic across requests — batch effects and GPU non-associativity break byte-equal eval assumptions.',
    'Output tokens cost 3-5x input tokens because decode reads the entire model from HBM per token; this is hardware physics, not pricing strategy.',
    'Streaming hides latency for the user; it does not reduce wall-clock time or cost.',
  ],
  pitfalls: [
    'Estimating tokens from word or character count instead of using the provider\'s actual tokenizer — wrong by 30-50% on code and non-English.',
    'Inserting timestamps or per-request IDs near the start of a system prompt and wondering why prompt caching never hits.',
    'Asserting exact-string equality in LLM evals at temperature 0 — flaky failures from batch-effect drift, not real regressions.',
    'Assuming a 1M-token context window means you can dump 1M tokens of docs and the model will use them — lost-in-the-middle still applies.',
    'Cutting input tokens by 4x and expecting 4x latency reduction — decode dominates total time once output exceeds a few hundred tokens.',
    'Treating streaming as a way to reduce cost or total latency rather than a UX-only optimization for perceived speed.',
  ],
  relatedSlugs: ['rag', 'token-optimization', 'bottlenecks', 'evaluation'] as Module['relatedSlugs'],
}
