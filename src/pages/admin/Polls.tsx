import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as dataService from '../../services/dataService'
import type { Poll, EventRecord } from '../../types/schema'
import { PageHeader, Card, Badge, Button, LinkButton, IconButton } from '../../components/admin/ui'

interface PollRow {
  poll: Poll
  event?: EventRecord
  questionCount: number
  responseCount: number
}

export function Polls() {
  const [params] = useSearchParams()
  const eventIdFilter = params.get('eventId') ?? undefined
  const [rows, setRows] = useState<PollRow[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function load() {
    const polls = await dataService.getPolls(eventIdFilter)
    const rows = await Promise.all(
      polls.map(async (poll) => {
        const [event, questions, responses] = await Promise.all([
          dataService.getEvent(poll.eventId),
          dataService.getQuestions(poll.id),
          dataService.getResponseRows({ pollId: poll.id }),
        ])
        return { poll, event, questionCount: questions.length, responseCount: responses.length }
      }),
    )
    setRows(rows)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIdFilter])

  function publicUrl(poll: Poll) {
    return `${window.location.origin}/poll/${poll.publicSlug}`
  }

  async function copyLink(poll: Poll) {
    try {
      await navigator.clipboard.writeText(publicUrl(poll))
    } catch {
      // clipboard API unavailable — silently ignore in prototype
    }
    setCopiedId(poll.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  async function togglePublish(poll: Poll) {
    await dataService.updatePoll(poll.id, { status: poll.status === 'published' ? 'draft' : 'published' })
    load()
  }

  async function duplicate(poll: Poll) {
    await dataService.duplicatePoll(poll.id)
    load()
  }

  async function remove(poll: Poll) {
    if (!confirm(`Delete poll "${poll.name}"? This cannot be undone.`)) return
    await dataService.deletePoll(poll.id)
    load()
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Polls" subtitle="All polls, grouped by event" />

      <div className="flex flex-col gap-4 px-8 py-6">
        {rows.map(({ poll, event, questionCount, responseCount }) => (
          <Card key={poll.id} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-admin-muted">{event?.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="font-semibold text-admin-text">{poll.name}</p>
                  <Badge tone={poll.status === 'published' ? 'success' : 'warning'}>{poll.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-admin-muted">
                  {questionCount} questions · {responseCount} responses
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <LinkButton to={`/admin/polls/${poll.id}/questions`} variant="secondary">
                  Questions
                </LinkButton>
                <Button variant="secondary" onClick={() => duplicate(poll)}>
                  Duplicate
                </Button>
                <Button variant="secondary" onClick={() => togglePublish(poll)}>
                  {poll.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <IconButton onClick={() => remove(poll)} title="Delete poll">
                  🗑️
                </IconButton>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-admin-border bg-admin-bg px-3 py-2">
              <span className="flex-1 truncate font-mono text-xs text-admin-muted">{publicUrl(poll)}</span>
              <Button variant="secondary" onClick={() => copyLink(poll)}>
                {copiedId === poll.id ? 'Copied!' : 'Copy Link'}
              </Button>
              <a
                href={`/poll/${poll.publicSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-admin-border bg-admin-bg px-3.5 py-2 text-sm font-semibold text-admin-text hover:bg-admin-border/60"
              >
                Preview
              </a>
            </div>
          </Card>
        ))}

        {rows.length === 0 && <p className="text-sm text-admin-muted">No polls found.</p>}
      </div>
    </div>
  )
}
