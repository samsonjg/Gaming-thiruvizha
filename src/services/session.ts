import { v4 as uuid } from 'uuid'
import type { UserSession } from '../types/schema'

const SESSION_KEY = 'kyn_poll_session'

function readQueryParams(): Partial<UserSession> {
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

// Creates or resumes a lightweight anonymous session, stamping it with
// whatever Kyn/UTM tracking params are present on the current URL.
export function getOrCreateSession(): UserSession {
  const stored = localStorage.getItem(SESSION_KEY)
  const fromUrl = readQueryParams()

  if (stored) {
    const session: UserSession = JSON.parse(stored)
    // Re-stamp source/campaign if this visit arrived with fresh params.
    const merged: UserSession = {
      ...session,
      ...Object.fromEntries(Object.entries(fromUrl).filter(([, v]) => v !== undefined)),
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(merged))
    return merged
  }

  const session: UserSession = {
    sessionId: uuid(),
    source: fromUrl.source ?? 'external',
    userId: fromUrl.userId,
    eventId: fromUrl.eventId,
    campaign: fromUrl.campaign,
    utmSource: fromUrl.utmSource,
    utmMedium: fromUrl.utmMedium,
    utmCampaign: fromUrl.utmCampaign,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSessionId(): string {
  return getOrCreateSession().sessionId
}
