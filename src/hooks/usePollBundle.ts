import { useEffect, useState } from 'react'
import type { EventRecord, Poll, Question, QuestionOption } from '../types/schema'
import * as eventsRepository from '../repositories/events.repository'
import * as pollsRepository from '../repositories/polls.repository'
import * as questionsRepository from '../repositories/questions.repository'
import * as optionsRepository from '../repositories/options.repository'
import { FirebaseNotConfiguredError } from '../repositories/_firestore'

export interface PollBundle {
  event: EventRecord
  poll: Poll
  questions: Question[]
  optionsByQuestion: Map<string, QuestionOption[]>
}

export type PollBundleState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'not-configured' }
  | { status: 'ready'; bundle: PollBundle }

// Everything the public poll flow needs to render, loaded together: the
// poll (by its public slug), its parent event, and its published questions
// with each question's options. Used only by the public poll page — kept
// as a hook (not inlined in the page) so it stays testable and reusable if
// a second "resume a poll" entry point is ever added.
export function usePollBundle(slug: string | undefined, isAdmin = false): PollBundleState {
  const [state, setState] = useState<PollBundleState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    async function load() {
      if (!slug) return
      // Product Rule GT-POLL-002: only a published poll (with a published
      // parent event) is reachable by public users — enforced by
      // firestore.rules. `isAdmin` is passed through so an admin's own
      // "Preview" of a draft poll (Polls.tsx opens this same public URL)
      // still works; see the comment on getPollBySlug in
      // polls.repository.ts for why a non-admin query needs an explicit
      // status filter to be allowed at all. See docs/SECURITY.md.
      const poll = await pollsRepository.getPollBySlug(slug, isAdmin)
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
          const opts = await optionsRepository.getOptions(poll.id, q.id)
          optionsByQuestion.set(q.id, opts)
        }),
      )

      if (!cancelled) {
        setState({ status: 'ready', bundle: { event, poll, questions, optionsByQuestion } })
      }
    }

    load().catch((err: unknown) => {
      if (cancelled) return
      if (err instanceof FirebaseNotConfiguredError) {
        setState({ status: 'not-configured' })
      } else {
        // Unexpected failure (network, permission-denied, …) — treated as
        // not-found rather than leaking a raw SDK error to a public user.
        // See docs/SECURITY.md "user-facing error copy".
        setState({ status: 'not-found' })
      }
    })

    return () => {
      cancelled = true
    }
  }, [slug, isAdmin])

  return state
}
