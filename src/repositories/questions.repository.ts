import { v4 as uuid } from 'uuid'
import type { Question, QuestionOption } from '../types/schema'
import { KEYS, read, write, delay } from './_localStorage'

export async function getQuestions(pollId: string): Promise<Question[]> {
  return delay(
    read<Question>(KEYS.questions)
      .filter((q) => q.pollId === pollId)
      .sort((a, b) => a.order - b.order),
  )
}

export async function getPublishedQuestions(pollId: string): Promise<Question[]> {
  const all = await getQuestions(pollId)
  return all.filter((q) => q.status === 'published')
}

export async function getQuestion(id: string): Promise<Question | undefined> {
  return delay(read<Question>(KEYS.questions).find((q) => q.id === id))
}

export async function createQuestion(input: Omit<Question, 'id'>): Promise<Question> {
  const questions = read<Question>(KEYS.questions)
  const question: Question = { ...input, id: `q-${uuid()}` }
  write(KEYS.questions, [...questions, question])
  return delay(question)
}

export async function updateQuestion(id: string, patch: Partial<Question>): Promise<Question | undefined> {
  const questions = read<Question>(KEYS.questions)
  const idx = questions.findIndex((q) => q.id === id)
  if (idx === -1) return delay(undefined)
  questions[idx] = { ...questions[idx], ...patch }
  write(KEYS.questions, questions)
  return delay(questions[idx])
}

export async function deleteQuestion(id: string): Promise<void> {
  write(KEYS.questions, read<Question>(KEYS.questions).filter((q) => q.id !== id))
  write(KEYS.options, read<QuestionOption>(KEYS.options).filter((o) => o.questionId !== id))
  return delay(undefined)
}

export async function duplicateQuestion(id: string): Promise<Question | undefined> {
  const source = await getQuestion(id)
  if (!source) return delay(undefined)
  const siblingCount = (await getQuestions(source.pollId)).length
  const newQuestion: Question = {
    ...source,
    id: `q-${uuid()}`,
    title: `${source.title} (Copy)`,
    status: 'draft',
    order: siblingCount + 1,
  }
  write(KEYS.questions, [...read<Question>(KEYS.questions), newQuestion])

  const options = read<QuestionOption>(KEYS.options).filter((o) => o.questionId === id)
  const newOptions = options.map((o) => ({ ...o, id: `opt-${uuid()}`, questionId: newQuestion.id }))
  write(KEYS.options, [...read<QuestionOption>(KEYS.options), ...newOptions])

  return delay(newQuestion)
}

export async function reorderQuestions(pollId: string, orderedIds: string[]): Promise<void> {
  const questions = read<Question>(KEYS.questions)
  orderedIds.forEach((id, idx) => {
    const q = questions.find((x) => x.id === id && x.pollId === pollId)
    if (q) q.order = idx + 1
  })
  write(KEYS.questions, questions)
  return delay(undefined)
}
