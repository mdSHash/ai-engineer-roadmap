import type { DecisionTree } from '../types'

const ragChoiceTree: DecisionTree = {
  slug: 'rag-or-not',
  title: 'Should you use RAG?',
  description: 'Walk through the questions a senior engineer asks before reaching for RAG.',
  rootId: 'q1',
  nodes: {
    q1: {
      id: 'q1',
      question: 'Does your data fit comfortably in the model\'s context window?',
      options: [
        { label: 'Yes, under ~100k tokens and stable', nextId: 'r-longctx', rationale: 'No retrieval failure mode; simpler ops.' },
        { label: 'No, much larger or changes frequently', nextId: 'q2' },
      ],
    },
    q2: {
      id: 'q2',
      question: 'Is the data structured (rows, fields, joins)?',
      options: [
        { label: 'Yes — tabular / database / spreadsheet', nextId: 'r-sql', rationale: 'Embedding numeric data loses precision.' },
        { label: 'No — mostly unstructured text', nextId: 'q3' },
      ],
    },
    q3: {
      id: 'q3',
      question: 'Does the answer require computation, transformation, or deterministic lookup?',
      options: [
        { label: 'Yes — math, aggregations, API lookup', nextId: 'r-tools', rationale: 'Don\'t retrieve a doc to summarize a number.' },
        { label: 'No — answer lives in document text', nextId: 'q4' },
      ],
    },
    q4: {
      id: 'q4',
      question: 'Are queries multi-hop (need to combine info across multiple documents)?',
      options: [
        { label: 'Yes — synthesis across docs', nextId: 'r-agentic', rationale: 'Single-shot retrieval cannot decompose.' },
        { label: 'No — single-doc answers', nextId: 'q5' },
      ],
    },
    q5: {
      id: 'q5',
      question: 'Are queries entity-relationship-shaped ("how is X connected to Y")?',
      options: [
        { label: 'Yes — relationships matter more than text similarity', nextId: 'r-graph', rationale: 'Vector search misses graph structure.' },
        { label: 'No — semantic Q&A', nextId: 'q6' },
      ],
    },
    q6: {
      id: 'q6',
      question: 'Do queries mix exact-match (codes, names) and conceptual?',
      options: [
        { label: 'Yes — heterogeneous query types', nextId: 'r-hybrid', rationale: 'Hybrid retrieval is the production default.' },
        { label: 'No — purely conceptual', nextId: 'r-rerank' },
      ],
    },
    'r-longctx': {
      id: 'r-longctx',
      recommendation: 'Long-context with prompt caching',
      detail: 'Skip RAG. Stuff everything in a cached system prompt. ~10% the cost on cached tokens, no chunking pipeline, no retrieval failure mode. Re-evaluate if corpus grows past ~100k tokens.',
    },
    'r-sql': {
      id: 'r-sql',
      recommendation: 'Text-to-SQL or function calling',
      detail: 'Embedding tabular data is an anti-pattern. Build a SQL-generating prompt with schema in context, or expose typed function calls for query/mutation operations.',
    },
    'r-tools': {
      id: 'r-tools',
      recommendation: 'Tool / function calling',
      detail: 'Define typed tools (search, calculate, lookup), let the model orchestrate. Fast, accurate, auditable. Pair with retrieval only if the tools require unstructured context.',
    },
    'r-agentic': {
      id: 'r-agentic',
      recommendation: 'Agentic RAG',
      detail: 'Let the model plan: decompose query, retrieve per sub-query, synthesize. 3-10x cost vs naive RAG. Worth it for genuinely multi-hop questions.',
    },
    'r-graph': {
      id: 'r-graph',
      recommendation: 'GraphRAG (or hybrid graph + vector)',
      detail: 'Build a knowledge graph from your corpus, retrieve by traversal. Expensive ingest (~LLM call per chunk for entity extraction). Pair with vector retrieval if you also have semantic queries.',
    },
    'r-hybrid': {
      id: 'r-hybrid',
      recommendation: 'Hybrid retrieval (BM25 + dense) + re-ranking',
      detail: 'Production default. ~1.5x naive RAG cost, 10-25% recall lift. Add cross-encoder re-rank to top-20 → top-3 for further precision lift.',
    },
    'r-rerank': {
      id: 'r-rerank',
      recommendation: 'Dense retrieval + re-ranking',
      detail: 'Pure semantic with cross-encoder re-rank to fix precision. Add hybrid later if you encounter exact-match queries you missed.',
    },
  },
}

