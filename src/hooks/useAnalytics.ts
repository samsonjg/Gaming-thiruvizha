import * as statsRepository from '../repositories/stats.repository'
import { useAsync } from './useAsync'

export function usePollAnalytics(pollId: string | undefined) {
  return useAsync(
    () => (pollId ? statsRepository.getPollAnalytics(pollId) : Promise.resolve(undefined)),
    [pollId],
  )
}

export function useOptionResults(questionId: string | undefined) {
  return useAsync(() => (questionId ? statsRepository.getOptionResults(questionId) : Promise.resolve([])), [questionId])
}

export function useRatingAverage(questionId: string | undefined) {
  return useAsync(
    () => (questionId ? statsRepository.getRatingAverage(questionId) : Promise.resolve(undefined)),
    [questionId],
  )
}

export type { OptionResult, PollAnalytics } from '../repositories/stats.repository'
