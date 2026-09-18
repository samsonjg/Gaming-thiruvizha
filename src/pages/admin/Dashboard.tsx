import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as dataService from '../../services/dataService'
import { GT_POLL_ID } from '../../data/seed'
import { PageHeader, MetricCard, Card } from '../../components/admin/ui'
import { AnimatedCounter } from '../../components/shared/AnimatedCounter'
import { ResultBar } from '../../components/shared/ResultBar'

export function Dashboard() {
  const [analytics, setAnalytics] = useState<dataService.PollAnalytics | null>(null)
  const [topOptions, setTopOptions] = useState<dataService.OptionResult[]>([])

  useEffect(() => {
    dataService.getPollAnalytics(GT_POLL_ID).then(setAnalytics)
    dataService.getOptionResults('q1-excited').then(setTopOptions)
  }, [])

  if (!analytics) return null

  const maxFunnel = Math.max(...analytics.funnel.map((f) => f.count), 1)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Gaming Thiruvizha 2026"
        subtitle="Audience poll performance overview"
        actions={
          <Link to="/admin/analytics" className="text-sm font-semibold text-admin-primary">
            View full analytics →
          </Link>
        }
      />

      <div className="flex flex-col gap-6 px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Participants" value={<AnimatedCounter value={analytics.participants} />} />
          <MetricCard label="Total Responses" value={<AnimatedCounter value={analytics.totalResponses} />} />
          <MetricCard label="Completion Rate" value={<AnimatedCounter value={analytics.completionRate} suffix="%" />} />
          <MetricCard label="Active Questions" value={analytics.activeQuestions} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <p className="mb-4 text-sm font-semibold text-admin-text">Response Trend</p>
            <TrendChart data={analytics.trend} />
          </Card>

          <Card>
            <p className="mb-4 text-sm font-semibold text-admin-text">Completion Funnel</p>
            <div className="flex flex-col gap-3">
              {analytics.funnel.map((f) => (
                <div key={f.stage} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-admin-muted">{f.stage}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-admin-border">
                    <div
                      className="h-full rounded-full bg-admin-primary"
                      style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold text-admin-text">{f.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-4 text-sm font-semibold text-admin-text">Question Performance</p>
            <div className="flex flex-col gap-3">
              {analytics.questionPerformance.map((q) => (
                <div key={q.questionId} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2 text-admin-text">{q.title}</span>
                  <span className="shrink-0 font-semibold text-admin-primary">{q.responses}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-4 text-sm font-semibold text-admin-text">Most Popular Answers — Q1</p>
            <div className="flex flex-col gap-3">
              {topOptions.slice(0, 5).map((o, i) => (
                <ResultBar key={o.optionId} label={o.label} emoji={o.emoji} pct={o.pct} count={o.count} highlight={i === 0} theme="light" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-admin-muted">No data yet.</p>
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex h-36 items-end gap-1">
      {data.map((d) => (
        <div key={d.date} className="group relative flex h-full flex-1 items-end">
          <div
            className="w-full rounded-t-sm bg-admin-primary/70 transition-colors group-hover:bg-admin-primary"
            style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
          />
          <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-admin-text px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
            {d.date.slice(5)}: {d.count}
          </div>
        </div>
      ))}
    </div>
  )
}
