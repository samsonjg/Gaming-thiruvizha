import { PageHeader, Card } from '../../components/ui'

// [TBD] No admin-configurable settings exist yet in the approved product
// (see docs/PRD.md §6). This page is a placeholder so the nav item has
// somewhere to go — add real settings here as they're specified, rather
// than inventing configuration options.
export function Settings() {
  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" subtitle="Platform configuration" />

      <div className="max-w-xl px-8 py-6">
        <Card>
          <p className="text-sm text-admin-muted">No configurable settings yet.</p>
        </Card>
      </div>
    </div>
  )
}
