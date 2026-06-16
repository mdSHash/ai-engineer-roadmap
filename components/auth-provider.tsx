'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  ensureMasterAccount, getCurrentUser, loginUser, logoutUser, registerUser,
  type PublicUser,
} from '@/lib/auth'

interface AuthCtx {
  user: PublicUser | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  refresh: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setUser(getCurrentUser())
  }, [])

  useEffect(() => {
    let active = true
    ensureMasterAccount().finally(() => {
      if (!active) return
      setUser(getCurrentUser())
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  // Reflect changes from other tabs of the same origin.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'aer:session' || e.key === 'aer:users') refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await loginUser({ identifier, password })
    if (res.ok) setUser(res.user)
    return res.ok ? { ok: true } : { ok: false, error: res.error }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await registerUser({ username, email, password })
    if (res.ok) setUser(res.user)
    return res.ok ? { ok: true } : { ok: false, error: res.error }
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
