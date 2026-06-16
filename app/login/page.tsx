import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'Sign in — AI Engineer Roadmap' }

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" />
    </Suspense>
  )
}
