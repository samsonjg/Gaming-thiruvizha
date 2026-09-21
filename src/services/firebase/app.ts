import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'
import type { Analytics } from 'firebase/analytics'
import { firebaseConfig, isFirebaseConfigured } from '../../config/firebaseConfig'

// The only place `initializeApp` is called. Every other module imports
// `auth`/`db`/`getAnalyticsInstance` from here — never re-initialize
// Firebase elsewhere (see docs/AI_CONTEXT.md "keep Firebase config
// centralized"). `ignoreUndefinedProperties` lets repositories write
// objects with optional (possibly `undefined`) fields directly, matching
// the existing TypeScript types in types/schema.ts, instead of every
// write site having to strip undefined keys by hand.
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let analytics: Analytics | undefined

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = initializeFirestore(app, { ignoreUndefinedProperties: true })

  // Dynamically imported: `firebase/analytics` isn't on the critical
  // path for a first-time public poll visitor (no analytics.track()
  // call sites exist yet — see docs/ANALYTICS.md "Status") and keeping
  // it out of the eagerly-loaded bundle noticeably shrinks the JS a
  // mobile visitor has to download before the poll can render. Loaded
  // after the page has already painted.
  import('firebase/analytics').then(({ isSupported, getAnalytics }) => {
    isSupported().then((supported) => {
      if (supported && app) analytics = getAnalytics(app)
    })
  })
}

export { app, auth, db }

export function getAnalyticsInstance(): Analytics | undefined {
  return analytics
}
