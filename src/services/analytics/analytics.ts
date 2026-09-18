import { logEvent } from 'firebase/analytics'
import { getAnalyticsInstance } from '../firebase/app'

// The only place any code calls the Firebase Analytics SDK — see
// docs/AI_CONTEXT.md and docs/ANALYTICS.md. No event names are wired up
// to call sites yet (docs/ANALYTICS.md "Status"); this exists so that
// when they are, every call site does `analytics.track(...)` and never
// imports `firebase/analytics` directly.
//
// Safe to call unconditionally: no-ops (never throws) if Firebase isn't
// configured or Analytics isn't supported in the current browser.
function track(eventName: string, params?: Record<string, string | number | boolean>): void {
  const instance = getAnalyticsInstance()
  if (!instance) return
  logEvent(instance, eventName, params)
}

export const analytics = { track }
