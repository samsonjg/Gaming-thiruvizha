import { useEffect, useMemo, useState } from 'react'
import * as responsesRepository from '../../repositories/responses.repository'
import * as optionsRepository from '../../repositories/options.repository'
import type { ResponseRow } from '../../repositories/responses.repository'
import { useActivePoll } from '../../hooks/usePolls'
import { QUESTION_TYPE_META } from '../../constants/questionTypeMeta'
import { PageHeader, Card, Select, Button, Badge, LoadingState, EmptyState } from '../../components/ui'

function answerSummary(row: ResponseRow, optionLabels: Map<string, string>): string {
  const a = row.answer
  if (!a) return '—'
  if (a.textValue) return a.textValue
  if (a.ratingValue !== undefined) return `${a.ratingValue} ★`
  if (a.rankingOrder) return a.rankingOrder.map((id) => optionLabels.get(id) ?? id).join(' > ')
  if (a.optionIds?.length) return a.optionIds.map((id) => optionLabels.get(id) ?? id).join(', ')
  return '—'
}

export function Responses() {
  const { data: poll, loading: pollLoading } = useActivePoll()
  const [rows, setRows] = useState<ResponseRow[]>([])
  const [optionLabels, setOptionLabels] = useState<Map<string, string>>(new Map())
  const [questionFilter, setQuestionFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    if (!poll) return
    responsesRepository.getResponseRows({ pollId: poll.id }).then(async (rows) => {
      setRows(rows)
      const questionIds = [...new Set(rows.map((r) => r.response.questionId))]
      const optionLists = await Promise.all(questionIds.map((id) => optionsRepository.getOptions(poll.id, id)))
      const labels = new Map<string, string>()
      optionLists.flat().forEach((o) => labels.set(o.id, o.label))
      setOptionLabels(labels)
    })
  }, [poll])

  const questions = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((r) => {
      if (r.question) map.set(r.question.id, r.question.title)
    })
    return [...map.entries()]
  }, [rows])

  const filtered = rows.filter((r) => {
    if (questionFilter && r.response.questionId !== questionFilter) return false
    if (sourceFilter && r.response.source !== sourceFilter) return false
    if (typeFilter && r.question?.type !== typeFilter) return false
    return true
  })

  function exportCsv() {
    const header = ['Response ID', 'Question', 'Answer', 'Session ID', 'Timestamp', 'Source']
    const lines = filtered.map((r) =>
      [r.response.id, r.question?.title ?? '', answerSummary(r, optionLabels), r.response.sessionId, r.response.createdAt, r.response.source]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gaming-thiruvizha-responses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (pollLoading) return <LoadingState />
  if (!poll) return <EmptyState title="No poll yet" description="Create an event and poll to see responses here." />

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Responses"
        subtitle={`${filtered.length} of ${rows.length} responses`}
        actions={<Button onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="px-8 py-6">
        <Card className="mb-4 flex flex-wrap gap-3">
          <Select value={questionFilter} onChange={(e) => setQuestionFilter(e.target.value)} className="w-56">
            <option value="">All Questions</option>
            {questions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </Select>
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-40">
            <option value="">All Sources</option>
            <option value="kyn">Kyn</option>
            <option value="external">External</option>
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48">
            <option value="">All Question Types</option>
            {Object.values(QUESTION_TYPE_META).map((m) => (
              <option key={m.type} value={m.type}>
                {m.label}
              </option>
            ))}
          </Select>
        </Card>

        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-admin-border text-xs uppercase tracking-wide text-admin-muted">
                <th className="px-4 py-3 font-semibold">Response ID</th>
                <th className="px-4 py-3 font-semibold">Question</th>
                <th className="px-4 py-3 font-semibold">Answer</th>
                <th className="px-4 py-3 font-semibold">Session</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((r) => (
                <tr key={r.response.id} className="border-b border-admin-border/60 last:border-0 hover:bg-admin-bg">
                  <td className="px-4 py-2.5 font-mono text-xs text-admin-muted">{r.response.id.slice(0, 10)}…</td>
                  <td className="max-w-[220px] truncate px-4 py-2.5">{r.question?.title}</td>
                  <td className="max-w-[260px] truncate px-4 py-2.5">{answerSummary(r, optionLabels)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-admin-muted">{r.response.sessionId.slice(0, 12)}…</td>
                  <td className="px-4 py-2.5 text-xs text-admin-muted">{new Date(r.response.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.response.source === 'kyn' ? 'default' : 'muted'}>{r.response.source}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <p className="px-4 py-3 text-xs text-admin-muted">Showing first 200 of {filtered.length} matching responses.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
