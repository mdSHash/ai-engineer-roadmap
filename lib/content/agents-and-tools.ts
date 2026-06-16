import type { Module } from '../types'

export const agentsAndToolsModule: Module = {
  slug: 'agents-and-tools',
  number: '11',
  title: 'Agents and tool use',
  tagline: 'How LLMs actually take actions. The hottest interview topic in 2025-2026.',
  duration: '50 min read',
  level: 'Intermediate',
  intro:
    "Tool calling, the agent loop, ReAct, MCP, multi-agent patterns — central to modern AI engineering and the curriculum has zero foundational coverage. By the end you should be able to design a safe agent, name its failure modes, and defend it against prompt injection through tool output.",
  sections: [
    {
      heading: 'What actually happens when an LLM "calls a tool"',
      body: [
        'The model does not call anything. The model emits text. When you have configured tool calling, the model emits a structured JSON payload with two fields: a tool name and an arguments object. Your runtime — the agent harness, the SDK, the framework — parses that payload, executes the actual function, and feeds the return value back into the next turn as a tool-result message.',
        'This three-step dance — model emits intent, runtime executes, runtime returns observation — is the entire mechanic. Everything else (ReAct, agent loops, MCP) is layered on top of it. Junior candidates describe tool calling as if the model "runs" code. Senior candidates draw the boundary: model is a token generator; the runtime is the executor; the round-trip is mediated by structured messages.',
        'Practical consequence: the model can hallucinate a tool that does not exist, hallucinate arguments in the wrong shape, or call a real tool with wrong values. Your runtime must validate the JSON schema before executing, and return a descriptive error message back to the model when validation fails. The model will usually self-correct on the next turn.',
      ],
      callout: { kind: 'rule', text: 'A tool call is just structured output the model is biased toward producing. Treat the JSON payload as untrusted input — schema-validate before you ever execute.' },
    },
    {
      heading: 'The agent loop: observe, think, act, observe',
      body: [
        'An agent is not a model and not a framework. An agent is a loop. Pseudo-code: while not done, send conversation to the model, parse response, if it contains a tool call execute it and append the result, otherwise return the final message. That is it.',
        'Everything else — system prompt, allowed tools, memory, planning module — is configuration on top of this loop. When you hear "build me an agent," you are being asked to specify the loop body, the stopping conditions, and the tool surface. Frameworks like LangGraph or the OpenAI Agents SDK package this loop with sensible defaults; they do not invent new mechanics.',
        'The mental model that matters: a single-agent loop with 3-5 well-chosen tools and a tight system prompt outperforms most "multi-agent orchestrator" architectures in production. Complexity does not improve reliability; it usually destroys it.',
      ],
    },
    {
      heading: 'ReAct vs plain function calling',
      body: [
        'ReAct ("Reason + Act") interleaves natural-language reasoning and actions in the model\'s output: "Thought: I need the weather. Action: get_weather(\\"NYC\\"). Observation: 72°F. Thought: now I can answer." It was the dominant pattern in 2022-2023 because models did not have native function calling and you had to parse actions out of free-form text.',
        'Plain function calling moves the action half into structured JSON, while leaving the reasoning either implicit (the model reasons internally before emitting the tool call) or in a thinking/scratchpad channel that some providers expose separately. This is the modern default and it is more reliable: there is no brittle text parser between you and the action.',
        'You still see ReAct in older LangChain code, in research papers, and in agents that need explainable traces. Most production systems should use native function calling and rely on a thinking/scratchpad block when reasoning trace is needed.',
      ],
      callout: { kind: 'insight', text: 'If you are still parsing "Action:" lines out of model output in 2026, you are paying a reliability tax that no longer makes sense. Native function calling is universally available.' },
    },
    {
      heading: 'How to design tools the model can actually use',
      body: [
        'Bad tools are the single most common reason agents fail. The model is only as good as the API surface it is handed, and most teams hand it something resembling internal RPC calls — terse names, dozens of optional args, ambiguous overloads.',
      ],
      decisionRules: [
        { when: 'The tool does one thing', pick: 'Give it a verb-noun name and 1-3 required arguments', why: 'Models route by name. "search_docs" beats "documentSearchService_v2_handle". Argument count above ~5 starts to degrade tool selection.' },
        { when: 'The tool could be called twice with the same args', pick: 'Make it idempotent or surface a "already_done" status', why: 'Agents retry. A non-idempotent send_email tool will email twice. Idempotency keys or duplicate detection is non-negotiable for state-changing tools.' },
        { when: 'The tool can fail in user-recoverable ways', pick: 'Return descriptive errors as tool-result content, not exceptions', why: 'The model treats the error string as the next observation and self-corrects. "User not found: try email instead of username" routes the model to the fix.' },
        { when: 'The tool returns large payloads', pick: 'Return a summary plus a handle (id, url) the model can fetch later', why: 'Stuffing 50KB of JSON into the next turn destroys the context window and forces the model to re-read it on every step.' },
        { when: 'Two tools have overlapping purpose', pick: 'Merge them or remove one', why: 'The model will toss a coin between them. Disambiguation costs tokens and accuracy.' },
      ],
    },
    {
      heading: 'Stopping conditions: you need all four',
      body: [
        'An agent without stopping conditions becomes a runaway compute bill or an infinite loop. Production agents need at least four independent kill switches.',
      ],
      bullets: [
        'Max iterations: hard cap on loop turns (typically 10-25). Hits when the agent gets stuck.',
        'No tool call emitted: the model returned a final answer without invoking a tool. This is the happy path exit.',
        'Explicit done signal: a "submit" or "finish" tool the model calls when it believes the task is complete. Useful for tasks where "no tool" is ambiguous.',
        'Budget exhaustion: token budget, dollar budget, or wall-clock budget hit. Fail closed with a partial-result message rather than burning more.',
      ],
      callout: { kind: 'warn', text: 'A single stopping condition is not enough. Max-iterations alone lets a runaway agent burn 25 turns. Budget alone lets a misbehaving agent silently exceed iteration sanity. You need the conjunction.' },
    },
    {
      heading: 'The compounding error problem',
      body: [
        'Per-step reliability multiplies. A 90%-reliable step compounds to 0.9^10 = 35% over a ten-step trajectory. A 95%-reliable step compounds to 0.95^10 = 60%. To hit 90% end-to-end across ten steps you need 99% per step. This is the math that kills naive agents.',
        'There are exactly three ways out: shorten the trajectory (combine steps, make tools higher-level), raise per-step reliability (better prompts, stronger model, tool-side validation), or insert verification (a checker that catches errors before they propagate). All three are valid; teams that ignore the math and just "iterate" never converge.',
        'Senior signal in interviews: when asked "will this work in production?" of a 12-step agent, do the math out loud. "Even at 95% per step, that is 54% end-to-end. We need to either compress steps or add a verification layer."',
      ],
    },
    {
      heading: 'Multi-agent patterns: when (rarely) and how',
      body: [
        'The marketing makes multi-agent systems sound essential. In practice, most production "agents" are single loops with good tools. When multi-agent helps, it helps for one of three reasons: parallelism (independent subtasks fan out), specialization (different system prompts and tool surfaces), or adversarial verification (one agent generates, another critiques).',
      ],
      matrix: {
        caption: 'Match the pattern to the failure mode it actually addresses',
        headers: ['Pattern', 'Use when', 'What goes wrong'],
        rows: [
          ['Single-agent loop', 'Default. Most workflows fit here.', 'None inherent — start here, escalate only on evidence.'],
          ['Orchestrator/worker', 'Task naturally decomposes into independent subtasks', 'Orchestrator picks bad subtasks; outputs do not compose; coordination overhead exceeds benefit.'],
          ['Planner + executor', 'Long-horizon tasks where upfront plans help', 'Plans become stale; rigid plans cannot adapt to new observations; brittle on novel inputs.'],
          ['Debate / critic', 'High-stakes outputs needing verification', 'Critics agree with generators (sycophancy); cost doubles for marginal gains.'],
          ['Swarm / role-based', 'Simulating a workflow (PM + dev + QA personas)', 'Theatre. Personas hide that the same model is talking to itself. Rarely beats a single-agent loop with the same tools.'],
          ['Hierarchical', 'Genuinely huge task surface', 'Context loss between layers; slow; expensive; usually unnecessary.'],
        ],
      },
    },
    {
      heading: 'MCP — the open standard worth knowing',
      body: [
        'Model Context Protocol is an open spec for exposing tools and resources to any LLM client. Anthropic published the initial version; OpenAI, the major IDEs, and a growing list of agent frameworks have adopted it. The point is decoupling: write a tool server once, any compliant client can use it.',
        'Architecturally, an MCP server exposes "tools" (callable functions), "resources" (readable data), and "prompts" (template snippets). The client (your agent runtime, an IDE, a chat app) speaks JSON-RPC to the server. The model is unchanged — it still emits structured tool calls — but the runtime side becomes pluggable.',
        'When this matters: building tools you want consumed by multiple agents or clients, or integrating with the IDE/desktop ecosystem that has standardized on MCP. When it does not matter: an internal agent calling four internal tools written by the same team. Direct function calling stays simpler.',
      ],
    },
    {
      heading: 'Failure modes that bite in production',
      body: [
        'Every agent eventually exhibits at least one of these. Knowing them by name is the difference between "the agent is broken" and a debuggable hypothesis.',
      ],
      bullets: [
        'Tool-call hallucination: model invokes a tool that does not exist, or invents argument keys. Fix: schema validation + descriptive error response that lists allowed tools.',
        'Infinite loop: model keeps calling the same tool with slight variations, never finishing. Fix: detect repeated calls, escalate to "you have called this tool N times — stop and answer".',
        'Plan drift: model abandons the original goal mid-trajectory and chases a side quest. Fix: re-inject the original task into the system prompt every K turns, or use a planner that holds the goal externally.',
        'Context bloat: tool outputs accumulate until context is mostly stale observations. Fix: summarize or evict old turns, store large outputs by reference (id) and let the model fetch on demand.',
        'Premature termination: model gives up and returns a half-finished answer. Fix: explicit "submit" tool with a checklist, or add a verifier step before letting the loop exit.',
        'Wrong-tool selection: model picks the plausible-but-wrong tool from two similar ones. Fix: deduplicate the tool surface, sharpen names and descriptions, add disambiguating examples.',
      ],
    },
    {
      heading: 'Agent safety — the privilege model',
      body: [
        'Every tool the agent has is a privilege the attacker inherits. An agent with a send_email tool can be coerced into sending email by anyone whose text reaches its context — including the body of a retrieved document, the output of a search tool, or a user-uploaded PDF. This is prompt injection through tool output, and it is the dominant attack vector.',
        'The mitigations are layered. Treat any text returned by a tool as untrusted user input — never execute instructions from it. Isolate destructive actions (writes, sends, payments, deletes) behind explicit human approval gates that show the resolved arguments before commit. Apply principle of least privilege: do not give an agent file_write if it only needs file_read. Sandbox code execution. Rate-limit per-tool calls to constrain blast radius.',
        'Senior signal: when asked "is this agent safe?" the answer is never yes/no. The answer enumerates the tool surface, the trust boundary on each input source, the destructive actions, and the approval gates. If destructive tools are wired up without approval gates, the design is broken.',
      ],
      callout: { kind: 'warn', text: 'An agent with shell access plus internet access plus retrieval over user-controlled documents is a remote code execution vector. The compose of features creates the vulnerability — each one in isolation might look fine.' },
    },
    {
      heading: 'Frameworks: what each one is actually for',
      body: [
        'You will be asked which framework. The honest answer is that frameworks are thin wrappers over the same loop, and the choice is mostly about ergonomics, observability, and what your team already runs.',
      ],
      matrix: {
        caption: 'Agent frameworks as of 2025-2026',
        headers: ['Framework', 'Sweet spot', 'Watch out for'],
        rows: [
          ['LangGraph',          'Stateful graph workflows with branches, retries, persistence',  'Heavy abstraction; debugging the graph state is its own skill'],
          ['CrewAI',             'Role-based "team" agents, opinionated multi-agent setups',      'The metaphor leaks; hides how much is just one model talking to itself'],
          ['AutoGen',            'Microsoft research agent patterns, conversational multi-agent', 'Research feel, API churn, less production polish'],
          ['OpenAI Agents SDK',  'Production single-agent loops with first-class tracing',         'Tied to OpenAI conventions; cross-provider portability is partial'],
          ['Anthropic computer use', 'Agents that drive a real desktop (mouse, screen, keyboard)', 'Slow, expensive, fragile; sandbox carefully — full system access'],
          ['Pydantic AI',        'Typed Python-native agent definitions, validation built-in',    'Newer, smaller ecosystem'],
          ['Vercel AI SDK',      'TypeScript agents in Next.js / edge environments',              'Streaming-first; complex multi-step orchestration is less ergonomic'],
          ['Roll your own',      'Tight requirements, deep observability needs',                  'You will reimplement retry, tracing, persistence — budget the time'],
        ],
      },
    },
    {
      heading: 'Evaluating agents: trajectory vs outcome',
      body: [
        'Two evaluation lenses, and you need both. Outcome eval asks: did the final result match the expected answer? Trajectory eval asks: did the agent take a sensible path to get there? An agent that gets the right answer by calling the wrong tools five times is a production liability — it will burn cost and break the moment one of those wrong tools changes behavior.',
        'Build outcome eval first because it is cheaper: golden tasks, expected outputs, automated grader (often LLM-as-judge for open-ended outputs, exact match for structured ones). Build trajectory eval second: log every tool call, score on tool selection accuracy, step count vs optimal, and per-step recoverability.',
        'When trajectory metrics regress but outcome metrics hold, you have an inefficiency problem (more cost, more latency, more failure surface). When outcome regresses, you have a quality problem. Distinguishing the two in interviews is a senior signal.',
      ],
    },
    {
      heading: 'Cost and latency: the hidden tax',
      body: [
        'A single-shot LLM call is one model invocation. A 10-step agent is ten model invocations plus tool execution overhead. Real-world agents run 5-20x the cost and latency of equivalent single-shot calls — sometimes worse when reasoning models are in the loop.',
        'Where the cost actually goes: input tokens grow on every turn because the conversation history accumulates. By turn 10 you are re-paying for the system prompt, all prior tool calls, and all prior observations on every model call. Prompt caching (where supported) cuts the recurring cost dramatically for the static system prompt and tool schemas. Without caching, agents are nearly always cost-prohibitive at scale.',
        'Latency: tool execution time stacks on top of model latency. p95 budget for an agent is rarely under 5 seconds. If you need sub-second responses, you do not need an agent — you need a single-shot call with the right tool already selected.',
      ],
      callout: { kind: 'insight', text: 'Before defending an agent design, run the napkin math: average steps × per-step token cost × per-step latency. If the result is incompatible with the SLA or the unit economics, simpler architectures (single-shot, classifier + tool) usually win.' },
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three interview questions appear in nearly every senior AI engineering loop. Get the framing right and the rest follows.',
      ],
      bullets: [
        'Trap 1 — "Walk me through what happens when an LLM calls a tool." Junior answer treats the model as the executor. Senior answer: model emits structured JSON (name + args), runtime parses and executes, runtime returns the result as a tool-result message on the next turn. Mention schema validation, error round-tripping, and that the model never touches your system directly.',
        'Trap 2 — "Design a research agent." Junior answer: lists tools and stops. Senior answer: name the tool surface (search, fetch, summarize, cite), the stopping conditions (max iterations, no-tool-call, explicit submit, budget), the trust boundary (web text is untrusted), and the eval plan (outcome on a golden set, trajectory on tool-selection accuracy). Estimate cost and latency.',
        'Trap 3 — "Your agent is hitting an infinite loop on certain queries — debug it." Junior answer: increase max iterations. Senior answer: log the trajectory, identify the repeated tool/argument pattern, find the missing exit condition (likely a tool returning ambiguous results the model keeps re-trying), then fix at the tool layer (better error messages, idempotency, return a "no further results" signal) plus at the loop layer (detect repetition, force a final answer).',
      ],
    },
  ],
  keyTakeaways: [
    'A tool call is structured JSON the model emits; your runtime executes and returns the result. The model never runs anything itself.',
    'An agent is a loop, not a model. Specify the loop body, the tool surface, and the stopping conditions — that is the design.',
    'Compounding error math is brutal: 95% per step over 10 steps is 60% end-to-end. Shorten trajectories, raise per-step reliability, or add verification.',
    'Most production "agents" should be single-loop with 3-5 sharp tools. Multi-agent helps for parallelism, specialization, or adversarial verification — rarely otherwise.',
    'Every tool is a privilege the attacker inherits via prompt injection. Approval gates on destructive actions are non-negotiable.',
    'Evaluate both outcome (did it get there) and trajectory (was the path sensible). They fail differently and demand different fixes.',
  ],
  pitfalls: [
    'Shipping an agent with only a max-iterations cap and no budget or repetition detection. The first runaway burns the budget.',
    'Giving the model a tool surface that includes two near-duplicate tools. Selection accuracy collapses without warning.',
    'Trusting tool output as instructions. Retrieval-injection attacks pivot through this every time.',
    'Returning massive JSON blobs as tool results. Context bloats, costs spike, and the model starts ignoring older turns.',
    'Wiring destructive tools (send, delete, pay, deploy) without approval gates. The first prompt injection becomes a production incident.',
    'Skipping prompt caching on the system prompt and tool schemas. Agent unit economics collapse without it at scale.',
  ],
  relatedSlugs: ['rag', 'evaluation', 'structured-outputs', 'adversarial-defense'],
}
