'use client'

import { useEffect, useState, useCallback } from 'react'
import { getProgress, updateProgress, resetProgress, summarize, type UserProgress, type ProgressSummary, listUsers } from './auth'
import { moduleList } from './content/modules'
import { quizzes } from './content/quizzes'
import { flashcards } from './content/flashcards'
import { decisionTrees } from './content/decision-trees'
import { useAuth } from '@/components/auth-provider'

const TOTALS = {
  modules:    moduleList.length,
  quizzes:    quizzes.length,
  flashcards: flashcards.length,
  trees:      decisionTrees.length,
}

export function useProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)

  const reload = useCallback(() => {
    if (!user) return setProgress(null)
    setProgress(getProgress(user.id))
  }, [user])

  useEffect(() => { reload() }, [reload])

  const recordModuleView = useCallback((slug: string) => {
    if (!user) return
    updateProgress(user.id, p => p.modulesViewed.includes(slug) ? p : { ...p, modulesViewed: [...p.modulesViewed, slug] })
    reload()
  }, [user, reload])

  const recordQuizScore = useCallback((slug: string, best: number, total: number) => {
    if (!user) return
    updateProgress(user.id, p => {
      const existing = p.quizScores[slug]
      const nextBest = Math.max(best, existing?.best ?? 0)
      const attempts = (existing?.attempts ?? 0) + 1
      return { ...p, quizScores: { ...p.quizScores, [slug]: { best: nextBest, total, attempts } } }
    })
    reload()
  }, [user, reload])

  const recordFlashcardSeen = useCallback((id: string) => {
    if (!user) return
    updateProgress(user.id, p => p.flashcardsSeen.includes(id) ? p : { ...p, flashcardsSeen: [...p.flashcardsSeen, id] })
    reload()
  }, [user, reload])

  const recordTreeCompleted = useCallback((slug: string) => {
    if (!user) return
    updateProgress(user.id, p => p.treesCompleted.includes(slug) ? p : { ...p, treesCompleted: [...p.treesCompleted, slug] })
    reload()
  }, [user, reload])

  const reset = useCallback(() => {
    if (!user) return
    resetProgress(user.id)
    reload()
  }, [user, reload])

  const summary: ProgressSummary | null = progress ? summarize(progress, TOTALS) : null

  return { progress, summary, recordModuleView, recordQuizScore, recordFlashcardSeen, recordTreeCompleted, reset, totals: TOTALS }
}

export interface LeaderboardRow {
  username: string
  isAdmin: boolean
  totalPct: number
  modulesViewed: number
  quizzesCompleted: number
  treesCompleted: number
  flashcardsSeen: number
  lastActiveAt: number
}

export function useLeaderboard(): LeaderboardRow[] {
  const [rows, setRows] = useState<LeaderboardRow[]>([])

  const reload = useCallback(() => {
    const users = listUsers()
    const out: LeaderboardRow[] = users.map(u => {
      const p = getProgress(u.id)
      const s = summarize(p, TOTALS)
      return {
        username: u.username,
        isAdmin: !!u.isAdmin,
        totalPct: s.totalPct,
        modulesViewed: s.modulesViewed,
        quizzesCompleted: s.quizzesCompleted,
        treesCompleted: s.treesCompleted,
        flashcardsSeen: s.flashcardsSeen,
        lastActiveAt: p.lastActiveAt,
      }
    })
    out.sort((a, b) => b.totalPct - a.totalPct || b.lastActiveAt - a.lastActiveAt)
    setRows(out)
  }, [])

  useEffect(() => {
    reload()
    function onStorage(e: StorageEvent) {
      if (e.key === 'aer:users' || e.key === 'aer:progress' || e.key === 'aer:session') reload()
    }
    window.addEventListener('storage', onStorage)
    const interval = setInterval(reload, 4000)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval) }
  }, [reload])

  return rows
}
