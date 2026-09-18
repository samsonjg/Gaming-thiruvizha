import { v4 as uuid } from 'uuid'
import type {
  EventRecord,
  Poll,
  Question,
  QuestionOption,
  Response,
  ResponseAnswer,
  AnswerValue,
  ResponseSource,
} from '../types/schema'
import { seedEvent, seedPoll, seedQuestions, seedOptions, generateMockResponses } from '../data/seed'

// Lightweight localStorage-backed "data service". Every export is async so a
// future fetch()-based implementation against a real backend is a drop-in
// swap for this module without touching any component.

const KEYS = {
  events: 'kyn_poll_events',
  polls: 'kyn_poll_polls',
  questions: 'kyn_poll_questions',
  options: 'kyn_poll_options',
  responses: 'kyn_poll_responses',
  answers: 'kyn_poll_answers',
  seeded: 'kyn_poll_seeded_v1',
}

function read<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T[]) : []
}

function write<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function ensureSeeded() {
  if (localStorage.getItem(KEYS.seeded)) return

  write(KEYS.events, [seedEvent])
  write(KEYS.polls, [seedPoll])
  write(KEYS.questions, seedQuestions)
  write(KEYS.options, seedOptions)

  const { responses, answers } = generateMockResponses()
  write(KEYS.responses, responses)
  write(KEYS.answers, answers)

  localStorage.setItem(KEYS.seeded, '1')
}

ensureSeeded()

async function delay<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// ---------------- Events ----------------

export async function getEvents(): Promise<EventRecord[]> {
  return delay(read<EventRecord>(KEYS.events))
}

export async function getEvent(id: string): Promise<EventRecord | undefined> {
  return delay(read<EventRecord>(KEYS.events).find((e) => e.id === id))
}

export async function createEvent(input: Omit<EventRecord, 'id'>): Promise<EventRecord> {
  const events = read<EventRecord>(KEYS.events)
  const event: EventRecord = { ...input, id: `evt-${uuid()}` }
  write(KEYS.events, [...events, event])
  return delay(event)
}

export async function updateEvent(id: string, patch: Partial<EventRecord>): Promise<EventRecord | undefined> {
  const events = read<EventRecord>(KEYS.events)
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) return delay(undefined)
  events[idx] = { ...events[idx], ...patch }
  write(KEYS.events, events)
  return delay(events[idx])
}

export async function deleteEvent(id: string): Promise<void> {
  write(
    KEYS.events,
    read<EventRecord>(KEYS.events).filter((e) => e.id !== id),
  )
  return delay(undefined)
}

// ---------------- Polls ----------------

export async function getPolls(eventId?: string): Promise<Poll[]> {
  const polls = read<Poll>(KEYS.polls)
  return delay(eventId ? polls.filter((p) => p.eventId === eventId) : polls)
}

export async function getPoll(id: string): Promise<Poll | undefined> {
  return delay(read<Poll>(KEYS.polls).find((p) => p.id === id))
}

export async function getPollBySlug(slug: string): Promise<Poll | undefined> {
  return delay(read<Poll>(KEYS.polls).find((p) => p.publicSlug === slug))
}

export async function createPoll(input: Omit<Poll, 'id'>): Promise<Poll> {
  const polls = read<Poll>(KEYS.polls)
  const poll: Poll = { ...input, id: `poll-${uuid()}` }
  write(KEYS.polls, [...polls, poll])
  return delay(poll)
}

export async function updatePoll(id: string, patch: Partial<Poll>): Promise<Poll | undefined> {
  const polls = read<Poll>(KEYS.polls)
  const idx = polls.findIndex((p) => p.id === id)
  if (idx === -1) return delay(undefined)
  polls[idx] = { ...polls[idx], ...patch }
  write(KEYS.polls, polls)
  return delay(polls[idx])
}

export async function deletePoll(id: string): Promise<void> {
  write(KEYS.polls, read<Poll>(KEYS.polls).filter((p) => p.id !== id))
  return delay(undefined)
}

export async function duplicatePoll(id: string): Promise<Poll | undefined> {
  const source = await getPoll(id)
  if (!source) return delay(undefined)
  const newPoll: Poll = {
    ...source,
    id: `poll-${uuid()}`,
    name: `${source.name} (Copy)`,
    status: 'draft',
    publicSlug: `${source.publicSlug}-copy-${Math.floor(Math.random() * 1000)}`,
  }
  write(KEYS.polls, [...read<Poll>(KEYS.polls), newPoll])

  const questions = read<Question>(KEYS.questions).filter((q) => q.pollId === id)
  const options = read<QuestionOption>(KEYS.options)
  const newQuestions: Question[] = []
  const newOptions: QuestionOption[] = []
  for (const q of questions) {
    const newQId = `q-${uuid()}`
    newQuestions.push({ ...q, id: newQId, pollId: newPoll.id })
    options
      .filter((o) => o.questionId === q.id)
      .forEach((o) => newOptions.push({ ...o, id: `opt-${uuid()}`, questionId: newQId }))
  }
  write(KEYS.questions, [...read<Question>(KEYS.questions), ...newQuestions])
  write(KEYS.options, [...options, ...newOptions])

  return delay(newPoll)
}

