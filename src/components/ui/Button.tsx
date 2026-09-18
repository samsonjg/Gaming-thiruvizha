import { Link, type LinkProps } from 'react-router-dom'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-admin-primary text-white hover:bg-admin-primary-dark',
  secondary: 'bg-admin-bg text-admin-text border border-admin-border hover:bg-admin-border/60',
  ghost: 'text-admin-muted hover:bg-admin-bg',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
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
// Do not wrap a Button in a Link/<a>: two nested interactive elements broke
// click handling in the admin during prototype QA.
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
