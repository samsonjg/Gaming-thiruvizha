import { collection, doc, getDocs, query, orderBy, writeBatch } from 'firebase/firestore'
import type { QuestionOption } from '../types/schema'
import { requireDb, withId } from './_firestore'

// Nested under polls/{pollId}/questions/{questionId}/options.
function optionsCollection(pollId: string, questionId: string) {
  return collection(requireDb(), 'polls', pollId, 'questions', questionId, 'options')
}

export async function getOptions(pollId: string, questionId: string): Promise<QuestionOption[]> {
  const snap = await getDocs(query(optionsCollection(pollId, questionId), orderBy('order')))
  return snap.docs.map((d) => withId<Omit<QuestionOption, 'id'>>(d))
}

// Replaces the full option set for a question — matches the admin Question
// Builder's "edit all options at once" UI (docs/FEATURES.md "Question
// Builder"). Existing option docs are deleted and the new set is written
// in the same batch, so a page reload never shows a half-applied edit.
export async function setOptions(
  pollId: string,
  questionId: string,
  options: Omit<QuestionOption, 'id' | 'questionId'>[],
): Promise<QuestionOption[]> {
  const colRef = optionsCollection(pollId, questionId)
  const existing = await getDocs(colRef)
  const b = writeBatch(requireDb())
  existing.docs.forEach((d) => b.delete(d.ref))

  const created: QuestionOption[] = []
  options.forEach((o, idx) => {
    const ref = doc(colRef)
    const data = { ...o, questionId, order: idx + 1 }
    b.set(ref, data)
    created.push({ ...data, id: ref.id })
  })

  await b.commit()
  return created
}
