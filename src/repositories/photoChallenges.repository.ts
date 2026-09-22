import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore'
import type { PhotoChallenge } from '../types/schema'
import { requireDb, withId } from './_firestore'

const COLLECTION = 'photoChallenges'

// v1 is a singleton in practice — see docs/PRD.md "Photo Challenge" and
// the plan decision to match the admin mockup's single Configuration
// form rather than a full CRUD list like Polls. Modeled as a real
// collection (not a hardcoded doc id) so nothing blocks adding proper
// multi-challenge support later.

// Public: only a currently-active, in-window challenge. Filters by
// `status` explicitly (not just `orderBy`) — a non-admin `list` query
// must be provably safe from its own `where` clauses, or firestore.rules
// rejects the whole query; see docs/FIREBASE_SCHEMA.md "Indexes" for why
// (this exact class of bug hit the Poll once already).
export async function getActiveChallenge(): Promise<PhotoChallenge | undefined> {
  const snap = await getDocs(
    query(collection(requireDb(), COLLECTION), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(1)),
  )
  const d = snap.docs[0]
  return d ? withId<Omit<PhotoChallenge, 'id'>>(d) : undefined
}

// Admin: the most recently created challenge regardless of status —
// what the single Configuration form edits.
export async function getCurrentChallenge(): Promise<PhotoChallenge | undefined> {
  const snap = await getDocs(query(collection(requireDb(), COLLECTION), orderBy('createdAt', 'desc'), limit(1)))
  const d = snap.docs[0]
  return d ? withId<Omit<PhotoChallenge, 'id'>>(d) : undefined
}

export async function getChallenge(id: string): Promise<PhotoChallenge | undefined> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, id))
  return snap.exists() ? withId<Omit<PhotoChallenge, 'id'>>(snap) : undefined
}

export async function createChallenge(input: Omit<PhotoChallenge, 'id'>): Promise<PhotoChallenge> {
  const ref = await addDoc(collection(requireDb(), COLLECTION), input)
  return { ...input, id: ref.id }
}

export async function updateChallenge(id: string, patch: Partial<PhotoChallenge>): Promise<PhotoChallenge | undefined> {
  await updateDoc(doc(requireDb(), COLLECTION, id), patch)
  return getChallenge(id)
}
