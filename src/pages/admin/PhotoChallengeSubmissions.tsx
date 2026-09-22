import { useState } from 'react'
import { useCurrentChallenge, useSubmissions } from '../../hooks/usePhotoChallenge'
import * as submissionsRepository from '../../repositories/photoSubmissions.repository'
import { useAuthState } from '../../app/providers/AuthProvider'
import type { PhotoSubmission, SubmissionStatus } from '../../types/schema'
import { PageHeader, Card, Select, Button, Badge, LoadingState, EmptyState } from '../../components/ui'
import { PhotoChallengeTabs } from '../../features/admin/PhotoChallengeTabs'
import { RejectSubmissionModal } from '../../features/admin/RejectSubmissionModal'

const STATUS_TONE: Record<SubmissionStatus, 'success' | 'warning' | 'muted'> = {
  approved: 'success',
  rejected: 'warning',
  pending: 'muted',
}

export function PhotoChallengeSubmissions() {
  const { user } = useAuthState()
  const { data: challenge, loading: challengeLoading } = useCurrentChallenge()
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('')
  const { data: submissions, loading, reload } = useSubmissions(challenge?.id, statusFilter || undefined)
  const [modal, setModal] = useState<{ submission: PhotoSubmission; mode: 'reject' | 'remove' } | null>(null)
  const [viewing, setViewing] = useState<PhotoSubmission | null>(null)

  async function approve(submission: PhotoSubmission) {
    if (!challenge || !user) return
    await submissionsRepository.approveSubmission(challenge.id, submission.userId, user.uid)
    reload()
  }

  async function handleModalConfirm(reason: string) {
    if (!challenge || !user || !modal) return
    await submissionsRepository.rejectSubmission(challenge.id, modal.submission.userId, user.uid, reason)
    if (modal.mode === 'remove') {
      await submissionsRepository.removeSubmissionPhoto(modal.submission)
    }
    setModal(null)
    reload()
  }

  if (challengeLoading) return <LoadingState />
  if (!challenge) return <EmptyState title="No challenge configured" description="Create a Photo Challenge in Configuration first." />

  return (
    <div className="flex flex-col">
      <PageHeader title="Photo Challenge" subtitle={`${submissions?.length ?? 0} submissions`} />
      <PhotoChallengeTabs />

      <div className="px-8 py-6">
        <Card className="mb-4 flex flex-wrap gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | '')} className="w-48">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </Card>

        {loading && <LoadingState />}

        {!loading && (submissions?.length ?? 0) === 0 && <EmptyState title="No submissions" description="Nothing matches this filter yet." />}

        {!loading && submissions && submissions.length > 0 && (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-admin-border text-xs uppercase tracking-wide text-admin-muted">
                  <th className="px-4 py-3 font-semibold">Photo</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Changes</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-b border-admin-border/60 last:border-0 hover:bg-admin-bg">
                    <td className="px-4 py-2.5">
                      <button onClick={() => setViewing(s)} className="block h-12 w-12 overflow-hidden rounded-lg bg-admin-bg">
                        <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-admin-muted">{s.userId.slice(0, 12)}…</td>
                    <td className="px-4 py-2.5 text-xs text-admin-muted">{new Date(s.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-admin-muted">{s.photoChangeCount}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-2">
                        {s.status !== 'approved' && (
                          <Button variant="secondary" onClick={() => approve(s)}>
                            Approve
                          </Button>
                        )}
                        {s.status !== 'rejected' && (
                          <Button variant="secondary" onClick={() => setModal({ submission: s, mode: 'reject' })}>
                            Reject
                          </Button>
                        )}
                        <Button variant="danger" onClick={() => setModal({ submission: s, mode: 'remove' })}>
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setViewing(null)}>
          <div className="max-w-lg">
            <img src={viewing.imageUrl} alt="" className="max-h-[80vh] w-full rounded-2xl object-contain" />
            {viewing.rejectionReason && <p className="mt-2 text-center text-sm text-white/80">Rejection reason: {viewing.rejectionReason}</p>}
          </div>
        </div>
      )}

      <RejectSubmissionModal
        open={!!modal}
        title={modal?.mode === 'remove' ? 'Remove this photo?' : 'Reject this submission?'}
        confirmLabel={modal?.mode === 'remove' ? 'Remove' : 'Reject'}
        onCancel={() => setModal(null)}
        onConfirm={handleModalConfirm}
      />
    </div>
  )
}
