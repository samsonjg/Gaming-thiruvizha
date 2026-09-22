import { useState } from 'react'
import { Modal, Button, Textarea } from '../../components/ui'

const EXAMPLE_REASONS = ['AI-generated', 'Inappropriate', 'Unrelated photo', 'Duplicate', 'Spam', 'Violates Terms']

export function RejectSubmissionModal({
  open,
  title,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: (reason: string) => Promise<void> | void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    if (!reason.trim()) return
    setSubmitting(true)
    await onConfirm(reason.trim())
    setSubmitting(false)
    setReason('')
  }

  function close() {
    setReason('')
    onCancel()
  }

  return (
    <Modal open={open} onClose={close}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-admin-text">{title}</h3>
          <p className="mt-1 text-sm text-admin-muted">A reason is required and will be shown to the user.</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className="rounded-full border border-admin-border px-2.5 py-1 text-xs text-admin-muted hover:bg-admin-bg"
            >
              {r}
            </button>
          ))}
        </div>

        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection…" />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={submitting || !reason.trim()}>
            {submitting ? 'Submitting…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
