import type { Flashcard } from '../types'

export const flashcards: Flashcard[] = [
  // RAG
  { id: 'fc-001', category: 'RAG', front: 'When should you NOT use RAG?', back: 'When data fits in long-context (use caching), when data is structured (use SQL), when answer needs computation (use tools), or when corpus is small + stable (stuff in prompt).' },
  { id: 'fc-002', category: 'RAG', front: 'What does hybrid retrieval combine?', back: 'BM25 (lexical, exact tokens — wins on rare terms like SKUs) + dense semantic (wins on conceptual queries). Fused via Reciprocal Rank Fusion.' },
  { id: 'fc-003', category: 'RAG', front: 'What does a re-ranker fix?', back: 'Precision. The right answer is in top-k but not top-1. Cross-encoder re-rank typically lifts top-1 accuracy 15-25%.' },
  { id: 'fc-004', category: 'RAG', front: 'When does GraphRAG win?', back: 'Entity-relationship questions ("how is X connected to Y through Z"). Loses on plain Q&A — too expensive for what vector retrieval handles.' },
  { id: 'fc-005', category: 'RAG', front: 'What is contextual retrieval?', back: 'Anthropic technique: prepend a 50-100 token doc-context summary to each chunk before embedding. ~50% reduction in retrieval failures.' },
  { id: 'fc-006', category: 'RAG', front: 'What is HyDE?', back: 'Hypothetical Document Embeddings. Generate a hypothetical answer first, embed THAT, retrieve. Helps with short/sparse queries.' },
  { id: 'fc-007', category: 'RAG', front: 'Naive RAG\'s biggest failure modes?', back: '1) Short keyword queries (no semantic signal). 2) Out-of-domain embedder. 3) Chunk boundaries through context. 4) Multi-hop questions.' },

  // Vector DBs
  { id: 'fc-010', category: 'Vector DB', front: 'Five constraints that pick a vector DB?', back: 'Vector count, QPS, p95 latency budget, filter complexity, ops model (managed vs self-host).' },
  { id: 'fc-011', category: 'Vector DB', front: 'When does pgvector hit its ceiling?', back: 'Around 10M vectors. HNSW build time and memory dominate; latency p95 climbs above 100ms.' },
  { id: 'fc-012', category: 'Vector DB', front: 'HNSW M parameter — what does it control?', back: 'Links per node in the graph. Higher M = better recall, more memory. Typical default 16-32.' },
  { id: 'fc-013', category: 'Vector DB', front: 'IVF vs HNSW?', back: 'IVF: clustered index, lower memory, slightly lower recall. HNSW: graph index, faster queries, RAM-hungry. HNSW is the production default below 100M vectors.' },
  { id: 'fc-014', category: 'Vector DB', front: 'What is pre-filter vs post-filter?', back: 'Pre-filter: filter metadata first, then vector search subset. Fast on selective filters. Post-filter: vector search whole corpus, drop non-matching. Fast on broad filters. Good DBs auto-pick.' },

  // Chunking
  { id: 'fc-020', category: 'Chunking', front: 'Default chunking when in doubt?', back: 'Recursive character split, chunk_size=512, overlap=64. Rarely optimal, rarely terrible.' },
  { id: 'fc-021', category: 'Chunking', front: 'When use parent-child chunking?', back: 'When you need precise retrieval AND surrounding context for generation. Index small, hydrate to parents at generation time.' },
  { id: 'fc-022', category: 'Chunking', front: 'How do you chunk source code?', back: 'AST-based — one function or class per chunk via tree-sitter. Token windows cut through function bodies and produce useless chunks.' },
  { id: 'fc-023', category: 'Chunking', front: 'When does semantic chunking lose?', back: 'On structured documents with explicit headings (use structural). On cost-sensitive workloads (lots of embedding calls). On short documents (no real topic boundaries).' },
  { id: 'fc-024', category: 'Chunking', front: 'How chunk for legal contracts?', back: 'Section-based structural + contextual prefix per chunk + parent-child where parent is full clause section. Cross-references make context critical.' },

  // Tokens & Cost
  { id: 'fc-030', category: 'Tokens & Cost', front: 'Largest single token-cost lever?', back: 'Prompt caching. ~10% of normal cost on cached prefix tokens. Required for static system prompts and document context.' },
  { id: 'fc-031', category: 'Tokens & Cost', front: 'Output tokens vs input tokens — cost ratio?', back: 'Output is typically 5x more expensive than input. Cap max_tokens aggressively, use structured output to remove filler.' },
  { id: 'fc-032', category: 'Tokens & Cost', front: 'Order of operations to cut LLM cost?', back: 'Measure → cache → reduce top-k → right-size models per step → cap output tokens → batch API for non-realtime.' },
  { id: 'fc-033', category: 'Tokens & Cost', front: 'When NOT to optimize tokens?', back: 'When LLM bill < 10% of infra spend, when no eval is in place, or when prompt is still iterating. Premature optimization is rework.' },
  { id: 'fc-034', category: 'Tokens & Cost', front: 'Routing vs Cascading?', back: 'Routing: cheap classifier picks model upfront (faster, but adds failure mode). Cascading: try cheap first, escalate on low confidence (saves cost, adds latency on hard path).' },

  // Prompting for code
  { id: 'fc-040', category: 'Prompting', front: 'Mental model for AI coding tools?', back: 'Fast junior who has memorized every API but never asks clarifying questions unless invited. Front-load context, state constraints, give permission to ask back.' },
  { id: 'fc-041', category: 'Prompting', front: 'Plan for a large refactor?', back: 'Plan-then-execute in passes. Pass 1: model produces and you review the plan. Pass 2+: execute one chunk at a time with test runs and diff review.' },
  { id: 'fc-042', category: 'Prompting', front: 'Top 3 failure modes in AI-generated code?', back: '1) Hallucinated APIs (run + type-check). 2) Plausible-but-wrong logic (read every branch). 3) Tests that pass for the wrong reason (read assertions).' },
  { id: 'fc-043', category: 'Prompting', front: 'How to enforce existing conventions?', back: 'Force model to read 2-3 similar features first, summarize the pattern in 5 bullets, you correct, then implement using that pattern.' },

  // Bottlenecks
  { id: 'fc-050', category: 'Bottlenecks', front: 'Four AI bottleneck types?', back: 'Latency (trace and find longest span), cost (token telemetry per call type), quality (build eval set), reliability (classify error types).' },
  { id: 'fc-051', category: 'Bottlenecks', front: 'Retrieval-vs-generation diagnostic?', back: 'Feed curated correct context to the failing query. If model nails it: retrieval ordering issue (add re-ranker). If model still fails: generation issue (prompt, temperature, output format).' },
  { id: 'fc-052', category: 'Bottlenecks', front: 'First step on a new project with quality issues?', back: 'Build the eval set. 50-100 queries with expected behavior. Without it every fix is a guess.' },
  { id: 'fc-053', category: 'Bottlenecks', front: 'Three cost regression patterns?', back: '1) Retry storms with full prompt re-sent. 2) Prompt bloat creep over time. 3) Top-k inflation in RAG. 4) Caching silently disabled.' },

  // Evaluation
  { id: 'fc-060', category: 'Evaluation', front: 'Four RAG eval metrics?', back: 'Context precision (retrieved chunks relevant?), context recall (all relevant chunks surfaced?), faithfulness (answer grounded in context?), answer relevance (addresses question?).' },
  { id: 'fc-061', category: 'Evaluation', front: 'LLM-as-judge biases?', back: 'Position bias (prefers first option), length bias (longer = higher), self-preference (own family scores higher), drift over model updates.' },
  { id: 'fc-062', category: 'Evaluation', front: 'Online vs offline eval?', back: 'Offline: pre-deploy / CI, regression catching, golden eval set. Online: production sampling, drift detection, real distribution. Both required.' },
  { id: 'fc-063', category: 'Evaluation', front: 'Three ways to source ground truth?', back: 'Human-labeled (best, slow). Distillation from stronger model (medium). Bootstrapped from positive user feedback (cheap, noisy). Most teams mix.' },

  // Lifecycle
  { id: 'fc-070', category: 'Lifecycle', front: 'Eight phases of AI engineering?', back: '1) Framing 2) Data audit 3) POC 4) Architecture 5) Build 6) Hardening 7) Deploy 8) Maintenance.' },
  { id: 'fc-071', category: 'Lifecycle', front: 'Where do most AI launches go wrong?', back: 'In handoffs: POC→prod (no eval), build→hardening (skipped under launch pressure), deploy→maintain (no owner).' },
  { id: 'fc-072', category: 'Lifecycle', front: 'Hardening phase covers what?', back: 'Safety (prompt injection), cost (caching, right-sizing), reliability (retries, fallbacks), edge cases (long, empty, non-English, adversarial inputs), privacy (PII, retention).' },
  { id: 'fc-073', category: 'Lifecycle', front: 'When is AI the wrong tool?', back: 'When a SQL query, regex, or rule solves it. When success is not measurable. When failure cost is high and no human-in-the-loop is feasible.' },

  // Quick foundational
  { id: 'fc-080', category: 'RAG', front: 'Top-k for production RAG?', back: 'Retrieve top-20-50 fast, re-rank to top-3-5 for generation. Top-3 with re-ranker often beats top-10 without, at lower cost.' },
  { id: 'fc-081', category: 'Tokens & Cost', front: 'Batch API tradeoff?', back: '50% cost in exchange for 24h SLA (Anthropic, OpenAI). Use for eval runs, bulk summarization, offline jobs.' },
  { id: 'fc-082', category: 'Vector DB', front: 'Embedding cost trap on migration?', back: 'When you change embedder, you re-embed everything. 10M chunks at $0.0001 each = $1000 per migration. Plan it.' },
]
