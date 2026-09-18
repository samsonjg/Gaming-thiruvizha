import { useMemo } from 'react'
import { useAuthState } from '../app/providers/AuthProvider'
import { readQueryParams } from '../services/session'
import type { UserSession } from '../types/schema'

// The public poll's session identity is the real Firebase Auth uid
// (anonymous or, if the visitor happens to be signed in as admin,
// their own uid) — NOT a separate localStorage-generated id. This
// matters beyond bookkeeping: firestore.rules' duplicate-response
// prevention checks `request.auth.uid` against the response document,
// so a mismatched sessionId here would make every submitAnswer() call
// fail the security rule. See docs/SECURITY.md.
//
// Returns null while the anonymous sign-in is still in flight — callers
// should treat that the same as "loading."
export function useSession(): UserSession | null {
  const { user, loading } = useAuthState()

  return useMemo(() => {
    if (loading || !user) return null
    const fromUrl = readQueryParams()
    return {
      sessionId: user.uid,
      userId: fromUrl.userId,
      eventId: fromUrl.eventId,
      source: fromUrl.source ?? 'external',
      campaign: fromUrl.campaign,
      utmSource: fromUrl.utmSource,
      utmMedium: fromUrl.utmMedium,
      utmCampaign: fromUrl.utmCampaign,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, loading])
}
