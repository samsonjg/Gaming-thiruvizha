import { forwardRef, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-admin-primary text-white hover:bg-admin-primary-dark',
  secondary: 'bg-admin-bg text-admin-text border border-admin-border hover:bg-admin-border/60',
  ghost: 'text-admin-muted hover:bg-admin-bg',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border bg-admin-surface px-8 py-5">
      <div>
        <h1 className="text-xl font-bold text-admin-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-admin-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }>(
  ({ children, className, ...rest }, ref) => (
    <div ref={ref} className={clsx('rounded-2xl border border-admin-border bg-admin-surface p-5 shadow-sm', className)} {...rest}>
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

export function MetricCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-admin-muted">{label}</p>
      <p className="text-3xl font-extrabold text-admin-text">{value}</p>
      {sub && <p className="text-xs text-admin-muted">{sub}</p>}
    </Card>
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warning' | 'muted' }) {
  const tones: Record<string, string> = {
    default: 'bg-admin-primary/10 text-admin-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    muted: 'bg-admin-border text-admin-muted',
  }
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={clsx('rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50', BUTTON_VARIANTS[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}

// A single interactive element (no button-in-anchor nesting), styled like
// Button, for navigation — use whenever the action is "go to a route".
export function LinkButton({
  children,
  variant = 'primary',
  className,
  ...rest
}: LinkProps & { variant?: ButtonVariant }) {
  return (
    <Link
      className={clsx(
        'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  )
}

export function IconButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-bg hover:text-admin-text',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-admin-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-text outline-none focus:border-admin-primary',
        props.className,
      )}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-text outline-none focus:border-admin-primary',
        props.className,
      )}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-text outline-none focus:border-admin-primary',
        props.className,
      )}
    />
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 select-none">
      <span
        onClick={() => onChange(!checked)}
        className={clsx('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-admin-primary' : 'bg-admin-border')}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
      {label && <span className="text-sm font-medium text-admin-text">{label}</span>}
    </label>
  )
}