const vectorDbTree: DecisionTree = {
  slug: 'vector-db-pick',
  title: 'Which vector database?',
  description: 'Pick a vector DB by constraints, not by brand recognition.',
  rootId: 'v1',
  nodes: {
    v1: {
      id: 'v1',
      question: 'How many vectors are you indexing?',
      options: [
        { label: 'Under 1M (POC, internal tool)', nextId: 'r-chroma' },
        { label: '1M – 10M (production app)', nextId: 'v2' },
        { label: '10M – 100M (large scale)', nextId: 'v3' },
        { label: '100M+ (massive)', nextId: 'r-milvus' },
      ],
    },
    v2: {
      id: 'v2',
      question: 'Are you already running Postgres?',
      options: [
        { label: 'Yes', nextId: 'r-pgvector', rationale: 'Add pgvector extension; no new dependency.' },
        { label: 'No / managed preferred', nextId: 'v2b' },
      ],
    },
    v2b: {
      id: 'v2b',
      question: 'Are filter queries (multi-tenancy, metadata) frequent?',
      options: [
        { label: 'Yes — heavy filtering', nextId: 'r-qdrant' },
        { label: 'No — pure vector search dominates', nextId: 'r-pinecone' },
      ],
    },
    v3: {
      id: 'v3',
      question: 'Self-host required?',
      options: [
        { label: 'Yes — on-prem / data residency', nextId: 'v3b' },
        { label: 'No — managed is fine', nextId: 'r-pinecone-large' },
      ],
    },
    v3b: {
      id: 'v3b',
      question: 'Hybrid search out-of-box?',
      options: [
        { label: 'Yes — want lexical + vector built-in', nextId: 'r-weaviate' },
        { label: 'Pure vector search only', nextId: 'r-qdrant-self' },
      ],
    },
    'r-chroma': {
      id: 'r-chroma',
      recommendation: 'Chroma, pgvector, or LanceDB',
      detail: 'Operational simplicity wins below 1M vectors. Don\'t pay infra tax for scale you don\'t have. Move when you outgrow.',
    },
    'r-pgvector': {
      id: 'r-pgvector',
      recommendation: 'pgvector with HNSW index',
      detail: 'Boring is the right answer. ACID, joins with metadata, backups, replication — all just work. Plan to migrate if you cross 10M vectors.',
    },
    'r-qdrant': {
      id: 'r-qdrant',
      recommendation: 'Qdrant Cloud',
      detail: 'Best filter performance among managed options. Strong payload model. Faster than competitors on selective metadata queries.',
    },
    'r-pinecone': {
      id: 'r-pinecone',
      recommendation: 'Pinecone serverless',
      detail: 'Simplest API and ops story. Watch query costs at high QPS. Re-evaluate if filter complexity grows.',
    },
    'r-pinecone-large': {
      id: 'r-pinecone-large',
      recommendation: 'Pinecone or Qdrant Cloud',
      detail: 'Both scale here. Pinecone for simplicity; Qdrant for filter-heavy workloads. Cost-model both at projected QPS.',
    },
    'r-weaviate': {
      id: 'r-weaviate',
      recommendation: 'Weaviate (self-hosted)',
      detail: 'Hybrid lexical + vector built-in. Modular schema. Heavier ops than Qdrant — expect to manage Kubernetes.',
    },
    'r-qdrant-self': {
      id: 'r-qdrant-self',
      recommendation: 'Qdrant (self-hosted)',
      detail: 'Same Qdrant, run it yourself. Rust-fast, payload-rich. Smaller community than Weaviate but operationally simpler.',
    },
    'r-milvus': {
      id: 'r-milvus',
      recommendation: 'Milvus or Vespa',
      detail: 'Designed for billion-scale with GPU acceleration. Operationally complex — only worth it when no smaller DB fits.',
    },
  },
}

