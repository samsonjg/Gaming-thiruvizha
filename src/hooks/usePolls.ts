import { GT_POLL_SLUG } from '../constants/demoIds'
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

// The admin Dashboard/Responses/Analytics screens report on one "active"
// poll rather than being poll-scoped routes (matches the approved
// prototype's flat nav — see docs/PRD.md §6 [TBD: multi-poll admin
// dashboard support]). Prefers the Gaming Thiruvizha demo poll by its
// stable slug; falls back to the first poll that exists so this doesn't
// hard-fail once a second poll is created.
export function useActivePoll() {
  return useAsync(async () => {
    const bySlug = await pollsRepository.getPollBySlug(GT_POLL_SLUG)
    if (bySlug) return bySlug
    const all = await pollsRepository.getPolls()
    return all[0]
  }, [])
}
