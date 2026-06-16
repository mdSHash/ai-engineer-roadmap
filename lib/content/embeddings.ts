import type { Module } from '../types'

export const embeddingsModule: Module = {
  slug: 'embeddings' as Module['slug'],
  number: '10',
  title: 'Embeddings — what the vectors actually mean',
  tagline: 'Vector DBs, RAG, and chunking all sit on top of embeddings. Most engineers never learn what they are.',
  duration: '40 min read',
  level: 'Foundations',
  intro:
    'Embeddings are the object underneath every retrieval module. If you cannot explain what cosine similarity actually measures, why dimension counts differ across models, or what training objective produces a "good" embedder, you will lose any retrieval-deep interview. This module is the foundation that vector-databases and chunking assume.',
  sections: [
    {
      heading: 'What an embedding actually is',
      body: [
        'An embedding is a learned, dense, fixed-length vector representation of a piece of text. The promise is geometric: chunks that mean similar things land near each other in the vector space, and chunks that mean different things land far apart. "Near" and "far" are measured by a distance metric — usually cosine similarity.',
        'The vector itself is not human-readable. A 1536-dimensional embedding is just 1536 floating-point numbers, each one a coordinate along an axis the model invented during training. No single dimension corresponds to a human concept. Meaning lives in the arrangement of all dimensions together, which is why you cannot inspect a vector and reason about it directly.',
        'The senior framing: embeddings are a learned hash where the collision pattern is semantic similarity. That is the whole product. Everything else — vector DBs, ANN indexes, RAG pipelines — exists to exploit that one property at scale.',
      ],
      callout: { kind: 'insight', text: 'An embedding model is just a function from string to fixed-length float vector. Everything fancy you read about retrieval is downstream of how good that function is on your domain.' },
    },
    {
      heading: 'How embedders are actually trained',
      body: [
        'Modern text embedders are dual-encoder (also called bi-encoder) transformers trained with contrastive loss on pairs. You feed in a query and a positive document (semantically related) and a batch of negative documents (unrelated). The objective: pull the query and positive vector close together, push the query and negatives apart. Repeat over hundreds of millions of pairs.',
        'The data sources matter more than the architecture. Pairs come from question-answer datasets, query-clicked-result logs, paraphrase corpora, MS MARCO, NLI datasets, and synthetic LLM-generated pairs. The mix determines what kinds of similarity the model learns to encode. An embedder trained mostly on web Q&A will be weak on legal or biomedical text not because the math is different, but because it never saw those distributions.',
        'Hard negatives are the secret weapon. Random negatives are easy — any random sentence is obviously unrelated. The training signal that produces strong retrievers comes from "hard negatives": documents that look superficially relevant (same topic, similar phrasing) but are not the right answer. BGE, E5, and the modern OpenAI/Voyage/Cohere embedders all rely heavily on hard-negative mining.',
      ],
    },
    {
      heading: 'Similarity metrics: cosine, dot product, Euclidean',
      body: [
        'Three metrics show up in vector search. They are not interchangeable, and picking the wrong one against your embedder is a silent bug.',
      ],
      matrix: {
        caption: 'Pick the metric your embedder was trained for — do not improvise',
        headers: ['Metric', 'What it measures', 'When it is correct'],
        rows: [
          ['Cosine similarity', 'Angle between two vectors, ignoring magnitude', 'Default for normalized embeddings (OpenAI, Cohere, BGE, E5). Magnitude carries no signal.'],
          ['Dot product',       'Magnitude-weighted alignment',                   'When the embedder is normalized, dot product == cosine. When unnormalized, dot product also encodes "confidence" — used by some retrievers (e.g. ColBERT-style).'],
          ['Euclidean (L2)',    'Straight-line distance in vector space',         'Rare for text embeddings. Sometimes used in image embeddings (CLIP) where magnitude is meaningful.'],
          ['Manhattan (L1)',    'Sum of axis-wise differences',                   'Almost never the right answer for text. Listed only because interviewers sometimes ask.'],
        ],
      },
      callout: { kind: 'rule', text: 'If your embedder normalizes its outputs to unit length (most modern ones do), cosine similarity and dot product are mathematically identical. Use whichever is faster in your DB — usually dot product.' },
    },
    {
      heading: 'What cosine similarity actually computes',
      body: [
        'Cosine similarity between vectors a and b equals the dot product divided by the product of magnitudes. Geometrically, it is the cosine of the angle between the two vectors. Range is -1 to 1: identical direction is 1, orthogonal is 0, opposite direction is -1. In practice, on real embedders, almost everything sits between 0.0 and 1.0 because the model rarely produces directly opposed vectors.',
        'The trap: cosine similarity does not measure semantic relatedness directly. It measures geometric proximity in a learned space. The two only coincide when the model has been trained to make them coincide. On out-of-domain text — legal contracts to a general embedder, code to a text embedder, medical jargon to a web embedder — the geometry no longer matches the semantics, and high cosine scores can be meaningless.',
        'A second trap: absolute cosine values are not comparable across embedders. A score of 0.82 is "very similar" in one model and "barely related" in another. Always calibrate against your own corpus before treating cosine numbers as confidence.',
      ],
    },
    {
      heading: 'Dimensionality: why 768, 1536, 3072, and what to truncate',
      body: [
        'Common embedding sizes you should know cold: 384 (MiniLM, old BGE-small), 768 (BERT-base, BGE-base, E5-base), 1024 (Cohere v3, BGE-large), 1536 (OpenAI text-embedding-3-small, ada-002), 3072 (OpenAI text-embedding-3-large), 4096 (some Voyage and Llama-derived embedders).',
        'More dimensions usually means more capacity, but with diminishing returns and rising cost. Each dimension is 4 bytes (float32) or 2 bytes (float16). At 10M vectors, 1536 dims = 60GB; 3072 dims = 120GB. That is real money on a managed vector DB.',
        'Matryoshka Representation Learning (MRL) is the modern fix. The model is trained so that the first N dimensions of the full vector are themselves a usable, lower-dimensional embedding. OpenAI text-embedding-3 supports this: you ask for 3072 dims, then truncate to 1024 or 512 with minor recall loss. This is how you cut storage and ANN cost without re-embedding the corpus.',
      ],
      callout: { kind: 'insight', text: 'Matryoshka truncation is the cheap upgrade most teams miss. Re-embed once at full dimension, then experiment with 256, 512, 1024 for storage savings — the recall hit is often under 2%.' },
    },
    {
      heading: 'Domain mismatch: where general embedders quietly fail',
      body: [
        'A general-purpose embedder is trained on a roughly web-distributed mix of text. Drop it on medical records, legal contracts, financial filings, or source code, and the geometry collapses. Documents about completely different concepts cluster together because the model only recognizes the surface vocabulary, not the domain semantics. Recall and precision both fall, often without throwing any error.',
        'The diagnosis is simple: pick 50 query-document pairs from your domain that you know are correct matches, embed them, and check the cosine distribution. If "obvious" matches score 0.6 and obvious non-matches score 0.55, your embedder is not separating signal from noise on this domain.',
        'The fix path, in order of cost: try a domain-specific open embedder (BGE-medical, CodeBERT-style, legal-bert), then try a stronger general model (Voyage, Cohere v3 with input_type), then fine-tune an open embedder on your own pairs. Fine-tuning a 768-dim BGE on 5-10k of your own pairs is a weekend job and routinely beats anything off the shelf.',
      ],
    },
    {
      heading: 'Symmetric vs asymmetric retrieval',
      body: [
        'Most retrieval is asymmetric: a short query (5-10 tokens) needs to match a long document chunk (200-500 tokens). The two text distributions are different, and naively embedding both with the same prompt produces miscalibrated similarity.',
        'Modern embedders address this with input prefixes or input_type parameters. E5 uses "query: " and "passage: " prefixes. Cohere v3 takes input_type="search_query" or "search_document". Voyage takes input_type="query" or "document". OpenAI text-embedding-3 does not require it but accepts it. The model produces slightly different vectors for the same string depending on its role.',
        'Symmetric retrieval — duplicate detection, clustering, paraphrase mining — uses the same encoding for both sides. If you confuse these, retrieval quality silently degrades. A junior signal is treating queries and documents as the same kind of input. A senior signal is asking which mode applies before picking the embedder.',
      ],
      callout: { kind: 'warn', text: 'If you are using E5, BGE, or Cohere embed-v3 without setting the query vs document prefix correctly, you are leaving 5-15% recall on the table. Check your embedding code, not your prompt.' },
    },
    {
      heading: 'Bi-encoder vs cross-encoder',
      body: [
        'A bi-encoder embeds query and document independently and compares vectors. This is what every "embedding model" is. It scales because document embeddings are precomputed and reused — at query time you embed once and run a vector search.',
        'A cross-encoder takes the query and document together as a single input and outputs a relevance score directly. It is far more accurate because it can model token-level interactions between the two — but you cannot precompute anything. Every (query, candidate) pair is a fresh forward pass.',
        'The production pattern: bi-encoder for retrieval (top-50 from millions of docs in milliseconds), cross-encoder re-ranker for precision (re-score the top-50 to top-5 in 100-300ms). Cohere Rerank, bge-reranker-v2, and Jina rerankers are all cross-encoders. Treating them as interchangeable with embedders is a junior mistake — they cannot be used for index-time search at all.',
      ],
    },
    {
      heading: 'The embedder shortlist (know these cold)',
      body: [
        'You will be asked to name embedders in any retrieval-shaped interview. Memorize the rough shape of each.',
      ],
      matrix: {
        caption: 'Major embedders as of 2025-2026',
        headers: ['Embedder', 'Dims', 'Sweet spot', 'Watch out for'],
        rows: [
          ['OpenAI text-embedding-3-small', '1536 (truncatable)', 'Default for most teams; cheap, MRL-enabled, strong general performance', 'Closed model, per-token API cost adds up at billions of chunks'],
          ['OpenAI text-embedding-3-large', '3072 (truncatable)', 'Higher quality general retrieval, MRL truncation supported',           'Storage cost; gain over -small is modest on most domains'],
          ['Cohere embed-v3 (English / multilingual)', '1024',     'Strong with input_type prefixes, multilingual is best-in-class',     'Closed model; v4 will likely deprecate v3 — plan migrations'],
          ['Voyage voyage-3 / voyage-3-large', '1024 / 2048',      'Top of MTEB at the time; voyage-code for code retrieval',            'Smaller ecosystem than OpenAI/Cohere'],
          ['BGE (BAAI) bge-large-en-v1.5 / bge-m3', '1024 / 1024', 'Open-weight, fine-tunable, bge-m3 multilingual + dense + sparse',     'Tokenizer choice matters; M3 is heavier than v1.5'],
          ['E5 (Microsoft) e5-large-v2 / multilingual-e5', '1024', 'Open, well-documented, requires "query:"/"passage:" prefixes',        'Old-ish; newer BGE/Voyage often outperform'],
          ['Jina embeddings v3', '1024 (MRL)',                     'Long context (8k tokens), task-specific LoRA adapters',               'Newer, less battle-tested at billion scale'],
          ['Nomic embed-text-v1.5', '768 (MRL)',                   'Open weights and open data, MRL truncation, strong cost/perf',        'Smaller dim ceiling; fine for most retrieval'],
          ['CodeBERT / unixcoder / voyage-code-2', 'varies',       'Code-specific embeddings — required for code search',                 'Do not use general text embedders for code; quality collapses'],
        ],
      },
    },
    {
      heading: 'Decision: which embedder to start with',
      body: [
        'Start by elimination. The right embedder is rarely the most powerful one — it is the one matched to your domain, scale, and operational profile.',
      ],
      decisionRules: [
        { when: 'POC or general English text under 1M chunks', pick: 'OpenAI text-embedding-3-small at 1536 dims', why: 'Cheapest path to a working baseline. MRL means you can truncate later without re-embedding.' },
        { when: 'Production English retrieval, cost-sensitive at 10M+ chunks', pick: 'BGE-large-en-v1.5 or Nomic embed-text-v1.5, self-hosted', why: 'Open weights eliminate per-token API spend; quality is competitive with closed models on general English.' },
        { when: 'Multilingual retrieval is required', pick: 'Cohere embed-multilingual-v3 or bge-m3', why: 'These models were trained explicitly on multilingual pairs. OpenAI works but is weaker on lower-resource languages.' },
        { when: 'Code retrieval (repo Q&A, code search)', pick: 'voyage-code-2 or a CodeBERT-family open model', why: 'General text embedders treat identifiers as noise. Code-specific models encode syntax and identifier structure.' },
        { when: 'Domain is medical, legal, or biomedical', pick: 'Domain open model first (e.g. BGE-medical, BioBERT-derived) or fine-tune BGE on your pairs', why: 'General models miscluster jargon. A weekend of fine-tuning beats any closed model on niche domains.' },
        { when: 'Long-document retrieval (chunks above 512 tokens)', pick: 'Jina v3 (8k context) or chunk smaller', why: 'Most embedders truncate at 512 tokens silently. Either pick a long-context embedder or fix the chunker.' },
      ],
    },
    {
      heading: 'MTEB: the benchmark that misleads if you read it wrong',
      body: [
        'MTEB (Massive Text Embedding Benchmark) is the standard leaderboard. It evaluates embedders across retrieval, classification, clustering, re-ranking, and STS tasks across many datasets. Every new embedder claims an MTEB score.',
        'The trap: MTEB is dominated by web-style English text. A model topping MTEB by 0.5 points may be worse on your legal corpus, your code corpus, or your customer-support tickets. The retrieval subset is what matters for RAG, not the overall average — but most blog posts quote the overall.',
        'The senior move: treat MTEB as a shortlist filter, never as a final answer. Pick the top 5 embedders on the retrieval subset, then evaluate all five on your own labeled pairs. The model that wins on your eval set wins, regardless of MTEB ranking.',
      ],
      callout: { kind: 'warn', text: 'A model that is 1.5 points better on MTEB but 8 points worse on your domain is a bad choice. Always evaluate on your data before committing.' },
    },
    {
      heading: 'Embedding migration: the hidden cost of "just switch models"',
      body: [
        'Switching embedders is not a config change. Embeddings from model A and embeddings from model B are not comparable — they live in completely different vector spaces, with different dimensionality, different norms, and different geometric meaning. There is no projection between them. Migration means re-embedding the entire corpus.',
        'For 50M chunks at OpenAI text-embedding-3-small ($0.02 per 1M tokens, ~250 tokens per chunk on average) the bill is roughly $250 in API spend, plus the engineering time of running the pipeline, plus the storage cost of keeping both indexes hot during cutover. For 500M chunks it is $2,500 plus a much harder cutover.',
        'The plan: dual-write to a shadow index for the new embedder, run a recall@k eval on a held-out set to confirm the new model is actually better, slowly shift query traffic, and only delete the old index after a confidence window. Treating embedder migration as a routine change is how teams ship recall regressions to production.',
      ],
      callout: { kind: 'rule', text: 'Pick your embedder with migration cost in mind. The right model on day one is worth more than the best model on day 365 — because by then, switching costs real engineering and real money.' },
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three traps separate junior from senior answers in embedding-shaped questions.',
      ],
      bullets: [
        'Trap 1 — Asked to walk through what happens when you call an embedding endpoint. Junior answer: "it returns a vector". Senior answer: tokenizer turns text into token ids, ids run through a transformer (dual-encoder, trained with contrastive loss on positive/negative pairs), the final hidden state is pooled (mean, CLS, or last-token) and projected to the output dim, the output is L2-normalized, you get back N floats — and the geometry of those floats was shaped by the training pairs the model saw.',
        'Trap 2 — Asked why cosine similarity works as a measure of semantic relatedness. Junior answer: "because similar things are close in vector space". Senior answer: cosine measures the angle between two learned representations; it works only because the embedder was explicitly trained to make semantically related pairs angularly close. It breaks on out-of-domain text, on non-normalized vectors, when comparing absolute scores across models, and when the data distribution at inference no longer matches what the model trained on.',
        'Trap 3 — Asked how to decide whether to switch embedding models given 50M existing chunks. Junior answer: "compare MTEB scores". Senior answer: build a labeled eval set from production traffic, score current model and candidate models on recall@k and MRR, estimate re-embedding cost (API spend + engineering + dual-index storage), estimate quality lift in absolute terms not benchmark points, plan a dual-write shadow index migration, and only commit if the lift on your eval — not MTEB — justifies the spend.',
      ],
    },
  ],
  keyTakeaways: [
    'An embedding is a learned dense vector where geometric proximity approximates semantic similarity, produced by a dual-encoder trained with contrastive loss on positive and negative pairs.',
    'Cosine similarity is the default metric and equals dot product on normalized embeddings — but absolute cosine values are not comparable across models or domains.',
    'Dimensionality is a cost-quality tradeoff; Matryoshka embedders let you truncate the same vector to smaller dimensions without re-embedding the corpus.',
    'Bi-encoders are for retrieval at scale; cross-encoders are for re-ranking the shortlist. They are not interchangeable.',
    'Domain mismatch is the silent killer — a general embedder on legal, medical, or code corpora collapses recall without throwing any error.',
    'MTEB is a shortlist filter, never a final answer. Always evaluate candidate embedders on your own labeled pairs before committing.',
    'Embedder migration means re-embedding everything; plan the cost, the dual-index cutover, and the eval comparison before switching.',
  ],
  pitfalls: [
    'Treating queries and documents symmetrically when the embedder expects asymmetric prefixes (E5, BGE, Cohere v3) — silent recall loss.',
    'Comparing absolute cosine scores across different embedders or different corpora and treating them as confidence numbers.',
    'Picking an embedder by MTEB ranking without evaluating on your domain — the leaderboard is biased toward web English.',
    'Using a general text embedder for code, medical, or legal corpora and being surprised when retrieval underperforms.',
    'Forgetting that embedder switches force a full re-embed — no projection exists between two models\' vector spaces.',
    'Ignoring tokenizer truncation (most embedders cap at 512 tokens) — long chunks are silently cut off, losing tail content from the embedding.',
  ],
  relatedSlugs: ['vector-databases', 'rag', 'chunking', 'evaluation'] as Module['relatedSlugs'],
}