const chunkingTree: DecisionTree = {
  slug: 'chunking-strategy',
  title: 'Which chunking strategy?',
  description: 'Pick by document type and query pattern, not by default.',
  rootId: 'c1',
  nodes: {
    c1: {
      id: 'c1',
      question: 'What kind of document?',
      options: [
        { label: 'Source code', nextId: 'r-ast' },
        { label: 'Tabular data / spreadsheets', nextId: 'r-no-chunk' },
        { label: 'Legal contracts / regulated docs', nextId: 'r-legal' },
        { label: 'PDFs/Word with clear headings', nextId: 'r-structural' },
        { label: 'Markdown / wiki / docs', nextId: 'r-md' },
        { label: 'Long-form articles / books', nextId: 'r-semantic' },
        { label: 'Customer support tickets / chat', nextId: 'r-atomic' },
        { label: 'Mixed / unknown', nextId: 'c2' },
      ],
    },
    c2: {
      id: 'c2',
      question: 'Does the corpus have reliable structure (headings, sections)?',
      options: [
        { label: 'Yes', nextId: 'r-structural' },
        { label: 'No — messy text', nextId: 'r-recursive' },
      ],
    },
    'r-ast': {
      id: 'r-ast',
      recommendation: 'AST-based chunking (one function/class per chunk)',
      detail: 'Use tree-sitter or language parser. Token windows cut through function bodies. Add file path, language, and class metadata. Embed code + 1-sentence description for hybrid retrieval.',
    },
    'r-no-chunk': {
      id: 'r-no-chunk',
      recommendation: 'Don\'t chunk — extract to SQL or row-per-chunk with schema',
      detail: 'Embedding tabular data loses precision. Either generate SQL or treat each row as a chunk with schema headers prepended.',
    },
    'r-legal': {
      id: 'r-legal',
      recommendation: 'Section-based + contextual chunking + parent-child',
      detail: 'Split on section structure. Prepend "[From {doc}, Section {N}]: ..." to each chunk before embedding. Parent = full clause. Cross-references make context critical.',
    },
    'r-structural': {
      id: 'r-structural',
      recommendation: 'Structural chunking on headings, max 800 tokens',
      detail: 'Split on H1/H2/H3. Cap each at 800 tokens; recursively split larger sections preserving heading context.',
    },
    'r-md': {
      id: 'r-md',
      recommendation: 'Markdown-aware structural + parent-child',
      detail: 'Split on Markdown headers. Children = paragraphs/sections; parent = full top-level section. Best balance of precision and context.',
    },
    'r-semantic': {
      id: 'r-semantic',
      recommendation: 'Semantic chunking',
      detail: 'Embed each sentence; split where consecutive embeddings diverge. Topic-aligned chunks. Costs ~10x in embedding calls vs structural — worth it on narrative content with implicit boundaries.',
    },
    'r-atomic': {
      id: 'r-atomic',
      recommendation: 'One ticket / one turn = one chunk',
      detail: 'Tickets are atomic. Chat turns benefit from sliding-window context (3-5 surrounding turns).',
    },
    'r-recursive': {
      id: 'r-recursive',
      recommendation: 'Recursive character split, chunk_size=512, overlap=64',
      detail: 'Tries paragraph boundaries first, falls back to sentences/words. Universal default. Pair with parent-child if you can afford the storage.',
    },
  },
}

export const decisionTrees: DecisionTree[] = [ragChoiceTree, vectorDbTree, chunkingTree]
