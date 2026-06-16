import type { InterviewQuestion } from '../types'

export const interviewRag: InterviewQuestion[] = [
  {
    id: 'rag-001',
    category: 'RAG',
    difficulty: 'Mid',
    scenario: 'A customer wants RAG over 100 PDFs that change daily. Their queries mix keyword (product codes) and conceptual ("how do I cancel"). Latency budget is 800ms p95, monthly query volume is 500k. Walk me through your stack.',
    answer: {
      summary: 'Hybrid retrieval (BM25 + dense) with daily incremental indexing, light re-ranking, parent-child chunking, mid-tier model for generation. Latency budget is tight, so re-rank only top-20.',
      steps: [
        'Ingestion: nightly cron with delta detection (file hash). Only re-process changed PDFs. Parse with pdfplumber + structural chunking on headings, fall back to recursive char split.',
        'Index: hybrid — BM25 (Elasticsearch or built-in) + dense embeddings (text-embedding-3-small for cost). Vector DB: Qdrant or pgvector if Postgres is already in stack.',
        'Retrieval: top-20 from each, RRF fusion, cross-encoder rerank to top-3.',
        'Generation: Sonnet/Haiku-tier model with prompt caching on the system prompt; structured output for citations.',
        'Eval: 50-query golden set tracking recall@5, faithfulness, latency.',
      ],
      tradeoffs: [
        'Re-ranking adds 100-200ms but typically a 15-25% precision lift — worth it within 800ms budget.',
        'Hybrid adds ~50ms vs pure dense; necessary because of product-code queries.',
        'Daily delta avoids re-embedding cost but means up-to-12-hour staleness — confirm acceptable.',
      ],
      redFlags: [
        'Naming Pinecone before establishing scale and ops constraints.',
        'No mention of evaluation.',
        'Stuffing top-10 chunks for "more context" — bloats latency and cost without quality lift.',
      ],
      followUps: [
        'How would you handle a single PDF that exceeds 1000 pages?',
        'What if the latency budget shrunk to 300ms?',
        'How would access control per user change the design?',
      ],
    },
  },
  {
    id: 'rag-002',
    category: 'RAG',
    difficulty: 'Senior',
    scenario: 'Your RAG system\'s recall@5 is 92% but users complain answers are wrong. What is happening and how do you fix it?',
    answer: {
      summary: 'High recall, low precision — the right chunks are in top-5 but not top-1, OR the model is hallucinating despite correct context. The fix is to test which.',
      steps: [
        'Run a faithfulness eval: feed ONLY the correct chunk, see if the model answers correctly. If yes, the issue is retrieval ordering. If no, the issue is generation.',
        'For retrieval ordering: add a cross-encoder re-ranker over top-20. Often reorders the top-1 correctly.',
        'For generation: check prompt — is it instructing the model to ground in retrieved context? Are chunks delimited clearly? Lower temperature.',
        'Add citations to outputs and validate them against retrieved chunks.',
      ],
      tradeoffs: [
        'Re-ranking adds latency. If you cannot afford it, alternative is contextual chunking to improve embedding quality upstream.',
        'Forcing strict grounding can hurt fluency on questions that need synthesis across chunks.',
      ],
      redFlags: [
        'Jumping to "use a bigger model" without diagnosing.',
        'Tuning temperature randomly with no eval.',
      ],
      followUps: [
        'How would you measure faithfulness automatically?',
        'What if it is a multi-hop question?',
      ],
    },
  },
  {
    id: 'rag-003',
    category: 'RAG',
    difficulty: 'Mid',
    scenario: 'When would you NOT use RAG, even if the data does not fit in the model\'s training set?',
    answer: {
      summary: 'When the data fits in long-context with prompt caching, when it is structured (use SQL), when it is calculations (use tools), or when the corpus is small and stable.',
      steps: [
        'If corpus is under ~100k tokens and stable, use long-context with cached system prompt. No retrieval failure mode, simpler ops.',
        'If queries are over rows/tables, use text-to-SQL. Embedding numeric data loses precision.',
        'If the answer requires computation (totals, aggregations), use function/tool calls.',
        'If the user just uploaded one document and is reasoning about it, pass it directly.',
      ],
      tradeoffs: [
        'Long-context is more expensive per call; RAG is more expensive per ingest. Cross-over depends on query volume.',
        'Tool calling needs the API to exist; RAG does not.',
      ],
      redFlags: ['Treating RAG as the default for any retrieval-shaped question.'],
      followUps: ['How do you decide between long-context and RAG quantitatively?'],
    },
  },
  {
    id: 'rag-004',
    category: 'RAG',
    difficulty: 'Senior',
    scenario: 'Your client wants GraphRAG. Describe when this is the right call and when it is over-engineering.',
    answer: {
      summary: 'GraphRAG wins on entity-relationship questions ("how is X connected to Y through Z"). It loses on plain Q&A where vector similarity already works.',
      steps: [
        'Sample 30 real queries. If many require multi-entity traversal ("which suppliers share customers with our flagged vendors"), GraphRAG is justified.',
        'Estimate ingest cost: typically one LLM call per chunk for entity/relation extraction. For 100k chunks at $0.0001/extraction = $10, but for 10M chunks = $1000. Plan for it.',
        'Ship hybrid: vector retrieval for semantic Q&A + graph traversal for relationship questions, with a router on top.',
      ],
      tradeoffs: [
        'GraphRAG ingest is ~10-50x more expensive than embedding-only. Schema drift is a maintenance burden.',
        'Pure-vector RAG is simpler to operate and faster to iterate on.',
      ],
      redFlags: [
        'Picking GraphRAG because it is in the news, not because the queries need it.',
        'Skipping the cost analysis on extraction.',
      ],
      followUps: [
        'How do you handle schema drift over time?',
        'What if entity extraction is 80% accurate — is that good enough?',
      ],
    },
  },
  {
    id: 'rag-005',
    category: 'RAG',
    difficulty: 'Mid',
    scenario: 'A user asks a question that spans 3 documents, but each retrieval only returns chunks from 1. How do you fix this?',
    answer: {
      summary: 'Multi-hop retrieval. Either decompose the query (agentic RAG), use HyDE to broaden retrieval, or increase k and let the model synthesize.',
      steps: [
        'Diagnose: is the query ambiguous, or are documents not co-retrieved? Check if a hand-crafted query gets all three.',
        'Quick fix: increase top-k to 10-15 and see if all three are present.',
        'Better: agentic RAG — let the model issue 2-3 sub-queries, retrieve per sub-query, synthesize.',
        'Alternative: HyDE — generate a hypothetical answer first, embed that, retrieve. Often surfaces broader context.',
      ],
      tradeoffs: [
        'Agentic RAG: 3-10x cost and latency.',
        'Higher top-k: more tokens in context, may hurt faithfulness.',
      ],
      redFlags: ['Increasing k without measurement; could just increase noise.'],
      followUps: ['How would you cache sub-query results to amortize cost?'],
    },
  },
  {
    id: 'rag-006',
    category: 'RAG',
    difficulty: 'Junior',
    scenario: 'What is the difference between BM25 and semantic search? Why use both?',
    answer: {
      summary: 'BM25 is keyword-based (exact tokens, TF-IDF style). Semantic is embedding similarity. Hybrid combines both because each catches what the other misses.',
      steps: [
        'BM25 wins on rare exact terms: SKUs, error codes, names. No vector match for "ERR_5021".',
        'Semantic wins on conceptual queries: "how do I cancel" matches "subscription termination process".',
        'Combine via Reciprocal Rank Fusion (RRF) — does not require score calibration across systems.',
      ],
      tradeoffs: [
        'Hybrid adds ~50% latency (one extra retrieval call).',
        'Quality lift is workload-dependent: 10-25% recall on heterogeneous queries; minimal on pure-semantic workloads.',
      ],
      redFlags: ['Pure-semantic-only on a corpus with proper nouns or codes.'],
      followUps: ['When would you skip BM25?'],
    },
  },
  {
    id: 'rag-007',
    category: 'RAG',
    difficulty: 'Senior',
    scenario: 'Your team\'s RAG system has been working in prod for 6 months. Quality has been slowly dropping. What do you check?',
    answer: {
      summary: 'Workload drift, embedder drift, corpus quality drift, or eval set staleness. Investigate with both online sampling and offline eval.',
      steps: [
        'Compare current eval scores to launch scores. If eval is stable but users complain, eval set is stale — refresh from current production queries.',
        'Check workload distribution: are users asking different kinds of questions now? Sample 100 recent queries and categorize.',
        'Check corpus: have new doc types been added that the embedder is bad at? Check by embedding clustering.',
        'Check for silent provider changes: embedding API version, model deprecations, index parameter drift after migration.',
      ],
      tradeoffs: ['Refreshing the eval set means losing comparability to old metrics; tradeoff for relevance.'],
      redFlags: [
        'Concluding "the model is bad" without measurement.',
        'Skipping the workload-drift check.',
      ],
      followUps: [
        'How would you build automated drift detection?',
        'What is the frequency for refreshing eval sets?',
      ],
    },
  },
  {
    id: 'rag-008',
    category: 'RAG',
    difficulty: 'Senior',
    scenario: 'Compare contextual retrieval vs parent-child chunking. When pick which?',
    answer: {
      summary: 'Both add context to small chunks. Contextual prepends LLM-generated context to the chunk before embedding. Parent-child retrieves small, generates with the parent. Pick based on cost vs index size.',
      steps: [
        'Contextual retrieval: one LLM ingest call per chunk, fixed cost upfront. Index size unchanged. Cuts retrieval failures ~50%.',
        'Parent-child: no extra ingest cost. Index size ~doubles (you store both child and parent metadata). Retrieval pipeline is two-stage.',
        'Pick contextual when: corpus is stable, you can amortize ingest cost, queries need precise retrieval grounded in a clear document context.',
        'Pick parent-child when: corpus changes frequently (no fixed ingest cost to amortize), generation needs full surrounding context.',
      ],
      tradeoffs: [
        'Contextual: pay once at ingest, cheap forever. But re-running on prompt changes is expensive.',
        'Parent-child: pay every retrieval (pulling parents). Negligible per-query cost but 2x storage.',
      ],
      redFlags: ['Picking one without comparing on the actual eval set.'],
      followUps: ['Can you stack both?'],
    },
  },
  {
    id: 'vec-001',
    category: 'Vector DB',
    difficulty: 'Mid',
    scenario: 'Walk me through choosing a vector DB for: 5M vectors, 100 QPS, 200ms p95, multi-tenant with strict per-user filtering, on AWS.',
    answer: {
      summary: 'pgvector if you already run Postgres, otherwise Qdrant. Filter-heavy workloads + multi-tenancy = Qdrant\'s sweet spot.',
      steps: [
        'Constraints: 5M is moderate, 100 QPS is moderate, 200ms is comfortable, but per-user filter is the dominant constraint.',
        'pgvector with HNSW index handles 5M and supports row-level security. Joins with tenant tables transactionally.',
        'If no Postgres or you need more headroom, Qdrant. Best filter performance among managed options. AWS marketplace.',
        'Avoid Pinecone here: per-query cost at 100 QPS adds up fast for moderate scale; managed simplicity is overkill at 5M.',
      ],
      tradeoffs: [
        'pgvector past 10M starts hurting on HNSW build time and memory.',
        'Qdrant adds an operational service.',
      ],
      redFlags: ['Naming Pinecone without checking filter complexity.'],
      followUps: [
        'What happens at 50M vectors?',
        'What if filters are mostly broad (large tenants)?',
      ],
    },
  },
  {
    id: 'vec-002',
    category: 'Vector DB',
    difficulty: 'Senior',
    scenario: 'Your team picked Pinecone 2 years ago. Bills are now $40k/mo. Do you migrate?',
    answer: {
      summary: 'Probably yes if the workload is read-heavy and steady-state. Map cost components first, model the migration, prove savings, then plan the cutover.',
      steps: [
        'Decompose: storage tier vs read tier vs write tier. Pinecone serverless reads dominate most bills.',
        'Cost model the alternatives: self-hosted Qdrant on EKS, pgvector if Postgres exists. Include ops cost in the comparison.',
        'Pilot in shadow mode: replicate index, run dual reads, compare recall and latency on the eval set.',
        'Migration plan: re-embed if dimensions change, validate eval scores match, cut over with rollback.',
      ],
      tradeoffs: [
        'Self-hosting saves cash but adds ops burden — staffing cost may eat the savings.',
        'Migration is a 4-8 week project; only worth it if savings exceed engineering time × ops cost.',
      ],
      redFlags: [
        'Migrating without a cost model.',
        'Skipping the shadow-mode validation.',
      ],
      followUps: ['What if Pinecone offered a 50% discount to keep you?'],
    },
  },
  {
    id: 'vec-003',
    category: 'Vector DB',
    difficulty: 'Mid',
    scenario: 'Explain HNSW. When does it become a problem?',
    answer: {
      summary: 'Hierarchical Navigable Small World — graph-based ANN index. Fast queries, slow build, memory-hungry. Becomes a problem at billion-scale or under tight memory budgets.',
      steps: [
        'Each vector is a node in a multi-layer graph. Higher layers are sparser. Query starts at top, greedily descends.',
        'Two parameters: M (links per node, affects recall + memory) and ef (search breadth at query time).',
        'Becomes a problem: above ~100M vectors index size dominates RAM cost. Build time scales superlinearly. Cold starts are slow.',
        'Mitigations: IVF or DiskANN for billion-scale; PQ compression for memory savings.',
      ],
      tradeoffs: [
        'Higher M = better recall, more memory.',
        'Higher ef = better recall, slower queries.',
      ],
      redFlags: ['Treating M and ef as black-box defaults — they materially affect quality.'],
      followUps: ['How does DiskANN compare?'],
    },
  },
  {
    id: 'chunk-001',
    category: 'Chunking',
    difficulty: 'Mid',
    scenario: 'You are building RAG over a corpus of legal contracts. What chunking strategy?',
    answer: {
      summary: 'Section-based structural chunking with contextual prepending, max 800 tokens per chunk, parent = full clause section.',
      steps: [
        'Parse on numbered section structure (Section 1, 1.1, 1.1.a). These are author-intended boundaries.',
        'Cap each chunk at 800 tokens; split long sections recursively while preserving heading context.',
        'Add contextual prefix: "[From {document title}, Section {N}, on {topic}]: ..." — clauses cross-reference, retrieval needs this.',
        'Use parent-child: retrieve clause-level chunks, generate with section-level parents.',
      ],
      tradeoffs: [
        'Contextual chunking adds ingest cost. Worth it for legal where misretrieval is high-cost.',
        'Section-level parents can be huge — cap parent size or split.',
      ],
      redFlags: [
        'Fixed-token chunking on legal text — breaks references.',
        'No mention of cross-references.',
      ],
      followUps: [
        'What if contracts have amendments overriding sections?',
        'How do you prevent retrieval from returning superseded clauses?',
      ],
    },
  },
  {
    id: 'chunk-002',
    category: 'Chunking',
    difficulty: 'Senior',
    scenario: 'When does semantic chunking outperform recursive character splitting? When does it lose?',
    answer: {
      summary: 'Wins on long-form narrative with implicit topic shifts. Loses on structured documents with explicit headings, and on cost-sensitive workloads.',
      steps: [
        'Wins: blog posts, transcripts, books — content has topic boundaries that match meaning, not formatting.',
        'Loses: technical docs with H1/H2 headings — the author already chunked it for you.',
        'Loses on cost: every sentence is embedded for boundary detection. 10x the embedding cost vs structural splitting.',
      ],
      tradeoffs: [
        'Semantic boundaries match human intent; arbitrary token boundaries do not.',
        'Cost and complexity vs marginal quality lift on already-structured content.',
      ],
      redFlags: ['Recommending semantic chunking universally.'],
      followUps: ['How would you measure if semantic chunking helped your specific corpus?'],
    },
  },
  {
    id: 'chunk-003',
    category: 'Chunking',
    difficulty: 'Mid',
    scenario: 'You inherit a RAG system using 256-token chunks with no overlap. Recall is poor. Where do you start?',
    answer: {
      summary: 'Either the chunks are too small to mean anything alone, or they are splitting through context. Diagnose by sampling, then increase chunk size and add overlap or move to parent-child.',
      steps: [
        'Sample 20 retrieved chunks. Are they coherent on their own? If not, they are too small.',
        'Try chunk_size=512 with overlap=64. Re-run eval. Compare recall@5 and faithfulness.',
        'If gains are marginal, try parent-child: keep small chunks for retrieval, hydrate to parents at generation.',
        'If still poor, look at structural boundaries — fixed tokens may be cutting through important context.',
      ],
      tradeoffs: [
        'Bigger chunks: more context per retrieval, potentially lower precision.',
        'Parent-child: more storage, more complex pipeline.',
      ],
      redFlags: ['Tuning without an eval set.'],
      followUps: ['What is your overlap heuristic?'],
    },
  },
  {
    id: 'chunk-004',
    category: 'Chunking',
    difficulty: 'Senior',
    scenario: 'How would you chunk a corpus of source code for a code-search RAG?',
    answer: {
      summary: 'AST-based chunking: one function or class per chunk. Token windows cut through functions and produce useless chunks.',
      steps: [
        'Use tree-sitter or language-specific parser. Walk the AST, emit one chunk per function/method/class.',
        'Add metadata: file path, language, surrounding class, imports. Important for retrieval filtering and for the LLM to use the chunk.',
        'For very large functions, fall back to recursive splitting but always preserve the function signature in each child chunk.',
        'Embed both the code AND a 1-2 sentence natural language description (LLM-generated at ingest). Hybrid retrieval over both.',
      ],
      tradeoffs: [
        'AST parsing per language; multi-language repos add complexity.',
        'Embedding code + descriptions doubles index size, but recall is dramatically better than embedding code alone.',
      ],
      redFlags: ['Token-window chunking for code.'],
      followUps: ['How do you keep the index in sync with code changes?'],
    },
  },
]
