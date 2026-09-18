import { v4 as uuid } from 'uuid'
import type { QuestionOption } from '../types/schema'
import { KEYS, read, write, delay } from './_localStorage'

export async function getOptions(questionId: string): Promise<QuestionOption[]> {
  return delay(
    read<QuestionOption>(KEYS.options)
      .filter((o) => o.questionId === questionId)
      .sort((a, b) => a.order - b.order),
  )
}

export async function setOptions(
  questionId: string,
  options: Omit<QuestionOption, 'id' | 'questionId'>[],
): Promise<QuestionOption[]> {
  const all = read<QuestionOption>(KEYS.options).filter((o) => o.questionId !== questionId)
  const created = options.map((o, idx) => ({
    ...o,
    id: `opt-${uuid()}`,
    questionId,
    order: idx + 1,
  }))
  write(KEYS.options, [...all, ...created])
  return delay(created)
}
