import type { AnswerValue, Question, QuestionOption } from '../../types/schema'

// Every question component is a controlled component sharing this exact
// prop contract, so the same component can be used standalone (admin
// preview) or wired into the multi-step public flow.
export interface QuestionComponentProps {
  question: Question
  options: QuestionOption[]
  value: AnswerValue | null
  onChange: (value: AnswerValue) => void
  disabled?: boolean
}
