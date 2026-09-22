import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveChallenge, useMySubmission } from '../../hooks/usePhotoChallenge'
import { useSession } from '../../hooks/useSession'
import * as submissionsRepository from '../../repositories/photoSubmissions.repository'
import { PhotoUploadFlow } from '../../features/photo-challenge/PhotoUploadFlow'
import { MySubmissionStatus } from '../../features/photo-challenge/MySubmissionStatus'
import { PhotoGallery } from '../../features/photo-challenge/PhotoGallery'
import { analytics } from '../../services/analytics/analytics'

export function PhotoChallengePage() {
  const { data: challenge, loading: challengeLoading, error: challengeError, reload } = useActiveChallenge()
  const session = useSession()
  const { data: submission, loading: submissionLoading, reload: reloadSubmission } = useMySubmission(challenge?.id, session?.sessionId)
  const [changingPhoto, setChangingPhoto] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (challenge) analytics.track('photo_challenge_viewed')
  }, [challenge])

  const isEnded = challenge ? new Date(challenge.endAt) < new Date() : false

  async function handleSubmit(file: File) {
    if (!challenge || !session) return
    setSubmitting(true)
    try {
      await submissionsRepository.submitPhoto({
        challengeId: challenge.id,
        uid: session.sessionId,
        file,
        termsVersion: challenge.termsVersion,
      })
      reloadSubmission()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleChangePhoto(file: File) {
    if (!challenge || !session) return
    setSubmitting(true)
    try {
      await submissionsRepository.changePhoto({
        challengeId: challenge.id,
        uid: session.sessionId,
        file,
        termsVersion: challenge.termsVersion,
      })
      reloadSubmission()
      setChangingPhoto(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gt-purple-950 text-white [background:radial-gradient(120%_120%_at_50%_0%,#2a1458_0%,#150a2e_55%,#0d0620_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-8">
        <Link to="/" className="text-sm text-white/50">
          ← Back
        </Link>

        {(challengeLoading || submissionLoading) && !challenge && <CenteredMessage text="Loading…" />}

        {!challengeLoading && (challengeError || !challenge) && (
          <CenteredMessage text="No active Snap Hunt right now. Check back soon!" onRetry={reload} />
        )}

        {challenge && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gt-gold-400">📸 Snap Hunt</p>
              <h1 className="mt-1 text-3xl font-extrabold">{challenge.title}</h1>
              <p className="mt-2 text-sm text-white/70">{challenge.description}</p>
              {challenge.rewardPoints > 0 && (
                <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                  🏆 {challenge.rewardPoints} Points
                </span>
              )}
            </div>

            {isEnded ? (
              <CenteredMessage text="This Snap Hunt has ended." />
            ) : !session || submissionLoading ? (
              <CenteredMessage text="Loading…" />
            ) : submission && !changingPhoto ? (
              <MySubmissionStatus submission={submission} challenge={challenge} onChangePhoto={() => setChangingPhoto(true)} />
            ) : (
              <PhotoUploadFlow
                challenge={challenge}
                mode={submission ? 'change' : 'submit'}
                submitting={submitting}
                onSubmit={submission ? handleChangePhoto : handleSubmit}
                onCancel={submission ? () => setChangingPhoto(false) : undefined}
              />
            )}

            <div>
              <p className="mb-3 text-sm font-semibold text-white/80">Community Submissions</p>
              <PhotoGallery challengeId={challenge.id} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CenteredMessage({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center text-white/60">
      <p>{text}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80">
          Try again
        </button>
      )}
    </div>
  )
}
