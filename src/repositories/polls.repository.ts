import { v4 as uuid } from 'uuid'
import type { Poll, Question, QuestionOption } from '../types/schema'
import { KEYS, read, write, delay } from './_localStorage'

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
