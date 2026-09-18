import type { ResponseFilters } from '../repositories/responses.repository'
import * as responsesRepository from '../repositories/responses.repository'
import { useAsync } from './useAsync'

export function useResponseRows(filters: ResponseFilters) {
  return useAsync(() => responsesRepository.getResponseRows(filters), [JSON.stringify(filters)])
}

export { submitAnswer, hasResponded } from '../repositories/responses.repository'
export type { SubmitAnswerInput, SubmitAnswerResult, ResponseRow, ResponseFilters } from '../repositories/responses.repository'
