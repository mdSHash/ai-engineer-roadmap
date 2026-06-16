import type { Module, ModuleSlug } from '../types'
import { ragModule } from './rag'
import { vectorDbModule } from './vector-databases'
import { chunkingModule } from './chunking'
import { tokenOptimizationModule } from './token-optimization'
import { promptingForCodeModule } from './prompting-for-code'
import { bottlenecksModule } from './bottlenecks'
import { evaluationModule } from './evaluation'
import { lifecycleModule } from './lifecycle'
import { llmInternalsModule } from './llm-internals'
import { embeddingsModule } from './embeddings'
import { agentsAndToolsModule } from './agents-and-tools'
import { fineTuningModule } from './fine-tuning'
import { structuredOutputsModule } from './structured-outputs'
import { reasoningPatternsModule } from './reasoning-patterns'
import { adversarialDefenseModule } from './adversarial-defense'

export const modules: Record<ModuleSlug, Module> = {
  'rag':                  ragModule,
  'vector-databases':     vectorDbModule,
  'chunking':             chunkingModule,
  'token-optimization':   tokenOptimizationModule,
  'prompting-for-code':   promptingForCodeModule,
  'bottlenecks':          bottlenecksModule,
  'evaluation':           evaluationModule,
  'lifecycle':            lifecycleModule,
  'llm-internals':        llmInternalsModule,
  'embeddings':           embeddingsModule,
  'agents-and-tools':     agentsAndToolsModule,
  'fine-tuning':          fineTuningModule,
  'structured-outputs':   structuredOutputsModule,
  'reasoning-patterns':   reasoningPatternsModule,
  'adversarial-defense':  adversarialDefenseModule,
}

// Order matters for the curriculum reading flow.
// Foundations first, then intermediate, then advanced.
export const moduleList: Module[] = [
  llmInternalsModule,        // 09 — Foundations
  embeddingsModule,          // 10 — Foundations
  ragModule,                 // 01 — Foundations
  vectorDbModule,            // 02 — Foundations
  chunkingModule,            // 03 — Foundations
  tokenOptimizationModule,   // 04 — Intermediate
  promptingForCodeModule,    // 05 — Intermediate
  agentsAndToolsModule,      // 11 — Intermediate
  structuredOutputsModule,   // 13 — Intermediate
  fineTuningModule,          // 12 — Intermediate
  reasoningPatternsModule,   // 14 — Intermediate
  bottlenecksModule,         // 06 — Intermediate
  evaluationModule,          // 07 — Intermediate
  adversarialDefenseModule,  // 15 — Advanced
  lifecycleModule,           // 08 — Advanced
]
