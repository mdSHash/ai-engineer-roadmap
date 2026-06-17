import type { Module } from '../types'

export const promptingForCodeModule: Module = {
  slug: 'prompting-for-code',
  number: '08',
  title: 'The art of asking AI to write code for you',
  tagline: 'Small fixes, large refactors, and from-scratch projects each need a different conversation. Master all three.',
  duration: '50 min read',
  level: 'Intermediate',
  intro:
    'AI coding tools fall into the same trap as humans: ask vague questions, get vague code. The skill is in scoping the problem, loading the right context, and structuring the conversation so the model can actually solve what you asked. This module is the complete playbook for AI-assisted code, organized by project size and stage.',
  sections: [
    {
      heading: 'The mental model: AI is a fast junior who never asks',
      body: [
        'The right way to think about modern AI coding tools (Claude Code, Cursor, GitHub Copilot Workspace, etc.) is as a fast junior who has memorized every public API but who will not stop to ask clarifying questions unless you explicitly invite it.',
        'That changes how you prompt. You need to (a) front-load the context the junior would otherwise gather by reading the codebase, (b) state the constraints they would otherwise miss, and (c) give them permission to ask back when they are unsure.',
      ],
      callout: { kind: 'rule', text: 'Treat every prompt as a one-shot task spec. If a competent junior could not implement what you asked from your description plus the linked files, the model cannot either.' },
    },
    {
      heading: 'The four code-prompting situations',
      body: [
        'Each has a distinct playbook. Misapplying one to another is where engineers waste tokens and hours.',
      ],
      matrix: {
        caption: 'Match the playbook to the situation, not the model',
        headers: ['Situation', 'Optimal approach', 'Anti-pattern'],
        rows: [
          ['Small targeted fix in known code',  'Single-file context, tight diff request',           'Loading the whole repo for a 5-line bug'],
          ['Large refactor in existing code',   'Plan first, scope cuts, multi-pass execution',     'One huge prompt asking the model to refactor the system'],
          ['New feature in existing project',   'Read patterns first, then conform',                'Letting the model invent its own conventions'],
          ['From-scratch project',              'Architecture decisions before any code',           'Asking for an MVP without specifying constraints'],
        ],
      },
    },
    {
      heading: 'Situation 1: Small fix in code you know',
      body: [
        'You have a bug or a tiny feature in a file you can name. The danger is over-prompting — pasting the whole file and asking "make it better" leads to scope creep and unwanted edits.',
      ],
      bullets: [
        'Show the model exactly the function or block. Not the whole file unless the file is small.',
        'State the symptom precisely: "X happens when Y; expected Z."',
        'Constrain the change: "minimum diff," "do not refactor surrounding code," "preserve the public signature."',
        'Ask for a diff, not a rewrite. Diffs force the model to be conservative.',
      ],
      callout: { kind: 'insight', text: 'For small fixes, the model often suggests cleanups it was not asked for. State "do not modify other code unless required for the fix" to stop scope creep.' },
    },
    {
      heading: 'Situation 2: Large refactor in existing code',
      body: [
        'You want to extract a service, swap a library, or migrate to a new pattern across many files. This is where most teams get burned. One huge prompt fails for three reasons: the model loses track halfway through, the context window blows up, and you cannot review the result.',
        'The playbook is plan, then execute in passes.',
      ],
      bullets: [
        'Pass 1: ask the model to read the relevant files and produce a plan (list of files to change, in what order, and why). Review and correct the plan before any code changes.',
        'Pass 2: execute the plan one logical chunk at a time. After each chunk, run tests and review the diff before continuing.',
        'Maintain a "decisions log" the model rereads each pass — what we decided about naming, where state lives, what stays unchanged. Without this, the model drifts.',
        'For very large refactors, consider opening a long-running plan file the model edits as it goes. Treat it as the source of truth across sessions.',
      ],
      callout: { kind: 'warn', text: 'Asking for a refactor across 20 files in one shot will produce code the model believes is correct but is not. The plan-then-execute pattern adds 30% time and saves 200% time later.' },
    },
    {
      heading: 'Situation 3: New feature in an existing project',
      body: [
        'The trap here is the model writing code that works but does not match the project\'s conventions. Tests fail downstream, code reviews ping back, the team\'s style is violated.',
        'Fix: read first, write second. Force the model to surface the project\'s patterns before generating new code.',
      ],
      bullets: [
        'Step 1: "Read 2-3 similar features and tell me the pattern this codebase uses for X" (e.g., service layer, error handling, test structure).',
        'Step 2: Ask the model to summarize the pattern in 5 bullets. Correct any misreadings.',
        'Step 3: "Now implement the new feature using that pattern. Match the file naming, error handling style, test layout."',
        'Step 4: Spot-check that the new code looks like the existing code. If not, point at a specific file and say "match this."',
      ],
    },
    {
      heading: 'Situation 4: From-scratch projects',
      body: [
        'Here you have the most freedom and the highest risk of over-engineering. The model defaults to its training-distribution average — typically a fully-built-out tech stack with abstractions you do not need.',
        'The senior move is to make architectural decisions first, force the model to defer to them, and start narrow.',
      ],
      bullets: [
        'Lock in: language, framework, deployment target, data store, auth method. Write these into a project README the model rereads.',
        'Start with the data model and one critical path end-to-end. Resist building a full feature surface in v1.',
        'Tell the model "no abstractions until needed twice." Otherwise it will generate Service/Repository/Factory layers for one CRUD endpoint.',
        'After the spike works, ask the model to identify what it would refactor next. This separates working code from clean architecture and lets you decide which to invest in.',
      ],
      callout: { kind: 'rule', text: 'Greenfield AI codegen has a productivity ceiling around the first 1000-2000 LOC. Past that, conventions and decisions need to live somewhere outside the model — README, plan files, or memory — or it drifts.' },
    },
    {
      heading: 'Context loading: what to include and what not to',
      body: [
        'The most common mistake is loading too much. The second most is loading too little. Both produce bad code.',
      ],
      bullets: [
        'Include: the file you are editing, files it imports from that you will read, and the project conventions doc (style, naming, error handling).',
        'Skip: large generated files (lockfiles, migrations), unrelated modules, full third-party library source (link to docs URL instead).',
        'For tests: include 1-2 example tests of the same shape so the model matches the test style.',
        'For long-context models: it is not free to include more. The model attends less to each token as the context grows. More is not better past a point.',
      ],
    },
    {
      heading: 'Talking the model into asking back',
      body: [
        'Models default to producing an answer even when they should ask. You can override this.',
      ],
      bullets: [
        'Phrase: "If anything in the spec is ambiguous, list questions before writing code."',
        'Phrase: "Stop and ask before making decisions about A, B, or C." (Naming things, choosing libraries, picking abstractions.)',
        'Pattern: ask the model to summarize what it understood before coding. Mismatches surface fast.',
      ],
    },
    {
      heading: 'Reviewing AI-generated code: what to actually check',
      body: [
        'You will be asked in interviews "how do you trust AI-generated code?" The answer is: same way you trust a junior\'s code, with sharper attention to certain failure modes.',
      ],
      bullets: [
        'Hallucinated APIs: methods that do not exist, library names that are slight misspellings of real ones, deprecated patterns. Run / type-check first.',
        'Plausible-but-wrong logic: the code looks reasonable but does not handle the off-by-one, the empty case, or the concurrent caller. Read every if/branch.',
        'Over-engineering: factories, adapters, observers added "for flexibility." Strip them if the YAGNI bar is not met.',
        'Subtle license violations: pasted snippets from training data with non-MIT licenses. Less common with modern models but watch for verbatim large blocks.',
        'Tests that pass for the wrong reason: mocks that mock the wrong thing, asserts that always pass. Read the test, not just the green checkmark.',
      ],
      callout: { kind: 'insight', text: 'AI code reviews require the same energy as junior code reviews — what changes is the volume. You will review 5x more code, so build muscle for fast skim-then-deep-read on suspicious sections.' },
    },
    {
      heading: 'Tooling: which AI coding tool when',
      body: [
        'Quick orientation. Pick the tool by where the work lives.',
      ],
      bullets: [
        'Inline autocomplete (Copilot, Cursor Tab): for typing speed on small predictable code. Quality drops fast on novel logic.',
        'Chat-in-IDE (Cursor Chat, Claude in IDE, Continue): for "explain this", "write this function", small refactors with file context.',
        'Agentic CLI (Claude Code, Cursor Agent, Aider): for multi-file tasks, plan-then-execute, working in a repo over many turns. The current frontier.',
        'Browser-based long-context (Claude.ai, ChatGPT): for high-stakes code where you want explicit human review of every diff before it touches the file system.',
      ],
    },
    {
      heading: 'Common interview traps',
      body: [
        'Three patterns that separate hands-on AI users from cargo-cult ones.',
      ],
      bullets: [
        'Trap 1 — "I just paste my whole repo." Senior answer: scoped context, plan-then-execute, conventions doc.',
        'Trap 2 — Treating AI output as a finished product. Senior answer: code review process, hallucinated-API checks, test-first prompting.',
        'Trap 3 — Not knowing failure modes. Saying "AI just works" is a junior signal. Naming three failure patterns and how you mitigate them is senior.',
      ],
    },
  ],
  keyTakeaways: [
    'Match the prompting playbook to the situation: small fix, big refactor, new feature, or from scratch.',
    'For large refactors, plan-then-execute in passes. Single-shot prompts fail at scale.',
    'For new features, force the model to surface and conform to existing patterns before writing.',
    'For from-scratch projects, freeze architectural decisions early and resist abstraction inflation.',
    'Reviewing AI code is its own skill — hallucinated APIs, over-engineering, and false-positive tests are the top three failure modes.',
  ],
  pitfalls: [
    'One-shot refactor prompts that ask for too much in too little context.',
    'Letting the model invent conventions instead of inheriting them from the codebase.',
    'Skipping the "summarize what you understood" check before generating code.',
    'Trusting tests that pass without reading what they actually assert.',
  ],
  relatedSlugs: ['token-optimization', 'lifecycle', 'bottlenecks'],
}
