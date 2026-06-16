import { AuthGate } from '@/components/auth-gate'

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>
}
