import type { ReactNode } from 'react'
import { useAuthState } from '../../app/providers/AuthProvider'
import { AdminLoginForm } from './AdminLoginForm'
import { LoadingState } from '../../components/ui'

// UX-level route guard only. It hides admin screens from a non-admin
// visitor and shows the login form — it is NOT the security boundary.
// Firestore security rules (firestore.rules) are what actually stop a
// non-admin from reading/writing admin data, because a client-side check
// can always be bypassed by someone calling the SDK directly. See
// docs/SECURITY.md and docs/AI_CONTEXT.md do-not-break rule #3.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { configured, loading, isAdmin } = useAuthState()

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg px-6 text-center">
        <div className="max-w-md">
          <p className="text-lg font-bold text-admin-text">Firebase isn't configured yet</p>
          <p className="mt-2 text-sm text-admin-muted">
            Set the <code className="rounded bg-admin-border px-1 py-0.5">VITE_FIREBASE_*</code> environment variables in{' '}
            <code className="rounded bg-admin-border px-1 py-0.5">.env.local</code> — see{' '}
            <code className="rounded bg-admin-border px-1 py-0.5">docs/DEVELOPMENT.md</code>.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg">
        <LoadingState label="Checking your session…" />
      </div>
    )
  }

  if (!isAdmin) {
    return <AdminLoginForm />
  }

  return <>{children}</>
}
