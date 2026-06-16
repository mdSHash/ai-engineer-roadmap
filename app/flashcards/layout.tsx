import { AuthGate } from '@/components/auth-gate'

export default function FlashcardsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>
}
