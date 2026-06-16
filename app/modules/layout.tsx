import { AuthGate } from '@/components/auth-gate'

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>
}
