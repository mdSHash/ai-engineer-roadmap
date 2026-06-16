import type { InterviewQuestion } from '../types'
import { interviewRag } from './interview-rag'
import { interviewPrompting } from './interview-prompting'
import { interviewSystems } from './interview-systems'

export const interviewQuestions: InterviewQuestion[] = [
  ...interviewRag,
  ...interviewPrompting,
  ...interviewSystems,
]

export const interviewCategories = [
  'RAG',
  'Vector DB',
  'Chunking',
  'Tokens & Cost',
  'Prompting',
  'Bottlenecks',
  'Evaluation',
  'System Design',
  'Lifecycle',
] as const