// ---------------- Questions ----------------

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

// ---------------- Options ----------------

export async function getOptions(questionId: string): Promise<QuestionOption[]> {
  return delay(
    read<QuestionOption>(KEYS.options)
      .filter((o) => o.questionId === questionId)
      .sort((a, b) => a.order - b.order),
  )
}

export async function setOptions(questionId: string, options: Omit<QuestionOption, 'id' | 'questionId'>[]): Promise<QuestionOption[]> {
  const all = read<QuestionOption>(KEYS.options).filter((o) => o.questionId !== questionId)
  const created = options.map((o, idx) => ({
    ...o,
    id: `opt-${uuid()}`,
    questionId,
    order: idx + 1,
  }))
  write(KEYS.options, [...all, ...created])
  return delay(created)
}

// ---------------- Responses ----------------

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
// real backend would — the check a production API must repeat server-side.
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

// ---------------- Aggregation / analytics ----------------

export interface OptionResult {
  optionId: string
  label: string
  emoji?: string
  count: number
  pct: number
}

export async function getOptionResults(questionId: string): Promise<OptionResult[]> {
  const options = await getOptions(questionId)
  const rows = await getResponseRows({ questionId })
  const counts = new Map<string, number>()
  let total = 0

  for (const row of rows) {
    for (const optId of row.answer?.optionIds ?? []) {
      counts.set(optId, (counts.get(optId) ?? 0) + 1)
      total += 1
    }
  }

  return options
    .map((o) => ({
      optionId: o.id,
      label: o.label,
      emoji: o.emoji,
      count: counts.get(o.id) ?? 0,
      pct: total > 0 ? Math.round(((counts.get(o.id) ?? 0) / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export async function getRatingAverage(questionId: string): Promise<{ average: number; count: number; distribution: Record<number, number> }> {
  const rows = await getResponseRows({ questionId })
  const values = rows.map((r) => r.answer?.ratingValue).filter((v): v is number => typeof v === 'number')
  const distribution: Record<number, number> = {}
  values.forEach((v) => {
    distribution[v] = (distribution[v] ?? 0) + 1
  })
  const average = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0
  return { average, count: values.length, distribution }
}

export async function getTextAnswers(questionId: string): Promise<string[]> {
  const rows = await getResponseRows({ questionId })
  return rows.map((r) => r.answer?.textValue).filter((v): v is string => Boolean(v))
}

export interface PollAnalytics {
  participants: number
  totalResponses: number
  completionRate: number
  activeQuestions: number
  kynPct: number
  externalPct: number
  trend: { date: string; count: number }[]
  funnel: { stage: string; count: number }[]
  questionPerformance: { questionId: string; title: string; responses: number }[]
}

export async function getPollAnalytics(pollId: string): Promise<PollAnalytics> {
  const questions = await getQuestions(pollId)
  const activeQuestions = questions.filter((q) => q.status === 'published')
  const rows = await getResponseRows({ pollId })

  const sessions = new Set(rows.map((r) => r.response.sessionId))
  const participants = sessions.size

  const kynCount = rows.filter((r) => r.response.source === 'kyn').length
  const externalCount = rows.length - kynCount

  // completion = sessions that answered the required first question AND the last active question
  const first = activeQuestions[0]
  const last = activeQuestions[activeQuestions.length - 1]
  let completedSessions = 0
  let completionBase = 1
  if (first && last) {
    const firstSet = new Set(rows.filter((r) => r.response.questionId === first.id).map((r) => r.response.sessionId))
    const lastSet = new Set(rows.filter((r) => r.response.questionId === last.id).map((r) => r.response.sessionId))
    completedSessions = [...firstSet].filter((s) => lastSet.has(s)).length
    completionBase = firstSet.size || 1
  }

  const trendMap = new Map<string, number>()
  rows.forEach((r) => {
    const date = r.response.createdAt.slice(0, 10)
    trendMap.set(date, (trendMap.get(date) ?? 0) + 1)
  })
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }))

  const funnel = activeQuestions.map((q, idx) => {
    const answeredSessions = new Set(rows.filter((r) => r.response.questionId === q.id).map((r) => r.response.sessionId))
    return { stage: `Q${idx + 1} answered`, count: answeredSessions.size }
  })

  const questionPerformance = activeQuestions.map((q) => ({
    questionId: q.id,
    title: q.title,
    responses: rows.filter((r) => r.response.questionId === q.id).length,
  }))

  return {
    participants,
    totalResponses: rows.length,
    completionRate: Math.round((completedSessions / completionBase) * 100),
    activeQuestions: activeQuestions.length,
    kynPct: rows.length ? Math.round((kynCount / rows.length) * 100) : 0,
    externalPct: rows.length ? Math.round((externalCount / rows.length) * 100) : 0,
    trend,
    funnel,
    questionPerformance,
  }
}

export function resetAllData(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  ensureSeeded()
}
