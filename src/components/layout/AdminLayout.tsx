import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/events', label: 'Events', icon: '🗓️' },
  { to: '/admin/polls', label: 'Polls', icon: '📋' },
  { to: '/admin/responses', label: 'Responses', icon: '🗂️' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-admin-bg text-admin-text">
      <aside className="flex w-60 shrink-0 flex-col border-r border-admin-border bg-admin-surface">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gt-violet-500 to-gt-magenta-500 text-sm font-bold text-white">
            K
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Kyn Admin</p>
            <p className="text-[11px] leading-tight text-admin-muted">Event Engagement</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-admin-primary/10 text-admin-primary' : 'text-admin-muted hover:bg-admin-bg'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-admin-border px-5 py-4 text-[11px] text-admin-muted">
          Gaming Thiruvizha 2026 — Demo Prototype
        </div>
      </aside>

      <main className="min-h-screen flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
