import type { Module, ModuleSlug } from '../types'

export const structuredOutputsModule: Module = {
  slug: 'structured-outputs' as ModuleSlug,
  number: '13',
  title: 'Structured outputs — making models return usable data',
  tagline: 'Every production AI system depends on this layer. Junior engineers tell models "respond in JSON" and ship bugs.',
  duration: '35 min read',
  level: 'Intermediate',
  intro:
    'JSON mode, function calling, constrained decoding, schema design, validation. The bridge between LLM output and the rest of your application. Every production AI system depends on this layer; every interviewer probes it.',
  sections: [
    {
      heading: 'Why "just ask for JSON" fails',
      body: [
        'A surprising number of teams ship pipelines whose entire reliability story is the string "respond in valid JSON, no prose." This works most of the time, which is exactly the problem — most of the time is not production.',
        'LLMs sample one token at a time. They have no symbolic notion that an opening bracket needs a matching close, that a comma must precede the next field, or that a string must end before the trailing brace. Each token is just a probability distribution; the structural rules of JSON live nowhere in the decoder. When the model gets near the context limit, gets confused by an example, or sees a stray quote in the input, it can produce {"name": "Alice", "age": 30,} or trail off mid-string. Your downstream JSON.parse throws.',
        'Worse, the prompt-only approach silently degrades when you change models, change temperature, or paste a customer message containing a curly brace. The failure is rare, looks fine in eval, and explodes in production at 3am.',
      ],
      callout: { kind: 'warn', text: 'If a candidate proposes "ask for JSON in the prompt" as their structured-output strategy, that is a junior signal. Always volunteer the failure modes and propose a real mechanism.' },
    },
    {
      heading: 'Three mechanisms, three guarantees',
      body: [
        'There are three real ways to get structured output out of a model. They look similar from the outside and have very different guarantees underneath. Naming the difference is the senior signal.',
      ],
      matrix: {
        caption: 'Pick by the guarantee you actually need',
        headers: ['Mechanism', 'What it does', 'Guarantee', 'When to pick'],
        rows: [
          ['Prompt instruction',     'Tell the model "return JSON"',                                       'None — best-effort string output',                       'Internal scripts, low-stakes, never production'],
          ['JSON mode',              'Provider flag forcing valid-JSON output',                            'Output parses as JSON. Schema is NOT enforced.',         'You control parsing but tolerate field-shape drift'],
          ['Function / tool calling', 'Schema declared, model emits a typed call',                          'Output matches a named schema, validated server-side',   'You want the canonical "model returns typed data" API'],
          ['Constrained decoding',   'Token sampler masked by a grammar (JSON Schema, regex, BNF)',        'Output is mathematically forced to match the grammar',   'Self-hosted, strict schemas, zero-tolerance pipelines'],
          ['Repair pipeline',        'Parse, regex-extract, LLM-repair, fallback',                         'Probabilistic — recovers most malformed output',         'Wrap any of the above for the long tail'],
        ],
      },
    },
    {
      heading: 'Constrained decoding: the mechanism that actually guarantees the shape',
      body: [
        'Constrained (or guided) decoding is the only technique that gives a hard guarantee. At each generation step, you compute the set of tokens that would keep the partial output valid under your grammar, and you mask the logits of every other token to negative infinity before sampling. The model literally cannot produce an invalid character.',
        'Implementations include Outlines, llguidance, XGrammar, Guidance, and the structured-output flags exposed by vLLM, TGI, and Ollama. They accept a JSON Schema, a Pydantic model, a regex, or a context-free grammar, compile it to a finite-state machine over the token vocabulary, and intersect that with the model logits at sampling time.',
        'There is a quality cost. Constraining the sampler can push the model into low-probability regions of its distribution, especially with rigid schemas it was not trained on. The fix is to constrain the structure but not the content — let the model choose field values freely, only force the shape.',
      ],
      callout: { kind: 'insight', text: 'For self-hosted models, constrained decoding is the right default. For hosted APIs, "structured outputs" mode (OpenAI, Anthropic, Gemini) gives you the same guarantee through their server-side decoder.' },
    },
    {
      heading: 'Schema design: the difference between a schema that helps and one that hurts',
      body: [
        'A bad schema makes a good model dumb. A good schema makes a mid-sized model usable. Schema design is the highest-leverage knob in this whole stack and most teams ignore it.',
        'Three rules carry most of the weight: prefer flat over nested, prefer enums over free-text, and write a description for every field. Flat schemas reduce the probability of brace-mismatch errors and let the model commit to one field at a time. Enums collapse the space the model has to search and turn extraction into classification. Field descriptions are read by the model — they are not just documentation. Treat them like prompt fragments.',
      ],
      decisionRules: [
        { when: 'A field can take one of a small set of values (status, priority, sentiment)', pick: 'Enum with explicit values', why: 'Free-text fields produce "high", "High", "HIGH", "elevated" indefinitely. Enums collapse the surface area to a fixed set the model can match.' },
        { when: 'You have an array of repeated objects', pick: 'Flat top-level fields when the count is bounded', why: 'A model fills primary_email, secondary_email more reliably than emails: [...]. Arrays multiply the chance of structural error.' },
        { when: 'A field might not apply', pick: 'Make it nullable with an explicit description, not optional', why: 'Optional fields silently omit. Nullable fields force the model to commit to "not present" rather than drift.' },
        { when: 'You need a long unstructured field (summary, notes)', pick: 'Put it last in the schema', why: 'Free-text generation is high-variance. Resolving it at the end means structural fields are already fixed before the model wanders.' },
        { when: 'Fields have semantic relationships (start_date < end_date)', pick: 'Validate post-hoc; do not encode in schema', why: 'Schema languages cannot express cross-field invariants. Use Pydantic / Zod validators after parsing.' },
      ],
    },
    {
      heading: 'Pydantic and Zod: validation is not optional',
      body: [
        'Even with constrained decoding, every model output must pass through a typed validator before reaching the rest of the system. In Python that means Pydantic; in TypeScript that means Zod. Validation failures are errors, not warnings — they should raise, not log.',
        'The reason is defense in depth. Constrained decoders have bugs. Schema versions drift between client and server. Models occasionally produce schema-valid but semantically wrong output (right shape, wrong meaning). The validator is your last line. It also gives you typed objects downstream instead of dicts of unknowns, which removes a large class of runtime bugs.',
        'A useful pattern: define the schema once in Pydantic / Zod, derive the JSON Schema from it for the LLM call, and validate the response with the same model. One source of truth, no drift.',
      ],
      callout: { kind: 'rule', text: 'Treat schema validation failure the same way you treat a 500 from a downstream API — retry with backoff, then fail loud. Never silently default and continue.' },
    },
    {
      heading: 'Schema-too-large is a real degradation',
      body: [
        'Junior intuition: more fields means more useful output. Empirical reality: a 200-field schema produces materially worse output than a 20-field schema. The model has to maintain structural state across hundreds of generation steps, and the probability of a misstep compounds.',
        'The senior move is decomposition. If you need 50 fields about a document, do not ask for them in one call. Group them into 4-6 cohesive sub-schemas (identification, parties, dates, financials, terms, signatures) and run them as parallel calls against the same source. Quality goes up, latency goes down via parallelism, cost stays roughly equal, and per-field error becomes diagnosable instead of one giant blob.',
        'There is a second, sneakier reason: large schemas push the description tokens up so far in the context that the model "forgets" them by the time it generates field 87. Decomposition keeps the relevant instructions close to the work.',
      ],
    },
    {
      heading: 'Refusals belong in the schema',
      body: [
        'A common bug: the model is asked to extract a phone number from a contract that has none. With a schema demanding a phone_number string, it hallucinates one. Constrained decoding makes this worse, not better — the grammar forces the model to fill the field whether the answer exists or not.',
        'The fix is to design refusal as a valid branch of the schema. A discriminated union like {kind: "found", phone_number: string} | {kind: "not_present", reason: string} | {kind: "ambiguous", candidates: string[]} gives the model a legitimate place to put "I do not know" and a downstream consumer that can branch on it.',
        'Every extraction schema in production should have an explicit "could not determine" path. If your schema does not, you are getting hallucinations and counting them as data.',
      ],
      callout: { kind: 'warn', text: 'Constrained decoding plus a non-nullable required field equals guaranteed hallucination when the data is missing. The grammar will fill it. Always offer a refusal branch.' },
    },
    {
      heading: 'Streaming structured output is harder than it looks',
      body: [
        'For chat-style UIs, you want to stream the structured response so the user sees something happening. Partial JSON is famously annoying to consume — every token can break the parse, and naive incremental JSON parsers give you garbage-in-garbage-out.',
        'The real solutions: stream against a tolerant parser (partial-json, jsonrepair, ijson), expose only the fields whose closing brace has been seen, and never expose a value until its parent object is structurally closed. Some providers stream typed deltas (path + value) instead of raw JSON — when available, prefer that.',
        'For many use cases the right answer is to not stream the structure at all. Stream a free-text "thinking" prefix to the user for perceived latency, then issue a separate non-streamed structured call for the actual data. Two calls, but a much simpler client.',
      ],
    },
    {
      heading: 'Repair pipelines: assume malformed output and recover',
      body: [
        'Even with all of the above, you will get malformed output in production. The right response is a layered repair pipeline that fails forward, not a single brittle parse.',
      ],
      bullets: [
        'Layer 1 — strict parse: try the typed validator. If it passes, return.',
        'Layer 2 — regex extract: pull the largest brace-balanced substring out of the response (models often wrap JSON in prose despite instructions). Reparse.',
        'Layer 3 — repair pass: send the malformed output back to a small model with a "fix this JSON to match this schema" prompt. Cheap, surprisingly effective.',
        'Layer 4 — fallback default: schema-valid empty object with a flag (extraction_status: "failed"). Do not crash the user; surface the failure to ops.',
        'Always log the raw response that failed each layer. Repair stats are your retrieval-quality signal for this stack.',
      ],
    },
    {
      heading: 'Tool calls are structured outputs',
      body: [
        'A tool call (function call) and a structured-output response are the same primitive. The model is emitting a typed payload that conforms to a named schema. The only difference is intent — a tool call is "run this code"; a structured output is "return this data."',
        'This matters because the function-calling APIs from major providers are the most battle-tested structured-output endpoints they ship. They get more eval, more tuning, and tighter guarantees than ad-hoc JSON mode. When you need typed data out of a hosted model, define a fake tool whose "execution" is just returning the args, and use the tool-calling pathway. You inherit the better infrastructure for free.',
        'The senior framing in an interview: "I would model this as a tool call even though no tool is being executed, because that is the canonical typed-output API of the model and it is more reliable than the JSON-mode flag."',
      ],
    },
    {
      heading: 'Cost, latency, and quality are not free',
      body: [
        'Constrained decoding is not a strict win. It moves the cost into different places, and you should know which.',
        'Latency: constrained decoders compute a token mask at each step. For complex grammars on large vocabularies this can add 5-30% per-token latency. Most production systems accept this; latency-critical ones (search-as-you-type) do not.',
        'Quality: as noted above, rigid schemas can push the model out of its high-probability region. The fix is mostly schema design, but for genuinely hard tasks you may need to compare schema-on vs schema-off completion quality on your own eval set.',
      ],
      callout: { kind: 'insight', text: 'Always run a paired eval: same prompts, schema-constrained vs unconstrained-then-validated. The right answer is "whichever has better schema-valid task accuracy", not "the one that parses more often."' },
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three traps separate junior from senior answers in structured-output questions.',
      ],
      bullets: [
        'Trap 1 — "Just add RESPOND IN JSON to the prompt." Senior answer: name the three real mechanisms (JSON mode, function calling, constrained decoding), explain that prompt-only output is statistical and will fail in the long tail, and pick the one whose guarantee matches the failure budget.',
        'Trap 2 — "Build one schema with all 50 fields and extract in one call." Senior answer: schema-too-large degrades quality measurably; decompose into 4-6 cohesive sub-schemas, run in parallel, validate independently, recombine. Quality up, latency down, errors localized.',
        'Trap 3 — "JSON parses but ~5% of the time the field names are wrong." Senior answer: that is a schema-instruction failure, not a parsing failure. The model is generating valid JSON without true schema enforcement — likely prompt-only or JSON-mode without strict schema. Move to constrained decoding or strict-mode function calling, validate with Pydantic / Zod, treat any validation failure as a hard error.',
      ],
    },
  ],
  keyTakeaways: [
    'There are three real mechanisms — JSON mode, function calling, constrained decoding — and only the last gives a hard structural guarantee.',
    'Schema design dominates output quality: flat over nested, enums over free-text, descriptions on every field, refusal as an explicit branch.',
    'Pydantic or Zod validation is mandatory; schema failures are errors, never warnings.',
    'Schema-too-large is a real degradation. Decompose 50-field extractions into parallel sub-schemas.',
    'Tool calling and structured output are the same primitive — the tool-calling endpoint is usually the most reliable typed-output API a provider exposes.',
    'Always wrap structured outputs in a layered repair pipeline: strict parse, regex extract, LLM repair, fallback default.',
  ],
  pitfalls: [
    'Relying on prompt-only "respond in JSON" instructions in production. Works in eval, fails in the long tail.',
    'Required non-nullable fields plus constrained decoding when the data may be missing — guaranteed hallucinations.',
    'One mega-schema with 100+ fields per call instead of decomposed sub-schemas.',
    'Defining the schema in two places (LLM client + validator) and letting them drift instead of deriving one from the other.',
    'Streaming raw partial JSON to a strict client parser and crashing on every intermediate token.',
    'Logging schema-validation failures as warnings and silently continuing with a default object — the data is wrong and nobody knows.',
  ],
  relatedSlugs: ['prompting-for-code', 'evaluation', 'token-optimization', 'agents-and-tools'] as ModuleSlug[],
}
