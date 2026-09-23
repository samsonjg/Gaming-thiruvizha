import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, writeBatch } from 'firebase/firestore/lite'
import type { Question } from '../types/schema'
import { requireDb, withId } from './_firestore'
import * as optionsRepository from './options.repository'

// Nested under polls/{pollId}/questions — see docs/FIREBASE_SCHEMA.md.
function questionsCollection(pollId: string) {
  return collection(requireDb(), 'polls', pollId, 'questions')
}

export async function getQuestions(pollId: string): Promise<Question[]> {
  const snap = await getDocs(query(questionsCollection(pollId), orderBy('order')))
  return snap.docs.map((d) => withId<Omit<Question, 'id'>>(d))
}

// Used by the public poll flow (anonymous, non-admin). Issues its own
// filtered query rather than delegating to getQuestions() + a client-side
// filter — see the comment on polls.repository.ts's getPollBySlug for why
// an explicit `where('status', ...)` clause is required for a non-admin
// list query to be allowed at all, not just for correctness.
export async function getPublishedQuestions(pollId: string): Promise<Question[]> {
  const snap = await getDocs(query(questionsCollection(pollId), where('status', '==', 'published'), orderBy('order')))
  return snap.docs.map((d) => withId<Omit<Question, 'id'>>(d))
}

export async function getQuestion(pollId: string, questionId: string): Promise<Question | undefined> {
  const snap = await getDoc(doc(questionsCollection(pollId), questionId))
  return snap.exists() ? withId<Omit<Question, 'id'>>(snap) : undefined
}

export async function createQuestion(pollId: string, input: Omit<Question, 'id'>): Promise<Question> {
  const ref = await addDoc(questionsCollection(pollId), input)
  return { ...input, id: ref.id }
}

export async function updateQuestion(pollId: string, questionId: string, patch: Partial<Question>): Promise<Question | undefined> {
  await updateDoc(doc(questionsCollection(pollId), questionId), patch)
  return getQuestion(pollId, questionId)
}

export async function deleteQuestion(pollId: string, questionId: string): Promise<void> {
  const options = await optionsRepository.getOptions(pollId, questionId)
  const b = writeBatch(requireDb())
  options.forEach((o) => b.delete(doc(questionsCollection(pollId), questionId, 'options', o.id)))
  b.delete(doc(questionsCollection(pollId), questionId))
  await b.commit()
}

export async function duplicateQuestion(pollId: string, questionId: string): Promise<Question | undefined> {
  const source = await getQuestion(pollId, questionId)
  if (!source) return undefined
  const siblingCount = (await getQuestions(pollId)).length

  const newQuestion = await createQuestion(pollId, {
    ...source,
    title: `${source.title} (Copy)`,
    status: 'draft',
    order: siblingCount + 1,
  })

  const options = await optionsRepository.getOptions(pollId, questionId)
  if (options.length) {
    await optionsRepository.setOptions(pollId, newQuestion.id, options)
  }

  return newQuestion
}

export async function reorderQuestions(pollId: string, orderedIds: string[]): Promise<void> {
  const b = writeBatch(requireDb())
  orderedIds.forEach((id, idx) => {
    b.update(doc(questionsCollection(pollId), id), { order: idx + 1 })
  })
  await b.commit()
}
