import type { UserSession } from '../types/schema'

// Parses the Kyn/UTM tracking params this app's poll links are expected
// to carry (see docs/PRD.md "Kyn Traffic Attribution"). Pure and
// side-effect-free — combined with the real Firebase Auth uid by
// hooks/useSession.ts, which is what the rest of the app should use.
export function readQueryParams(): Partial<UserSession> {
  const params = new URLSearchParams(window.location.search)
  const source = params.get('source') === 'kyn' ? 'kyn' : params.get('source') === 'external' ? 'external' : undefined

  return {
    userId: params.get('user_id') ?? undefined,
    eventId: params.get('event_id') ?? undefined,
    source,
    campaign: params.get('campaign') ?? undefined,
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
  }
}
