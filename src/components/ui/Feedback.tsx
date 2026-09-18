import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warning' | 'muted' }) {
  const tones: Record<string, string> = {
    default: 'bg-admin-primary/10 text-admin-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    muted: 'bg-admin-border text-admin-muted',
  }
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
}

// Shared production data-fetching states — used by every hook-backed page
// instead of each screen inventing its own loading/empty/error markup.
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-admin-muted">
      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-admin-border border-t-admin-primary" />
      {label}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-16 text-center">
      <p className="text-sm font-semibold text-admin-text">{title}</p>
      {description && <p className="text-sm text-admin-muted">{description}</p>}
    </div>
  )
}

// User-safe error display. Never pass a raw Firebase/SDK error message here
// — log the technical detail (see services/analytics or console) and show
// generic, actionable copy to the user instead.
export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm font-semibold text-red-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-admin-bg px-3.5 py-2 text-sm font-semibold text-admin-text hover:bg-admin-border/60">
          Try again
        </button>
      )}
    </div>
  )
}
