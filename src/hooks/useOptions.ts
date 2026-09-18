import * as optionsRepository from '../repositories/options.repository'
import { useAsync } from './useAsync'

export function useOptions(questionId: string | undefined) {
  return useAsync(() => (questionId ? optionsRepository.getOptions(questionId) : Promise.resolve([])), [questionId])
}
