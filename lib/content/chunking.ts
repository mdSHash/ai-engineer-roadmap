import type { Module } from '../types'

export const chunkingModule: Module = {
  slug: 'chunking',
  number: '03',
  title: 'Chunking strategies — the art of splitting documents',
  tagline: 'Chunking is where most RAG quality is won or lost. Pick wrong, fix nothing else.',
  duration: '30 min read',
  level: 'Foundations',
  intro:
    'You can have the best embeddings, the fastest vector DB, and the smartest re-ranker — and still ship a useless RAG system because your chunks are too small, too big, or split through the wrong sentence. This module gives you the chunking decisions a senior engineer makes by reflex.',
  sections: [
    {
      heading: 'Why chunk at all?',
      body: [
        'Three reasons. First, embeddings have a fixed input limit (typically 512-8192 tokens). Second, retrieval precision rises when chunks are smaller (the irrelevant text drags down similarity scores for big chunks). Third, you cannot stuff entire documents into the LLM\'s context for every query.',
        'But chunking is destructive: every cut throws away context the chunk needs to mean something. The whole game is balancing retrieval precision (small chunks) against generation context (big chunks).',
      ],
      callout: { kind: 'rule', text: 'A chunk needs enough context to mean something on its own. If a human reading the chunk in isolation cannot tell what it is about, your chunks are too small or split through context.' },
    },
    {
      heading: 'The chunking strategy matrix',
      body: [
        'Six chunking strategies cover 95% of production use cases. Pick by the document type, not by what you have heard about.',
      ],
      matrix: {
        caption: 'Picking by document type and query pattern',
        headers: ['Strategy', 'Use when', 'Watch out for'],
        rows: [
          ['Fixed-size (token count)',     'Quick POC, homogeneous text, no structure',                  'Splits sentences mid-thought; usually a baseline you replace'],
          ['Recursive character split',    'General-purpose default (LangChain\'s RecursiveCharacterTextSplitter)', 'Decent default but tunes poorly to specific document types'],
          ['Sentence-based',               'Q&A over articles, FAQs, conversational text',               'Tiny sentences carry no context; aggregate into windows'],
          ['Semantic chunking',            'Mixed paragraph lengths, narrative documents',                'LLM call per pair = slow + expensive; embedding similarity fragile near topic shifts'],
          ['Structural (headings, tables)', 'Manuals, legal, technical specs with clear sections',       'Requires document parsing; fails on poorly-structured PDFs'],
          ['Parent-child / hierarchical',  'Need precise retrieval AND surrounding context',             'More storage, more complexity; retrieval pipeline is two-stage'],
          ['Late chunking',                'You can afford long-context embedders (Jina v3, etc.)',     'Newer technique, fewer integrations; embedder must support it'],
          ['Agentic chunking',             'Documents need LLM judgment to split (legal contracts)',     'Cost: an LLM call per document at ingest. For high-value, low-volume corpora.'],
        ],
      },
    },
    {
      heading: 'Fixed-size: the baseline you outgrow fast',
      body: [
        'Split by N tokens (typically 256-512) with M token overlap (10-20%). It is fast, deterministic, and almost always wrong for production.',
        'Why it fails: it cuts through sentences, headings, code blocks, and table rows. Half-sentences embed to nothing meaningful. The overlap helps but does not fix the cut-mid-thought problem.',
      ],
    },
    {
      heading: 'Recursive character: the LangChain default',
      body: [
        'Try to split on \\n\\n (paragraphs), then \\n (lines), then ". " (sentences), then " " (words), then characters — until each chunk fits the size budget.',
        'Strengths: respects paragraph and sentence boundaries when possible. Easy to use. Reasonable default for messy text.',
        'Weaknesses: still ignores document structure (headings, tables). Tuning chunk size and overlap is per-corpus and rarely revisited.',
      ],
      callout: { kind: 'insight', text: 'Recursive character splitting with chunk_size=512 and overlap=64 is the universal "I\'m not sure what to do" default. It is rarely optimal but rarely terrible.' },
      viz: { slug: 'chunking-comparator', caption: 'same document, four strategies, side by side' },
    },
    {
      heading: 'Semantic chunking: split where topics shift',
      body: [
        'Embed each sentence, then walk through the document detecting where consecutive sentence embeddings diverge — that is a topic boundary, split there.',
        'When it shines: long-form narrative content with implicit sections (blog posts, transcripts, books). The chunks correspond to ideas, not arbitrary token windows.',
        'When it loses: technical documents with explicit headings (use structural). Short documents where topic boundaries do not exist. Cost-sensitive use cases (lots of embedding calls).',
      ],
    },
    {
      heading: 'Structural chunking: when documents have markup',
      body: [
        'Split on the document\'s native structure: H1/H2 sections in Markdown, headings in HTML, sections in LaTeX, top-level keys in JSON, etc. Often combined with a max-size cap (split big sections recursively).',
        'When to use: any document type with reliable structure. This includes Markdown docs, OpenAPI specs, code (split by function/class), and well-OCRed manuals.',
        'Pre-processing matters: PDF extraction quality dominates everything downstream. If your parser is splitting tables wrong, your chunking will be too.',
      ],
    },
    {
      heading: 'Parent-child: small for retrieval, big for generation',
      body: [
        'Index small chunks (say, single paragraphs) for retrieval, but at generation time, fetch the parent (the surrounding section) and feed that to the LLM. Best of both: precise retrieval, contextual generation.',
        'Implementation: store doc_id and parent_chunk_id as metadata on each child. Retrieval returns child chunks; before generation, replace each with its parent (deduplicating overlapping parents).',
        'Cost: ~2x storage (children + parents). Worth it for use cases where small-chunk retrieval is critical but generation needs context.',
      ],
      callout: { kind: 'rule', text: 'Parent-child is the highest-ROI chunking upgrade after recursive character. If you have time for one improvement past the baseline, do this.' },
    },
    {
      heading: 'Contextual chunking (Anthropic): the cheap upgrade',
      body: [
        'Before embedding each chunk, prepend a 50-100 token summary of "where this chunk fits in the document." Anthropic reported ~50% reduction in retrieval failures.',
        'Example: chunk text "The grace period is 14 days." becomes "[From the 2024 Master Service Agreement, Section 5.3 on payment terms]: The grace period is 14 days."',
        'Cost: one LLM call per document at ingest, batched by chunk. Use prompt caching on the document so you do not re-pay the document tokens for every chunk in it.',
      ],
    },
    {
      heading: 'Late chunking: the newer technique',
      body: [
        'Instead of chunking text and then embedding each chunk, embed the entire document with a long-context embedder, then chunk the resulting token-level embeddings into pooled chunk embeddings. Each chunk\'s embedding is now contextualized by the whole document.',
        'When it works: you can use a long-context embedder (Jina embeddings v3, some Cohere variants) and your documents are not enormous.',
        'When it does not: documents larger than the embedder\'s context (back to traditional chunking). Mature integrations are still rare.',
      ],
    },
    {
      heading: 'Decision: which chunking by document type',
      body: [
        'A practical decision sheet you can reach for in interviews and design docs.',
      ],
      decisionRules: [
        { when: 'PDFs / Word docs with clear headings', pick: 'Structural chunking (split on headings, cap each at 800 tokens)', why: 'The author already segmented the document. Use their structure.' },
        { when: 'Wiki / Markdown / docs sites',          pick: 'Markdown-aware structural with parent-child parents = sections', why: 'Headings are reliable. Section-level parents give the LLM what it needs.' },
        { when: 'Customer support tickets / chat',       pick: 'One ticket = one chunk (or one turn = one chunk for long convos)', why: 'Tickets are atomic. Splitting them destroys their meaning.' },
        { when: 'Source code',                            pick: 'AST-based: one function or class per chunk',                    'why': 'Token-window chunking cuts through function bodies. Tree-sitter or similar.' },
        { when: 'Legal contracts',                        pick: 'Section-based with contextual chunking on top',                  'why': 'Contracts cross-reference each other. Every chunk needs section + document context.' },
        { when: 'Long-form articles / books',             pick: 'Semantic chunking',                                              'why': 'Topic boundaries are real and not marked up. Worth the embedding cost.' },
        { when: 'Conversational transcripts',             pick: 'Speaker-turn chunking with sliding window of 3-5 turns',         'why': 'A single turn lacks context; the surrounding turns supply it.' },
        { when: 'Tables / structured data',               pick: 'Don\'t chunk text — extract to SQL or row-per-chunk with schema headers', 'why': 'Embedding tabular data loses precision. Don\'t.' },
      ],
    },
    {
      heading: 'Tuning chunk size and overlap',
      body: [
        'Two knobs you will spend time on. Both are corpus-dependent and you must measure.',
      ],
      bullets: [
        'Chunk size: 256-512 tokens for short queries; 800-1200 tokens for synthesis-heavy queries. Bigger chunks = fewer chunks per query but more irrelevant tokens.',
        'Overlap: 10-20% is typical. Higher overlap helps when chunks split through context but inflates storage and retrieval (same content matches multiple chunks).',
        'Rule of thumb: start with chunk_size=512 and overlap=64. Measure recall@5 and faithfulness. Move from there.',
      ],
      callout: { kind: 'warn', text: 'Do not tune chunk size on vibes. Set up an eval set of 50-100 (query, expected answer, correct chunk) tuples and measure. Vibe-tuning is the most common time sink in RAG.' },
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three frequently-missed signals.',
      ],
      bullets: [
        'Trap 1 — "I\'d split into 512-token chunks." Senior answer: split based on document structure first; fall back to size cap second.',
        'Trap 2 — Ignoring document type. Same chunking for code, contracts, and tickets is a junior signal. Talk through how each needs different splitting.',
        'Trap 3 — No mention of evaluation. Chunking decisions without an eval harness are guesses. Always volunteer the recall-vs-faithfulness measurement plan.',
      ],
    },
  ],
  keyTakeaways: [
    'Pick chunking by document type and query pattern, not by default. There is no universal best.',
    'Parent-child is the highest-ROI upgrade past recursive character splitting.',
    'Contextual chunking (~50 tokens of doc context per chunk) cuts retrieval failures dramatically for ~$$ of LLM ingest cost.',
    'Always pair chunking changes with an eval set. Vibes are not enough.',
  ],
  pitfalls: [
    'Fixed-token chunking on technical PDFs — splits tables and code blocks.',
    'Embedding tabular data instead of normalizing to SQL.',
    'Chunk size set by gut feel; never measured against retrieval quality.',
    'Re-chunking and re-embedding the corpus weekly without versioning the index.',
  ],
  relatedSlugs: ['rag', 'vector-databases', 'evaluation'],
}
