import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore'
import type { Poll } from '../types/schema'
import { requireDb, withId } from './_firestore'
import * as questionsRepository from './questions.repository'
import * as optionsRepository from './options.repository'

const COLLECTION = 'polls'

export async function getPolls(eventId?: string): Promise<Poll[]> {
  const db = requireDb()
  const q = eventId ? query(collection(db, COLLECTION), where('eventId', '==', eventId)) : collection(db, COLLECTION)
  const snap = await getDocs(q)
  return snap.docs.map((d) => withId<Omit<Poll, 'id'>>(d))
}

export async function getPoll(id: string): Promise<Poll | undefined> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, id))
  return snap.exists() ? withId<Omit<Poll, 'id'>>(snap) : undefined
}

// Product Rule: only a `published` poll is reachable by public users
// (GT-POLL-002) — enforced by firestore.rules on the read, not here; this
// helper is also used by admin, which must see draft polls too.
export async function getPollBySlug(slug: string): Promise<Poll | undefined> {
  const snap = await getDocs(query(collection(requireDb(), COLLECTION), where('publicSlug', '==', slug), limit(1)))
  const d = snap.docs[0]
  return d ? withId<Omit<Poll, 'id'>>(d) : undefined
}

export async function createPoll(input: Omit<Poll, 'id'>): Promise<Poll> {
  const ref = await addDoc(collection(requireDb(), COLLECTION), input)
  return { ...input, id: ref.id }
}

export async function updatePoll(id: string, patch: Partial<Poll>): Promise<Poll | undefined> {
  await updateDoc(doc(requireDb(), COLLECTION, id), patch)
  return getPoll(id)
}

export async function deletePoll(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, id))
}

export async function duplicatePoll(id: string): Promise<Poll | undefined> {
  const source = await getPoll(id)
  if (!source) return undefined

  const newPoll = await createPoll({
    ...source,
    name: `${source.name} (Copy)`,
    status: 'draft',
    publicSlug: `${source.publicSlug}-copy-${Math.floor(Math.random() * 1000)}`,
  })

  const questions = await questionsRepository.getQuestions(id)
  for (const q of questions) {
    const options = await optionsRepository.getOptions(id, q.id)
    const newQuestion = await questionsRepository.createQuestion(newPoll.id, {
      ...q,
      pollId: newPoll.id,
    })
    if (options.length) {
      await optionsRepository.setOptions(newPoll.id, newQuestion.id, options)
    }
  }

  return newPoll
}

// Exposed for repositories that need an atomic multi-document write (see
// responses.repository.ts's stats increment) without pulling the Firestore
// SDK into every file.
export function batch() {
  return writeBatch(requireDb())
}
