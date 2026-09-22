import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const TABS = [
  { to: '/admin/photo-challenge/config', label: 'Configuration' },
  { to: '/admin/photo-challenge/submissions', label: 'Submissions' },
  { to: '/admin/photo-challenge/analytics', label: 'Analytics' },
]

export function PhotoChallengeTabs() {
  return (
    <div className="flex gap-1 border-b border-admin-border px-8">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            clsx(
              'border-b-2 px-3 py-3 text-sm font-medium transition-colors',
              isActive ? 'border-admin-primary text-admin-primary' : 'border-transparent text-admin-muted hover:text-admin-text',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
