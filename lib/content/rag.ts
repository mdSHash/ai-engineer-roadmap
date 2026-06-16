import type { Module } from '../types'

export const ragModule: Module = {
  slug: 'rag',
  number: '01',
  title: 'When to RAG (and when not to)',
  tagline: 'RAG is a tool, not a religion. Most teams over-apply it. Learn the decision.',
  duration: '45 min read',
  level: 'Foundations',
  intro:
    'Retrieval-Augmented Generation gives an LLM access to information it was not trained on, by pulling relevant documents into the prompt at inference time. The interview question is almost never "what is RAG" — it is "do we need RAG here, and if so, which kind?" This module is the decision layer.',
  sections: [
    {
      heading: 'What problem does RAG actually solve?',
      body: [
        'RAG exists because LLMs have three hard limits: a fixed knowledge cutoff, no awareness of private data, and a finite context window. RAG addresses all three by fetching relevant snippets at query time and stuffing them into the prompt.',
        'But each of those limits has alternative solutions. A knowledge cutoff can be addressed with web search tools. Private data access can be solved with structured tool calls into a database. A finite context window can sometimes be solved by simply paying for a larger one.',
        'So the real RAG question is: is retrieval the cheapest, most reliable way to give the model the information it needs to answer this query?',
      ],
      callout: { kind: 'rule', text: 'RAG is the right answer when the source-of-truth is unstructured text, changes over time, and is too large to fit in context. If any of those three is false, consider an alternative first.' },
    },
    {
      heading: 'Decision: when NOT to use RAG',
      body: [
        'Skipping RAG is often the right call. Here are the signals that you should reach for something simpler or different.',
      ],
      decisionRules: [
        { when: 'The data fits comfortably in the model\'s context window and changes rarely', pick: 'Long-context prompt with prompt caching', why: 'Cheaper, simpler, no embedding pipeline. Modern models cache up to ~1M tokens at <10% cost on cached portions.' },
        { when: 'The user is asking a question over structured data (rows, fields, joins)', pick: 'Text-to-SQL or function calling', why: 'Embedding tabular data loses precision. SQL is exact. RAG over CSVs is an anti-pattern.' },
        { when: 'The answer is a calculation, transformation, or deterministic lookup', pick: 'Tool/function call', why: 'Don\'t retrieve a doc to summarize a number. Call an API or function and feed the result back.' },
        { when: 'The corpus is small and stable (under ~50 short documents)', pick: 'Stuff everything in the system prompt', why: 'Retrieval introduces a failure mode (wrong chunk retrieved). If it all fits, skip the failure mode.' },
        { when: 'The task is reasoning over a single document the user just uploaded', pick: 'Just pass the full doc in context', why: 'Chunking a single PDF you already have in hand often hurts. Long-context models handle this directly.' },
      ],
    },
    {
      heading: 'Decision: when RAG is the right answer',
      body: [
        'RAG earns its complexity when the corpus is large, evolving, and the question requires grounded retrieval rather than reasoning over the whole thing.',
      ],
      decisionRules: [
        { when: 'Corpus exceeds context budget (e.g. 10k+ pages of policy docs)', pick: 'RAG with semantic + keyword hybrid retrieval', why: 'Pure long-context is too expensive per query and quality degrades past ~200k tokens.' },
        { when: 'Documents change frequently (daily ingestion pipelines)', pick: 'RAG with incremental indexing', why: 'Re-fine-tuning is expensive and slow. Vector DB updates are cheap and immediate.' },
        { when: 'The system needs to cite sources', pick: 'RAG with chunk-to-source mapping', why: 'Citations require knowing which document a piece of context came from. RAG\'s retrieval step gives you this for free.' },
        { when: 'You need access control per user (multi-tenant)', pick: 'RAG with metadata filtering', why: 'Filter retrieved chunks by user permissions before they hit the LLM. Can\'t do this with fine-tuning.' },
      ],
    },
    {
      heading: 'The RAG type matrix',
      body: [
        'Once you decide RAG is right, you must pick which kind. Calling everything "RAG" in an interview is a junior signal. Naming the variant matched to the use case is a senior signal.',
      ],
      matrix: {
        caption: 'Pick by the failure mode you most need to avoid',
        headers: ['Variant', 'Use when', 'Failure mode it avoids'],
        rows: [
          ['Naive RAG',          'POC, small corpus, simple Q&A',                              'None — itself the baseline that fails on edge cases'],
          ['Hybrid (BM25 + dense)', 'Mixed query types: keyword (codes, names) + semantic',     'Pure-semantic missing exact-match queries like SKUs, error codes'],
          ['Re-ranking RAG',     'Recall is fine, precision is not',                           'Top-k contains the answer but in position 8 instead of 1'],
          ['Hierarchical / multi-index', 'Heterogeneous corpora (FAQs vs manuals vs tickets)', 'One index over everything dilutes relevance'],
          ['Parent-child chunks', 'Retrieve narrow, generate with context',                    'Tiny chunks lack context for the LLM to use; big chunks hurt retrieval'],
          ['Contextual RAG',     'Chunks lose meaning when extracted (legal, code)',           'Out-of-context chunk retrieval ("this section overrides §3.2")'],
          ['Agentic RAG',        'Multi-hop questions across docs, planning needed',           'Single-shot retrieval cannot decompose the question'],
          ['GraphRAG',           'Entity-relationship questions ("how is X connected to Y")',  'Vector similarity misses graph-structured relationships'],
          ['HyDE',               'User queries are short / under-specified',                   'Query embedding too sparse to match document embeddings'],
          ['Self-querying',      'Queries contain implicit metadata filters',                  'Returning chunks from wrong time period / category / tenant'],
        ],
      },
    },
    {
      heading: 'Naive RAG: the baseline you should know cold',
      body: [
        'The classic pipeline: chunk documents, embed each chunk with a sentence model, store in a vector DB, embed the query at runtime, retrieve top-k by cosine similarity, stuff into prompt, generate.',
        'Where it breaks: short keyword queries (no semantic signal), out-of-domain embeddings (general embedder on legal/medical text), chunk boundaries cutting through important context, and queries needing aggregation across many documents.',
      ],
      callout: { kind: 'warn', text: 'If a candidate proposes naive RAG for a production system without listing its failure modes, that is the answer you mark as junior. Always volunteer the limitations.' },
    },
    {
      heading: 'Hybrid retrieval: the production default',
      body: [
        'Hybrid combines lexical search (BM25, exact tokens) with dense retrieval (semantic similarity), then fuses the rankings — usually with Reciprocal Rank Fusion (RRF) because it does not require score calibration across systems.',
        'BM25 wins on rare exact terms (product SKUs, error codes, proper nouns). Dense wins on conceptual queries ("how do I cancel"). Most real queries need both.',
        'Cost: roughly 1.5x naive RAG (one extra retrieval call). Quality lift: 10-25% recall improvement on heterogeneous query workloads. Almost always worth it.',
      ],
    },
    {
      heading: 'Re-ranking: cheap, large impact',
      body: [
        'A re-ranker is a small model (cross-encoder like bge-reranker, Cohere Rerank, Jina) that scores each retrieved candidate against the query directly, instead of via embedding similarity. You retrieve top-50 with a fast bi-encoder, then re-rank to top-5 with a cross-encoder.',
        'Why it works: cross-encoders see query and document together and can model interactions. Embeddings are independent vectors that lose this signal.',
        'When to add it: your retriever has good recall (the answer is in top-50) but poor precision (it is not in top-3). This is the most common production bottleneck.',
      ],
      callout: { kind: 'insight', text: 'Re-rankers add ~100-300ms latency for top-50 candidates. If your latency budget is tight, re-rank fewer candidates rather than skipping it entirely.' },
    },
    {
      heading: 'Agentic RAG: when single-shot retrieval cannot decompose the question',
      body: [
        'Agentic RAG lets the LLM plan retrievals: ask a clarifying sub-question, retrieve, evaluate, retrieve again with refined query, synthesize.',
        'Use it when: questions are multi-hop ("what changed in policy X between version 2 and version 4 and why"), require iterative refinement, or span document types where a single query cannot match all the relevant chunks.',
        'Cost: 3-10x the naive RAG token spend. Latency goes from 1-2s to 5-30s. Only worth it when the answer quality lift justifies that.',
      ],
    },
    {
      heading: 'GraphRAG: when relationships matter more than text similarity',
      body: [
        'GraphRAG builds a knowledge graph from your corpus (entities + relationships) and retrieves by graph traversal instead of (or in addition to) vector similarity. Microsoft\'s GraphRAG, LightRAG, and similar systems formalize this.',
        'Where it shines: questions like "which customers are connected through shared vendors and what risks does that create" — pure semantic search cannot answer these because the answer is in the structure, not the text.',
        'Where it loses: pure unstructured Q&A. The graph extraction step is expensive (an LLM call per chunk), and brittle to schema drift. Do not GraphRAG everything.',
      ],
    },
    {
      heading: 'Contextual retrieval: solving the chunk-without-context problem',
      body: [
        'Anthropic published "Contextual Retrieval" — before embedding each chunk, prepend a 1-2 sentence summary of how that chunk fits into the larger document. Reported ~50% reduction in retrieval failures.',
        'Why it works: chunks like "This rate applies only to commercial tenants" are useless without knowing which rate. Adding "From the 2024 Lease Schedule, Section 4.2..." restores the missing context.',
        'Cost: one LLM call per chunk at ingest. Use prompt caching on the document so you do not re-pay for the doc on every chunk.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three traps separate junior from senior answers in RAG-shaped questions.',
      ],
      bullets: [
        'Trap 1 — "Just use RAG" for everything. Senior answer: explore long-context, tool calling, and fine-tuning first; arrive at RAG by elimination.',
        'Trap 2 — Recommending a specific tool (Pinecone, LangChain) before defining the problem. Senior answer: state requirements first, derive tool choice last.',
        'Trap 3 — Ignoring evaluation. RAG without retrieval evaluation (recall@k, MRR) and generation evaluation (faithfulness, answer relevance) is unshippable. Always volunteer the eval plan.',
      ],
    },
  ],
  keyTakeaways: [
    'RAG is one of four ways to give an LLM information; long-context, fine-tuning, and tool-calling are the others. Do not default to RAG.',
    'In production, hybrid retrieval + re-ranking is the baseline that beats naive RAG on almost every workload at 1.5-2x the cost.',
    'Agentic RAG is for multi-hop questions; GraphRAG is for entity-relationship questions; contextual retrieval is the cheap upgrade that fixes 50% of retrieval failures.',
    'In interviews, name the failure mode each variant solves — that is the senior signal.',
  ],
  pitfalls: [
    'Embedding tabular or numeric data and trying to RAG over it. Use SQL.',
    'Chunking and re-embedding on every prompt change instead of caching.',
    'Skipping re-ranking because "recall is fine" — recall is rarely the bottleneck; precision is.',
    'Picking a vector DB before knowing the corpus size, query rate, or filter requirements.',
    'No evaluation harness. Without recall@k and faithfulness scores, you cannot tell if a change helped or hurt.',
  ],
  relatedSlugs: ['vector-databases', 'chunking', 'evaluation'],
}
