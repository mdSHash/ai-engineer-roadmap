import type { Module, ModuleSlug } from '../types'
import { ragModule } from './rag'
import { vectorDbModule } from './vector-databases'
import { chunkingModule } from './chunking'
import { tokenOptimizationModule } from './token-optimization'
import { promptingForCodeModule } from './prompting-for-code'
import { bottlenecksModule } from './bottlenecks'
import { evaluationModule } from './evaluation'
import { lifecycleModule } from './lifecycle'

export const modules: Record<ModuleSlug, Module> = {
  'rag':                 ragModule,
  'vector-databases':    vectorDbModule,
  'chunking':            chunkingModule,
  'token-optimization':  tokenOptimizationModule,
  'prompting-for-code':  promptingForCodeModule,
  'bottlenecks':         bottlenecksModule,
  'evaluation':          evaluationModule,
  'lifecycle':           lifecycleModule,
}

export const moduleList: Module[] = [
  ragModule,
  vectorDbModule,
  chunkingModule,
  tokenOptimizationModule,
  promptingForCodeModule,
  bottlenecksModule,
  evaluationModule,
  lifecycleModule,
]
