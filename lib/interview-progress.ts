// Per-user interview progress: SM-2 spaced-repetition scheduler + localStorage.
// Used by Study mode (writes) and Browse mode (reads chip status).
// Drill and Mock are intentionally walled off from this scheduler — see audit.

export type SrRating = 'again' | 'hard' | 'good' | 'easy'
export type SrStatus = 'new' | 'learning' | 'review' | 'mastered'

export interface QuestionProgress {
  questionId: string
  status: SrStatus
  easeFactor: number      // SM-2 ease, init 2.5, floor 1.3
  intervalDays: number    // current interval, init 0
  reps: number            // total successful reviews
  lapses: number          // times rated 'again'
  lastReviewedAt: number | null  // ms epoch
  nextReviewAt:   number | null  // ms epoch
  lastRating: SrRating | null
}

export interface InterviewSessionRecord {
  id: string
  mode: 'study' | 'mock'
  startedAt: number
  endedAt: number | null
  questionIds: string[]
  ratings: SrRating[]              // for study mode
  rubricScores?: number[]          // for mock mode (0..4 per question)
  durationMs?: number
}

export interface FollowUpProgress {
  // key: `${questionId}:${followUpIndex}`
  gotIt: boolean
  lastReviewedAt: number
}

const KEY_QUESTIONS  = 'aer:iv:questions'
const KEY_FOLLOWUPS  = 'aer:iv:followups'
const KEY_SESSIONS   = 'aer:iv:sessions'
const KEY_PREFS      = 'aer:iv:prefs'

const DAY_MS = 24 * 60 * 60 * 1000

export interface InterviewPrefs {
  sessionSize: number
  mockTimerSeconds: number
  interleaveStrictness: 'strict' | 'loose' | 'off'
}

export const defaultPrefs: InterviewPrefs = {
  sessionSize: 12,
  mockTimerSeconds: 180,
  interleaveStrictness: 'strict',
}

function userScopedKey(base: string, userId: string) {
  return `${base}:${userId}`
}

export function freshProgress(questionId: string): QuestionProgress {
  return {
    questionId,
    status: 'new',
    easeFactor: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    lastRating: null,
  }
}

// --- SM-2 scheduler ---
// Lightweight variant: 'again' resets, 'hard' shrinks, 'good' progresses, 'easy' jumps ahead.
// Returns a NEW progress record (pure function).
export function scheduleNext(p: QuestionProgress, rating: SrRating, now = Date.now()): QuestionProgress {
  const next: QuestionProgress = { ...p, lastReviewedAt: now, lastRating: rating }

  if (rating === 'again') {
    next.intervalDays = 0
    next.lapses = p.lapses + 1
    next.easeFactor = Math.max(1.3, p.easeFactor - 0.2)
    next.status = 'learning'
    next.nextReviewAt = now + 10 * 60 * 1000   // 10 minutes
    return next
  }

  if (rating === 'hard') {
    next.easeFactor = Math.max(1.3, p.easeFactor - 0.15)
    next.intervalDays = p.intervalDays === 0 ? 1 : Math.max(1, Math.round(p.intervalDays * 1.2))
    next.reps = p.reps + 1
  } else if (rating === 'good') {
    if (p.reps === 0)        next.intervalDays = 1
    else if (p.reps === 1)   next.intervalDays = 3
    else                     next.intervalDays = Math.round(p.intervalDays * p.easeFactor)
    next.reps = p.reps + 1
  } else if (rating === 'easy') {
    next.easeFactor = p.easeFactor + 0.15
    if (p.reps === 0)        next.intervalDays = 4
    else                     next.intervalDays = Math.max(4, Math.round(p.intervalDays * p.easeFactor * 1.3))
    next.reps = p.reps + 1
  }

  next.nextReviewAt = now + next.intervalDays * DAY_MS
  next.status = next.intervalDays >= 21 ? 'mastered' : 'review'
  return next
}

// --- Storage ---

function readMap(key: string): Record<string, QuestionProgress> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(key)
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, QuestionProgress> } catch { return {} }
}

function writeMap(key: string, map: Record<string, QuestionProgress>) {
  window.localStorage.setItem(key, JSON.stringify(map))
}

export function getAllProgress(userId: string): Record<string, QuestionProgress> {
  return readMap(userScopedKey(KEY_QUESTIONS, userId))
}

