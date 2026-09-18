import * as optionsRepository from '../repositories/options.repository'
import { useAsync } from './useAsync'

export function useOptions(pollId: string | undefined, questionId: string | undefined) {
  return useAsync(
    () => (pollId && questionId ? optionsRepository.getOptions(pollId, questionId) : Promise.resolve([])),
    [pollId, questionId],
  )
}
