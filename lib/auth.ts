// Client-side auth using localStorage + Web Crypto PBKDF2.
// Passwords are never stored in plaintext.
// All data is per-device (browser localStorage); see SECURITY.md.

const STORAGE_USERS    = 'aer:users'
const STORAGE_SESSION  = 'aer:session'
const STORAGE_PROGRESS = 'aer:progress'

const PBKDF2_ITERATIONS = 100_000
const SALT_BYTES = 16
const HASH_BYTES = 32

export interface UserRecord {
  id: string
  username: string
  email: string
  createdAt: number
  isAdmin?: boolean
  // Stored hash + salt as base64
  saltB64: string
  hashB64: string
}

export interface PublicUser {
  id: string
  username: string
  email: string
  createdAt: number
  isAdmin?: boolean
}

function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s)
}

function fromB64(b64: string): Uint8Array {
  const s = atob(b64)
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
  return bytes
}

async function deriveHash(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey, HASH_BYTES * 8
  )
  return new Uint8Array(bits)
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

function readUsers(): UserRecord[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_USERS)
  if (!raw) return []
  try { return JSON.parse(raw) as UserRecord[] } catch { return [] }
}

function writeUsers(users: UserRecord[]) {
  window.localStorage.setItem(STORAGE_USERS, JSON.stringify(users))
}

export function isValidUsername(u: string): string | null {
  if (!u || u.length < 3) return 'Username must be at least 3 characters.'
  if (u.length > 32) return 'Username must be at most 32 characters.'
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Username can contain letters, digits, and underscores only.'
  return null
}

export function isValidEmail(e: string): string | null {
  if (!e) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Email format looks wrong.'
  return null
}

export function isStrongPassword(p: string): string | null {
  if (!p || p.length < 8)         return 'Password must be at least 8 characters.'
  if (!/[a-z]/.test(p))           return 'Password needs a lowercase letter.'
  if (!/[A-Z]/.test(p))           return 'Password needs an uppercase letter.'
  if (!/\d/.test(p))              return 'Password needs a digit.'
  if (!/[^a-zA-Z0-9]/.test(p))    return 'Password needs a symbol.'
  return null
}

function publicView(u: UserRecord): PublicUser {
  return {
    id: u.id, username: u.username, email: u.email, createdAt: u.createdAt, isAdmin: u.isAdmin,
  }
}

export async function registerUser(opts: {
  username: string
  email: string
  password: string
  isAdmin?: boolean
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const { username, email, password, isAdmin } = opts

  const uErr = isValidUsername(username); if (uErr) return { ok: false, error: uErr }
  const eErr = isValidEmail(email);       if (eErr) return { ok: false, error: eErr }
  const pErr = isStrongPassword(password);if (pErr) return { ok: false, error: pErr }

  const users = readUsers()
  const lcUser = username.toLowerCase()
  const lcEmail = email.toLowerCase()
  if (users.some(u => u.username.toLowerCase() === lcUser))
    return { ok: false, error: 'That username is taken.' }
  if (users.some(u => u.email.toLowerCase() === lcEmail))
    return { ok: false, error: 'An account with that email already exists.' }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveHash(password, salt)

  const user: UserRecord = {
    id: crypto.randomUUID(),
    username,
    email,
    createdAt: Date.now(),
    saltB64: toB64(salt),
    hashB64: toB64(hash),
    ...(isAdmin ? { isAdmin: true } : {}),
  }
  writeUsers([...users, user])
  setSession(user.id)
  return { ok: true, user: publicView(user) }
}

export async function loginUser(opts: {
  identifier: string
  password: string
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const { identifier, password } = opts
  if (!identifier || !password) return { ok: false, error: 'Enter username/email and password.' }

  const users = readUsers()
  const lc = identifier.toLowerCase()
  const user = users.find(u => u.username.toLowerCase() === lc || u.email.toLowerCase() === lc)
  if (!user) return { ok: false, error: 'No account matches those credentials.' }

  const salt = fromB64(user.saltB64)
  const expected = fromB64(user.hashB64)
  const got = await deriveHash(password, salt)
  if (!timingSafeEqual(expected, got))
    return { ok: false, error: 'No account matches those credentials.' }

  setSession(user.id)
  return { ok: true, user: publicView(user) }
}

export function logoutUser() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_SESSION)
}

function setSession(userId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_SESSION, userId)
}

export function getCurrentUser(): PublicUser | null {
  if (typeof window === 'undefined') return null
  const id = window.localStorage.getItem(STORAGE_SESSION)
  if (!id) return null
  const u = readUsers().find(x => x.id === id)
  return u ? publicView(u) : null
}

export function listUsers(): PublicUser[] {
  return readUsers().map(publicView)
}

export async function ensureMasterAccount(): Promise<void> {
  if (typeof window === 'undefined') return
  const users = readUsers()
  if (users.some(u => u.username.toLowerCase() === 'scriptmaker')) return
  const res = await registerUser({
    username: 'ScriptMaker',
    email: 'mostafa20171701097@cis.asu.edu.eg',
    password: 'Mm@123456789',
    isAdmin: true,
  })
  if (res.ok) {
    // Don't auto-login the master account on every visit; just seed it.
    logoutUser()
  }
}

// --- progress storage ---

export interface UserProgress {
  modulesViewed: string[]
  quizScores: Record<string, { best: number; total: number; attempts: number }>
  flashcardsSeen: string[]
  treesCompleted: string[]
  lastActiveAt: number
}

export function emptyProgress(): UserProgress {
  return {
    modulesViewed: [],
    quizScores: {},
    flashcardsSeen: [],
    treesCompleted: [],
    lastActiveAt: 0,
  }
}

function readAllProgress(): Record<string, UserProgress> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(STORAGE_PROGRESS)
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, UserProgress> } catch { return {} }
}

function writeAllProgress(map: Record<string, UserProgress>) {
  window.localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(map))
}

export function getProgress(userId: string): UserProgress {
  return readAllProgress()[userId] ?? emptyProgress()
}

export function updateProgress(userId: string, patch: (p: UserProgress) => UserProgress) {
  const all = readAllProgress()
  const next = patch(all[userId] ?? emptyProgress())
  next.lastActiveAt = Date.now()
  all[userId] = next
  writeAllProgress(all)
}

export function resetProgress(userId: string) {
  const all = readAllProgress()
  delete all[userId]
  writeAllProgress(all)
}

export interface ProgressSummary {
  totalPct: number
  modulesPct: number
  quizzesPct: number
  flashcardsPct: number
  treesPct: number
  modulesViewed: number
  quizzesCompleted: number
  flashcardsSeen: number
  treesCompleted: number
}

export function summarize(p: UserProgress, totals: { modules: number; quizzes: number; flashcards: number; trees: number }): ProgressSummary {
  const safePct = (x: number, total: number) => total ? Math.round((x / total) * 100) : 0
  const modulesPct    = safePct(p.modulesViewed.length, totals.modules)
  const quizzesPct    = safePct(Object.keys(p.quizScores).length, totals.quizzes)
  const flashcardsPct = safePct(p.flashcardsSeen.length, totals.flashcards)
  const treesPct      = safePct(p.treesCompleted.length, totals.trees)
  const totalPct      = Math.round((modulesPct + quizzesPct + flashcardsPct + treesPct) / 4)
  return {
    totalPct, modulesPct, quizzesPct, flashcardsPct, treesPct,
    modulesViewed: p.modulesViewed.length,
    quizzesCompleted: Object.keys(p.quizScores).length,
    flashcardsSeen: p.flashcardsSeen.length,
    treesCompleted: p.treesCompleted.length,
  }
}
