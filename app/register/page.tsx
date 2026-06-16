import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'Create account — AI Engineer Roadmap' }

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="register" />
    </Suspense>
  )
}
