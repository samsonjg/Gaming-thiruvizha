import { v4 as uuid } from 'uuid'
import type { AnswerValue, Question, Response, ResponseAnswer, ResponseSource } from '../types/schema'
import { KEYS, read, write, delay } from './_localStorage'

export async function hasResponded(sessionId: string, pollId: string, questionId: string): Promise<boolean> {
  const responses = read<Response>(KEYS.responses)
  return delay(responses.some((r) => r.sessionId === sessionId && r.pollId === pollId && r.questionId === questionId))
}

export interface SubmitAnswerInput {
  pollId: string
  questionId: string
  sessionId: string
  source: ResponseSource
  userId?: string
  value: AnswerValue
}

export interface SubmitAnswerResult {
  ok: boolean
  reason?: 'duplicate'
  response?: Response
}

// Enforces (sessionId, pollId, questionId) uniqueness at the same layer a
// real backend must repeat server-side (see docs/SECURITY.md — this check
// alone is NOT sufficient once this repository is backed by Firestore).
export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const already = await hasResponded(input.sessionId, input.pollId, input.questionId)
  if (already) {
    return delay({ ok: false, reason: 'duplicate' })
  }

  const response: Response = {
    id: `r-${uuid()}`,
    pollId: input.pollId,
    questionId: input.questionId,
    sessionId: input.sessionId,
    userId: input.userId,
    source: input.source,
    createdAt: new Date().toISOString(),
  }

  const answer: ResponseAnswer = {
    responseId: response.id,
    optionIds: input.value.kind === 'options' ? input.value.optionIds : undefined,
    textValue: input.value.kind === 'text' ? input.value.text : undefined,
    ratingValue: input.value.kind === 'rating' ? input.value.rating : undefined,
    rankingOrder: input.value.kind === 'ranking' ? input.value.order : undefined,
  }

  write(KEYS.responses, [...read<Response>(KEYS.responses), response])
  write(KEYS.answers, [...read<ResponseAnswer>(KEYS.answers), answer])

  return delay({ ok: true, response })
}

export interface ResponseRow {
  response: Response
  answer: ResponseAnswer
  question?: Question
}

export interface ResponseFilters {
  pollId?: string
  questionId?: string
  source?: ResponseSource
  questionType?: string
  fromDate?: string
  toDate?: string
}

export async function getResponseRows(filters: ResponseFilters = {}): Promise<ResponseRow[]> {
  const responses = read<Response>(KEYS.responses)
  const answers = read<ResponseAnswer>(KEYS.answers)
  const questions = read<Question>(KEYS.questions)
  const answerMap = new Map(answers.map((a) => [a.responseId, a]))
  const questionMap = new Map(questions.map((q) => [q.id, q]))

  let rows: ResponseRow[] = responses.map((response) => ({
    response,
    answer: answerMap.get(response.id) as ResponseAnswer,
    question: questionMap.get(response.questionId),
  }))

  if (filters.pollId) rows = rows.filter((r) => r.response.pollId === filters.pollId)
  if (filters.questionId) rows = rows.filter((r) => r.response.questionId === filters.questionId)
  if (filters.source) rows = rows.filter((r) => r.response.source === filters.source)
  if (filters.questionType) rows = rows.filter((r) => r.question?.type === filters.questionType)
  if (filters.fromDate) rows = rows.filter((r) => r.response.createdAt >= filters.fromDate!)
  if (filters.toDate) rows = rows.filter((r) => r.response.createdAt <= filters.toDate!)

  rows.sort((a, b) => (a.response.createdAt < b.response.createdAt ? 1 : -1))

  return delay(rows)
}
