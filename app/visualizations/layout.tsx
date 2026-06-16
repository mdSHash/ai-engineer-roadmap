import { AuthGate } from '@/components/auth-gate'

export default function VisualizationsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>
}
