import { useState, type FormEvent } from 'react'
import { useAuthState } from '../../app/providers/AuthProvider'
import { Button, Input } from '../../components/ui'

// Admin sign-in. There is no signup here on purpose — the first admin is
// bootstrapped manually via the Firebase console/CLI (custom claim), see
// docs/ADMIN_PANEL.md. This form only authenticates an existing Firebase
// Auth user; it never decides who is an admin.
export function AdminLoginForm() {
  const { signInAdmin } = useAuthState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signInAdmin(email, password)
    } catch {
      // Never surface the raw Firebase error (leaks whether an email
      // exists, internal error codes, etc.) — see docs/SECURITY.md.
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gt-violet-500 to-gt-magenta-500 text-sm font-bold text-white">
            K
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-admin-text">Kyn Admin</p>
            <p className="text-[11px] leading-tight text-admin-muted">Sign in to continue</p>
          </div>
        </div>

        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-admin-muted">Email</span>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>

        <label className="mb-4 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-admin-muted">Password</span>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
