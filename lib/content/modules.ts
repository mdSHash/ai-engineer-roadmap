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

// Pedagogical sequence — each module builds on the ones before it.
// Foundations: 01-05 (mechanics → embeddings → text prep → storage → RAG)
// Generation control: 06-08 (cost → reliable outputs → AI tooling)
// Advanced techniques: 09-11 (reasoning → agents → adaptation)
// Production operations: 12-15 (eval → bottlenecks → safety → lifecycle)
export const moduleList: Module[] = [
  llmInternalsModule,        // 01
  embeddingsModule,          // 02
  chunkingModule,            // 03
  vectorDbModule,            // 04
  ragModule,                 // 05
  tokenOptimizationModule,   // 06
  structuredOutputsModule,   // 07
  promptingForCodeModule,    // 08
  reasoningPatternsModule,   // 09
  agentsAndToolsModule,      // 10
  fineTuningModule,          // 11
  evaluationModule,          // 12
  bottlenecksModule,         // 13
  adversarialDefenseModule,  // 14
  lifecycleModule,           // 15
]
