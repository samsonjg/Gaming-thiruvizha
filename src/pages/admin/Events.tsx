import * as eventsRepository from '../../repositories/events.repository'
import { useEvents } from '../../hooks/useEvents'
import { PageHeader, Card, Badge, LinkButton, IconButton, LoadingState, ErrorState, EmptyState } from '../../components/ui'

export function Events() {
  const { data: events, loading, error, reload } = useEvents()

  async function remove(id: string, name: string) {
    if (!confirm(`Delete event "${name || '(untitled)'}"? This cannot be undone. Polls under this event are not deleted.`)) return
    await eventsRepository.deleteEvent(id)
    reload()
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Events"
        subtitle="Manage Kyn events that have polls attached"
        actions={<LinkButton to="/admin/events/new">+ New Event</LinkButton>}
      />

      {loading && <LoadingState />}
      {error && <ErrorState onRetry={reload} />}
      {!loading && !error && events?.length === 0 && <EmptyState title="No events yet" />}

      <div className="flex flex-col gap-4 px-8 py-6">
        {events?.map((event) => (
          <Card key={event.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-admin-text">{event.name}</p>
                <Badge tone={event.status === 'published' ? 'success' : event.status === 'draft' ? 'warning' : 'muted'}>
                  {event.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-admin-muted">
                {event.venue} · {event.startDate} – {event.endDate}
              </p>
              <p className="mt-1 text-xs text-admin-muted">Kyn Event ID: {event.kynEventId}</p>
            </div>
            <div className="flex gap-2">
              <LinkButton to={`/admin/events/${event.id}`} variant="secondary">
                Edit
              </LinkButton>
              <LinkButton to={`/admin/polls?eventId=${event.id}`} variant="secondary">
                View Polls
              </LinkButton>
              <IconButton onClick={() => remove(event.id, event.name)} title="Delete event">
                🗑️
              </IconButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
