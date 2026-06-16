'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from './auth-provider'
import { isStrongPassword, isValidEmail, isValidUsername } from '@/lib/auth'
import { Eyebrow } from './section'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const { login, register, user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params?.get('next') || '/profile'

  const [identifier, setIdentifier] = useState('')
  const [username,  setUsername]    = useState('')
  const [email,     setEmail]       = useState('')
  const [password,  setPassword]    = useState('')
  const [confirm,   setConfirm]     = useState('')
  const [showPwd,   setShowPwd]     = useState(false)
  const [err,       setErr]         = useState<string | null>(null)
  const [busy,      setBusy]        = useState(false)

  useEffect(() => {
    if (user) router.replace(next)
  }, [user, router, next])

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        const u = isValidUsername(username); if (u) return setErr(u)
        const em = isValidEmail(email);     if (em) return setErr(em)
        const pw = isStrongPassword(password); if (pw) return setErr(pw)
        if (password !== confirm) return setErr('Passwords do not match.')
        const res = await register(username, email, password)
        if (!res.ok) return setErr(res.error ?? 'Registration failed.')
      } else {
        const res = await login(identifier, password)
        if (!res.ok) return setErr(res.error ?? 'Sign-in failed.')
      }
      router.replace(next)
    } finally { setBusy(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto px-6 md:px-12 py-16 md:py-24"
    >
      <Eyebrow>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Eyebrow>
      <h1 className="font-serif text-display-md text-ink-50 mt-4 mb-3">
        {mode === 'login' ? 'Sign in.' : 'Sign up.'}
      </h1>
      <p className="text-ink-400 leading-relaxed mb-10">
        {mode === 'login'
          ? 'Pick up where you left off.'
          : 'Track your progress across modules, quizzes, flashcards, and decision trees.'}
      </p>

      <form onSubmit={handle} className="space-y-5">
        {mode === 'register' ? (
          <>
            <Field label="Username">
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                className={inputClass}
              />
            </Field>
          </>
        ) : (
          <Field label="Username or email">
            <input
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Password">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              className={inputClass + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200"
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mode === 'register' && (
            <p className="font-mono text-[10px] text-ink-500 mt-2 leading-relaxed">
              8+ chars · upper · lower · digit · symbol
            </p>
          )}
        </Field>

        {mode === 'register' && (
          <Field label="Confirm password">
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </Field>
        )}

        {err && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-l-2 border-amber-accent/60 bg-amber-accent/5 pl-4 py-2 pr-3 text-sm text-amber-accent"
          >
            {err}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-lime-accent text-ink-950 hover:bg-lime-glow disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-center font-mono text-xs text-ink-400 pt-2">
          {mode === 'login' ? (
            <>No account? <Link href="/register" className="text-lime-accent hover:underline">Sign up →</Link></>
          ) : (
            <>Already have one? <Link href="/login" className="text-lime-accent hover:underline">Sign in →</Link></>
          )}
        </p>
      </form>
    </motion.div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400 mb-2 block">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full bg-ink-900/40 border border-ink-700 focus:border-lime-accent/60 outline-none px-4 py-2.5 font-mono text-sm placeholder:text-ink-500 text-ink-100'
