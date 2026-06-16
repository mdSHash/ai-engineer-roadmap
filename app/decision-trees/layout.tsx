import { AuthGate } from '@/components/auth-gate'

export default function DecisionTreesLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>
}
