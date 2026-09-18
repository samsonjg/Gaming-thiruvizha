import { useEffect, useState } from 'react'
import type { EventRecord, Poll, Question, QuestionOption } from '../types/schema'
import * as eventsRepository from '../repositories/events.repository'
import * as pollsRepository from '../repositories/polls.repository'
import * as questionsRepository from '../repositories/questions.repository'
import * as optionsRepository from '../repositories/options.repository'

export interface PollBundle {
  event: EventRecord
  poll: Poll
  questions: Question[]
  optionsByQuestion: Map<string, QuestionOption[]>
}

export type PollBundleState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'ready'; bundle: PollBundle }

// Everything the public poll flow needs to render, loaded together: the
// poll (by its public slug), its parent event, and its published questions
// with each question's options. Used only by the public poll page — kept
// as a hook (not inlined in the page) so it stays testable and reusable if
// a second "resume a poll" entry point is ever added.
export function usePollBundle(slug: string | undefined): PollBundleState {
  const [state, setState] = useState<PollBundleState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    async function load() {
      if (!slug) return
      const poll = await pollsRepository.getPollBySlug(slug)
      if (!poll || cancelled) {
        if (!cancelled) setState({ status: 'not-found' })
        return
      }

      const [event, questions] = await Promise.all([
        eventsRepository.getEvent(poll.eventId),
        questionsRepository.getPublishedQuestions(poll.id),
      ])
      if (!event || cancelled) {
        if (!cancelled) setState({ status: 'not-found' })
        return
      }

      const optionsByQuestion = new Map<string, QuestionOption[]>()
      await Promise.all(
        questions.map(async (q) => {
          const opts = await optionsRepository.getOptions(q.id)
          optionsByQuestion.set(q.id, opts)
        }),
      )

      if (!cancelled) {
        setState({ status: 'ready', bundle: { event, poll, questions, optionsByQuestion } })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}
