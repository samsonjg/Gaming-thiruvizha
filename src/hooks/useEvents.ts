import * as eventsRepository from '../repositories/events.repository'
import { useAsync } from './useAsync'

export function useEvents() {
  return useAsync(() => eventsRepository.getEvents(), [])
}

export function useEvent(id: string | undefined) {
  return useAsync(() => (id ? eventsRepository.getEvent(id) : Promise.resolve(undefined)), [id])
}
