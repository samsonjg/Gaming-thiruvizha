import type { PhotoChallenge, PhotoSubmission } from '../../types/schema'
import { Badge } from '../../components/ui'

const STATUS_LABEL: Record<PhotoSubmission['status'], string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function MySubmissionStatus({
  submission,
  challenge,
  onChangePhoto,
}: {
  submission: PhotoSubmission
  challenge: PhotoChallenge
  onChangePhoto: () => void
}) {
  const changesRemaining = Math.max(0, challenge.allowedPhotoChanges - submission.photoChangeCount)
  const tone = submission.status === 'approved' ? 'success' : submission.status === 'rejected' ? 'warning' : 'muted'

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-semibold text-white/80">My Submission</p>

      <img src={submission.imageUrl} alt="Your submission" className="max-h-80 w-full rounded-2xl object-contain bg-black/30" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">Status</span>
        <Badge tone={tone}>{STATUS_LABEL[submission.status]}</Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>Submitted</span>
        <span>{new Date(submission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      {submission.status === 'rejected' && submission.rejectionReason && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <p className="font-semibold">Reason</p>
          <p className="mt-1">{submission.rejectionReason}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-white/60">
        <span>Photo changes remaining</span>
        <span>{changesRemaining}</span>
      </div>

      {changesRemaining > 0 ? (
        <button
          type="button"
          onClick={onChangePhoto}
          className="w-full rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80"
        >
          Change Photo
        </button>
      ) : (
        <p className="text-center text-xs text-white/40">Photo change used. Your submission is locked.</p>
      )}
    </div>
  )
}