export function getProgressFor(userId: string, questionId: string): QuestionProgress {
  const all = getAllProgress(userId)
  return all[questionId] ?? freshProgress(questionId)
}

export function recordReview(userId: string, questionId: string, rating: SrRating): QuestionProgress {
  const all = getAllProgress(userId)
  const prev = all[questionId] ?? freshProgress(questionId)
  const next = scheduleNext(prev, rating)
  all[questionId] = next
  writeMap(userScopedKey(KEY_QUESTIONS, userId), all)
  return next
}

// --- Follow-ups ---

function readFollowUps(userId: string): Record<string, FollowUpProgress> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(userScopedKey(KEY_FOLLOWUPS, userId))
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, FollowUpProgress> } catch { return {} }
}

function writeFollowUps(userId: string, map: Record<string, FollowUpProgress>) {
  window.localStorage.setItem(userScopedKey(KEY_FOLLOWUPS, userId), JSON.stringify(map))
}

export function recordFollowUp(userId: string, questionId: string, followUpIndex: number, gotIt: boolean) {
  const map = readFollowUps(userId)
  map[`${questionId}:${followUpIndex}`] = { gotIt, lastReviewedAt: Date.now() }
  writeFollowUps(userId, map)
}

// --- Sessions ---

function readSessions(userId: string): InterviewSessionRecord[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(userScopedKey(KEY_SESSIONS, userId))
  if (!raw) return []
  try { return JSON.parse(raw) as InterviewSessionRecord[] } catch { return [] }
}

function writeSessions(userId: string, sessions: InterviewSessionRecord[]) {
  window.localStorage.setItem(userScopedKey(KEY_SESSIONS, userId), JSON.stringify(sessions.slice(-100)))
}

export function appendSession(userId: string, session: InterviewSessionRecord) {
  const list = readSessions(userId)
  list.push(session)
  writeSessions(userId, list)
}

export function getSessions(userId: string): InterviewSessionRecord[] {
  return readSessions(userId).slice().reverse()  // newest first
}

// --- Prefs ---

export function getPrefs(userId: string): InterviewPrefs {
  if (typeof window === 'undefined') return defaultPrefs
  const raw = window.localStorage.getItem(userScopedKey(KEY_PREFS, userId))
  if (!raw) return defaultPrefs
  try { return { ...defaultPrefs, ...JSON.parse(raw) } } catch { return defaultPrefs }
}

export function savePrefs(userId: string, prefs: Partial<InterviewPrefs>) {
  const merged = { ...getPrefs(userId), ...prefs }
  window.localStorage.setItem(userScopedKey(KEY_PREFS, userId), JSON.stringify(merged))
}

// --- Queue assembly for Study mode ---

import type { InterviewQuestion } from './types'

export interface StudyQueueItem {
  question: InterviewQuestion
  progress: QuestionProgress
  isDue: boolean
  isNew: boolean
}

function ratingDifficultyWeight(d: 'Junior' | 'Mid' | 'Senior'): number {
  return d === 'Junior' ? 1 : d === 'Mid' ? 2 : 3
}

export function buildStudyQueue(
  userId: string,
  allQuestions: InterviewQuestion[],
  opts: { sessionSize: number; categoryFilter?: string; difficultyFilter?: string }
): StudyQueueItem[] {
  const all = getAllProgress(userId)
  const now = Date.now()

  let pool = allQuestions
  if (opts.categoryFilter && opts.categoryFilter !== 'All')
    pool = pool.filter(q => q.category === opts.categoryFilter)
  if (opts.difficultyFilter && opts.difficultyFilter !== 'All')
    pool = pool.filter(q => q.difficulty === opts.difficultyFilter)

  const due: StudyQueueItem[] = []
  const fresh: StudyQueueItem[] = []

  for (const q of pool) {
    const p = all[q.id]
    if (!p) {
      fresh.push({ question: q, progress: freshProgress(q.id), isDue: false, isNew: true })
    } else if (p.nextReviewAt !== null && p.nextReviewAt <= now) {
      due.push({ question: q, progress: p, isDue: true, isNew: false })
    }
  }

  // Sort due by oldest-due first
  due.sort((a, b) => (a.progress.nextReviewAt ?? 0) - (b.progress.nextReviewAt ?? 0))
  // Sort fresh by ascending difficulty (Junior first), then category alphabetical
  fresh.sort((a, b) =>
    ratingDifficultyWeight(a.question.difficulty) - ratingDifficultyWeight(b.question.difficulty)
    || a.question.category.localeCompare(b.question.category)
  )

  let combined = [...due, ...fresh].slice(0, opts.sessionSize)

  // Interleave: round-robin by category so two consecutive items don't share category.
  combined = interleaveByCategory(combined)
  return combined
}

