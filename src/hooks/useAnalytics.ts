import * as statsRepository from '../repositories/stats.repository'
import { useAsync } from './useAsync'

export function usePollAnalytics(pollId: string | undefined) {
  return useAsync(
    () => (pollId ? statsRepository.getPollAnalytics(pollId) : Promise.resolve(undefined)),
    [pollId],
  )
}

export function useOptionResults(pollId: string | undefined, questionId: string | undefined) {
  return useAsync(
    () => (pollId && questionId ? statsRepository.getOptionResults(pollId, questionId) : Promise.resolve([])),
    [pollId, questionId],
  )
}

export function useRatingAverage(pollId: string | undefined, questionId: string | undefined) {
  return useAsync(
    () => (pollId && questionId ? statsRepository.getRatingAverage(pollId, questionId) : Promise.resolve(undefined)),
    [pollId, questionId],
  )
}

export type { OptionResult, PollAnalytics } from '../repositories/stats.repository'
