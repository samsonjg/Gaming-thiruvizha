// Transitional Phase-2 storage layer: every repository in this directory
// reads/writes through here so swapping to Firestore later only means
// rewriting this file's callers' internals (see repositories/*.repository.ts),
// not the hooks or pages that consume them.
//
// [TEMPORARY / NOT PRODUCTION READY] — localStorage is a single-browser,
// client-only store. It is replaced by Firestore in the Firebase migration
// phase (see docs/ARCHITECTURE.md, docs/FIREBASE_SCHEMA.md). Every exported
// repository function is already async so that swap does not change any
// caller.
import { seedEvent, seedPoll, seedQuestions, seedOptions, generateMockResponses } from '../data/seed'
import type { EventRecord, Poll, Question, QuestionOption, Response, ResponseAnswer } from '../types/schema'

export const KEYS = {
  events: 'kyn_poll_events',
  polls: 'kyn_poll_polls',
  questions: 'kyn_poll_questions',
  options: 'kyn_poll_options',
  responses: 'kyn_poll_responses',
  answers: 'kyn_poll_answers',
  seeded: 'kyn_poll_seeded_v1',
} as const

export function read<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T[]) : []
}

export function write<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export async function delay<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function ensureSeeded() {
  if (localStorage.getItem(KEYS.seeded)) return

  write<EventRecord>(KEYS.events, [seedEvent])
  write<Poll>(KEYS.polls, [seedPoll])
  write<Question>(KEYS.questions, seedQuestions)
  write<QuestionOption>(KEYS.options, seedOptions)

  const { responses, answers } = generateMockResponses()
  write<Response>(KEYS.responses, responses)
  write<ResponseAnswer>(KEYS.answers, answers)

  localStorage.setItem(KEYS.seeded, '1')
}

ensureSeeded()

export function resetAllData(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  ensureSeeded()
}
