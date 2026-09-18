import { v4 as uuid } from 'uuid'
import type { EventRecord } from '../types/schema'
import { KEYS, read, write, delay } from './_localStorage'

export async function getEvents(): Promise<EventRecord[]> {
  return delay(read<EventRecord>(KEYS.events))
}

export async function getEvent(id: string): Promise<EventRecord | undefined> {
  return delay(read<EventRecord>(KEYS.events).find((e) => e.id === id))
}

export async function createEvent(input: Omit<EventRecord, 'id'>): Promise<EventRecord> {
  const events = read<EventRecord>(KEYS.events)
  const event: EventRecord = { ...input, id: `evt-${uuid()}` }
  write(KEYS.events, [...events, event])
  return delay(event)
}

export async function updateEvent(id: string, patch: Partial<EventRecord>): Promise<EventRecord | undefined> {
  const events = read<EventRecord>(KEYS.events)
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) return delay(undefined)
  events[idx] = { ...events[idx], ...patch }
  write(KEYS.events, events)
  return delay(events[idx])
}

export async function deleteEvent(id: string): Promise<void> {
  write(
    KEYS.events,
    read<EventRecord>(KEYS.events).filter((e) => e.id !== id),
  )
  return delay(undefined)
}
