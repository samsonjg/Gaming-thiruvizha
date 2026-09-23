import { collection, deleteDoc, doc, getDoc, getDocs, addDoc, updateDoc } from 'firebase/firestore/lite'
import type { EventRecord } from '../types/schema'
import { requireDb, withId } from './_firestore'

const COLLECTION = 'events'

// Product Rule: only `published` events are shown to public users — the
// public read path (docs/USER_FLOWS.md "Event Discovery") filters this
// client-side today; firestore.rules is the actual enforcement (see
// docs/SECURITY.md) so this function intentionally returns everything and
// lets callers filter, matching the admin's need to see drafts too.
export async function getEvents(): Promise<EventRecord[]> {
  const snap = await getDocs(collection(requireDb(), COLLECTION))
  return snap.docs.map((d) => withId<Omit<EventRecord, 'id'>>(d))
}

export async function getEvent(id: string): Promise<EventRecord | undefined> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, id))
  return snap.exists() ? withId<Omit<EventRecord, 'id'>>(snap) : undefined
}

export async function createEvent(input: Omit<EventRecord, 'id'>): Promise<EventRecord> {
  const ref = await addDoc(collection(requireDb(), COLLECTION), input)
  return { ...input, id: ref.id }
}

export async function updateEvent(id: string, patch: Partial<EventRecord>): Promise<EventRecord | undefined> {
  await updateDoc(doc(requireDb(), COLLECTION, id), patch)
  return getEvent(id)
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, id))
}
