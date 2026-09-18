import { useState } from 'react'
import { Modal, Button } from '../../components/ui'

export function PublishModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}) {
  const [publishing, setPublishing] = useState(false)
  const [done, setDone] = useState(false)

  async function handleConfirm() {
    setPublishing(true)
    await onConfirm()
    setPublishing(false)
    setDone(true)
    setTimeout(() => setDone(false), 1200)
  }

  return (
    <Modal open={open} onClose={onCancel}>
      {done ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-3xl">✓</span>
          <p className="font-semibold text-admin-text">Published</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-admin-text">Publish this question?</h3>
            <p className="mt-1 text-sm text-admin-muted">
              Users will be able to see and respond to this question immediately.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel} disabled={publishing}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
