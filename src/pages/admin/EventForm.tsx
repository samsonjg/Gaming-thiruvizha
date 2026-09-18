import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as dataService from '../../services/dataService'
import type { EventRecord, EventStatus } from '../../types/schema'
import { PageHeader, Card, Input, Textarea, Select, Button } from '../../components/admin/ui'

const EMPTY: Omit<EventRecord, 'id'> = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  venue: '',
  location: '',
  categories: [],
  imageUrl: '',
  kynEventId: '',
  pollId: '',
  status: 'draft',
}

export function EventForm() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const [form, setForm] = useState<Omit<EventRecord, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew && id) {
      dataService.getEvent(id).then((event) => {
        if (event) setForm(event)
      })
    }
  }, [id, isNew])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    if (isNew) {
      const created = await dataService.createEvent(form)
      navigate(`/admin/events/${created.id}`)
    } else if (id) {
      await dataService.updateEvent(id, form)
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={isNew ? 'New Event' : 'Edit Event'} subtitle="Event details used across the public poll and admin" />

      <div className="max-w-2xl px-8 py-6">
        <Card className="flex flex-col gap-4">
          <Field label="Event Name">
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Gaming Thiruvizha 2026" />
          </Field>

          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <Input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Venue">
              <Input value={form.venue} onChange={(e) => update('venue', e.target.value)} />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => update('location', e.target.value)} />
            </Field>
          </div>

          <Field label="Event Image URL">
            <Input value={form.imageUrl ?? ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder="https://…" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kyn Event ID">
              <Input value={form.kynEventId} onChange={(e) => update('kynEventId', e.target.value)} />
            </Field>
            <Field label="Poll ID">
              <Input value={form.pollId} onChange={(e) => update('pollId', e.target.value)} placeholder="Linked automatically" />
            </Field>
          </div>

          <Field label="Status">
            <Select value={form.status} onChange={(e) => update('status', e.target.value as EventStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </Select>
          </Field>

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/events')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Event'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-admin-muted">{label}</span>
      {children}
    </label>
  )
}
