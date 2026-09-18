import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase/app'

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super('Firebase is not configured. Set the VITE_FIREBASE_* environment variables — see docs/DEVELOPMENT.md.')
    this.name = 'FirebaseNotConfiguredError'
  }
}

// Every Firestore repository calls this first instead of importing `db`
// directly, so a missing configuration fails with one clear, catchable
// error type instead of a raw "Cannot read properties of undefined"
// somewhere deep in the Firestore SDK.
export function requireDb() {
  if (!db) throw new FirebaseNotConfiguredError()
  return db
}

export function withId<T>(snap: QueryDocumentSnapshot<DocumentData>): T & { id: string } {
  return { ...(snap.data() as T), id: snap.id }
}
