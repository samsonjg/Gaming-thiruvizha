// Centralized Firebase configuration. Every Firebase env var lives here and
// only here — see docs/DEVELOPMENT.md for the full setup steps and
// .env.example for the variable list. Never hardcode a Firebase config
// object anywhere else in the app.

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

const requiredVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(requiredVars)
  .filter(([, value]) => !value)
  .map(([key]) => key)

// Deliberately fails loudly instead of silently falling back to mock data —
// see docs/AI_CONTEXT.md rule #6 ("no fake backend shipped as production
// behavior"). isFirebaseConfigured lets the UI show a clear setup message
// instead of crashing with a raw SDK error.
export const isFirebaseConfigured = missing.length === 0

export const firebaseConfigStatus = {
  configured: isFirebaseConfigured,
  missingVars: missing.map((key) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`),
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: requiredVars.apiKey ?? '',
  authDomain: requiredVars.authDomain ?? '',
  projectId: requiredVars.projectId ?? '',
  storageBucket: requiredVars.storageBucket ?? '',
  messagingSenderId: requiredVars.messagingSenderId ?? '',
  appId: requiredVars.appId ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
}
