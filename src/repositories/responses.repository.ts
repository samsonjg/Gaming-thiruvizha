import { collection, doc, getDoc, getDocs, query, where, increment, writeBatch } from 'firebase/firestore'
import type { AnswerValue, Question, Response, ResponseAnswer, ResponseSource } from '../types/schema'
import { requireDb } from './_firestore'
import * as questionsRepository from './questions.repository'

function responsesCollection(pollId: string) {
  return collection(requireDb(), 'polls', pollId, 'responses')
}

function statsDoc(pollId: string, questionId: string) {
  return doc(requireDb(), 'polls', pollId, 'questionStats', questionId)
}

// Deterministic id — see docs/SECURITY.md "Duplicate response prevention".
// A session/uid can only ever address its own response document for a
// given question, and firestore.rules disallows update/delete entirely,
// so a second submit is rejected by Firestore itself, not by this check
// (this check is only a fast client-side UX short-circuit).
function responseId(uid: string, questionId: string) {
  return `${uid}_${questionId}`
}

export async function hasResponded(sessionId: string, pollId: string, questionId: string): Promise<boolean> {
  const snap = await getDoc(doc(responsesCollection(pollId), responseId(sessionId, questionId)))
  return snap.exists()
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

// Writes the response and atomically increments the public-readable
// questionStats counters doc in the same batch — see docs/FIREBASE_SCHEMA.md
// "Aggregated results without exposing individual responses". Raw
// responses stay admin-only; public clients only ever read questionStats.
export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const already = await hasResponded(input.sessionId, input.pollId, input.questionId)
  if (already) return { ok: false, reason: 'duplicate' }

  const id = responseId(input.sessionId, input.questionId)
  const response: Response = {
    id,
    pollId: input.pollId,
    questionId: input.questionId,
    sessionId: input.sessionId,
    userId: input.userId,
    source: input.source,
    createdAt: new Date().toISOString(),
  }
  const answer: ResponseAnswer = {
    responseId: id,
    optionIds: input.value.kind === 'options' ? input.value.optionIds : undefined,
    textValue: input.value.kind === 'text' ? input.value.text : undefined,
    ratingValue: input.value.kind === 'rating' ? input.value.rating : undefined,
    rankingOrder: input.value.kind === 'ranking' ? input.value.order : undefined,
  }

  const b = writeBatch(requireDb())
  b.set(doc(responsesCollection(input.pollId), id), { ...response, answer })

  const statsPatch: Record<string, unknown> = { totalResponses: increment(1) }
  if (input.value.kind === 'options') {
    input.value.optionIds.forEach((optId) => {
      statsPatch[`optionCounts.${optId}`] = increment(1)
    })
  } else if (input.value.kind === 'rating') {
    statsPatch.ratingSum = increment(input.value.rating)
    statsPatch.ratingCount = increment(1)
  } else if (input.value.kind === 'text') {
    statsPatch.textCount = increment(1)
  }
  b.set(statsDoc(input.pollId, input.questionId), statsPatch, { merge: true })

  await b.commit()
  return { ok: true, response }
}

export interface ResponseRow {
  response: Response
  answer: ResponseAnswer
  question?: Question
}

export interface ResponseFilters {
  pollId: string
  questionId?: string
  source?: ResponseSource
  questionType?: string
  fromDate?: string
  toDate?: string
}

// Admin-only — see docs/SECURITY.md. Reads the raw responses subcollection,
// which firestore.rules restricts to the `admin` custom claim.
export async function getResponseRows(filters: ResponseFilters): Promise<ResponseRow[]> {
  const clauses = []
  if (filters.questionId) clauses.push(where('questionId', '==', filters.questionId))
  if (filters.source) clauses.push(where('source', '==', filters.source))

  const [snap, questions] = await Promise.all([
    getDocs(query(responsesCollection(filters.pollId), ...clauses)),
    questionsRepository.getQuestions(filters.pollId),
  ])
  const questionMap = new Map(questions.map((q) => [q.id, q]))

  let rows: ResponseRow[] = snap.docs.map((d) => {
    const data = d.data() as Response & { answer: ResponseAnswer }
    const { answer, ...response } = data
    return { response: { ...response, id: d.id }, answer, question: questionMap.get(response.questionId) }
  })

  if (filters.questionType) rows = rows.filter((r) => r.question?.type === filters.questionType)
  if (filters.fromDate) rows = rows.filter((r) => r.response.createdAt >= filters.fromDate!)
  if (filters.toDate) rows = rows.filter((r) => r.response.createdAt <= filters.toDate!)

  rows.sort((a, b) => (a.response.createdAt < b.response.createdAt ? 1 : -1))
  return rows
}
