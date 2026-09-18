import * as pollsRepository from '../repositories/polls.repository'
import { useAsync } from './useAsync'

export function usePolls(eventId?: string) {
  return useAsync(() => pollsRepository.getPolls(eventId), [eventId])
}

export function usePoll(id: string | undefined) {
  return useAsync(() => (id ? pollsRepository.getPoll(id) : Promise.resolve(undefined)), [id])
}

export function usePollBySlug(slug: string | undefined) {
  return useAsync(() => (slug ? pollsRepository.getPollBySlug(slug) : Promise.resolve(undefined)), [slug])
}
