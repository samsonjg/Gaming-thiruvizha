import { resetAllData } from '../../repositories'
import { PageHeader, Card, Button } from '../../components/ui'

export function Settings() {
  function handleReset() {
    if (!confirm('Reset all demo data back to the seeded defaults? This clears any changes made in this browser.')) return
    resetAllData()
    window.location.reload()
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" subtitle="Prototype configuration" />

      <div className="max-w-xl px-8 py-6">
        <Card className="flex flex-col gap-3">
          <div>
            <p className="font-semibold text-admin-text">Demo Data</p>
            <p className="text-sm text-admin-muted">
              This prototype stores everything in your browser's local storage. Reset it to restore the seeded
              Gaming Thiruvizha event, poll, questions and mock responses.
            </p>
          </div>
          <Button variant="danger" className="self-start" onClick={handleReset}>
            Reset Demo Data
          </Button>
        </Card>
      </div>
    </div>
  )
}
