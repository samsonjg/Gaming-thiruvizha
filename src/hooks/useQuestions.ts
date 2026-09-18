import * as questionsRepository from '../repositories/questions.repository'
import { useAsync } from './useAsync'

export function useQuestions(pollId: string | undefined) {
  return useAsync(() => (pollId ? questionsRepository.getQuestions(pollId) : Promise.resolve([])), [pollId])
}

export function usePublishedQuestions(pollId: string | undefined) {
  return useAsync(() => (pollId ? questionsRepository.getPublishedQuestions(pollId) : Promise.resolve([])), [pollId])
}

export function useQuestion(id: string | undefined) {
  return useAsync(() => (id ? questionsRepository.getQuestion(id) : Promise.resolve(undefined)), [id])
}
