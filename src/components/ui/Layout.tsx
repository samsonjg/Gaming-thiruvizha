import { forwardRef, type ReactNode } from 'react'
import clsx from 'clsx'

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
