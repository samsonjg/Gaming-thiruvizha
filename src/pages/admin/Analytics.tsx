import { useEffect, useState } from 'react'
import * as statsRepository from '../../repositories/stats.repository'
import type { OptionResult } from '../../repositories/stats.repository'
import { useActivePoll } from '../../hooks/usePolls'
import { usePollAnalytics } from '../../hooks/useAnalytics'
import { useQuestions } from '../../hooks/useQuestions'
import { PageHeader, Card, MetricCard, LoadingState, EmptyState } from '../../components/ui'
import { AnimatedCounter } from '../../components/common/AnimatedCounter'
import { ResultBar } from '../../components/common/ResultBar'

export function Analytics() {
  const { data: poll, loading: pollLoading } = useActivePoll()
  const { data: analytics } = usePollAnalytics(poll?.id)
  const { data: questions } = useQuestions(poll?.id)
  const [ratingStats, setRatingStats] = useState<{ average: number; count: number; distribution: Record<number, number> } | null>(null)
  const [optionResults, setOptionResults] = useState<Record<string, OptionResult[]>>({})

  const ratingQuestion = questions?.find((q) => q.type === 'rating')
  const optionQuestions = questions?.filter((q) => q.type === 'single_choice' || q.type === 'multiple_choice') ?? []

  useEffect(() => {
    if (!poll || !ratingQuestion) return
    statsRepository.getRatingAverage(poll.id, ratingQuestion.id).then(setRatingStats)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll?.id, ratingQuestion?.id])

  useEffect(() => {
    if (!poll || optionQuestions.length === 0) return
    Promise.all(optionQuestions.map((q) => statsRepository.getOptionResults(poll.id, q.id).then((r) => [q.id, r] as const))).then(
      (entries) => setOptionResults(Object.fromEntries(entries)),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll?.id, optionQuestions.map((q) => q.id).join(',')])

  if (pollLoading) return <LoadingState />
  if (!poll) return <EmptyState title="No poll yet" description="Create an event and poll to see analytics here." />
  if (!analytics) return <LoadingState />

  const mostSelected = Object.values(optionResults)
    .flat()
    .sort((a, b) => b.count - a.count)[0]

  return (
    <div className="flex flex-col">
      <PageHeader title="Analytics" subtitle={`${poll.name} — full breakdown`} />

      <div className="flex flex-col gap-6 px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Total Participants" value={<AnimatedCounter value={analytics.participants} />} />
          <MetricCard label="Unique Respondents" value={<AnimatedCounter value={analytics.participants} />} />
          <MetricCard label="Total Responses" value={<AnimatedCounter value={analytics.totalResponses} />} />
          <MetricCard label="Completion Rate" value={<AnimatedCounter value={analytics.completionRate} suffix="%" />} />
          <MetricCard label="Average Rating" value={ratingStats ? `${ratingStats.average.toFixed(1)} / 5` : '—'} />
          <MetricCard label="Most Selected Option" value={mostSelected ? mostSelected.label : '—'} sub={mostSelected ? `${mostSelected.pct}%` : undefined} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <p className="mb-4 text-sm font-semibold text-admin-text">Kyn vs External Source</p>
            <div className="flex flex-col gap-3">
              <ResultBar label="Kyn" pct={analytics.kynPct} highlight theme="light" />
              <ResultBar label="External" pct={analytics.externalPct} theme="light" />
            </div>
          </Card>

          <Card>
            <p className="mb-4 text-sm font-semibold text-admin-text">Completion Funnel</p>
            <div className="flex flex-col gap-2">
              {['Poll Opened', ...analytics.funnel.map((f) => f.stage), 'Poll Completed'].map((stage, idx) => (
                <div key={stage} className="flex items-center gap-2 text-xs text-admin-muted">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-admin-primary/10 text-admin-primary">
                    {idx + 1}
                  </span>
                  {stage}
                  {idx < analytics.funnel.length + 1 && <span className="text-admin-border">↓</span>}
                </div>
              ))}
            </div>
          </Card>

          {ratingStats && ratingQuestion && (
            <Card>
              <p className="mb-4 text-sm font-semibold text-admin-text">Rating Distribution — {ratingQuestion.title}</p>
              <div className="flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = ratingStats.distribution[n] ?? 0
                  const pct = ratingStats.count ? Math.round((count / ratingStats.count) * 100) : 0
                  return <ResultBar key={n} label={`${n} ★`} pct={pct} count={count} theme="light" highlight={n === 5} />
                })}
              </div>
            </Card>
          )}

          {Object.entries(optionResults).map(([questionId, results]) => {
            const q = questions?.find((sq) => sq.id === questionId)
            return (
              <Card key={questionId}>
                <p className="mb-4 text-sm font-semibold text-admin-text">Option Distribution — {q?.title}</p>
                <div className="flex flex-col gap-2">
                  {results.slice(0, 6).map((r, i) => (
                    <ResultBar key={r.optionId} label={r.label} emoji={r.emoji} pct={r.pct} count={r.count} theme="light" highlight={i === 0} />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
