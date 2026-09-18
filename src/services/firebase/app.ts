import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { firebaseConfig, isFirebaseConfigured } from '../../config/firebaseConfig'

// The only place `initializeApp` is called. Every other module imports
// `auth`/`db`/`getAnalyticsInstance` from here — never re-initialize
// Firebase elsewhere (see docs/AI_CONTEXT.md "keep Firebase config
// centralized").
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let analytics: Analytics | undefined

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  isSupported().then((supported) => {
    if (supported && app) analytics = getAnalytics(app)
  })
}

export { app, auth, db }

export function getAnalyticsInstance(): Analytics | undefined {
  return analytics
}
