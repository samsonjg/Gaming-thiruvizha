import { useCurrentChallenge, useSubmissions } from '../../hooks/usePhotoChallenge'
import { PageHeader, MetricCard, LoadingState, EmptyState } from '../../components/ui'
import { PhotoChallengeTabs } from '../../features/admin/PhotoChallengeTabs'

export function PhotoChallengeAnalytics() {
  const { data: challenge, loading: challengeLoading } = useCurrentChallenge()
  const { data: submissions, loading } = useSubmissions(challenge?.id)

  if (challengeLoading || loading) return <LoadingState />
  if (!challenge) return <EmptyState title="No challenge configured" description="Create a Snap Hunt in Configuration first." />

  const total = submissions?.length ?? 0
  const pending = submissions?.filter((s) => s.status === 'pending').length ?? 0
  const approved = submissions?.filter((s) => s.status === 'approved').length ?? 0
  const rejected = submissions?.filter((s) => s.status === 'rejected').length ?? 0
  const uniqueParticipants = new Set(submissions?.map((s) => s.userId)).size

  return (
    <div className="flex flex-col">
      <PageHeader title="Snap Hunt" subtitle="Submission analytics" />
      <PhotoChallengeTabs />

      <div className="flex flex-col gap-6 px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Views" value="—" sub="See Firebase Analytics (photo_challenge_viewed)" />
          <MetricCard label="Upload Attempts" value="—" sub="See Firebase Analytics (photo_upload_started)" />
          <MetricCard label="Submissions" value={total} />
          <MetricCard label="Unique Participants" value={uniqueParticipants} />
          <MetricCard label="Pending" value={pending} />
          <MetricCard label="Approved" value={approved} />
          <MetricCard label="Rejected" value={rejected} />
        </div>
        <p className="text-xs text-admin-muted">
          Submission Conversion Rate (submissions ÷ upload attempts) requires GA4/BigQuery export, which isn't wired up yet — view
          funnel events directly in the Firebase Analytics console for now.
        </p>
      </div>
    </div>
  )
}
