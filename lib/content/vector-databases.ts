import type { Module } from '../types'

export const vectorDbModule: Module = {
  slug: 'vector-databases',
  number: '02',
  title: 'Vector databases — picking the right one',
  tagline: 'Pinecone vs Qdrant vs pgvector vs Weaviate vs Milvus is not about features. It is about constraints.',
  duration: '35 min read',
  level: 'Foundations',
  intro:
    'Most engineers pick the vector DB they have heard of most. The senior move is to pick from constraints: scale, latency, hybrid search needs, operational profile, cost model, and what your team already runs. This module gives you the decision framework.',
  sections: [
    {
      heading: 'The five constraints that pick the database for you',
      body: [
        'Before naming a single vendor, write down these five numbers. They eliminate 80% of the choices.',
      ],
      bullets: [
        'Vector count: 100k, 10M, 1B? Different DBs scale differently — some collapse past 10M.',
        'Query QPS: 1/min for an internal tool vs 1000/sec for consumer-facing search.',
        'p95 latency budget: 50ms (search-as-you-type) vs 500ms (chat) vs 2s (background job).',
        'Filter complexity: pure vector search vs pre/post-filter on metadata vs hybrid lexical+vector.',
        'Operational model: SaaS-only OK? Self-hosted required? Existing Postgres? On-prem only?',
      ],
      callout: { kind: 'rule', text: 'In an interview, asking these five questions before naming a vendor is the senior signal. Don\'t name a tool until the constraints force the choice.' },
    },
    {
      heading: 'The shortlist (what you need to know cold)',
      body: [
        'You will be expected to speak intelligently about these in any AI engineering interview. Memorize the rough shape of each.',
      ],
      matrix: {
        caption: 'Snapshot of major vector databases as of 2025-2026',
        headers: ['Database', 'Hosted?', 'Sweet spot', 'Watch out for'],
        rows: [
          ['Pinecone',  'SaaS',                'Fast managed setup, serverless tier, simple API', 'Cost at scale, vendor lock-in, limited self-host'],
          ['Qdrant',   'OSS + cloud',          'Best filter performance, payload-rich, Rust-fast', 'Smaller community than competitors, fewer integrations'],
          ['Weaviate', 'OSS + cloud',          'Hybrid search out-of-box, modular, GraphQL',     'Heavier ops, schema rigidity'],
          ['Milvus',   'OSS + Zilliz cloud',   'Largest scale (billions), GPU acceleration',     'Operationally complex, overkill under 10M vectors'],
          ['pgvector', 'Postgres extension',   'Use existing Postgres, ACID, joins with metadata', 'Slower than dedicated DBs above ~10M vectors'],
          ['Chroma',   'OSS, embeddable',      'POC, local dev, in-process, easiest API',         'Not for production scale; missing distributed mode'],
          ['LanceDB',  'OSS, embedded',        'Edge deploys, on-disk columnar, multi-modal',    'Newer, smaller production track record'],
          ['Vespa',    'OSS + cloud',          'Massive scale + complex ranking, used by Yahoo', 'Steep learning curve, YAML-heavy config'],
          ['Elastic / OpenSearch', 'OSS + cloud', 'Existing ELK stack, hybrid lexical+vector',  'Vector search bolted on, less optimized than pure vector DBs'],
          ['Redis (HNSW module)', 'OSS + cloud', 'Already use Redis, low-latency, in-memory',    'Memory cost, persistence trade-offs'],
        ],
      },
    },
    {
      heading: 'Decision tree: which vector DB by scale',
      body: [
        'Scale is the strongest single signal. Use this as a starting point, then adjust for the other constraints.',
      ],
      decisionRules: [
        { when: 'Under 1M vectors, prototyping or internal tool', pick: 'Chroma, pgvector, or LanceDB', why: 'Operational simplicity wins. Don\'t pay infra tax for scale you don\'t have.' },
        { when: '1M-10M vectors, production app, already on Postgres', pick: 'pgvector with HNSW index', why: 'No new dependency, joins with relational data, transactional consistency. Past 10M, latency degrades.' },
        { when: '1M-50M vectors, no Postgres, want managed', pick: 'Pinecone serverless or Qdrant Cloud', why: 'Both scale here without operational headaches. Pinecone = simplest API; Qdrant = better filters.' },
        { when: '10M-100M vectors, self-hosted required', pick: 'Qdrant or Weaviate', why: 'Both run well in Kubernetes at this scale. Pick Qdrant for filter-heavy workloads, Weaviate for hybrid out-of-box.' },
        { when: '100M+ vectors or GPU-accelerated retrieval needed', pick: 'Milvus or Vespa', why: 'Designed for billion-scale. Higher operational cost is justified by what no one else can do.' },
        { when: 'Edge deployment or on-device inference', pick: 'LanceDB or sqlite-vss', why: 'Embedded, no server, runs on-device. Required for offline-first apps.' },
      ],
    },
    {
      heading: 'Filter performance is where DBs really differ',
      body: [
        'Vector search with metadata filters ("retrieve top-k from this user\'s docs only") looks identical in every DB\'s docs but performs very differently in practice.',
        'Two strategies exist: pre-filter (filter first, then vector search the subset) and post-filter (vector search the whole corpus, then drop non-matching). Pre-filter is fast on selective filters but slow on broad ones; post-filter is the opposite.',
        'The good DBs (Qdrant, Weaviate) decide automatically based on filter selectivity. The naive ones force you to choose, and get it wrong on edge cases. This is one of the most common production bottlenecks.',
      ],
      callout: { kind: 'warn', text: 'If your queries always filter by user_id or tenant, test filter performance before committing to a DB. A DB that excels on raw vector search can choke on filtered queries.' },
    },
    {
      heading: 'Indexing: HNSW vs IVF vs flat',
      body: [
        'You will be asked. Here is what you must know.',
      ],
      bullets: [
        'Flat (brute force): exact, fast under 100k vectors, slow above. Use for evaluation ground truth.',
        'HNSW (Hierarchical Navigable Small World): graph index, the production default. Fast queries, slow build, memory-hungry. Most DBs use this by default.',
        'IVF (Inverted File): clustered index, smaller memory footprint, slightly lower recall than HNSW. Good for very large corpora where memory matters.',
        'IVF-PQ (Product Quantization): compressed IVF, big memory savings (4-32x), recall hit. For billion-scale where memory is the bottleneck.',
        'DiskANN: graph index designed to live on SSD, not RAM. For 100M+ vectors at lower hosting cost.',
      ],
    },
    {
      heading: 'Cost model: where the surprise bills come from',
      body: [
        'Vector DB pricing has three traps that bite teams in production.',
      ],
      bullets: [
        'Storage tier: vectors are big (1536 floats * 4 bytes = 6KB per vector before metadata). 10M vectors = 60GB minimum. Pricing scales linearly with this.',
        'Read tier: serverless DBs charge per query. At 100 QPS, a "cheap" $0.0001/query becomes $260/day.',
        'Re-embedding cost: when you change embedder, you re-embed everything. For 10M chunks at $0.0001/embed = $1000 per migration. Plan for this.',
      ],
      callout: { kind: 'insight', text: 'Always estimate steady-state cost at projected scale before picking a DB. The "free tier" Pinecone is fine for POC but the per-query cost at 1000 QPS surprises teams.' },
    },
    {
      heading: 'pgvector: when "boring" is the right answer',
      body: [
        'pgvector turns Postgres into a vector DB. It is surprisingly good for the 1-10M range, and the operational story is unbeatable: backups, replication, point-in-time recovery, and joining vectors with relational data all just work.',
        'When to pick it: you already run Postgres, your scale is moderate, you need ACID guarantees, and your team is small.',
        'When to leave: past ~10M vectors, HNSW index size starts hurting. Latency p95 climbs above 100ms. At that point, move vectors out and keep metadata in Postgres.',
      ],
    },
    {
      heading: 'When to put a re-ranker in front, not switch DBs',
      body: [
        'Teams often migrate to a "better" vector DB when the real problem is precision, not recall. The cheaper fix is a cross-encoder re-ranker (Cohere Rerank, bge-reranker-large, Jina) over the top-50 candidates.',
        'Run the experiment: same DB, retrieve top-50 instead of top-5, re-rank to top-5. Often beats a DB migration at a fraction of the cost.',
      ],
    },
    {
      heading: 'Migration risks (this is what gets asked)',
      body: [
        'Vector DB migrations are usually painful for one of these reasons:',
      ],
      bullets: [
        'Embedder change required: different DBs prefer different embedding dimensions (1536 vs 768 vs 1024). Switching may force a re-embed.',
        'Index parameter drift: HNSW M and ef parameters do not map 1:1 across DBs. Recall changes silently.',
        'Filter syntax: each DB has its own DSL. Hundreds of filter expressions need rewriting.',
        'Eval drift: identical config can score differently. Always re-run the eval suite post-migration.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three traps to avoid in vector DB questions.',
      ],
      bullets: [
        'Trap 1 — "I would use Pinecone." Senior answer: ask the constraints first; pick by elimination, not familiarity.',
        'Trap 2 — Picking based on benchmarks alone. Benchmarks rarely match your filter pattern, query distribution, and write/read ratio. Always pilot.',
        'Trap 3 — Ignoring the embedding model. The DB cannot fix bad embeddings. Embedding quality dominates retrieval quality; DB choice is downstream.',
      ],
    },
  ],
  keyTakeaways: [
    'Vector count, QPS, latency, filter complexity, and ops model determine the DB. Pick by constraints, not by brand.',
    'pgvector wins below 10M vectors when you already run Postgres. Past that, dedicated DBs win.',
    'Filter performance is the silent killer in production — most DBs fail differently from their benchmarks here.',
    'Re-rankers fix precision problems cheaper than DB migrations.',
  ],
  pitfalls: [
    'Choosing Pinecone for the brand and being surprised by query costs at scale.',
    'Using Chroma in production (it is for prototyping; the distributed story is immature).',
    'Ignoring re-embedding cost when planning a migration or model upgrade.',
    'Treating HNSW M/ef parameters as black-box; they materially affect recall.',
  ],
  relatedSlugs: ['rag', 'chunking', 'evaluation'],
}
