import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AnswerValue } from '../../types/schema'
import { usePollBundle } from '../../hooks/usePollBundle'
import { useSession } from '../../hooks/useSession'
import { useAuthState } from '../../app/providers/AuthProvider'
import * as responsesRepository from '../../repositories/responses.repository'
import * as statsRepository from '../../repositories/stats.repository'
import type { OptionResult } from '../../repositories/stats.repository'
import { PollLanding } from './PollLanding'
import { PollFlow } from './PollFlow'
import { PollResults } from './PollResults'
import { PollComplete } from './PollComplete'

type FlowPhase = 'landing' | 'flow' | 'results' | 'complete'

export function PollPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAdmin } = useAuthState()
  const bundleState = usePollBundle(slug, isAdmin)
  const session = useSession()

  const [phase, setPhase] = useState<FlowPhase>('landing')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)
  const [results, setResults] = useState<OptionResult[]>([])

  if (bundleState.status === 'loading') {
    return <CenteredMessage text="Loading poll…" />
  }

  if (bundleState.status === 'not-found') {
    return <CenteredMessage text="This poll could not be found." />
  }

  if (bundleState.status === 'not-configured') {
    return <CenteredMessage text="This poll isn't available right now. Please try again shortly." />
  }

  if (!session) {
    return <CenteredMessage text="Loading poll…" />
  }

  const activeSession = session
  const { event, poll, questions, optionsByQuestion } = bundleState.bundle

  async function checkAlreadyAnswered(questionId: string) {
    return responsesRepository.hasResponded(activeSession.sessionId, poll.id, questionId)
  }

  async function startPoll() {
    setCurrentIndex(0)
    const already = questions[0] ? await checkAlreadyAnswered(questions[0].id) : false
    setAlreadyAnswered(already)
    setPhase('flow')
  }

  async function advance() {
    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      const headline = questions.find((q) => q.settings.resultsVisible) ?? questions[0]
      const res = headline ? await statsRepository.getOptionResults(poll.id, headline.id) : []
      setResults(res)
      setPhase('results')
      return
    }
    setCurrentIndex(nextIndex)
    const already = await checkAlreadyAnswered(questions[nextIndex].id)
    setAlreadyAnswered(already)
  }

  async function handleSubmit(questionId: string, value: AnswerValue) {
    await responsesRepository.submitAnswer({
      pollId: poll.id,
      questionId,
      sessionId: activeSession.sessionId,
      source: activeSession.source,
      userId: activeSession.userId,
      value,
    })
    await advance()
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