function interleaveByCategory(items: StudyQueueItem[]): StudyQueueItem[] {
  if (items.length <= 1) return items
  const groups = new Map<string, StudyQueueItem[]>()
  for (const it of items) {
    const c = it.question.category
    if (!groups.has(c)) groups.set(c, [])
    groups.get(c)!.push(it)
  }
  const out: StudyQueueItem[] = []
  let added = true
  while (added) {
    added = false
    for (const list of groups.values()) {
      if (list.length > 0) {
        out.push(list.shift()!)
        added = true
      }
    }
  }
  return out
}

// --- Mock interview queue ---

export interface MockQueueItem {
  question: InterviewQuestion
  index: number
}

export function buildMockQueue(
  allQuestions: InterviewQuestion[],
  opts: { length: number; targetDifficulty: 'Junior' | 'Mid' | 'Senior' }
): MockQueueItem[] {
  // Difficulty weights based on target role
  const weights: Record<'Junior' | 'Mid' | 'Senior', { Junior: number; Mid: number; Senior: number }> = {
    Junior: { Junior: 0.7, Mid: 0.25, Senior: 0.05 },
    Mid:    { Junior: 0.15, Mid: 0.6, Senior: 0.25 },
    Senior: { Junior: 0.05, Mid: 0.35, Senior: 0.6 },
  }
  const w = weights[opts.targetDifficulty]
  const numJ = Math.round(opts.length * w.Junior)
  const numM = Math.round(opts.length * w.Mid)
  const numS = opts.length - numJ - numM

  const byDiff = {
    Junior: shuffle(allQuestions.filter(q => q.difficulty === 'Junior')),
    Mid:    shuffle(allQuestions.filter(q => q.difficulty === 'Mid')),
    Senior: shuffle(allQuestions.filter(q => q.difficulty === 'Senior')),
  }

  const picked = [
    ...byDiff.Junior.slice(0, numJ),
    ...byDiff.Mid.slice(0, numM),
    ...byDiff.Senior.slice(0, numS),
  ]

  const interleaved = interleaveByCategory(
    picked.map(q => ({ question: q, progress: freshProgress(q.id), isDue: false, isNew: false }))
  ).map((it, i) => ({ question: it.question, index: i }))

  return interleaved
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  // Pseudo-shuffle by jittering with a simple offset based on length and ids — avoid Math.random for SSR determinism.
  // Note: we want different orderings per call though. Using Date.now is OK in client only; this fn only runs client-side.
  const seed = typeof window !== 'undefined' ? Date.now() % 10000 : 1
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(((seed * (i + 1)) % (i + 1) + Math.floor(i / 2)) % (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// --- Stats summary ---

export interface InterviewStats {
  total: number
  newCount: number
  learningCount: number
  reviewCount: number
  masteredCount: number
  dueCount: number
  totalReviews: number
  accuracy: number  // % of "good"/"easy" out of all reviews
}

export function getStats(userId: string, totalQuestions: number): InterviewStats {
  const all = getAllProgress(userId)
  const now = Date.now()
  let learning = 0, review = 0, mastered = 0, due = 0, totalReviews = 0, good = 0
  for (const p of Object.values(all)) {
    if      (p.status === 'learning') learning++
    else if (p.status === 'review')   review++
    else if (p.status === 'mastered') mastered++
    if (p.nextReviewAt !== null && p.nextReviewAt <= now) due++
    totalReviews += p.reps + p.lapses
    good += (p.reps)
  }
  const seen = learning + review + mastered
  const newCount = totalQuestions - seen
  const accuracy = totalReviews > 0 ? Math.round((good / totalReviews) * 100) : 0
  return { total: totalQuestions, newCount, learningCount: learning, reviewCount: review, masteredCount: mastered, dueCount: due, totalReviews, accuracy }
}

export function statusOf(userId: string, questionId: string): SrStatus {
  return getProgressFor(userId, questionId).status
}
