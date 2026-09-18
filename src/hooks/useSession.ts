import { useMemo } from 'react'
import { getOrCreateSession } from '../services/session'
import type { UserSession } from '../types/schema'

// [TEMPORARY / NOT PRODUCTION READY] Wraps the localStorage-based session
// from services/session.ts. Replaced by Firebase Anonymous Auth
// (`useAuthState`) in the Firebase migration phase — see docs/ARCHITECTURE.md.
export function useSession(): UserSession {
  return useMemo(() => getOrCreateSession(), [])
}
