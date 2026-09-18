import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AnswerValue, EventRecord, Poll, Question, QuestionOption } from '../../types/schema'
import * as dataService from '../../services/dataService'
import { getOrCreateSession } from '../../services/session'
import { PollLanding } from './PollLanding'
import { PollFlow } from './PollFlow'
import { PollResults } from './PollResults'
import { PollComplete } from './PollComplete'

type Phase = 'loading' | 'not-found' | 'landing' | 'flow' | 'results' | 'complete'

export function PollPage() {
  const { slug } = useParams<{ slug: string }>()
  const [phase, setPhase] = useState<Phase>('loading')
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [optionsByQuestion, setOptionsByQuestion] = useState<Map<string, QuestionOption[]>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)
  const [results, setResults] = useState<dataService.OptionResult[]>([])

  const session = getOrCreateSession()

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!slug) return
      const p = await dataService.getPollBySlug(slug)
      if (!p) {
        if (!cancelled) setPhase('not-found')
        return
      }
      const [ev, qs] = await Promise.all([dataService.getEvent(p.eventId), dataService.getPublishedQuestions(p.id)])
      if (!ev || cancelled) return

      const optMap = new Map<string, QuestionOption[]>()
      await Promise.all(
        qs.map(async (q) => {
          const opts = await dataService.getOptions(q.id)
          optMap.set(q.id, opts)
        }),
      )

      if (cancelled) return
      setPoll(p)
      setEvent(ev)
      setQuestions(qs)
      setOptionsByQuestion(optMap)
      setPhase('landing')
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  async function checkAlreadyAnswered(questionId: string) {
    if (!poll) return false
    return dataService.hasResponded(session.sessionId, poll.id, questionId)
  }

  async function startPoll() {
    setCurrentIndex(0)
    const already = await checkAlreadyAnswered(questions[0].id)
    setAlreadyAnswered(already)
    setPhase('flow')
  }

  async function advance() {
    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      // Show aggregated results for the first (headline) question with visible results.
      const headline = questions.find((q) => q.settings.resultsVisible) ?? questions[0]
      const res = await dataService.getOptionResults(headline.id)
      setResults(res)
      setPhase('results')
      return
    }
    setCurrentIndex(nextIndex)
    const already = await checkAlreadyAnswered(questions[nextIndex].id)
    setAlreadyAnswered(already)
  }

  async function handleSubmit(questionId: string, value: AnswerValue) {
    if (!poll) return
    await dataService.submitAnswer({
      pollId: poll.id,
      questionId,
      sessionId: session.sessionId,
      source: session.source,
      userId: session.userId,
      value,
    })
    await advance()
  }

  if (phase === 'loading') {
    return <CenteredMessage text="Loading poll…" />
  }

  if (phase === 'not-found' || !event || !poll) {
    return <CenteredMessage text="This poll could not be found." />
  }

  const headline = questions.find((q) => q.settings.resultsVisible) ?? questions[0]

  return (
    <div className="min-h-screen bg-gt-purple-950 text-white [background:radial-gradient(120%_120%_at_50%_0%,#2a1458_0%,#150a2e_55%,#0d0620_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {phase === 'landing' && <PollLanding event={event} onStart={startPoll} />}
        {phase === 'flow' && (
          <PollFlow
            questions={questions}
            optionsByQuestion={optionsByQuestion}
            currentIndex={currentIndex}
            alreadyAnswered={alreadyAnswered}
            onSubmit={handleSubmit}
            onSkip={advance}
          />
        )}
        {phase === 'results' && headline && (
          <PollResults results={results} questionTitle={headline.title} onContinue={() => setPhase('complete')} />
        )}
        {phase === 'complete' && <PollComplete event={event} />}
      </div>
    </div>
  )
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gt-purple-950 px-6 text-center text-white/70">
      {text}
    </div>
  )
}
