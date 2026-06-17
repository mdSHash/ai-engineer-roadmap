export type ModuleSlug =
  | 'rag'
  | 'vector-databases'
  | 'chunking'
  | 'token-optimization'
  | 'prompting-for-code'
  | 'bottlenecks'
  | 'evaluation'
  | 'lifecycle'
  | 'llm-internals'
  | 'embeddings'
  | 'agents-and-tools'
  | 'fine-tuning'
  | 'structured-outputs'
  | 'reasoning-patterns'
  | 'adversarial-defense'

export interface Module {
  slug: ModuleSlug
  title: string
  tagline: string
  duration: string
  level: 'Foundations' | 'Intermediate' | 'Advanced'
  number: string
  intro: string
  sections: Section[]
  keyTakeaways: string[]
  pitfalls: string[]
  relatedSlugs?: ModuleSlug[]
}

export type VizSlug = 'chunking-comparator' | 'rag-pipeline-flow' | 'token-cost-calculator'

export interface Section {
  heading: string
  body: string[]
  bullets?: string[]
  matrix?: { headers: string[]; rows: string[][]; caption?: string }
  callout?: { kind: 'rule' | 'warn' | 'insight'; text: string }
  decisionRules?: { when: string; pick: string; why: string }[]
  viz?: { slug: VizSlug; caption?: string }
}

export interface InterviewQuestion {
  id: string
  category:
    | 'RAG'
    | 'Vector DB'
    | 'Chunking'
    | 'Tokens & Cost'
    | 'Prompting'
    | 'Bottlenecks'
    | 'Evaluation'
    | 'System Design'
    | 'Lifecycle'
  difficulty: 'Junior' | 'Mid' | 'Senior'
  scenario: string
  answer: {
    summary: string
    steps: string[]
    tradeoffs: string[]
    redFlags: string[]
    followUps: string[]
  }
}

export interface Flashcard {
  id: string
  category: string
  front: string
  back: string
}

export interface DecisionTreeNode {
  id: string
  question?: string
  recommendation?: string
  detail?: string
  options?: { label: string; nextId: string; rationale?: string }[]
}

export interface DecisionTree {
  slug: string
  title: string
  description: string
  rootId: string
  nodes: Record<string, DecisionTreeNode>
}

export interface Quiz {
  slug: ModuleSlug
  title: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}
